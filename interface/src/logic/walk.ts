export type WalkDir = 'down' | 'right' | 'up' | 'left';
/** Row order of every walk sprite sheet (8 frames per row), as rendered in Blender. */
export const WALK_ROWS: WalkDir[] = ['down', 'right', 'up', 'left'];

/** Which way a character faces after a step of (dx, dy) in scene %; tiny steps keep the previous direction. */
export function walkDirection(dx: number, dy: number, prev: WalkDir): WalkDir {
  if (Math.hypot(dx, dy) < 0.2) return prev;
  const h: WalkDir = dx > 0 ? 'right' : 'left', v: WalkDir = dy > 0 ? 'down' : 'up';
  const ax = Math.abs(dx), ay = Math.abs(dy);
  // Near-diagonal: keep facing if it is one of the two directions being walked, so the sprite row doesn't flicker.
  if (Math.min(ax, ay) / Math.max(ax, ay) > 0.6 && (prev === h || prev === v)) return prev;
  return ax >= ay ? h : v;
}
