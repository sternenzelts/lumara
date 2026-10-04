// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend, DEFAULT_SETTINGS } from './local';
import type { Attendance, Fragment, Player, Session, Vote } from './types';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} });
});
describe('local demo contract', () => {
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
    await ana.join(session.id);
    await jay.updateSession(session.id, { stage: 'fragment_drop' });
    expect((watched as Session | null)?.stage).toBe('fragment_drop');
    await expect(ana.updateSession(session.id, { stage: 'vote' })).rejects.toThrow('Warden');
    let restored: Session | null = null; const stopReload = createLocalBackend('ana').watchActiveSession(s => { restored = s; });
    expect((restored as Session | null)?.stage).toBe('fragment_drop'); stop(); stopReload();
  });
  it('keeps author and voter identity out of public objects and owns deletes privately', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana'); const s = await jay.createSession('Privacy');
    await ana.join(s.id); await jay.updateSession(s.id, { stage: 'fragment_drop' });
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
  it('supports three stacked votes and only removes the caller’s votes', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana'); const s = await jay.createSession('Votes');
    await ana.join(s.id); await jay.updateSession(s.id, { stage: 'fragment_drop' }); const f = await jay.addFragment(s.id, 'More pairing', 'radiance');
    await jay.updateSession(s.id, { stage: 'vote' });
    await ana.castVote(s.id, f.id); await ana.castVote(s.id, f.id); await ana.castVote(s.id, f.id);
    await expect(ana.castVote(s.id, f.id)).rejects.toThrow('three votes');
    await expect(jay.removeMyVote(s.id, f.id)).rejects.toThrow('no vote');
    await ana.removeMyVote(s.id, f.id); expect(await ana.myVotes(s.id)).toHaveLength(2);
    let attendance: Attendance[] = []; const stop = jay.watchAttendance(s.id, value => { attendance = value; });
    expect(attendance.find(a => a.userId === 'ana')?.votesCast).toBe(2); stop();
  });
  it('persists a Vow across voyages and allows only admin settings changes', async () => {
    const jay = createLocalBackend('jay'); const ana = createLocalBackend('ana'); const s = await jay.createSession('First voyage');
    const vow = await jay.addVow(s.id, 'Write an onboarding checklist', null);
    await jay.updateSession(s.id, { status: 'ended', stage: 'completed' });
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
    await jay.updateSession(s.id, { stage: 'fragment_drop' }); const f = await jay.addFragment(s.id, 'Keep it safe', 'radiance');
    await jay.updateSession(s.id, { stage: 'vote' }); await expect(jay.deleteMyFragment(s.id, f.id)).rejects.toThrow('moved on');
    let fragments: Fragment[] = []; const stop = jay.watchFragments(s.id, list => { fragments = list; });
    expect(fragments).toHaveLength(1); stop();
  });
  it('cancels a voyage as if it never happened, and only the Warden or an admin can', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Oops'); await ana.join(s.id);
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
