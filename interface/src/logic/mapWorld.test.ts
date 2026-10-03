import { describe, expect, it } from 'vitest';
import { MAP } from '../data/sanctuaryMap';
import { cameraOffset, clampToFloor, gatherPoint, gatherSpot, mapSize, nearbyCrystal, resolveMove, shotDistance, stepMove } from './mapWorld';

const onFloor = (p: { x: number; y: number }) => {
  const f = MAP.floor; return ((p.x - f.cx) / f.rx) ** 2 + ((p.y - f.cy) / f.ry) ** 2 <= 1 + 1e-9;
};

describe('crystal interaction range', () => {
  it('offers an interaction at the walkable edge of each crystal', () => {
    for (const [id, point] of Object.entries(MAP.crystals)) {
      expect(nearbyCrystal({ x: point.x + 0.04, y: point.y })).toBe(id);
      expect(nearbyCrystal({ x: point.x, y: point.y + 0.06 * MAP.aspect })).toBe(id);
    }
  });
  it('offers no crystal action when away from crystals', () => {
    expect(nearbyCrystal(MAP.beacon)).toBeNull();
    const point = MAP.crystals.radiance;
    expect(nearbyCrystal({ x: point.x - 0.08, y: point.y })).toBeNull();
  });
});

describe('clampToFloor', () => {
  it('leaves a point on the floor where it is', () => {
    expect(clampToFloor(MAP.floor.cx, MAP.floor.cy)).toEqual({ x: MAP.floor.cx, y: MAP.floor.cy });
  });
  it('pulls a point in the clouds back onto the floor edge', () => {
    const p = clampToFloor(0.02, MAP.floor.cy);
    expect(onFloor(p)).toBe(true);
    expect(p.x).toBeCloseTo(MAP.floor.cx - MAP.floor.rx);
  });
});

describe('camera', () => {
  it('draws the map at 2x the screen width on a laptop', () => {
    expect(mapSize(1280, 720)).toEqual({ w: 2560, h: 2560 / 1.5 });
  });
  it('uses 2x the screen height on a tall phone so the map still covers it', () => {
    const s = mapSize(375, 812);
    expect(s.h).toBe(1624); expect(s.w).toBe(1624 * 1.5);
  });
  it('centres the focus point', () => {
    const { w, h } = mapSize(1280, 720);
    expect(cameraOffset({ x: .5, y: .5 }, 1280, 720)).toEqual({ x: 640 - w / 2, y: 360 - h / 2 });
  });
  it('never shows past the map edges', () => {
    const { w, h } = mapSize(1280, 720);
    expect(cameraOffset({ x: 0, y: 0 }, 1280, 720)).toEqual({ x: 0, y: 0 });
    expect(cameraOffset({ x: 1, y: 1 }, 1280, 720)).toEqual({ x: 1280 - w, y: 720 - h });
    const p = mapSize(375, 812);
    expect(cameraOffset({ x: 1, y: 1 }, 375, 812)).toEqual({ x: 375 - p.w, y: 812 - p.h });
  });
});

describe('gathering', () => {
  it('gathers each shared step at its place', () => {
    expect(gatherPoint('vow_review')!.y).toBeGreaterThan(MAP.beacon.y);
    expect(gatherPoint('vote')).toEqual(gatherPoint('hall'));
    expect(gatherPoint('vow_altar')!.y).toBeGreaterThan(MAP.gate.y);
    expect(gatherPoint('opening_pull')).toEqual({ x: MAP.floor.cx, y: MAP.floor.cy });
    expect(gatherPoint('fragment_drop')).toBeNull();
    expect(gatherPoint('register')).toBeNull();
  });
  it('spreads the party into distinct spots on the floor', () => {
    const spots = Array.from({ length: 5 }, (_, i) => gatherSpot(gatherPoint('vote')!, i, 5));
    expect(new Set(spots.map(s => `${s.x.toFixed(3)},${s.y.toFixed(3)}`)).size).toBe(5);
    expect(spots.every(onFloor)).toBe(true);
  });
});

const inside = (p: { x: number; y: number }, o: { x: number; y: number; rx: number; ry: number }) => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1 - 1e-6;

describe('solid objects', () => {
  it('has a footprint for every lamp, crystal, the beacon, columns and gate pillars', () => {
    expect(MAP.obstacles.length).toBeGreaterThanOrEqual(12 + 4 + 1 + 3 + 2);
  });
  it('never lets you stand inside an object', () => {
    const lamp = MAP.obstacles[0];
    const p = resolveMove({ x: lamp.x, y: lamp.y + lamp.ry * 3 }, { x: lamp.x, y: lamp.y });
    expect(MAP.obstacles.some(o => inside(p, o))).toBe(false);
  });
  it('slides you around an object instead of stopping dead', () => {
    const b = MAP.obstacles.find(o => o.kind === 'beacon')!;
    const from = { x: b.x - b.rx * 1.05, y: b.y + b.ry * 0.3 };
    const p = resolveMove(from, { x: b.x - b.rx * 0.5, y: b.y + b.ry * 0.9 });
    expect(inside(p, b)).toBe(false);
    expect(p.y).toBeGreaterThan(from.y);   // it moved along the edge
  });
  it('still keeps you on the plaza floor', () => {
    const p = resolveMove({ x: MAP.floor.cx, y: MAP.floor.cy + 0.2 }, { x: 0.01, y: 0.99 });
    expect(((p.x - MAP.floor.cx) / MAP.floor.rx) ** 2 + ((p.y - MAP.floor.cy) / MAP.floor.ry) ** 2).toBeLessThanOrEqual(1 + 1e-6);
  });
});

describe('steady movement', () => {
  it('walks at the same on-screen speed in every direction', () => {
    const o = { x: .5, y: .62 };
    const right = stepMove(o, { x: 1, y: 0 }, 0.1); const down = stepMove(o, { x: 0, y: 1 }, 0.1);
    expect((down.y - o.y) / MAP.aspect).toBeCloseTo((right.x - o.x) / 1, 5);  // y fractions are 1.5× x fractions in pixels
  });
  it('does not walk faster diagonally', () => {
    const o = { x: .5, y: .62 };
    const d = stepMove(o, { x: 1, y: 1 }, 0.1), r = stepMove(o, { x: 1, y: 0 }, 0.1);
    const px = (p: { x: number; y: number }) => Math.hypot(p.x - o.x, (p.y - o.y) / MAP.aspect);
    expect(px(d)).toBeCloseTo(px(r), 5);
  });
});

describe('aimed shot', () => {
  const W = 2560;
  it('stops at the first object in its path', () => {
    const c = MAP.obstacles.find(o => o.kind === 'crystal')!;
    const from = { x: c.x - c.rx - 60 / W, y: c.y };            // 60 px left of the crystal's edge
    const d = shotDistance(from, { x: 1, y: 0 }, 190, W);
    expect(d).toBeGreaterThan(50); expect(d).toBeLessThan(70);
  });
  it('flies its full range when nothing is in the way', () => {
    expect(shotDistance({ x: MAP.floor.cx, y: MAP.floor.cy + 0.25 }, { x: 0, y: 1 }, 110, W)).toBe(110);
  });
});
