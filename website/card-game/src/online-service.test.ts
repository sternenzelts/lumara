import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { createRoomService, type Room, type RoomStore, type RoomSnapshot } from './online-service';
import type { Action } from './engine';

const HOST = '00000000-0000-0000-0000-000000000001';
const ANA = '00000000-0000-0000-0000-000000000002';
const BOB = '00000000-0000-0000-0000-000000000003';
const EVE = '00000000-0000-0000-0000-000000000004';
const DB = new PGlite();
const profile = { name: 'Jay', companion: 'seren' };
const rng = { shuffle: <T>(cards: T[]) => [...cards], number: () => .4 };
let nextCode = 0;
const query = async <T>(sql: string, args: unknown[] = []) => (await DB.query<T>(sql, args)).rows;
const store: RoomStore = {
  create: async (room, owner) => { await query('select public.last_light_create($1, $2::uuid, $3::jsonb, $4::jsonb)', [room.code, owner, JSON.stringify(room.users), JSON.stringify(room.state)]); },
  load: async code => (await query<{ room: Room | null }>('select public.last_light_load($1) as room', [code]))[0].room,
  commit: async (room, expected) => (await query<{ ok: boolean }>('select public.last_light_commit($1, $2::bigint, $3::jsonb, $4::jsonb) as ok', [room.code, expected, JSON.stringify(room.users), JSON.stringify(room.state)]))[0].ok,
};
const service = createRoomService(store, rng, () => (++nextCode).toString(16).padStart(12, '0'));
const create = (user = HOST, players = 2) => service(user, { op: 'create', players, edition: 'party', ...profile });
const move = (user: string, view: RoomSnapshot, action: Action) => service(user, { op: 'act', code: view.code, version: view.version, action });

