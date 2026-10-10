import { describe, expect, it } from 'vitest';
import { minPicks, pickWarningText, underPicked } from './picks';

const att = (userId: string, votesCast: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast, characterId: null, checkinDone: true, peerGiven: 0 });
describe('picks', () => {
  it('asks for 3 picks, or every thought when fewer were written', () => {
    expect(minPicks(10)).toBe(3); expect(minPicks(2)).toBe(2); expect(minPicks(0)).toBe(0);
  });
  it('counts players under the minimum', () => {
    expect(underPicked([att('a', 3), att('b', 1), att('c', 0)], 5)).toBe(2);
    expect(underPicked([att('a', 2)], 2)).toBe(0);
  });
  it('warns the Warden, or not at all', () => {
    expect(pickWarningText(2, 3)).toBe('2 players picked fewer than 3 thoughts. Continue anyway?');
    expect(pickWarningText(1, 1)).toBe('1 player picked fewer than 1 thought. Continue anyway?');
    expect(pickWarningText(0, 3)).toBeNull(); expect(pickWarningText(2, 0)).toBeNull();
  });
});
