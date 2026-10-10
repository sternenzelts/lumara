import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../backend/local';
import type { Attendance, Fragment, Player, Session, Vote, Vow } from '../backend/types';
import { buildReport, portraitGroups, promisesKept, rankByVotes } from './report';

const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: id, category: 'spark', createdAt });
const vote = (fragmentId: string): Vote => ({ id: fragmentId + Math.random(), sessionId: 's', fragmentId });

describe('rankByVotes', () => {
  it('puts the most-voted thought first and breaks ties by age', () => {
    const r = rankByVotes([frag('a', 1), frag('b', 2), frag('c', 3)], [vote('c'), vote('c'), vote('b'), vote('a')]);
    expect(r.map(x => [x.fragment.id, x.votes])).toEqual([['c', 2], ['a', 1], ['b', 1]]);
  });
  it('lists unvoted thoughts with 0 votes', () => {
    expect(rankByVotes([frag('a', 1)], []).map(x => x.votes)).toEqual([0]);
  });
});

const sess = (id: string, createdAt: number, extra: Partial<Session> = {}): Session => ({ id, sprintName: id, stage: 'rewards', status: 'active', wardenId: 'w', currentFragmentId: null, timerEndsAt: null, createdAt, partyLocked: false, speaker: null, ...extra });
const vow = (id: string, sessionId: string, status: Vow['status'], ownerId: string | null = null): Vow => ({ id, sessionId, text: id, ownerId, status, createdAt: 1 });
const att = (userId: string, extra: Partial<Attendance> = {}): Attendance => ({ userId, sessionId: 'now', joinedAt: 1, votesCast: 2, characterId: null, checkinDone: true, peerGiven: 1, ...extra });
const player = (userId: string, displayCharacterId: string | null): Player => ({ userId, displayCharacterId, owned: {}, pulls: [], nickname: userId, introSeen: true });

describe('promisesKept', () => {
  it('counts the previous voyage’s vows that are fulfilled', () => {
    const sessions = [sess('old', 1), sess('prev', 2), sess('now', 3)];
    const vows = [vow('a', 'prev', 'fulfilled'), vow('b', 'prev', 'not_yet'), vow('c', 'old', 'fulfilled'), vow('d', 'now', 'open')];
    expect(promisesKept(sessions[2], sessions, vows)).toBe(1);
    expect(promisesKept(sessions[0], sessions, vows)).toBe(0);
  });
});
describe('portraitGroups', () => {
  it('uses one row up to 5, two rows up to 10, rows of 6 beyond', () => {
    const n = (k: number) => portraitGroups(Array.from({ length: k }, (_, i) => i)).map(r => r.length);
    expect(n(1)).toEqual([1]); expect(n(5)).toEqual([5]); expect(n(8)).toEqual([4, 4]); expect(n(9)).toEqual([5, 4]); expect(n(13)).toEqual([6, 6, 1]);
  });
});
describe('buildReport', () => {
  const base = () => ({
    session: sess('now', 3, { wardenId: 'w' }), sessions: [sess('prev', 2), sess('now', 3)],
    attendance: [att('ana', { joinedAt: 2, characterId: 'wren' }), att('w', { joinedAt: 3 })], players: [player('w', 'seren'), player('ana', 'rook')],
    profiles: { ana: { name: 'Ana' }, w: { name: 'Jay' } },
    fragments: [{ id: 'f1', sessionId: 'now', text: 'Keep pairing', category: 'radiance' as const, createdAt: 1 }, { id: 'f2', sessionId: 'now', text: 'Fix CI', category: 'fracture' as const, createdAt: 2 }, { id: 'f3', sessionId: 'now', text: 'Faster CI', category: 'fracture' as const, createdAt: 3 }],
    votes: [{ id: 'v', sessionId: 'now', fragmentId: 'f3' }],
    vows: [vow('Ship it', 'now', 'open', 'ana'), vow('Tidy', 'now', 'open'), vow('kept', 'prev', 'fulfilled')],
    settings: DEFAULT_SETTINGS, checkIn: { sat: 70, growth: 80, n: 2, of: 2 },
    peer: [{ targetId: 'ana', raters: 1, pct: { collab: 80, owner: 80, comm: 80, impact: 80, growth: 80 } }, { targetId: 'w', raters: 1, pct: { collab: 60, owner: 60, comm: 60, impact: 60, growth: 60 } }],
  });
  it('puts the Warden first and falls back to the display companion', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.portrait).toEqual([{ userId: 'w', name: 'Jay', characterId: 'seren', warden: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false }]);
  });
  it('shows a player only their own peer result and their own Starlight', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.peer.map(p => p.userId)).toEqual(['ana']);
    expect(r.numbers).toEqual({ thoughts: 3, votes: 1, vows: 2, promisesKept: 1, myStarlight: 300 + 2 * 50 + 200 });
  });
  it('shows the Warden everyone’s peer results', () => {
    expect(buildReport({ ...base(), viewerId: 'w', viewerSeesAll: true }).peer.map(p => p.name).sort()).toEqual(['Ana', 'Jay']);
  });
  it('gives an outsider no Starlight and no peer rows (Archives viewer)', () => {
    const r = buildReport({ ...base(), viewerId: 'stranger', viewerSeesAll: false });
    expect(r.numbers.myStarlight).toBeNull(); expect(r.peer).toEqual([]);
  });
  it('groups thoughts by category, most-voted first, and names vow owners', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.thoughts.find(t => t.category === 'fracture')!.items.map(i => i.text)).toEqual(['Faster CI', 'Fix CI']);
    expect(r.thoughts.map(t => t.category)).toEqual(['radiance', 'fracture']);   // empty categories are left out
    expect(r.vows).toEqual([{ text: 'Ship it', owner: 'Ana' }, { text: 'Tidy', owner: 'Shared by the team' }]);
  });
  it('drops peer rows for players no longer in the party', () => {
    const r = buildReport({ ...base(), attendance: [att('w')], viewerId: 'w', viewerSeesAll: true });
    expect(r.peer.map(p => p.userId)).toEqual(['w']);
  });
});