beforeAll(async () => {
  await DB.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create publication supabase_realtime;`);
  const sql = await readFile(new URL('../supabase/migrations/202610140001_last_light.sql', import.meta.url), 'utf8');
  await DB.exec(sql); await DB.exec(sql); // Migration also tolerates a deliberate second application.
}, 30000);
afterAll(async () => { await DB.close(); });

describe('Supabase rooms against real Postgres', () => {
  it('claims seats atomically, resumes the same identity, and refuses late or full joins', async () => {
    const host = await create(HOST, 3);
    const [ana, bob] = await Promise.all([service(ANA, { op: 'join', code: host.code, name: 'Ana', companion: 'ayaka' }), service(BOB, { op: 'join', code: host.code, name: 'Bob', companion: 'rook' })]);
    expect(new Set([host.playerID, ana.playerID, bob.playerID]).size).toBe(3);
    expect((await service(ANA, { op: 'join', code: host.code, name: 'Changed', companion: 'keira' })).playerID).toBe(ana.playerID);
    await expect(service(EVE, { op: 'join', code: host.code, name: 'Eve', companion: 'keira' })).rejects.toThrow('full');
    for (const [user, companion] of [[HOST, 'seren'], [ANA, 'ayaka'], [BOB, 'rook']]) {
      const current = await service(user, { op: 'view', code: host.code }); await move(user, current, { kind: 'seat', name: user === HOST ? 'Jay' : 'Ally', companion });
    }
    const ready = await service(HOST, { op: 'view', code: host.code });
    const dealt = await move(HOST, ready, { kind: 'start' }); expect(dealt.G.phase).toBe('playing');
    await expect(service(EVE, { op: 'join', code: host.code, name: 'Eve', companion: 'keira' })).rejects.toThrow('already started');
    expect((await service(ANA, { op: 'join', code: host.code, name: 'Ana', companion: 'ayaka' })).G.phase).toBe('playing');
  });
  it('enforces identity, ownership and ready gates; only the caller hand and future are returned', async () => {
    const host = await create(ANA);
    await expect(move(ANA, host, { kind: 'start' })).rejects.toThrow('every player');
    const guest = await service(BOB, { op: 'join', code: host.code, name: 'Bob', companion: 'rook' });
    await expect(service(EVE, { op: 'view', code: host.code })).rejects.toThrow('Join');
    await move(ANA, await service(ANA, { op: 'view', code: host.code }), { kind: 'seat', ...profile });
    const guestReady = await move(BOB, await service(BOB, { op: 'view', code: host.code }), { kind: 'seat', name: 'Bob', companion: 'rook' });
    await expect(move(BOB, guestReady, { kind: 'start' })).rejects.toThrow('no longer available');
    const started = await move(ANA, await service(ANA, { op: 'view', code: host.code }), { kind: 'start' });
    expect(started.G.deck).toEqual([]); expect(started.G.hands[0]).toHaveLength(8); expect(started.G.hands[1]).toEqual([]);
    const other = await service(BOB, { op: 'view', code: host.code }); expect(other.G.hands[0]).toEqual([]); expect(other.G.hands[1]).toHaveLength(8);
    await expect(move(BOB, other, { kind: 'draw' })).rejects.toThrow('no longer available');
    const before = await store.load(host.code);
    await expect(move(ANA, started, { kind: 'play', ids: [other.G.hands[1][0].id] })).rejects.toThrow('no longer available');
    expect(await store.load(host.code)).toEqual(before);
    expect(guest.playerID).toBe('1');
  });
  it('rejects stale actions and commits exactly one winner when two requests use the same version', async () => {
    const host = await create(BOB); const room = (await store.load(host.code))!;
    room.users[1] = ANA; room.state.phase = 'playing'; room.state.hands = [[], []]; room.state.deck = [{ id: 'one', type: 'skip' }, { id: 'two', type: 'skip' }]; room.state.deckSize = 2;
    await store.commit(room, room.version);
    const view = await service(BOB, { op: 'view', code: host.code });
    const results = await Promise.allSettled([move(BOB, view, { kind: 'draw' }), move(BOB, view, { kind: 'draw' })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await store.load(host.code))!.state.hands[0].map(c => c.id)).toEqual(['one']);
    await expect(move(BOB, view, { kind: 'draw' })).rejects.toMatchObject({ status: 409, snapshot: { version: view.version + 1 } });
  });
  it('persists private views and does not reveal a deck position or another player future', async () => {
    const host = await create(EVE); const room = (await store.load(host.code))!; room.users[1] = ANA; room.state.phase = 'playing';
    room.state.deck = [{ id: 'secret1', type: 'defuse' }, { id: 'secret2', type: 'skip' }]; room.state.deckSize = 2;
    room.state.future = [...room.state.deck]; room.state.stage = { type: 'future', actor: 0 }; await store.commit(room, room.version);
    const own = await service(EVE, { op: 'view', code: host.code }), other = await service(ANA, { op: 'view', code: host.code });
    expect(own.G.future).toHaveLength(2); expect(other.G.future).toEqual([]); expect(other.G.deck).toEqual([]);
    expect(JSON.stringify(other)).not.toContain('secret1');
    // A fresh service instance resumes durable state with the same identity.
    expect(await createRoomService(store, rng, () => 'unused')(EVE, { op: 'view', code: host.code })).toEqual(own);
  });
  it('gives Realtime readers only room versions and denies private reads or forged writes', async () => {
    const host = await create(ANA);
    const visibleAs = async (user: string) => {
      await query("select set_config('request.jwt.claim.sub', $1, false)", [user]); await DB.exec('set role authenticated');
      try { return await query<{ code: string; version: number }>('select * from public.last_light_room_updates where code = $1', [host.code]); } finally { await DB.exec('reset role'); }
    };
    expect(await visibleAs('')).toEqual([]); // An empty identity must never match a vacant/null seat.
    await service(BOB, { op: 'join', code: host.code, name: 'Bob', companion: 'rook' });
    expect(await visibleAs(BOB)).toHaveLength(1); expect(await visibleAs(EVE)).toEqual([]);
    expect(Object.keys((await visibleAs(BOB))[0]).sort()).toEqual(['code', 'updated_at', 'version']);
    await DB.exec('set role authenticated');
    try {
      await expect(query('select public.last_light_load($1)', [host.code])).rejects.toThrow('permission denied');
      await expect(query('select * from last_light_private.rooms')).rejects.toThrow('permission denied');
      await expect(query('update public.last_light_room_updates set version = 999')).rejects.toThrow('permission denied');
      await expect(query('select public.last_light_commit($1, 1, $2::jsonb, $3::jsonb)', [host.code, '[]', '{}'])).rejects.toThrow('permission denied');
    } finally { await DB.exec('reset role'); }
    await DB.exec('set role anon');
    try { await expect(query('select * from public.last_light_room_updates')).rejects.toThrow('permission denied'); } finally { await DB.exec('reset role'); }
    await DB.exec('set role service_role');
    try { expect((await store.load(host.code))!.code).toBe(host.code); } finally { await DB.exec('reset role'); }
  });
  it('rejects invalid decks and room codes before creating anything', async () => {
    await expect(service(HOST, { op: 'create', players: 10, edition: 'original', ...profile })).rejects.toThrow('valid deck');
    await expect(service(HOST, { op: 'join', code: 'bad', ...profile })).rejects.toThrow('12-character');
    await expect(service('', { op: 'view', code: '000000000001' })).rejects.toMatchObject({ status: 401 });
  });
  it('limits unfinished rooms per owner and frees a slot after finishing', async () => {
    const owner = '00000000-0000-0000-0000-000000000005';
    const rooms = [];
    for (let i = 0; i < 5; i++) rooms.push(await create(owner));
    await expect(create(owner)).rejects.toThrow('five active rooms');
    const finished = (await store.load(rooms[0].code))!; finished.state.winner = 0;
    expect(await store.commit(finished, finished.version)).toBe(true); expect((await create(owner)).playerID).toBe('0');
  });
  it('makes expired rooms unavailable without deleting their stored state', async () => {
    const owner = '00000000-0000-0000-0000-000000000006', room = await create(owner);
    await query("update last_light_private.rooms set expires_at = now() - interval '1 minute' where code = $1", [room.code]);
    await expect(service(owner, { op: 'view', code: room.code })).rejects.toMatchObject({ status: 404 });
    expect(await query('select code from last_light_private.rooms where code = $1', [room.code])).toHaveLength(1);
  });
});

describe('single-file deployment artifact', () => {
  it('runs the packaged function with the real SDK, migration and private game engine', async () => {
    let handler!: (request: Request) => Promise<Response>;
    const tokens: Record<string, string> = { 'host-test-token': HOST, 'ana-test-token': ANA };
    const serviceKey = 'local-service-key-only';
    vi.stubGlobal('Deno', {
      env: { get: (name: string) => ({ SUPABASE_URL: 'https://local-supabase.test', SUPABASE_SERVICE_ROLE_KEY: serviceKey } as Record<string, string>)[name] },
      serve: (fn: typeof handler) => { handler = fn; },
    });
    // Local HTTP boundary emulates only Supabase Auth/PostgREST; SQL and rules are real.
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input)), headers = new Headers(init?.headers);
      if (url.pathname === '/auth/v1/user') {
        const id = tokens[headers.get('authorization')?.replace('Bearer ', '') || ''];
        return Response.json(id ? { id, aud: 'authenticated', role: 'authenticated' } : { message: 'Invalid token' }, { status: id ? 200 : 401 });
      }
      expect(headers.get('authorization')).toBe(`Bearer ${serviceKey}`);
      const args = JSON.parse(String(init?.body)); let value: unknown;
      if (url.pathname.endsWith('/last_light_create')) {
        await query('select public.last_light_create($1, $2::uuid, $3::jsonb, $4::jsonb)', [args.p_code, args.p_owner, JSON.stringify(args.p_users), JSON.stringify(args.p_state)]); value = null;
      } else if (url.pathname.endsWith('/last_light_load')) value = await store.load(args.p_code);
      else if (url.pathname.endsWith('/last_light_commit')) value = await store.commit({ code: args.p_code, version: args.p_version, users: args.p_users, state: args.p_state }, args.p_version);
      else throw new Error(`Unexpected endpoint ${url.pathname}`);
      return Response.json(value);
    });
    try {
      const bundle = (await readFile(new URL('../supabase/deploy/last-light.js', import.meta.url), 'utf8'))
        .replace('import { createClient } from "npm:@supabase/supabase-js@2.117.2";', '');
      new Function('createClient', bundle)(createClient);
      const call = async (token: string, body: object) => {
        const result = await handler(new Request('https://local-supabase.test/functions/v1/last-light', { method: 'POST', headers: { origin: 'https://sternenzelts.github.io', authorization: `Bearer ${token}` }, body: JSON.stringify(body) }));
        return { status: result.status, body: await result.json() };
      };
      expect((await call('invalid', { op: 'create' })).status).toBe(401);
      const made = await call('host-test-token', { op: 'create', players: 2, edition: 'party', ...profile });
      expect(made.status).toBe(200); const code = made.body.code;
      const joined = await call('ana-test-token', { op: 'join', code, name: 'Ana', companion: 'ayaka', playerID: '0' });
      expect(joined.body.playerID).toBe('1');
      const raw = (await store.load(code))!; raw.state.phase = 'playing';
      raw.state.hands = [[{ id: 'pair1', type: 'rook' }, { id: 'pair2', type: 'rook' }], [{ id: 'hidden1', type: 'defuse' }, { id: 'hidden2', type: 'skip' }]];
      raw.state.counts = [2, 2]; raw.state.deck = [{ id: 'secret-deck', type: 'collapse' }]; raw.state.deckSize = 1; await store.commit(raw, raw.version);
      const view = await call('host-test-token', { op: 'view', code });
      expect(view.body.G.hands[1]).toEqual([]); expect(JSON.stringify(view.body)).not.toContain('secret-deck');
      const played = await call('host-test-token', { op: 'act', code, version: view.body.version, action: { kind: 'play', ids: ['pair1', 'pair2'], target: 1 } });
      expect(played.body.G.stage.type).toBe('steal');
      const stolen = await call('host-test-token', { op: 'act', code, version: played.body.version, action: { kind: 'steal', index: 1 } });
      expect(stolen.body.G.hands[0].map((card: { id: string }) => card.id)).toEqual(['hidden2']);
      expect(stolen.body.G.hands[1]).toEqual([]);
      const ana = await call('ana-test-token', { op: 'view', code });
      expect(ana.body.G.hands[0]).toEqual([]); expect(ana.body.G.hands[1].map((card: { id: string }) => card.id)).toEqual(['hidden1']);
    } finally { vi.unstubAllGlobals(); }
  });
});
