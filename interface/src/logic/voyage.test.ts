import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../backend/local';
import { previousStep, removedNote, stageProgress, voyageSteps, VOYAGE_BRIEFING } from './voyage';

const on = { ...DEFAULT_SETTINGS, skipVowReview: false };

describe('voyage steps', () => {
  it('lists the 6 steps after Gather when there are vows to review (the free wish is part of Homecoming)', () => {
    expect(voyageSteps(on, true)).toEqual(['vow_review', 'fragment_drop', 'vote', 'hall', 'vow_altar', 'rewards']);
  });
  it('drops vow review when there is nothing to review', () => {
    expect(voyageSteps(on, false)).not.toContain('vow_review');
    expect(stageProgress('vote', on, false)).toEqual({ title: VOYAGE_BRIEFING.vote.title, index: 2, total: 5 });
  });
  it('labels a stage with its position', () => {
    expect(stageProgress('vow_review', on, true)).toEqual({ title: 'Vow review', index: 1, total: 6 });
  });
  it('steps back over a skipped vow review, and never back into the lobby', () => {
    expect(previousStep('vote', on, false)).toBe('fragment_drop');
    expect(previousStep('fragment_drop', on, true)).toBe('vow_review');
    expect(previousStep('fragment_drop', on, false)).toBeNull();
    expect(previousStep('vow_review', on, true)).toBeNull();
  });
  it('has no label in the lobby or after the voyage', () => {
    expect(stageProgress('register', on, true)).toBeNull();
    expect(stageProgress('completed', on, true)).toBeNull();
  });
});
describe('removedNote', () => {
  it('tells the Warden whether a removed player can rejoin', () => {
    expect(removedNote('Ana', 'register', false)).toBe('Ana left the party. They can rejoin from the lobby.');
    expect(removedNote('Ana', 'register', true)).toBe('Ana left the party. The party is locked, so they can’t rejoin.');
    expect(removedNote('Ana', 'hall', false)).toBe('Ana left the party. They can’t rejoin until you return to the lobby.');
  });
});
