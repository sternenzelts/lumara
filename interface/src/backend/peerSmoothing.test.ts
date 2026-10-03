import { describe, expect, it } from 'vitest';
import { createSmoother, DELAY_MS } from './peerSmoothing';

const p = (x: number, moving = true) => ({ x, y: 0.5, facing: 'right' as const, characterId: 'ayaka', moving });

describe('peer smoothing', () => {
  it('draws a walking player between the two samples around (now - delay)', () => {
    const s = createSmoother();
    s.add('u2', p(0.1), 1000); s.add('u2', p(0.2), 1250); s.add('u2', p(0.3), 1500);
    expect(s.sample(1125 + DELAY_MS).u2.x).toBeCloseTo(0.15);
    expect(s.sample(1375 + DELAY_MS).u2.x).toBeCloseTo(0.25);
  });
  it('holds the newest position once time passes the last sample', () => {
    const s = createSmoother();
    s.add('u2', p(0.1), 1000); s.add('u2', p(0.4, false), 1250);
    const out = s.sample(5000).u2;
    expect(out.x).toBeCloseTo(0.4); expect(out.moving).toBe(false);
  });
  it('shows a first sighting straight away and reports when it has settled', () => {
    const s = createSmoother();
    s.add('u2', p(0.7, false), 1000);
    expect(s.sample(1000).u2.x).toBeCloseTo(0.7);
    expect(s.settled(1000 + DELAY_MS + 1)).toBe(true);
    s.add('u2', p(0.8), 2000);
    expect(s.settled(2000)).toBe(false);
  });
  it('a big jump (teleport skill, rejoin) snaps instead of sliding across the map', () => {
    const s = createSmoother();
    s.add('u2', p(0.1), 1000); s.add('u2', p(0.9), 1250);
    expect(s.sample(1125 + DELAY_MS).u2.x).toBeCloseTo(0.9);
  });
  it('forget drops a player', () => {
    const s = createSmoother(); s.add('u2', p(0.1), 1000); s.forget('u2');
    expect(s.sample(2000)).toEqual({});
  });
  it('starting to walk after standing still does not stretch the first step over the idle gap', () => {
    const s = createSmoother();
    s.add('u2', p(0.1, false), 1000); s.add('u2', p(0.15), 4000);
    expect(s.sample(3700 + DELAY_MS).u2.x).toBeCloseTo(0.1);
    expect(s.sample(3875 + DELAY_MS).u2.x).toBeCloseTo(0.125);
  });
});
