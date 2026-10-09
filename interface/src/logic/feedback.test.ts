import { describe, expect, it } from 'vitest';
import { summarizeCheckIns } from './feedback';

describe('summarizeCheckIns', () => {
  it('averages current party members as % of 5', () => {
    const rows = [{ sessionId: 's', userId: 'b', sat: 4, growth: 5 }, { sessionId: 's', userId: 'c', sat: 3, growth: 3 }, { sessionId: 's', userId: 'gone', sat: 1, growth: 1 }];
    expect(summarizeCheckIns(rows, ['a', 'b', 'c'])).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
  });
  it('reports null averages when nobody checked in', () => {
    expect(summarizeCheckIns([], ['a'])).toEqual({ sat: null, growth: null, n: 0, of: 1 });
  });
});
