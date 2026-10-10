// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend, DEFAULT_SETTINGS } from './local';
import type { Attendance, CheckIn, Fragment, Player, Session, SpeakerState, Stage, Vote } from './types';
import { NO_SPEAKER } from '../logic/speaker';

/** Test shortcut: move a voyage's stage directly in the demo store (skips the Warden and check-in rules). */
const setStage = (sid: string, stage: Stage) => {
  const s = JSON.parse(localStorage.getItem('lumara.demo.v1')!); s.sessions.find((x: Session) => x.id === sid).stage = stage;
  localStorage.setItem('lumara.demo.v1', JSON.stringify(s));
};
/** Test shortcut: everyone in the party has picked a companion and checked in (the lobby's start rule). */
const checkInEveryone = (sid: string) => {
  const s = JSON.parse(localStorage.getItem('lumara.demo.v1')!); s.checkins ??= [];
  for (const a of s.attendance.filter((x: Attendance) => x.sessionId === sid)) {
    a.characterId ??= 'wren'; a.checkinDone = true;
    if (!s.checkins.some((c: CheckIn) => c.sessionId === sid && c.userId === a.userId)) s.checkins.push({ sessionId: sid, userId: a.userId, sat: 4, growth: 4 });
  }
  localStorage.setItem('lumara.demo.v1', JSON.stringify(s));
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} });
});
describe('local demo contract', () => {
  it('peer feedback: no self-rating, editable, own result only, Warden sees all, removal-aware', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Peers'); await ana.join(s.id); await bob.join(s.id);
    checkInEveryone(s.id); await jay.updateSession(s.id, { stage: 'vow_altar' });
    const ok = { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 };
    await expect(ana.ratePeer(s.id, 'ana', ok)).rejects.toThrow('yourself');
    await expect(ana.ratePeer(s.id, 'zed', ok)).rejects.toThrow('isn’t in this party');
    await expect(ana.ratePeer(s.id, 'bob', { ...ok, collab: 2.5 })).rejects.toThrow('1 to 5');
    await ana.ratePeer(s.id, 'bob', ok); await ana.ratePeer(s.id, 'bob', { ...ok, collab: 1 });
    await bob.ratePeer(s.id, 'ana', ok);
    expect(await ana.myPeerRatings(s.id)).toEqual({ bob: { ...ok, collab: 1 } });
    expect(await ana.peerSummary(s.id)).toEqual([]);   // before Homecoming
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.peerGiven).toBe(1);
    await jay.updateSession(s.id, { stage: 'rewards' });
    expect((await bob.peerSummary(s.id)).map(r => [r.targetId, r.raters, r.pct.collab])).toEqual([['bob', 1, 20]]);
    expect((await jay.peerSummary(s.id)).map(r => r.targetId).sort()).toEqual(['ana', 'bob']);
    await jay.removePlayer(s.id, 'bob');
    expect(await jay.peerSummary(s.id)).toEqual([]);
    jay.watchAttendance(s.id, a => att = a); expect(att.find(a => a.userId === 'ana')?.peerGiven).toBe(0);
    const pub = JSON.parse(localStorage.getItem('lumara.demo.v1')!).peerRatings as object[];   // the shared store never holds the rater
    expect(pub.every(r => Object.keys(r).sort().join() === 'id,scores,sessionId,targetId')).toBe(true);
  });
  it('turns: only the chosen player chooses, from their own undiscussed picks, with a fallback', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Turns'); await ana.join(s.id); checkInEveryone(s.id);
    await jay.updateSession(s.id, { stage: 'fragment_drop' });
    const f1 = (await jay.addFragment(s.id, 'one', 'spark')).id, f2 = (await jay.addFragment(s.id, 'two', 'spark')).id, f3 = (await jay.addFragment(s.id, 'three', 'spark')).id;
    await jay.updateSession(s.id, { stage: 'vote' }); await ana.castVote(s.id, f1); await ana.castVote(s.id, f2);
    await jay.updateSession(s.id, { stage: 'hall' });
    const turn = (patch: Partial<SpeakerState> = {}) => jay.updateSession(s.id, { speaker: { ...NO_SPEAKER, currentId: 'ana', phase: 'choosing', ...patch } });
    await turn();
    await expect(jay.chooseTurnThought(s.id, f1)).rejects.toThrow('your turn');
    await expect(ana.chooseTurnThought(s.id, f3)).rejects.toThrow('you picked');
    await ana.chooseTurnThought(s.id, f1);
    let now: Session | null = null; jay.watchActiveSession(x => now = x);
    expect((now as Session | null)?.speaker).toMatchObject({ thoughtId: f1, phase: 'discussing' });
    await expect(ana.chooseTurnThought(s.id, f2)).rejects.toThrow('your turn');   // already discussing
    await turn({ discussed: [f1] }); await expect(ana.chooseTurnThought(s.id, f1)).rejects.toThrow('already discussed');
    await turn({ discussed: [f1, f2] }); await ana.chooseTurnThought(s.id, f3);   // none of her picks left: any undiscussed thought
  });
  it('reads a speaker saved before turns had thoughts as an empty turn state', async () => {
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ sessions: [{ id: 'old', sprintName: 'Old', stage: 'hall', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1, partyLocked: false, speaker: { currentId: 'ana', spoken: [], skipped: [] } }], attendance: [], fragments: [], votes: [], vows: [], players: [] }));
    let s: Session | null = null; createLocalBackend('jay').watchActiveSession(x => s = x);
    expect((s as Session | null)?.speaker).toEqual({ currentId: 'ana', spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [] });
  });
  it('lobby check-in: companion first, start waits for everyone, locks at the start, answers hidden until Homecoming', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Check'); await ana.join(s.id); await bob.join(s.id);
    for (const b of [jay, ana, bob]) await b.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await expect(ana.saveMyCheckIn(s.id, 4, 5)).rejects.toThrow('companion');
    for (const b of [jay, ana, bob]) await b.setMyCharacter(s.id, 'wren');
    for (const bad of [[0, 3], [3, 6], [2.5, 3]]) await expect(ana.saveMyCheckIn(s.id, bad[0], bad[1])).rejects.toThrow('1 to 5');
    await ana.saveMyCheckIn(s.id, 4, 5); await bob.saveMyCheckIn(s.id, 2, 3); await bob.saveMyCheckIn(s.id, 3, 3);
    expect(await bob.myCheckIn(s.id)).toMatchObject({ sat: 3, growth: 3 });
    let att: Attendance[] = []; ana.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.checkinDone).toBe(true); expect(att.find(a => a.userId === 'jay')?.checkinDone).toBe(false);
    await expect(jay.updateSession(s.id, { stage: 'fragment_drop' })).rejects.toThrow('check in');
    await jay.updateSession(s.id, { partyLocked: true });   // other lobby changes still work
    let seen: unknown[] = []; jay.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);   // no answers in the lobby
    await jay.saveMyCheckIn(s.id, 5, 5); await jay.updateSession(s.id, { stage: 'fragment_drop' });
    await expect(bob.saveMyCheckIn(s.id, 5, 5)).rejects.toThrow('moved on');
    jay.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);   // nor mid-voyage
    expect(await ana.checkInSummary(s.id)).toBeNull();
    await jay.updateSession(s.id, { stage: 'rewards' });
    jay.watchCheckIns(s.id, r => seen = r); expect(seen).toHaveLength(3);
    ana.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 80, growth: 87, n: 3, of: 3 });
    await jay.removePlayer(s.id, 'bob');
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 90, growth: 100, n: 2, of: 2 });
    await jay.cancelSession(s.id);
    expect(JSON.parse(localStorage.getItem('lumara.demo.v1')!).checkins).toEqual([]);
  });
  it('removing a player who never checked in unblocks the start', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Away'); await ana.join(s.id);
    await jay.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await jay.setMyCharacter(s.id, 'wren'); await jay.saveMyCheckIn(s.id, 3, 3);
    await expect(jay.updateSession(s.id, { stage: 'fragment_drop' })).rejects.toThrow('check in');
    await jay.removePlayer(s.id, 'ana'); await jay.updateSession(s.id, { stage: 'fragment_drop' });
  });
  it('a locked party refuses newcomers but lets members re-enter', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Locked'); await ana.join(s.id);
    await jay.updateSession(s.id, { partyLocked: true });
    await expect(bob.join(s.id)).rejects.toThrow('locked');
    await ana.join(s.id);   // the voyage gate calls join again; must not throw
    await jay.updateSession(s.id, { partyLocked: false }); await bob.join(s.id);
  });
  it('only the Warden removes players, never themselves, and the removed can rejoin when unlocked', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Remove'); await ana.join(s.id);
    await expect(ana.removePlayer(s.id, 'jay')).rejects.toThrow('Only the Warden');
    await expect(jay.removePlayer(s.id, 'jay')).rejects.toThrow('can’t be removed');
    await jay.removePlayer(s.id, 'ana');
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.map(a => a.userId)).toEqual(['jay']);
    await ana.join(s.id); jay.watchAttendance(s.id, a => att = a);
    expect(att.map(a => a.userId).sort()).toEqual(['ana', 'jay']);
  });
  it('reads sessions saved before lock/speaker existed as unlocked with no speaker', async () => {
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ sessions: [{ id: 'old', sprintName: 'Old', stage: 'hall', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 }], attendance: [], fragments: [], votes: [], vows: [], players: [] }));
    let s: Session | null = null; createLocalBackend('jay').watchActiveSession(x => s = x);
    expect(s).toMatchObject({ partyLocked: false, speaker: null });
  });
  it('once the voyage starts: newcomers refused, members reconnect, companions lock, removed players stay out; the lobby reopens', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Started'); await ana.join(s.id);
    await ana.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await ana.setMyCharacter(s.id, 'wren');
    setStage(s.id, 'fragment_drop');
    await expect(bob.join(s.id)).rejects.toThrow('already started');
    await ana.join(s.id);   // reconnect through the voyage gate
    await expect(ana.setMyCharacter(s.id, 'wren')).rejects.toThrow('locked');
    await jay.removePlayer(s.id, 'ana');
    await expect(ana.join(s.id)).rejects.toThrow('already started');
    setStage(s.id, 'register');   // Return to lobby
    await ana.join(s.id); await bob.join(s.id); await ana.setMyCharacter(s.id, 'wren');
  });
  it('persists admin currency gifts and rejects invalid amounts and ordinary players', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'); await ana.setMyNickname('Moon');
    await jay.grantCurrency('ana','starlight',500); await jay.grantCurrency('ana','stardust',60);
    for (const amount of [0,-1,1.5,NaN,1000001]) await expect(jay.grantCurrency('ana','starlight',amount)).rejects.toThrow('whole amount');
    await expect(ana.grantCurrency('ana','starlight',10)).rejects.toThrow('Only an admin');
    const restored = createLocalBackend('ana'); let p: Player | null = null; const stop = restored.watchPlayer('ana', value => p=value);
    expect((p as Player | null)?.currencyGrants?.map(g=>[g.currency,g.amount,g.byUserId])).toEqual([['starlight',500,'jay'],['stardust',60,'jay']]);stop();
  });
  it('lets the active Warden give currency only to current party members', async () => {
    const jay=createLocalBackend('jay'), ana=createLocalBackend('ana'), bob=createLocalBackend('bob'), outsider=createLocalBackend('outsider');
    const s=await jay.createSession('Party');await ana.join(s.id);await bob.join(s.id);await outsider.setMyNickname('Outside');
    await jay.updateSession(s.id,{wardenId:'ana'});
    await ana.grantCurrency('bob','starlight',200);
    await expect(ana.grantCurrency('outsider','starlight',200)).rejects.toThrow('party');
    await jay.updateSession(s.id,{status:'ended'});
    await expect(ana.grantCurrency('bob','starlight',200)).rejects.toThrow('party');
  });
  it('grants five welcome rolls once, keeps the balance, and refuses a sixth after reload', async () => {
    const ana = createLocalBackend('ana'); await ana.setMyNickname('Moon'); await ana.markIntroSeen();
    const record = { at: 1, characterId: 'wren', grade: 'A' as const, source: 'welcome' as const, duplicate: false };
    for (let i = 0; i < 5; i++) await ana.appendMyPull({ ...record, at: i });
    await expect(createLocalBackend('ana').appendMyPull(record)).rejects.toThrow('already claimed');
    const store = JSON.parse(localStorage.getItem('lumara.demo.v1')!);
    expect(store.players[0].pulls).toHaveLength(5); expect(store.players[0].owned.wren).toBe(5);
    await ana.appendMyPull({ ...record, source: 'banner' });
    expect(JSON.parse(localStorage.getItem('lumara.demo.v1')!).players[0].pulls).toHaveLength(6);
  });
  it('does not let an established player claim a first-time gift', async () => {
    const ana = createLocalBackend('ana'); await ana.setMyNickname('Moon'); await ana.markIntroSeen();
    const record = { at: 1, characterId: 'wren', grade: 'A' as const, source: 'banner' as const, duplicate: false };
    await ana.appendMyPull(record);
    await expect(ana.appendMyPull({ ...record, source: 'welcome' })).rejects.toThrow('unavailable');
  });
  it('refuses a seventh paid wish after the starting balance is spent', async () => {
    const ana=createLocalBackend('ana');const record={at:1,characterId:'wren',grade:'A' as const,source:'banner' as const,duplicate:false};
    for(let i=0;i<6;i++)await ana.appendMyPull({...record,at:i});
    await expect(ana.appendMyPull(record)).rejects.toThrow('You need 200 Starlight');
    let p: Player | null=null;const stop=ana.watchPlayer('ana',value=>p=value);expect((p as Player | null)?.pulls).toHaveLength(6);stop();
  });

  it('recovers persistent session state and protects Warden mutations', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana');
    const session = await jay.createSession('Sprint 12');
    let watched: Session | null = null; const stop = ana.watchActiveSession(s => { watched = s; });
    await ana.join(session.id); checkInEveryone(session.id);
    await jay.updateSession(session.id, { stage: 'fragment_drop' });
    expect((watched as Session | null)?.stage).toBe('fragment_drop');
    await expect(ana.updateSession(session.id, { stage: 'vote' })).rejects.toThrow('Warden');
    let restored: Session | null = null; const stopReload = createLocalBackend('ana').watchActiveSession(s => { restored = s; });
    expect((restored as Session | null)?.stage).toBe('fragment_drop'); stop(); stopReload();
  });
  it('keeps author and voter identity out of public objects and owns deletes privately', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana'); const s = await jay.createSession('Privacy');
    await ana.join(s.id); checkInEveryone(s.id); await jay.updateSession(s.id, { stage: 'fragment_drop' });
    const thought = await ana.addFragment(s.id, 'Protect focus time', 'spark');
    expect(Object.keys(thought).sort()).toEqual(['category', 'createdAt', 'id', 'sessionId', 'text']);
    expect(await jay.myFragmentIds(s.id)).toEqual([]); expect(await ana.myFragmentIds(s.id)).toEqual([thought.id]);
    await expect(jay.deleteMyFragment(s.id, thought.id)).rejects.toThrow('own thoughts');
    await jay.updateSession(s.id, { stage: 'vote' }); await ana.castVote(s.id, thought.id);
    let votes: Vote[] = []; const stop = jay.watchVotes(s.id, value => { votes = value; });
    expect(Object.keys(votes[0]).sort()).toEqual(['fragmentId', 'id', 'sessionId']);
    expect(await jay.myVotes(s.id)).toEqual([]); expect(await ana.myVotes(s.id)).toEqual([thought.id]);
    const publicStore = JSON.parse(localStorage.getItem('lumara.demo.v1')!);
    expect(publicStore.fragments[0]).not.toHaveProperty('author'); expect(publicStore.votes[0]).not.toHaveProperty('voter'); stop();
  });
  it('picks: one per thought, no upper limit, un-pick works, votesCast counts picks', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Picks'); await ana.join(s.id); checkInEveryone(s.id);
    await jay.updateSession(s.id, { stage: 'fragment_drop' });
    const ids: string[] = []; for (const t of ['one', 'two', 'three', 'four']) ids.push((await jay.addFragment(s.id, t, 'spark')).id);
    await jay.updateSession(s.id, { stage: 'vote' });
    for (const fid of ids) await ana.castVote(s.id, fid);
    await expect(ana.castVote(s.id, ids[0])).rejects.toThrow('already picked');
    await ana.removeMyVote(s.id, ids[3]);
    expect((await ana.myVotes(s.id)).sort()).toEqual(ids.slice(0, 3).sort());
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.votesCast).toBe(3);
  });
  it('persists a Vow across voyages and allows only admin settings changes', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana'); const s = await jay.createSession('First voyage');
    const vow = await jay.addVow(s.id, 'Write an onboarding checklist', null);
    checkInEveryone(s.id); await jay.updateSession(s.id, { status: 'ended', stage: 'completed' });
    await jay.createSession('Second voyage'); await jay.updateVow(vow.id, { status: 'fulfilled' });
    let fulfilled = false; const stop = jay.watchVows(vows => { fulfilled = vows.some(v => v.id === vow.id && v.status === 'fulfilled'); });
    expect(fulfilled).toBe(true); await expect(ana.saveSettings(DEFAULT_SETTINGS)).rejects.toThrow('Only Jay');
    await expect(jay.saveSettings({ ...DEFAULT_SETTINGS, rates: { sPlus: .9, sPlusPlus: .5 } })).rejects.toThrow('100%'); stop();
  });
  it('stores a cleaned nickname on the caller only and shares it live', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana');
    let seen: Player[] = []; const stop = jay.watchPlayers(list => { seen = list; });
    await ana.setMyNickname('  Moon   Child ');
    expect(seen.find(p => p.userId === 'ana')?.nickname).toBe('Moon Child');
    expect(seen.find(p => p.userId === 'jay')?.nickname ?? null).toBeNull(); stop();
  });
  it('rejects a blank or too-long nickname', async () => {
    const ana = createLocalBackend('ana');
    await expect(ana.setMyNickname('   ')).rejects.toThrow('between 1 and 16');
    await expect(ana.setMyNickname('x'.repeat(17))).rejects.toThrow('between 1 and 16');
  });
  it('marks the intro as seen', async () => {
    const ana = createLocalBackend('ana'); let me: Player | null = null;
    const stop = ana.watchPlayer('ana', p => { me = p; });
    await ana.markIntroSeen(); expect((me as Player | null)?.introSeen).toBe(true); stop();
  });
  it('reads old player records without the new fields as no nickname and intro unseen', async () => {
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ players: [{ userId: 'ana', displayCharacterId: null, owned: {}, pulls: [] }] }));
    const ana = createLocalBackend('ana'); let me: Player | null = null;
    const stop = ana.watchPlayer('ana', p => { me = p; });
    expect(me).toMatchObject({ nickname: null, introSeen: false }); stop();
  });
  it('does not lose an existing thought when a stale tab tries to remove it after writing closes', async () => {
    const jay = createLocalBackend('jay'); const s = await jay.createSession('Stage guard');
    checkInEveryone(s.id); await jay.updateSession(s.id, { stage: 'fragment_drop' }); const f = await jay.addFragment(s.id, 'Keep it safe', 'radiance');
    await jay.updateSession(s.id, { stage: 'vote' }); await expect(jay.deleteMyFragment(s.id, f.id)).rejects.toThrow('moved on');
    let fragments: Fragment[] = []; const stop = jay.watchFragments(s.id, list => { fragments = list; });
    expect(fragments).toHaveLength(1); stop();
  });
  it('cancels a voyage as if it never happened, and only the Warden or an admin can', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Oops'); await ana.join(s.id); checkInEveryone(s.id);
    await jay.updateSession(s.id, { stage: 'fragment_drop' }); await ana.addFragment(s.id, 'A thought', 'spark');
    await jay.updateSession(s.id, { stage: 'vote' }); let frags: Fragment[] = []; ana.watchFragments(s.id, v => { frags = v; })(); const [f] = frags;
    await ana.castVote(s.id, f.id);
    await jay.updateSession(s.id, { stage: 'rewards' }); await ana.appendMyPull({ characterId: 'wren', grade: 'A', source: 'opening', duplicate: false, at: 1, sessionId: s.id });
    await expect(ana.cancelSession(s.id)).rejects.toThrow();
    await jay.cancelSession(s.id);
    let active: Session | null | undefined; ana.watchActiveSession(v => { active = v; })();
    let all: Session[] = []; ana.watchSessions(v => { all = v; })();
    let p: Player | null = null; ana.watchPlayer('ana', v => { p = v; })();
    expect(active).toBeNull(); expect(all.some(x => x.id === s.id)).toBe(false);
    expect((p as Player | null)?.pulls.some(x => x.sessionId === s.id)).toBe(false);
    expect((p as Player | null)?.owned.wren ?? 0).toBe(0);
    expect(await jay.createSession('Fresh start')).toMatchObject({ sprintName: 'Fresh start' });
  });
});
