import { describe, expect, it, vi } from 'vitest';
import { createSupabaseBackend } from './supabase';
import { connect, resume, start } from './supabaseAuth';

function fakeClient(tables: Record<string, any[]>) {
  const handlers: { table: string; cb: () => void }[] = []; let status: (s: string) => void = () => {};
  const query = (t: string) => { const q: any = { _rows: tables[t] || [], select: () => q, eq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] === v); return q; }, neq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] !== v); return q; }, in: (k: string, v: any[]) => { q._rows = q._rows.filter((r: any) => v.includes(r[k])); return q; }, order: () => q, then: (res: any) => res({ data: q._rows, error: null }) }; return q; };
  const channel: any = { on: (_: string, f: any, cb: () => void) => { handlers.push({ table: f.table, cb }); return channel; }, subscribe: (cb?: (s: string) => void) => { if (cb) { status = cb; cb('SUBSCRIBED'); } return channel; }, unsubscribe: vi.fn() };
  return { client: { from: query, channel: () => channel, removeChannel: vi.fn(), rpc: vi.fn(async () => ({ data: [], error: null })) } as any, fire: (t: string) => handlers.filter(h => h.table === t).forEach(h => h.cb()), resubscribe: () => status('SUBSCRIBED'), tables };
}
const me = { id: 'u1', name: 'Ana', isAdmin: false };
const flush = () => new Promise(r => setTimeout(r, 0));

describe('supabase backend reads', () => {
  it('watchActiveSession returns the newest non-ended session and updates on change', async () => {
    const f = fakeClient({ sessions: [{ id: 's1', sprint_name: 'A', stage: 'vote', status: 'active', warden_id: 'u2', created_at: 2 }] });
    const seen: any[] = []; createSupabaseBackend(f.client, me).watchActiveSession(s => seen.push(s?.id ?? null)); await flush();
    f.tables.sessions[0].status = 'ended'; f.fire('sessions'); await flush();
    expect(seen).toEqual(['s1', null]);
  });
  it('re-fetches when the channel reconnects (network drop)', async () => {
    const f = fakeClient({ vows: [] }); const cb = vi.fn(); createSupabaseBackend(f.client, me).watchVows(cb); await flush();
    f.tables.vows.push({ id: 'v', session_id: 's', text: 't', owner_id: null, status: 'open', created_at: 1 }); f.resubscribe(); await flush();
    expect(cb).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'v' })]);
  });
  it('watchPlayer never emits a provisional null for an existing player', async () => {
    const f = fakeClient({ players: [{ user_id: 'u1', nickname: 'Ana', intro_seen: true, owned: {} }], pulls: [], currency_grants: [] });
    const cb = vi.fn(); createSupabaseBackend(f.client, me).watchPlayer('u1', cb); await flush();
    expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toMatchObject({ userId: 'u1', nickname: 'Ana' });
  });
});
describe('supabase writes and sign-in', () => {
  it('castVote calls the RPC with the right names and surfaces its error text', async () => {
    const f = fakeClient({}); f.client.rpc = vi.fn(async () => ({ data: null, error: { message: 'You have used all three votes. Remove one to vote elsewhere.' } }));
    await expect(createSupabaseBackend(f.client, me).castVote('s1', 'f1')).rejects.toThrow('three votes');
    expect(f.client.rpc).toHaveBeenCalledWith('cast_vote', { p_session: 's1', p_fragment: 'f1' });
  });
  it('a returning visitor is not signed in again', async () => {
    const auth = { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u9', is_anonymous: true } } } })), signInAnonymously: vi.fn() };
    const client: any = { auth, rpc: vi.fn(async (name: string) => ({ data: name === 'is_admin' ? false : null, error: null })), from: () => ({ select: () => ({ eq: async () => ({ data: [{ nickname: 'Bo' }], error: null }) }) }) };
    expect(await connect(client)).toEqual({ id: 'u9', name: 'Bo', isAdmin: false });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });
  it('a new visitor is signed in anonymously', async () => {
    const auth = { getSession: vi.fn(async () => ({ data: { session: null } })), signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'n1', is_anonymous: true } }, error: null })) };
    const client: any = { auth, rpc: vi.fn(async () => ({ data: false, error: null })), from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) };
    expect((await connect(client)).id).toBe('n1'); expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
});
describe('supabase cues and presence', () => {
  it('emit delivers to own listeners (self) and broadcasts', async () => {
    const sent: any[] = []; const bc: any[] = [];
    const ch: any = { on: (_t: string, f: any, cb: any) => { bc.push({ f, cb }); return ch; }, subscribe: () => ch, send: (m: any) => { sent.push(m); }, track: vi.fn(), presenceState: () => ({}) };
    const client: any = { channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() };
    const b = createSupabaseBackend(client, me); const got: any[] = []; b.on('skill', (d, from) => got.push([d, from]));
    b.emit('skill', { x: 1 }); expect(got).toEqual([[{ x: 1 }, 'u1']]); expect(sent[0]).toMatchObject({ type: 'broadcast', event: 'skill' });
  });
  it('onPeers excludes your own presence', () => {
    let sync = () => {}; const ch: any = { on: (_t: string, f: any, cb: any) => { if (f.event === 'sync') sync = cb; return ch; }, subscribe: () => ch, send: vi.fn(), track: vi.fn(),
      presenceState: () => ({ u1: [{ x: 1, y: 1 }], u2: [{ x: 0.5, y: 0.5, facing: 'left', characterId: 'wren', moving: false }] }) };
    const b = createSupabaseBackend({ channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() } as any, me);
    const cb = vi.fn(); b.onPeers(cb); sync(); expect(Object.keys(cb.mock.lastCall![0])).toEqual(['u2']);
  });
});

describe('start button for new visitors', () => {
  it('resume returns null with no session and does not sign in', async () => {
    const auth = { getSession: vi.fn(async () => ({ data: { session: null } })), signInAnonymously: vi.fn() };
    expect(await resume({ auth } as any)).toBeNull(); expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });
  it('start signs in once and claims the pre-registration reward', async () => {
    const auth = { getSession: vi.fn(), signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'n2' } }, error: null })) };
    const rpc = vi.fn(async () => ({ data: false, error: null }));
    const client: any = { auth, rpc, from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) };
    expect((await start(client)).id).toBe('n2'); expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('claim_prereg_reward');
  });
});
