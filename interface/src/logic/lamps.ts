// Vow review: the Warden marks the kept promises, confirms once, and every newly kept vow lights a lamp —
// all of them in one sequence, on every screen.
export const LAMP_COUNT = 12;
/** Gap between lamps igniting in the same moment. */
export const LAMP_STEP_MS = 650;
/** Spark leaves the beacon at 0.25 s, first lamp ignites at 1.25 s; the moment ends ~1.3 s after the last. */
export const lampMomentMs = (lamps: number) => 2600 + Math.max(0, lamps - 1) * LAMP_STEP_MS;

/** Lamps to celebrate when the lit count goes from prev to next (none on first load / no new light). */
export function lampsToCelebrate(prev: number | null, next: number): number[] {
  if (prev === null || next <= prev || prev >= LAMP_COUNT) return [];
  const out: number[] = [];
  for (let i = prev; i < Math.min(next, LAMP_COUNT); i++) out.push(i);
  return out;
}
