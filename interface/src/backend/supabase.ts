import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend, CheckInSummary, CueTopic, PeerScores, Me, Player, Presence, Settings, UserId, Unsubscribe } from './types';
import { createSmoother } from './peerSmoothing';
import { toAttendance, toCheckIn, toPeerResult, toFragment, toPlayer, toSession, toSettings, toVote, toVow } from './supabaseRows';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Online backend: reads re-fetch on Realtime changes (and on reconnect); writes go through server RPCs that enforce the rules. */
export function createSupabaseBackend(sb: SupabaseClient, me: Me): Backend {
  const rows = async (q: PromiseLike<{ data: any; error: any }>) => { const { data, error } = await q; if (error) throw new Error(error.message); return (data ?? []) as any[]; };
  const call = async (name: string, args?: object) => { const { data, error } = await sb.rpc(name, args); if (error) throw new Error(error.message); return data; };
  let n = 0;
  const live = <T,>(tables: string[], load: () => Promise<T>, cb: (v: T) => void): Unsubscribe => {
    let alive = true; let seq = 0;
    const run = async () => { const mine = ++seq; try { const v = await load(); if (alive && mine === seq) cb(v); } catch (e) { console.error(e); } };
    const open = () => {
      const ch = sb.channel(`watch-${++n}-${Math.random().toString(36).slice(2, 8)}`);
      tables.forEach(table => ch.on('postgres_changes' as any, { event: '*', schema: 'public', table }, () => void run()));
      let ok = false;
      ch.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') { ok = true; void run(); return; }
        if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT') return;
        ok = false;   // the client usually rejoins by itself; rebuild only if it is still down a while later
        setTimeout(() => { if (ok || !alive || current !== ch) return; void sb.removeChannel(ch); current = open(); }, 8000);
      });
      return ch;
    };
    let current = open();
    void run();   // first load straight away, even if the live channel is slow to join
    return () => { alive = false; sb.removeChannel(current); };
  };
  const loadPlayer = async (userId: string): Promise<Player | null> => {
    const [p] = await rows(sb.from('players').select('*').eq('user_id', userId)); if (!p) return null;
    const [pulls, grants] = await Promise.all([rows(sb.from('pulls').select('*').eq('user_id', userId).order('at')), rows(sb.from('currency_grants').select('*').eq('user_id', userId))]);
    return toPlayer(p, pulls, grants);
  };

  // One shared live channel. Presence (rate-limited by Supabase) only says who is online and is sent once per join;
  // walking positions travel as broadcast 'pos' messages: up to 4/s while moving, a heartbeat every 3 s otherwise.
  const cueSubs = new Map<string, Set<(d: unknown, from: UserId) => void>>();
  const peerSubs = new Set<(p: Record<UserId, Presence>) => void>();
  const positions: Record<UserId, Presence> = {}; let online = new Set<UserId>();
  let peers: Record<UserId, Presence> = {}; let lastSent = 0; let lastKey = '';
  let joined = false; let lastPresence: Presence | null = null;
  const smoother = createSmoother(); let frame: number | null = null;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const publishPeers = () => {
    const drawn = smoother.sample(now());
    peers = Object.fromEntries(Object.entries(drawn).filter(([id]) => id !== me.id && online.has(id)));
    peerSubs.forEach(fn => fn({ ...peers }));
  };
  // Redraw every frame while someone is still sliding between samples; stop once everyone has settled.
  const animate = () => {
    if (frame !== null || typeof requestAnimationFrame === 'undefined') return;
    const step = () => { publishPeers(); frame = smoother.settled(now()) ? null : requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
  };
  const sendPos = (p: Presence) => { lastSent = Date.now(); lastKey = JSON.stringify(p); void liveCh!.send({ type: 'broadcast', event: 'pos', payload: { from: me.id, p } }); };
  const openLive = () => {
    const ch = sb.channel('lumara-live', { config: { broadcast: { self: false }, presence: { key: me.id } } });
    (['pull_reveal', 'reaction', 'stage_cue', 'skill', 'say', 'speaker'] as const).forEach(event =>
      ch.on('broadcast' as any, { event }, ({ payload }: any) => cueSubs.get(event)?.forEach(fn => fn(payload.data, payload.from))));
    ch.on('broadcast' as any, { event: 'pos' }, ({ payload }: any) => {
      if (!payload?.from || payload.from === me.id) return;
      positions[payload.from] = payload.p; online.add(payload.from); smoother.add(payload.from, payload.p, now()); publishPeers(); animate();
    });
    ch.on('presence' as any, { event: 'sync' }, () => {
      online = new Set(Object.entries(ch.presenceState() as Record<string, unknown[]>).filter(([, v]) => v.length).map(([k]) => k));
      for (const id of Object.keys(positions)) if (!online.has(id)) { delete positions[id]; smoother.forget(id); }
      publishPeers();
    });
    ch.subscribe((status: string) => {
      if (liveCh !== ch && liveCh) return;
      if (status === 'SUBSCRIBED') { joined = true; void ch.track({ at: Date.now() }); if (lastPresence) sendPos(lastPresence); return; }
      if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT' && status !== 'CLOSED') return;
      joined = false;   // the client usually rejoins by itself; rebuild only if it is still down a while later
      setTimeout(() => { if (joined || liveCh !== ch) return; void sb.removeChannel(ch); liveCh = openLive(); }, status === 'CLOSED' ? 2000 : 8000);
    });
    return ch;
  };
  let liveCh: ReturnType<typeof openLive> | null = null;
  liveCh = openLive();

  const backend: Backend = {
    mode: 'artifact',
    async me() { return me; },
    async profiles(ids) { const r = ids.length ? await rows(sb.from('players').select('user_id,nickname').in('user_id', ids)) : []; return Object.fromEntries(ids.map(id => [id, { name: r.find(x => x.user_id === id)?.nickname || 'Warden' }])); },
    watchActiveSession: cb => live(['sessions'], async () => (await rows(sb.from('sessions').select('*').neq('status', 'ended').order('created_at', { ascending: false }))).map(toSession)[0] ?? null, cb),
    watchSessions: cb => live(['sessions'], async () => (await rows(sb.from('sessions').select('*').order('created_at', { ascending: false }))).map(toSession), cb),
    watchAttendance: (sid, cb) => live(['attendance'], async () => (await rows(sb.from('attendance').select('*').eq('session_id', sid))).map(toAttendance), cb),
    watchFragments: (sid, cb) => live(['fragments'], async () => (await rows(sb.from('fragments').select('*').eq('session_id', sid).order('created_at'))).map(toFragment), cb),
    watchVotes: (sid, cb) => live(['votes'], async () => (await rows(sb.from('votes').select('*').eq('session_id', sid))).map(toVote), cb),
    watchVows: cb => live(['vows'], async () => (await rows(sb.from('vows').select('*').order('created_at'))).map(toVow), cb),
    watchPlayer: (userId, cb) => live(['players', 'pulls', 'currency_grants'], () => loadPlayer(userId), cb),
    watchPlayers: cb => live(['players', 'pulls', 'currency_grants'], async () => {
      const [ps, pulls, grants] = await Promise.all([rows(sb.from('players').select('*')), rows(sb.from('pulls').select('*').order('at')), rows(sb.from('currency_grants').select('*'))]);
      return ps.map(p => toPlayer(p, pulls.filter(x => x.user_id === p.user_id), grants.filter(x => x.user_id === p.user_id)));
    }, cb),
    watchSettings: (cb: (s: Settings) => void) => live(['settings'], async () => toSettings((await rows(sb.from('settings').select('*')))[0]), cb),
    watchCheckIns: (sid, cb) => live(['checkins', 'attendance', 'sessions'], async () => (await rows(sb.from('checkins').select('*').eq('session_id', sid))).map(toCheckIn), cb),
    async myCheckIn(sid) { const [r] = await rows(sb.from('checkins').select('*').eq('session_id', sid).eq('user_id', me.id)); return r ? toCheckIn(r) : null; },
    ratePeer: async (sid, targetId, scores) => { await call('rate_peer', { p_session: sid, p_target: targetId, p_scores: scores }); },
    async myPeerRatings(sid) { const r = ((await call('my_peer_ratings', { p_session: sid })) ?? []) as { target_id: string; scores: PeerScores }[]; return Object.fromEntries(r.map(x => [x.target_id, x.scores])); },
    async peerSummary(sid) { return (((await call('peer_summary', { p_session: sid })) ?? []) as any[]).map(toPeerResult); },
    async checkInSummary(sid) { return ((await call('checkin_summary', { p_session: sid })) ?? null) as CheckInSummary | null; },
    async myFragmentIds(sid) { return ((await call('my_fragment_ids', { p_session: sid })) ?? []) as string[]; },
    async myVotes(sid) { return ((await call('my_votes', { p_session: sid })) ?? []) as string[]; },

    createSession: async name => toSession(await call('create_session', { p_name: name })),
    updateSession: async (id, patch) => { await call('set_session', { p_session: id, p_patch: patch }); },
    cancelSession: async id => { await call('cancel_session', { p_session: id }); },
    join: async sid => { await call('join_session', { p_session: sid }); },
    chooseTurnThought: async (sid, fid) => { await call('choose_turn_thought', { p_session: sid, p_fragment: fid }); },
    removePlayer: async (sid, userId) => { await call('remove_player', { p_session: sid, p_user: userId }); },
    saveMyCheckIn: async (sid, sat, growth) => { await call('save_checkin', { p_session: sid, p_sat: sat, p_growth: growth }); },
    setMyCharacter: async (sid, c) => { await call('set_my_character', { p_session: sid, p_character: c }); },
    addFragment: async (sid, text, category) => toFragment(await call('add_fragment', { p_session: sid, p_text: text, p_category: category })),
    deleteMyFragment: async (_sid, fid) => { await call('delete_my_fragment', { p_fragment: fid }); },
    castVote: async (sid, fid) => { await call('cast_vote', { p_session: sid, p_fragment: fid }); },
    removeMyVote: async (sid, fid) => { await call('remove_my_vote', { p_session: sid, p_fragment: fid }); },
    addVow: async (sid, text, owner) => toVow(await call('add_vow', { p_session: sid, p_text: text, p_owner: owner })),
    updateVow: async (id, patch) => { await call('update_vow', { p_vow: id, p_patch: patch }); },
    grantCurrency: async (userId, currency, amount) => { await call('grant_currency', { p_user: userId, p_currency: currency, p_amount: amount }); },
    appendMyPull: async r => { await call('append_pull', { p_character: r.characterId, p_grade: r.grade, p_source: r.source, p_session: r.sessionId ?? null }); },
    setMyDisplayCharacter: async c => { await call('set_display_character', { p_character: c }); },
    setMyNickname: async name => { await call('set_nickname', { p_name: name }); },
    markIntroSeen: async () => { await call('mark_intro_seen'); },
    saveSettings: async s => { await call('save_settings', { p_data: s }); },

    emit(topic: CueTopic, data: unknown) { cueSubs.get(topic)?.forEach(fn => fn(data, me.id)); if (joined) void liveCh!.send({ type: 'broadcast', event: topic, payload: { data, from: me.id } }); },
    on(topic, cb) { let s = cueSubs.get(topic); if (!s) cueSubs.set(topic, s = new Set()); s.add(cb); return () => { s!.delete(cb); }; },
    setPresence(p) {
      lastPresence = p; if (!joined) return;
      const gap = Date.now() - lastSent;
      if (p.moving ? gap >= 250 : (gap >= 3000 || (JSON.stringify(p) !== lastKey && gap >= 250))) sendPos(p);
    },
    onPeers(cb) { peerSubs.add(cb); cb({ ...peers }); return () => { peerSubs.delete(cb); }; },
  };
  return backend;
}
