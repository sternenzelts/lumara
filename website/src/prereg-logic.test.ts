import { describe, expect, it } from 'vitest';
import { LAUNCH, cleanName, launchState, milestoneLamps } from './prereg-logic';

describe('pre-registration', () => {
  it('counts down to 16 Oct 2026 and switches to live at launch', () => {
    expect(launchState(new Date('2026-10-15T09:00:00+08:00'))).toMatchObject({ live: false, days: 1, hours: 0 });
    expect(launchState(LAUNCH)).toMatchObject({ live: true });
  });
  it('lights milestone lamps at 10, 25 and 50 Wardens', () => {
    expect([0, 9, 10, 24, 25, 50, 80].map(milestoneLamps)).toEqual([0, 0, 1, 1, 2, 3, 3]);
  });
  it('accepts 2-16 character names', () => {
    expect(cleanName('  Jay  ')).toBe('Jay');
    expect(() => cleanName('J')).toThrow();
    expect(() => cleanName('x'.repeat(17))).toThrow();
  });
});
