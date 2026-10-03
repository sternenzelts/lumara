import { describe, expect, it } from 'vitest';
import { lampMomentMs, lampsToCelebrate } from './lamps';

describe('lampsToCelebrate', () => {
  it('celebrates every lamp lit by one confirm, in lighting order', () => {
    expect(lampsToCelebrate(0, 3)).toEqual([0, 1, 2]);
    expect(lampsToCelebrate(2, 3)).toEqual([2]);
  });
  it('does nothing on first load, when nothing changed, or when a vow is un-kept', () => {
    expect(lampsToCelebrate(null, 3)).toEqual([]);
    expect(lampsToCelebrate(3, 3)).toEqual([]);
    expect(lampsToCelebrate(3, 2)).toEqual([]);
  });
  it('never goes past the 12 lamps', () => {
    expect(lampsToCelebrate(12, 13)).toEqual([]);
    expect(lampsToCelebrate(10, 15)).toEqual([10, 11]);
  });
  it('the moment lasts longer when more lamps light', () => {
    expect(lampMomentMs(3)).toBeGreaterThan(lampMomentMs(1));
  });
});
