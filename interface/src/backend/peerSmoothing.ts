import type { Presence, UserId } from './types';

/** Other players are drawn this far in the past, so there are always two real samples to slide between. */
export const DELAY_MS = 300;
const SNAP = 0.25;   // a jump wider than a quarter of the map (teleport skill, rejoin) snaps instead of sliding
const KEEP = 8;
const STEP_MS = 250;   // normal gap between position messages while walking

interface Sample { t: number; p: Presence }

/** Delayed interpolation of other players' positions (positions arrive ~4×/s with network jitter). */
export function createSmoother() {
  const buf = new Map<UserId, Sample[]>();
  let lastAdd = -Infinity;
  return {
    add(id: UserId, p: Presence, t: number) {
      const list = buf.get(id) ?? [];
      const prev = list[list.length - 1];
      if (prev && t - prev.t > STEP_MS * 2) list.push({ t: t - STEP_MS, p: prev.p });   // after a pause, slide over one step, not the whole pause
      list.push({ t, p }); if (list.length > KEEP) list.shift(); buf.set(id, list); lastAdd = t;
    },
    forget(id: UserId) { buf.delete(id); },
    ids() { return [...buf.keys()]; },
    /** True once every player is drawn at their newest sample, so the animation loop can stop. */
    settled(now: number) { return now - DELAY_MS >= lastAdd; },
    sample(now: number): Record<UserId, Presence> {
      const at = now - DELAY_MS; const out: Record<UserId, Presence> = {};
      for (const [id, list] of buf) {
        const last = list[list.length - 1];
        if (list.length === 1 || at >= last.t) { out[id] = last.p; continue; }
        let i = list.length - 2; while (i > 0 && list[i].t > at) i--;
        const a = list[i], b = list[i + 1];
        if (at <= a.t) { out[id] = a.p; continue; }
        if (Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y) > SNAP) { out[id] = b.p; continue; }
        const k = (at - a.t) / (b.t - a.t);
        out[id] = { ...b.p, x: a.p.x + (b.p.x - a.p.x) * k, y: a.p.y + (b.p.y - a.p.y) * k, moving: a.p.moving || b.p.moving };
      }
      return out;
    },
  };
}
