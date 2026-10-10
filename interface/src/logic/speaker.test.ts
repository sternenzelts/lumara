import { describe, expect, it } from 'vitest';
import type { Fragment } from '../backend/types';
import { addBack, finishTurn, NO_SPEAKER, reelFrames, skipSpeaker, speakerCounts, speakerMark, speakerPool, spinSpeaker, startVow, turnChoices } from './speaker';

const party = ['a', 'b', 'c'];
const seq = (...xs: number[]) => () => xs.shift() ?? 0;
const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: id, category: 'spark', createdAt });
describe('turns', () => {
  it('spin starts a choosing turn for a waiting player; nobody gets two turns', () => {
    let s = spinSpeaker(party, null, seq(0))!;
    expect(s).toMatchObject({ currentId: 'a', phase: 'choosing', thoughtId: null });
    s = finishTurn(startVow({ ...s, thoughtId: 'f1', phase: 'discussing' }));
    expect(s).toEqual({ currentId: null, spoken: ['a'], skipped: [], thoughtId: null, phase: null, discussed: ['f1'] });
    s = finishTurn(spinSpeaker(party, s, seq(0))!); s = finishTurn(spinSpeaker(party, s, seq(0))!);
    expect(s.spoken).toEqual(['a', 'b', 'c']); expect(spinSpeaker(party, s)).toBeNull();
  });
  it('spin again while choosing picks someone else; the first goes back to waiting', () => {
    const again = spinSpeaker(party, spinSpeaker(party, null, seq(0))!, seq(0))!;
    expect(again.currentId).toBe('b'); expect(speakerMark(again, 'a')).toBe('waiting');
  });
  it('startVow moves a discussing turn to the Vow box', () => {
    expect(startVow({ ...NO_SPEAKER, currentId: 'a', thoughtId: 'f1', phase: 'discussing' }).phase).toBe('vow');
  });
  it('skipping the current speaker clears their turn and thought; skipped players are never picked', () => {
    const s = skipSpeaker({ ...NO_SPEAKER, currentId: 'b', thoughtId: 'f1', phase: 'discussing' }, 'b');
    expect(s).toMatchObject({ currentId: null, thoughtId: null, phase: null, skipped: ['b'] });
    expect(speakerPool(party, s)).toEqual(['a', 'c']);
    expect(speakerPool(party, addBack(s, 'b'))).toEqual(['a', 'b', 'c']);
  });
  it('counts over the current party (removed players drop out)', () => {
    expect(speakerCounts(party, { ...NO_SPEAKER, currentId: 'b', spoken: ['a', 'gone'], skipped: ['c'] })).toEqual({ spoken: 1, remaining: 1 });
  });
  it('builds a reel that lands on the pick', () => {
    const f = reelFrames(party, 'c', seq(0.1, 0.5, 0.9), 6);
    expect(f).toHaveLength(6); expect(f.at(-1)).toBe('c');
  });
  it('offers the chooser their own undiscussed picks, oldest first; else every undiscussed thought', () => {
    const fs = [frag('f3', 3), frag('f1', 1), frag('f2', 2)];
    expect(turnChoices(fs, ['f2', 'f3'], []).map(f => f.id)).toEqual(['f2', 'f3']);
    expect(turnChoices(fs, ['f2', 'f3'], ['f2', 'f3']).map(f => f.id)).toEqual(['f1']);
    expect(turnChoices(fs, [], ['f1']).map(f => f.id)).toEqual(['f2', 'f3']);
  });
});
