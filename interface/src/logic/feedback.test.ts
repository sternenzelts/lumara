import { describe, expect, it } from 'vitest';
import { finishWarningText, peerDone, pendingPeerFeedback, summarizeCheckIns, summarizePeers } from './feedback';

describe('summarizeCheckIns', () => {
  it('averages current party members as % of 5', () => {
    const rows = [{ sessionId: 's', userId: 'b', sat: 4, growth: 5 }, { sessionId: 's', userId: 'c', sat: 3, growth: 3 }, { sessionId: 's', userId: 'gone', sat: 1, growth: 1 }];
    expect(summarizeCheckIns(rows, ['a', 'b', 'c'])).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
  });
  it('reports null averages when nobody checked in', () => {
    expect(summarizeCheckIns([], ['a'])).toEqual({ sat: null, growth: null, n: 0, of: 1 });
  });
});
const att = (userId: string, checkinDone: boolean, peerGiven: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast: 0, characterId: null, checkinDone, peerGiven });
describe('peer feedback helpers', () => {
  it('averages each trait as % of 5 per target', () => {
    const r = summarizePeers([{ targetId: 'b', scores: { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 } }, { targetId: 'b', scores: { collab: 3, owner: 4, comm: 3, impact: 4, growth: 5 } }]);
    expect(r).toEqual([{ targetId: 'b', raters: 2, pct: { collab: 80, owner: 80, comm: 60, impact: 80, growth: 100 } }]);
  });
  it('counts a player done once they rated every teammate (solo players are done)', () => {
    const party = [att('a', true, 2), att('b', true, 1), att('c', false, 0)];
    expect(party.map(a => peerDone(a, party))).toEqual([true, false, false]);
    expect(peerDone(att('solo', false, 0), [att('solo', false, 0)])).toBe(true);
  });
  it('builds the Finish warning from peer feedback only, or none when everyone is done', () => {
    const party = [att('a', true, 2), att('b', true, 1), att('c', true, 0)];
    expect(pendingPeerFeedback(party)).toBe(2);
    expect(finishWarningText(2)).toBe('2 players haven’t finished peer feedback. Once you finish, nobody can add more.');
    expect(finishWarningText(1)).toBe('1 player hasn’t finished peer feedback. Once you finish, nobody can add more.');
    expect(finishWarningText(0)).toBeNull();
  });
});
