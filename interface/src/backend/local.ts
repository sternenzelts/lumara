import { starlightBalance, stardustBalance } from '../logic';
import { characterById } from '../data/characters';
import { cleanNickname } from '../logic/names';
import { welcomeRollsRemaining } from '../logic/welcome';
import type { Attendance, Backend, CueTopic, Fragment, FragmentCategory, Me, Player, Presence, PullRecord, Session, Settings, Unsubscribe, UserId, Vote, Vow } from './types';

export const DEFAULT_SETTINGS: Settings = {
  pullMode: 'fresh', rates: { sPlusPlus: .005, sPlus: .03 }, pity: { enabled: true, sPlus: 30, sPlusPlus: 100 },
  featuredCharacterId: 'mahesvara', movement: true, skipVowReview: false,
  starlight: { start: 1200, attend: 300, perVote: 50, perVow: 200, pullCost: 200 },
  stardust: { dupeA: 10, dupeSPlus: 50, dupeSPlusPlus: 50, costA: 60, costSPlus: 300, costSPlusPlus: 1000 },
};
type Store = { sessions: Session[]; attendance: Attendance[]; fragments: Fragment[]; votes: Vote[]; vows: Vow[]; players: Player[]; settings: Settings };
type PrivateStore = { fragments: Record<string, string[]>; votes: Record<string, string[]> };
const KEY = 'lumara.demo.v1';
const CHANGE = 'lumara-demo-change';
const uid = () => crypto.randomUUID();
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function createLocalBackend(playerId = new URLSearchParams(location.search).get('player') || 'jay'): Backend {
  const id = playerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'jay';
  const identity: Me = { id, name: id === 'jay' ? 'Jay' : title(id), isAdmin: id === 'jay' };
  let memory: Store = { sessions: [], attendance: [], fragments: [], votes: [], vows: [], players: [], settings: structuredClone(DEFAULT_SETTINGS) };
  let privateMemory: PrivateStore = { fragments: {}, votes: {} };
  let channel: BroadcastChannel | null = null;
  try { channel = new BroadcastChannel('lumara-demo-v1'); } catch { /* Single-tab operation is still usable. */ }
  const subscribers = new Set<() => void>();
  const cueSubscribers = new Map<CueTopic, Set<(data: unknown, from: UserId) => void>>();
  const peerSubscribers = new Set<(peers: Record<UserId, Presence>) => void>();
  const peers: Record<UserId, Presence> = {};
  const seen: Record<UserId, number> = {};
  let lastPresence = 0;
  const read = (): Store => {
    try { const raw = localStorage.getItem(KEY); if (raw) memory = { ...memory, ...JSON.parse(raw) }; } catch { /* Fall back to memory if browser storage is unavailable. */ }
    const copy = structuredClone(memory);
    const oldEconomy = copy.settings.starlight.start === undefined;
    copy.settings.starlight = { ...DEFAULT_SETTINGS.starlight, ...copy.settings.starlight };
    if (oldEconomy) copy.settings.starlight.pullCost = 200;
    copy.players = copy.players.map(p => ({ ...p, nickname: p.nickname ?? null, introSeen: p.introSeen ?? false }));
    copy.sessions = copy.sessions.map(x => ({ ...x, partyLocked: x.partyLocked ?? false, speaker: x.speaker ?? null }));
    return copy;
  };
  const readPrivate = (): PrivateStore => {
    try { const raw = localStorage.getItem(`${KEY}.private.${id}`); if (raw) privateMemory = JSON.parse(raw); } catch { /* Private identifiers remain in memory. */ }
    return structuredClone(privateMemory);
  };
  const writePrivate = (value: PrivateStore) => {
    privateMemory = value;
    try { localStorage.setItem(`${KEY}.private.${id}`, JSON.stringify(value)); } catch { /* Memory fallback. */ }
  };
  const notify = () => subscribers.forEach(fn => fn());
  const write = (value: Store) => {
    memory = value;
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Memory fallback. */ }
    window.dispatchEvent(new Event(CHANGE));
    channel?.postMessage({ kind: 'change' });
  };
  const mutate = async (fn: (s: Store) => void) => {
    const change = () => { const s = read(); fn(s); write(s); };
    // Serialize independent tabs so simultaneous thoughts cannot overwrite each other.
    if (navigator.locks) await navigator.locks.request(KEY, change);
    else change();
  };
  const watch = <T,>(select: (s: Store) => T, cb: (value: T) => void): Unsubscribe => {
    const fn = () => cb(select(read())); subscribers.add(fn); fn(); return () => subscribers.delete(fn);
  };
  const requireWarden = (s: Store, sessionId: string) => {
    const session = s.sessions.find(x => x.id === sessionId);
    if (!session) throw new Error('This retro is no longer available. Return to the Sanctuary.');
    if (!identity.isAdmin && session.wardenId !== id) throw new Error('Only the Warden can change this retro.');
    return session;
  };
  const requireStage = (s: Store, sid: string, allowed: Session['stage'][]) => {
    const session = s.sessions.find(x => x.id === sid);
    if (!session || session.status !== 'active' || !allowed.includes(session.stage)) throw new Error('The retro has moved on. Your screen will follow the current stage.');
    if (!s.attendance.some(x => x.sessionId === sid && x.userId === id)) throw new Error('Join this retro first.');
  };
  const player = (s: Store) => {
    let p = s.players.find(x => x.userId === id);
    if (!p) { p = { userId: id, displayCharacterId: null, owned: {}, pulls: [], nickname: null, introSeen: false }; s.players.push(p); }
    return p;
  };
  window.addEventListener(CHANGE, notify);
  window.addEventListener('storage', event => { if (event.key === KEY || event.key?.startsWith(`${KEY}.private.`)) notify(); });
  channel?.addEventListener('message', event => {
    const message = event.data;
    if (message.kind === 'change') notify();
    if (message.kind === 'cue') cueSubscribers.get(message.topic)?.forEach(fn => fn(message.data, message.from));
    if (message.kind === 'presence' && message.from !== id) {
      peers[message.from] = message.presence; seen[message.from] = Date.now();
      peerSubscribers.forEach(fn => fn({ ...peers }));
    }
  });
  window.setInterval(() => {
    let changed = false;
    for (const key of Object.keys(seen)) if (Date.now() - seen[key] > 5000) { delete peers[key]; delete seen[key]; changed = true; }
    if (changed) peerSubscribers.forEach(fn => fn({ ...peers }));
  }, 2000);
  const backend: Backend = {
    mode: 'local',
    async me() { return identity; },
    async profiles(ids) { return Object.fromEntries(ids.map(key => [key, { name: title(key) }])); },
    async createSession(sprintName) {
      if (!identity.isAdmin) throw new Error('Ask Jay to start a retro.');
      if (!sprintName.trim()) throw new Error('Give this voyage a name.');
      const session: Session = { id: uid(), sprintName: sprintName.trim().slice(0, 80), stage: 'register', status: 'active', wardenId: id, currentFragmentId: null, timerEndsAt: null, createdAt: Date.now(), partyLocked: false, speaker: null };
      await mutate(s => { if (s.sessions.some(x => x.status !== 'ended')) throw new Error('A retro is already in progress. Join it from the Sanctuary.'); s.sessions.push(session); });
      await backend.join(session.id); return session;
    },
    watchActiveSession(cb) { return watch(s => s.sessions.filter(x => x.status !== 'ended').sort((a, b) => b.createdAt - a.createdAt)[0] || null, cb); },
    watchSessions(cb) { return watch(s => [...s.sessions].sort((a, b) => b.createdAt - a.createdAt), cb); },
    async updateSession(sid, patch) { await mutate(s => { const session = requireWarden(s, sid); Object.assign(session, patch); }); },
    async cancelSession(sid) {
      await mutate(s => {
        requireWarden(s, sid);
        for (const p of s.players) {
          for (const pull of p.pulls.filter(x => x.source === 'opening' && x.sessionId === sid)) {
            const left = (p.owned[pull.characterId] || 0) - 1;
            if (left > 0) p.owned[pull.characterId] = left; else { delete p.owned[pull.characterId]; if (p.displayCharacterId === pull.characterId) p.displayCharacterId = null; }
          }
          p.pulls = p.pulls.filter(x => !(x.source === 'opening' && x.sessionId === sid));
        }
        s.sessions = s.sessions.filter(x => x.id !== sid); s.attendance = s.attendance.filter(x => x.sessionId !== sid);
        s.fragments = s.fragments.filter(x => x.sessionId !== sid); s.votes = s.votes.filter(x => x.sessionId !== sid); s.vows = s.vows.filter(x => x.sessionId !== sid);
      });
    },
    async join(sid) {
      await mutate(s => {
        const session = s.sessions.find(x => x.id === sid && x.status !== 'ended');
        if (!session) throw new Error('No active retro with that code. Check the code with your Warden.');
        if (!s.attendance.some(x => x.sessionId === sid && x.userId === id)) {   // members may always reconnect
          if (session.partyLocked) throw new Error('The party is locked. Ask your Warden to unlock it.');
          if (session.stage !== 'register') throw new Error('This voyage has already started. Join the next one.');
          s.attendance.push({ userId: id, sessionId: sid, joinedAt: Date.now(), votesCast: 0, characterId: null });
        }
        player(s);
      });
    },
    async removePlayer(sid, userId) {
      await mutate(s => {
        const session = requireWarden(s, sid);
        if (session.status === 'ended') throw new Error('This voyage has ended.');
        if (userId === session.wardenId) throw new Error('The Warden can’t be removed from their own party.');
        s.attendance = s.attendance.filter(x => !(x.sessionId === sid && x.userId === userId));
      });
    },
    async setMyCharacter(sid, characterId) { await mutate(s => {
      if (s.sessions.find(x => x.id === sid && x.status !== 'ended')?.stage !== 'register') throw new Error('Companions are locked once the voyage starts.');
      const a = s.attendance.find(x => x.sessionId === sid && x.userId === id); if (!a) throw new Error('Join the retro first.');
      if (!player(s).owned[characterId]) throw new Error('Choose a character from your collection.'); a.characterId = characterId; }); },
    watchAttendance(sid, cb) { return watch(s => s.attendance.filter(x => x.sessionId === sid), cb); },
    async addFragment(sid, text, category) {
      if (!text.trim()) throw new Error('Write a thought before sending it.');
      const fragment: Fragment = { id: uid(), sessionId: sid, text: text.trim().slice(0, 1500), category, createdAt: Date.now() };
      await mutate(s => { requireStage(s, sid, ['fragment_drop']); s.fragments.push(fragment); const p = readPrivate(); (p.fragments[sid] ||= []).push(fragment.id); writePrivate(p); });
      return fragment;
    },
    async deleteMyFragment(sid, fid) {
      await mutate(s => {
        const p = readPrivate(); if (!p.fragments[sid]?.includes(fid)) throw new Error('You can only remove your own thoughts.');
        requireStage(s, sid, ['fragment_drop']); s.fragments = s.fragments.filter(x => x.id !== fid || x.sessionId !== sid);
        p.fragments[sid] = p.fragments[sid].filter(x => x !== fid); writePrivate(p);
      });
    },
    async myFragmentIds(sid) { return readPrivate().fragments[sid] || []; },
    watchFragments(sid, cb) { return watch(s => s.fragments.filter(x => x.sessionId === sid), cb); },
    async castVote(sid, fid) {
      const vote: Vote = { id: uid(), sessionId: sid, fragmentId: fid };
      await mutate(s => {
        const p = readPrivate(); const own = p.votes[sid] ||= [];
        if (own.length >= 3) throw new Error('You have used all three votes. Remove one to vote elsewhere.');
        requireStage(s, sid, ['vote']); if (!s.fragments.some(x => x.id === fid && x.sessionId === sid)) throw new Error('This thought is no longer available.');
        s.votes.push(vote); const a = s.attendance.find(x => x.sessionId === sid && x.userId === id)!; a.votesCast = own.length + 1;
        own.push(vote.id); writePrivate(p);
      });
    },
    async removeMyVote(sid, fid) {
      await mutate(s => {
        const p = readPrivate(); requireStage(s, sid, ['vote']);
        const vote = s.votes.find(x => x.sessionId === sid && x.fragmentId === fid && p.votes[sid]?.includes(x.id));
        if (!vote) throw new Error('You have no vote on this thought.');
        p.votes[sid] = p.votes[sid].filter(x => x !== vote.id); s.votes = s.votes.filter(x => x.id !== vote.id);
        s.attendance.find(x => x.sessionId === sid && x.userId === id)!.votesCast = p.votes[sid].length;
        writePrivate(p);
      });
    },
    async myVotes(sid) { const p = readPrivate(); return read().votes.filter(x => x.sessionId === sid && p.votes[sid]?.includes(x.id)).map(x => x.fragmentId); },
    watchVotes(sid, cb) { return watch(s => s.votes.filter(x => x.sessionId === sid), cb); },
    watchVows(cb) { return watch(s => s.vows, cb); },
    async addVow(sid, text, ownerId) {
      if (!text.trim()) throw new Error('Write an action item first.');
      const vow: Vow = { id: uid(), sessionId: sid, text: text.trim().slice(0, 1000), ownerId, status: 'open', createdAt: Date.now() };
      await mutate(s => { requireWarden(s, sid); s.vows.push(vow); }); return vow;
    },
    async updateVow(vid, patch) { await mutate(s => { const vow = s.vows.find(x => x.id === vid); if (!vow) throw new Error('This vow is no longer available.'); const active = s.sessions.find(x => x.status !== 'ended'); if (!identity.isAdmin && active?.wardenId !== id) throw new Error('Only the Warden can update vows.'); Object.assign(vow, patch); }); },
    watchPlayer(userId, cb) { return watch(s => s.players.find(x => x.userId === userId) || null, cb); },
    watchPlayers(cb) { return watch(s => s.players, cb); },
    async grantCurrency(userId, currency, amount) {
      if (!['starlight', 'stardust'].includes(currency) || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) throw new Error('Choose a currency and a whole amount between 1 and 1,000,000.');
      await mutate(s => {
        const active = s.sessions.filter(x => x.status !== 'ended').sort((a,b) => b.createdAt - a.createdAt)[0];
        if (!identity.isAdmin && (!active || active.wardenId !== id || !s.attendance.some(a => a.sessionId === active.id && a.userId === userId))) throw new Error('Only an admin or this party’s Warden can give currency.');
        const recipient = s.players.find(p => p.userId === userId);
        if (!recipient) throw new Error('This player is no longer available.');
        const total = (recipient.currencyGrants || []).filter(g => g.currency === currency).reduce((n,g) => n + g.amount, amount);
        if (!Number.isSafeInteger(total)) throw new Error('This player’s currency limit has been reached.');
        (recipient.currencyGrants ||= []).push({id:uid(),currency,amount,byUserId:id,at:Date.now()});
      });
    },
    async appendMyPull(record) { await mutate(s => { const p = player(s); const character = characterById(record.characterId);
      if (!character || character.grade !== record.grade) throw new Error('This companion is unavailable.');
      if (record.source === 'welcome' && (!p.nickname || !p.introSeen || welcomeRollsRemaining(p) < 1)) throw new Error('Your free welcome wishes are already claimed or unavailable.');
      if (record.source === 'banner' && starlightBalance({userId:id,attendance:s.attendance,vows:s.vows,player:p,settings:s.settings}) < s.settings.starlight.pullCost) throw new Error(`You need ${s.settings.starlight.pullCost} Starlight for a wish.`);
      if (record.source === 'exchange') { const cost = record.grade === 'S++' ? s.settings.stardust.costSPlusPlus : record.grade === 'S+' ? s.settings.stardust.costSPlus : s.settings.stardust.costA; if(stardustBalance({player:p,settings:s.settings}) < cost) throw new Error('You need more Stardust for this exchange.'); }
      p.pulls.push({...record,duplicate:!!p.owned[record.characterId]}); p.owned[record.characterId] = (p.owned[record.characterId] || 0) + 1; p.displayCharacterId ||= record.characterId; }); },
    async setMyNickname(nickname) { const name = cleanNickname(nickname); await mutate(s => { player(s).nickname = name; }); },
    async markIntroSeen() { await mutate(s => { player(s).introSeen = true; }); },
    async setMyDisplayCharacter(characterId) { await mutate(s => { const p = player(s); if (!p.owned[characterId]) throw new Error('You have not collected this character yet.'); p.displayCharacterId = characterId; }); },
    watchSettings(cb) { return watch(s => s.settings, cb); },
    async saveSettings(settings) {
      if (!identity.isAdmin) throw new Error('Only Jay can change settings.');
      if (settings.rates.sPlus < 0 || settings.rates.sPlusPlus < 0 || settings.rates.sPlus + settings.rates.sPlusPlus > 1) throw new Error('Rarity rates must total 100% or less.');
      const values = [...Object.values(settings.rates), ...Object.values(settings.pity).filter(x => typeof x === 'number'), ...Object.values(settings.starlight), ...Object.values(settings.stardust)];
      if (values.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0)) throw new Error('Enter valid, non-negative currency and pity values.');
      if (settings.starlight.pullCost <= 0 || settings.pity.sPlus < 1 || settings.pity.sPlusPlus < 1) throw new Error('Pull cost and pity thresholds must be at least 1.');
      await mutate(s => { s.settings = structuredClone(settings); });
    },
    emit(topic, data) { cueSubscribers.get(topic)?.forEach(fn => fn(data, id)); channel?.postMessage({ kind: 'cue', topic, data, from: id }); },
    on(topic, cb) { let set = cueSubscribers.get(topic); if (!set) { set = new Set(); cueSubscribers.set(topic, set); } set.add(cb); return () => { set!.delete(cb); }; },
    setPresence(presence) { if (Date.now() - lastPresence < 95) return; lastPresence = Date.now(); channel?.postMessage({ kind: 'presence', presence, from: id }); },
    onPeers(cb) { peerSubscribers.add(cb); cb({ ...peers }); return () => { peerSubscribers.delete(cb); }; },
  };
  return backend;
}
