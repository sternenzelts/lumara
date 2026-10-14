// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createRoomService, RoomError, type Room, type RoomStore, type RoomRequest } from './online-service';
import { ensureCardIdentity, supabaseConnection, type TableConnection } from './supabase-multiplayer';

const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const code = 'abc123def456', HOST = 'host', ANA = 'ana';
let raw: Room | null;
const callbacks: (() => void)[] = [];
const store: RoomStore = {
  create: async room => { raw = structuredClone(room); },
  load: async () => raw ? structuredClone(raw) : null,
  commit: async (room, expected, notify = true) => {
    if (!raw || raw.version !== expected) return false;
    raw = { ...structuredClone(room), version: expected + 1 };
    if (notify) callbacks.forEach(fn => queueMicrotask(fn)); return true;
  },
};
const service = createRoomService(store, { number: () => .5, shuffle: cards => [...cards] }, () => code);
const connections: TableConnection[] = [];
function fakeClient(user: string) {
  const auth = { getSession: vi.fn(async () => ({ data: { session: { user: { id: user } } }, error: null })), signInAnonymously: vi.fn() };
  let update: (() => void) | null = null;
  const invoke = vi.fn(async (_name: string, { body }: { body: RoomRequest }) => {
    try { return { data: await service(user, body), error: null }; }
    catch (error) {
      if (!(error instanceof RoomError)) throw error;
      return { data: null, error: { context: Response.json({ error: error.message, snapshot: error.snapshot }, { status: error.status }) } };
    }
  });
  const channel = {
    on: vi.fn((_kind, _filter, callback: () => void) => { update = callback; return channel; }),
    subscribe: vi.fn((callback: (status: string) => void) => { if (update) callbacks.push(update); queueMicrotask(() => callback('SUBSCRIBED')); return channel; }),
  };
  const removeChannel = vi.fn(async () => { if (update) { const index = callbacks.indexOf(update); if (index >= 0) callbacks.splice(index, 1); } });
  return { auth, functions: { invoke }, channel: vi.fn(() => channel), removeChannel, trigger: () => update?.() };
}
const connect = async (user: string) => {
  const sb = fakeClient(user), errors: string[] = [], view = await service(user, { op: 'view', code });
  const connection = supabaseConnection(sb as unknown as SupabaseClient, code, view.playerID, message => errors.push(message));
  connections.push(connection); connection.start(); await flush();
  return { sb, errors, connection };
};

beforeEach(async () => {
  vi.useFakeTimers(); callbacks.length = 0; raw = null;
  await service(HOST, { op: 'create', players: 2, edition: 'party', name: 'Jay', companion: 'seren' });
  await service(ANA, { op: 'join', code, name: 'Ana', companion: 'ayaka' });
  raw!.state.phase = 'playing'; raw!.state.hands = [[{ id: 'mine', type: 'defuse' }], [{ id: 'theirs', type: 'defuse' }]];
  raw!.state.counts = [1, 1]; raw!.state.deck = [{ id: 'drawn', type: 'skip' }, { id: 'next', type: 'future' }]; raw!.state.deckSize = 2;
});
afterEach(() => { connections.splice(0).forEach(c => c.stop()); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Supabase client lifecycle', () => {
  it('reuses the existing retrospective identity instead of creating another guest', async () => {
    const sb = fakeClient(HOST); await ensureCardIdentity(sb as unknown as SupabaseClient); expect(sb.auth.signInAnonymously).not.toHaveBeenCalled();
  });
  it('keeps hands private and refreshes both players after an authoritative move', async () => {
    const host = await connect(HOST), ana = await connect(ANA);
    expect(host.connection.getState()!.G.hands[1]).toEqual([]); expect(ana.connection.getState()!.G.hands[0]).toEqual([]);
    host.connection.moves.act({ kind: 'draw' }); await flush();
    expect(host.connection.getState()!.G.hands[0].map(c => c.id)).toEqual(['mine', 'drawn']);
    expect(ana.connection.getState()!.G.current).toBe(1); expect(ana.connection.getState()!.G.hands[0]).toEqual([]);
    expect(ana.connection.getState()!.G.counts[0]).toBe(2);
  });
  it('queues a click made while a move is still sending instead of dropping it, and stops after unmount', async () => {
    const host = await connect(HOST); let calls = 0; host.connection.subscribe(() => calls++);
    host.connection.moves.act({ kind: 'draw' }); host.connection.moves.act({ kind: 'draw' }); await flush(); await flush();
    // The second draw is sent after the first lands; it is then simply no longer the host's turn.
    expect(raw!.state.hands[0]).toHaveLength(2); expect(host.sb.functions.invoke.mock.calls.filter(([, o]) => (o as { body: RoomRequest }).body.op === 'act')).toHaveLength(2);
    expect(host.errors.join(' ')).not.toContain('still finishing');
    host.connection.stop(); const afterStop = calls; host.sb.trigger(); await vi.advanceTimersByTimeAsync(30000);
    expect(calls).toBe(afterStop); expect(host.sb.removeChannel).toHaveBeenCalledTimes(1);
  });
  it('recovers a dropped update by polling and restores state on a fresh connection', async () => {
    const host = await connect(HOST); callbacks.length = 0; // Simulate a missed realtime message.
    raw!.version++; raw!.state.current = 1;
    await vi.advanceTimersByTimeAsync(15000); expect(host.connection.getState()!.G.current).toBe(1);
    host.connection.stop(); const resumed = await connect(HOST); expect(resumed.connection.getState()!.G).toEqual(host.connection.getState()!.G);
  });
  it('moves a card twice on two quick arrow presses: reorders show at once and are sent in order', async () => {
    raw!.state.hands[0] = [{ id: 'a', type: 'skip' }, { id: 'b', type: 'favor' }, { id: 'c', type: 'nope' }]; raw!.state.counts[0] = 3;
    const host = await connect(HOST);
    const handIds = () => host.connection.getState()!.G.hands[0].map(c => c.id);
    const moveRight = () => { const ids = handIds(), i = ids.indexOf('a'); [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]]; host.connection.moves.act({ kind: 'hand-order', order: ids }); };
    moveRight(); expect(handIds()).toEqual(['b', 'a', 'c']);
    moveRight(); expect(handIds()).toEqual(['b', 'c', 'a']);
    await flush(); await flush();
    expect(raw!.state.hands[0].map(c => c.id)).toEqual(['b', 'c', 'a']); expect(handIds()).toEqual(['b', 'c', 'a']); expect(host.errors.filter(Boolean)).toEqual([]);
  });
  it('does not regress to a stale view that arrives after a newer move', async () => {
    const host = await connect(HOST);
    const stale = await service(HOST, { op: 'view', code }); let release!: () => void;
    host.sb.functions.invoke.mockImplementationOnce(async () => { await new Promise<void>(resolve => { release = resolve; }); return { data: stale, error: null }; });
    host.sb.trigger(); await flush();
    host.connection.moves.act({ kind: 'draw' }); await flush();
    release(); await flush();
    expect(host.connection.getState()!.G.hands[0].map(c => c.id)).toEqual(['mine', 'drawn']);
  });
});
