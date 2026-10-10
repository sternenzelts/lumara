import { describe, expect, it, vi } from 'vitest';
import { createSupabaseBackend } from './supabase';
import { connect, resume, start } from './supabaseAuth';

function fakeClient(tables: Record<string, any[]>) {
  const handlers: { table: string; cb: () => void }[] = []; let status: (s: string) => void = () => {};
  const query = (t: string) => { const q: any = { _rows: tables[t] || [], select: () => q, eq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] === v); return q; }, neq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] !== v); return q; }, in: (k: string, v: any[]) => { q._rows = q._rows.filter((r: any) => v.includes(r[k])); return q; }, order: () => q, then: (res: any) => res({ data: q._rows, error: null }) }; return q; };
  const channel: any = { track: vi.fn(), send: vi.fn(), presenceState: () => ({}), on: (_: string, f: any, cb: () => void) => { handlers.push({ table: f.table, cb }); return channel; }, subscribe: (cb?: (s: string) => void) => { if (cb) { status = cb; cb('SUBSCRIBED'); } return channel; }, unsubscribe: vi.fn() };
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
  it('peer calls use the RPC names and map rows', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    const ok = { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 };
    await b.ratePeer('s1', 'u2', ok);
    expect(f.client.rpc).toHaveBeenCalledWith('rate_peer', { p_session: 's1', p_target: 'u2', p_scores: ok });
    f.client.rpc = vi.fn(async (name: string) => ({ data: name === 'peer_summary' ? [{ target_id: 'u1', raters: 2, collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 }] : [{ target_id: 'u2', scores: ok }], error: null }));
    expect(await b.peerSummary('s1')).toEqual([{ targetId: 'u1', raters: 2, pct: { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 } }]);
    expect(await b.myPeerRatings('s1')).toEqual({ u2: ok });
  });
  it('chooseTurnThought calls choose_turn_thought', async () => {
    const f = fakeClient({}); await createSupabaseBackend(f.client, me).chooseTurnThought('s1', 'f1');
    expect(f.client.rpc).toHaveBeenCalledWith('choose_turn_thought', { p_session: 's1', p_fragment: 'f1' });
  });
  it('delivers the speaker cue to its own listeners', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    const got = vi.fn(); b.on('speaker', got); b.emit('speaker', { sessionId: 's1', frames: ['u1'] });
    expect(got).toHaveBeenCalledWith({ sessionId: 's1', frames: ['u1'] }, 'u1');
  });
  it('check-in calls use the RPC names and pass the summary through', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    await b.saveMyCheckIn('s1', 4, 5);
    expect(f.client.rpc).toHaveBeenCalledWith('save_checkin', { p_session: 's1', p_sat: 4, p_growth: 5 });
    f.client.rpc = vi.fn(async () => ({ data: { sat: 70, growth: 80, n: 2, of: 3 }, error: null }));
    expect(await b.checkInSummary('s1')).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
    expect(f.client.rpc).toHaveBeenCalledWith('checkin_summary', { p_session: 's1' });
  });
  it('myCheckIn reads only the caller’s row', async () => {
    const f = fakeClient({ checkins: [{ session_id: 's1', user_id: 'u1', sat: 3, growth: 4 }, { session_id: 's1', user_id: 'u2', sat: 1, growth: 1 }] });
    expect(await createSupabaseBackend(f.client, me).myCheckIn('s1')).toEqual({ sessionId: 's1', userId: 'u1', sat: 3, growth: 4 });
  });
  it('removePlayer calls remove_player with the right names', async () => {
    const f = fakeClient({}); await createSupabaseBackend(f.client, me).removePlayer('s1', 'u2');
    expect(f.client.rpc).toHaveBeenCalledWith('remove_player', { p_session: 's1', p_user: 'u2' });
  });
  it('castVote calls the RPC with the right names and surfaces its error text', async () => {
    const f = fakeClient({}); f.client.rpc = vi.fn(async () => ({ data: null, error: { message: 'You already picked this thought.' } }));
    await expect(createSupabaseBackend(f.client, me).castVote('s1', 'f1')).rejects.toThrow('already picked');
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
    const ch: any = { on: (_t: string, f: any, cb: any) => { bc.push({ f, cb }); return ch; }, subscribe: (cb?: (s: string) => void) => { cb?.('SUBSCRIBED'); return ch; }, send: (m: any) => { sent.push(m); }, track: vi.fn(), presenceState: () => ({}) };
    const client: any = { channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() };
    const b = createSupabaseBackend(client, me); const got: any[] = []; b.on('skill', (d, from) => got.push([d, from]));
    b.emit('skill', { x: 1 }); expect(got).toEqual([[{ x: 1 }, 'u1']]); expect(sent[0]).toMatchObject({ type: 'broadcast', event: 'skill' });
  });
  it('peers come from position broadcasts of online players, never yourself', () => {
    const h: Record<string, (x: any) => void> = {};
    let state: Record<string, any[]> = {};
    const ch: any = { on: (_t: string, f: any, cb: any) => { h[f.event] = cb; return ch; }, subscribe: (cb?: any) => { cb?.('SUBSCRIBED'); return ch; }, send: vi.fn(), track: vi.fn(), presenceState: () => state };
    const b = createSupabaseBackend({ channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() } as any, me);
    const cb = vi.fn(); b.onPeers(cb);
    state = { u1: [{}], u2: [{}] }; h.sync({});
    h.pos({ payload: { from: 'u2', p: { name: 'Bo', x: 0.5, y: 0.5, facing: 'left', characterId: 'wren', moving: false } } });
    h.pos({ payload: { from: 'u1', p: { x: 1, y: 1 } } });
    expect(Object.keys(cb.mock.lastCall![0])).toEqual(['u2']); expect(cb.mock.lastCall![0].u2.name).toBe('Bo');
    state = { u1: [{}] }; h.sync({});
    expect(cb.mock.lastCall![0]).toEqual({});
  });
  it('tracks presence once per join and throttles position messages', () => {
    vi.useFakeTimers(); vi.setSystemTime(10_000);
    const ch: any = { on: () => ch, subscribe: (cb?: any) => { cb?.('SUBSCRIBED'); return ch; }, send: vi.fn(), track: vi.fn(), presenceState: () => ({}) };
    const b = createSupabaseBackend({ channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() } as any, me);
    const still = { x: 0.5, y: 0.5, facing: 'left' as const, characterId: 'wren', moving: false };
    for (let i = 0; i < 20; i++) { b.setPresence(still); vi.advanceTimersByTime(120); }   // 2.4 s standing still
    expect(ch.track).toHaveBeenCalledTimes(1);
    expect(ch.send.mock.calls.filter((c: any) => c[0].event === 'pos')).toHaveLength(1);
    for (let i = 0; i < 9; i++) { b.setPresence({ ...still, x: 0.5 + i / 100, moving: true }); vi.advanceTimersByTime(120); }   // ~1 s walking
    expect(ch.send.mock.calls.filter((c: any) => c[0].event === 'pos').length).toBeLessThanOrEqual(6);
    vi.useRealTimers();
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

describe('live channel recovery', () => {
  it('rebuilds the live channel after a failed join and then sends presence', async () => {
    vi.useFakeTimers();
    const made: any[] = [];
    const client: any = { removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn(), channel: () => {
      const ch: any = { on: () => ch, track: vi.fn(), send: vi.fn(), presenceState: () => ({}), subscribe: (cb: (s: string) => void) => { ch.cb = cb; return ch; } };
      made.push(ch); return ch; } };
    const b = createSupabaseBackend(client, me);
    made[0].cb('CHANNEL_ERROR');
    b.setPresence({ x: 0.5, y: 0.5, facing: 'left', characterId: 'wren', moving: false });
    expect(made[0].track).not.toHaveBeenCalled();
    vi.advanceTimersByTime(8100);
    expect(made).toHaveLength(2); expect(client.removeChannel).toHaveBeenCalledWith(made[0]);
    made[1].cb('SUBSCRIBED');
    expect(made[1].send).toHaveBeenCalledWith(expect.objectContaining({ event: 'pos', payload: expect.objectContaining({ p: expect.objectContaining({ characterId: 'wren' }) }) }));
    vi.useRealTimers();
  });
});
