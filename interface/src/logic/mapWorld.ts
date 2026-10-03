import type { Stage } from '../backend/types';
import { MAP } from '../data/sanctuaryMap';

type Pt = { x: number; y: number };
const ZOOM = 2;

/** Interaction range uses map coordinates, so phone and laptop players approach equally closely. */
export function nearbyCrystal(pos: Pt) {
  return Object.entries(MAP.crystals)
    .map(([id, point]) => ({ id, distance: Math.hypot(pos.x - point.x, (pos.y - point.y) / MAP.aspect) }))
    .filter(c => c.distance <= 0.065)
    .sort((a, b) => a.distance - b.distance)[0]?.id ?? null;
}

/** Keep a point (map fractions) on the plaza floor: outside the ellipse moves to its edge, towards the centre. */
export function clampToFloor(x: number, y: number): Pt {
  const f = MAP.floor; const dx = (x - f.cx) / f.rx, dy = (y - f.cy) / f.ry; const d = Math.hypot(dx, dy);
  return d <= 1 ? { x, y } : { x: f.cx + dx / d * f.rx, y: f.cy + dy / d * f.ry };
}

/** Map size on screen: 2× the screen, along whichever side keeps the whole screen covered. */
export function mapSize(vw: number, vh: number) {
  const byWidth = { w: vw * ZOOM, h: vw * ZOOM / MAP.aspect };
  return byWidth.h >= vh * ZOOM ? byWidth : { w: vh * ZOOM * MAP.aspect, h: vh * ZOOM };
}

/** World translation (px) that centres `focus`, clamped so no edge of the map is ever visible. */
export function cameraOffset(focus: Pt, vw: number, vh: number): Pt {
  const { w, h } = mapSize(vw, vh);
  const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
  return { x: clamp(vw / 2 - focus.x * w, vw - w), y: clamp(vh / 2 - focus.y * h, vh - h) };
}

/** Where the party gathers when the Warden starts a step; null = no gathering. */
export function gatherPoint(stage: Stage): Pt | null {
  switch (stage) {
    case 'opening_pull': case 'rewards': return { x: MAP.floor.cx, y: MAP.floor.cy };
    case 'vow_review': case 'vote': case 'hall': return { x: MAP.beacon.x, y: MAP.beacon.y + 0.09 };
    case 'vow_altar': return { x: MAP.gate.x, y: MAP.gate.y + 0.08 };
    default: return null;
  }
}

/** A spot for party member `index` of `total`: an arc in front of the gathering point, kept on the floor. */
export function gatherSpot(point: Pt, index: number, total: number): Pt {
  if (total <= 1) return clampToFloor(point.x, point.y);
  const spread = Math.min(Math.PI * 0.9, 0.35 * (total - 1));
  const a = Math.PI / 2 - spread / 2 + spread * index / (total - 1);   // arc below/in front of the point
  return clampToFloor(point.x + Math.cos(a) * 0.08, point.y + Math.sin(a) * 0.05);
}

/** Walking speed: fraction of the map's width per second (≈ a fifth of a laptop screen per second at 2× zoom). */
export const WALK_SPEED = 0.085;

/** Move `dt` seconds in `dir` (screen-space direction, any length) at a steady on-screen speed, diagonals included. */
export function stepMove(pos: Pt, dir: Pt, dt: number): Pt {
  const len = Math.hypot(dir.x, dir.y); if (!len) return pos;
  const d = WALK_SPEED * dt;
  return { x: pos.x + dir.x / len * d, y: pos.y + dir.y / len * d * MAP.aspect };   // 1 px down = aspect × 1 px across, in fractions
}

/** Where you end up trying to go from `from` to `to`: on the floor and outside every object (sliding along their edges). */
export function resolveMove(from: Pt, to: Pt): Pt {
  let p = clampToFloor(to.x, to.y);
  for (let pass = 0; pass < 3; pass++) {
    let pushed = false;
    for (const o of MAP.obstacles) {
      let u = (p.x - o.x) / o.rx, v = (p.y - o.y) / o.ry; const d = Math.hypot(u, v);
      if (d >= 1) continue;
      if (d < 1e-6) { u = (from.x - o.x) / o.rx; v = (from.y - o.y) / o.ry; const k = Math.hypot(u, v) || 1; u /= k; v /= k; }
      else { u /= d; v /= d; }
      p = { x: o.x + u * o.rx * 1.001, y: o.y + v * o.ry * 1.001 }; pushed = true;
    }
    p = clampToFloor(p.x, p.y);
    if (!pushed) break;
  }
  return p;
}

/** How far (screen px on a map `worldW` px wide) a shot travels from `from` along screen direction `dir` before hitting an object. */
export function shotDistance(from: Pt, dir: Pt, maxPx: number, worldW: number): number {
  const len = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / len, uy = dir.y / len, worldH = worldW / MAP.aspect;
  for (let d = 4; d <= maxPx; d += 3) {
    const p = { x: from.x + ux * d / worldW, y: from.y + uy * d / worldH };
    if (MAP.obstacles.some(o => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1)) return d;
  }
  return maxPx;
}
