// Ayaka's field skills: effects that sit on the map (not on a character) and change how others move.
// Still cosmetic (spec §10): they only slow, stun or freeze walking in the Sanctuary — never votes or data.

export type Pt = { x: number; y: number };
export type FieldKind = 'decel' | 'cadenza' | 'niflheim' | 'stasis' | 'lantern' | 'soar' | 'skyfall' | 'wall' | 'aegis' | 'thunder' | 'guide' | 'dawn';
/** One cast effect on the map. pos = caster's map position at cast; to = Frost Cadenza's aim point. */
export interface FieldFx { id: string; userId: string; kind: FieldKind; at: number; until: number; pos: Pt; to?: Pt; targetId?: string; /** Chrono Stasis cut short (Venuzdonoa, or Ayaka ending it). */ cutAt?: number; /** Ayaka ended her own time-stop early (gentle release, no sword slash). */ ended?: boolean }

export const DECEL = { ms: 4000, radius: 180, slow: 0.5 };
export const CADENZA = { ms: 2000, hitMs: 550, stunMs: 1000, range: 360, pickRadius: 160 };
export const NIFLHEIM = { ms: 3800, poseAtMs: 450, seatedMs: 3200 };
export const STASIS = { ms: 12000, tickMs: 1100, releaseMs: 11100 };   // 10 s of stopped time
export const LANTERN = { ms: 4000, radius: 180 };
export const SOAR = { ms: 2600, pickupMs: 450, landMs: 1500, range: 420 };
export const SKYFALL = { ms: 1900, landMs: 900, range: 300 };
export const WALL = { ms: 4000, radius: 55, range: 260 };
export const AEGIS = { ms: 4000, radius: 130 };
export const GUIDE = { ms: 4000, radius: 180, boost: 1.3 };
export const DAWN = { ms: 2200 };
export const THUNDER = { ms: 1500, landMs: 380, range: 360 };

const px = (a: Pt, b: Pt, size: { w: number; h: number }) => Math.hypot((a.x - b.x) * size.w, (a.y - b.y) * size.h);

/** Speed multiplier for a player at p: inside someone else's Deceleration Zone → half speed. */
export function slowFactor(userId: string, p: Pt, field: FieldFx[], t: number, size: { w: number; h: number }) {
  if (field.some(f => f.kind === 'guide' && t >= f.at && t < f.until && px(p, f.pos, size) <= GUIDE.radius)) return GUIDE.boost;   // Guiding Light: faster, and no slow
  if (inAegis(p, field, t, size)) return 1;
  return field.some(f => f.kind === 'decel' && f.userId !== userId && t >= f.at && t < f.until && px(p, f.pos, size) <= DECEL.radius) ? DECEL.slow : 1;
}

/** Can't move (or cast): stunned in ice, frozen in stopped time, or seated on the throne. */
export function isHeld(userId: string, field: FieldFx[], t: number, where?: Record<string, Pt | undefined>, size?: { w: number; h: number }) {
  const shielded = !!(where?.[userId] && size && inAegis(where[userId]!, field, t, size));   // Lunar Aegis: immune to the ice stun
  return field.some(f =>
    (f.kind === 'cadenza' && !shielded && f.targetId === userId && t >= f.at && t < f.at + CADENZA.hitMs + CADENZA.stunMs) ||
    (f.kind === 'thunder' && f.userId === userId && t >= f.at && t < f.at + THUNDER.landMs) ||
    (f.kind === 'niflheim' && f.userId === userId && t >= f.at && t < f.at + NIFLHEIM.seatedMs) ||
    (f.kind === 'soar' && f.userId === userId && t >= f.at && t < f.at + SOAR.landMs) ||
    (f.kind === 'skyfall' && f.userId === userId && t >= f.at && t < f.at + SKYFALL.landMs) ||
    (f.kind === 'stasis' && f.userId !== userId && t >= f.at + STASIS.tickMs && t < Math.min(f.at + STASIS.releaseMs, f.cutAt ?? Infinity)));
}

/** A skill that counters time stop (Azrenth's Sever, sword summoned) may be cast while frozen — not while stunned. */
export function canCastWhileHeld(userId: string, skill: { counters?: 'stasis' }, field: FieldFx[], t: number) {
  if (!isHeld(userId, field, t)) return true;
  if (skill.counters !== 'stasis') return false;
  return isHeld(userId, field.filter(f => f.kind !== 'stasis'), t) === false;
}

/** Venuzdonoa severs stopped time: every running Chrono Stasis ends now (its overlay plays a short cut-away). */
export function cutStasis(field: FieldFx[], t: number): FieldFx[] {
  return field.map(f => f.kind === 'stasis' && !f.cutAt && t < f.at + STASIS.releaseMs ? { ...f, cutAt: t, until: Math.min(f.until, t + 700) } : f);
}

/** Lunar Aegis: inside a moon shield nobody is slowed or stunned. */
export function inAegis(p: Pt, field: FieldFx[], t: number, size: { w: number; h: number }) {
  return field.some(f => f.kind === 'aegis' && t >= f.at && t < f.until && px(p, f.pos, size) <= AEGIS.radius);
}

/** Rampart of Stone: a step that would enter a standing wall is refused (stepping out of one is fine). */
export function wallBlocks(from: Pt, next: Pt, field: FieldFx[], t: number, size: { w: number; h: number }) {
  return field.some(f => { if (f.kind !== 'wall' || t < f.at || t >= f.until) return false; const c = f.to ?? f.pos; return px(next, c, size) < WALL.radius && px(next, c, size) < px(from, c, size); });
}

/** Lantern Ascent: anyone (Suvara included) near a rising lantern cloud glows warmly. */
export function inLantern(p: Pt, field: FieldFx[], t: number, size: { w: number; h: number }) {
  return field.some(f => f.kind === 'lantern' && t >= f.at && t < f.until && px(p, f.pos, size) <= LANTERN.radius);
}

/** Where Yulan sets Suvara down: toward the cursor (or the way she faces), at most SOAR.range px away. */
export function soarTarget(from: Pt, cursor: Pt | null, size: { w: number; h: number }, facing: Pt, range = SOAR.range): Pt {
  if (!size.w || !size.h) return from;   // map not measured yet: stay put
  const goal = cursor ?? { x: from.x + facing.x * 300 / size.w, y: from.y + facing.y * 300 / size.h };
  const d = px(goal, from, size), k = d > range ? range / d : 1;
  return { x: from.x + (goal.x - from.x) * k, y: from.y + (goal.y - from.y) * k };
}

/**
 * Frost Cadenza aim: the player nearest the cursor (within reach), else the cursor point capped to range.
 * No mouse (touch): the nearest player in range, else straight the way she faces.
 */
export function pickCadenzaTarget(from: Pt, cursor: Pt | null, players: (Pt & { id: string })[], size: { w: number; h: number }, facing: Pt): { targetId?: string; to: Pt } {
  const inRange = players.filter(p => px(p, from, size) <= CADENZA.range);
  const near = (c: Pt, max: number) => inRange.map(p => ({ p, d: px(p, c, size) })).filter(x => x.d <= max).sort((a, b) => a.d - b.d)[0]?.p;
  const hit = cursor ? near(cursor, CADENZA.pickRadius) : near(from, CADENZA.range);
  if (hit) return { targetId: hit.id, to: { x: hit.x, y: hit.y } };
  const goal = cursor ?? { x: from.x + facing.x * 200 / size.w, y: from.y + facing.y * 200 / size.h };
  const d = px(goal, from, size), k = d > CADENZA.range ? CADENZA.range / d : 1;
  return { to: { x: from.x + (goal.x - from.x) * k, y: from.y + (goal.y - from.y) * k } };
}

/** Ayaka presses her ultimate again: her own running Chrono Stasis releases now. */
export function endStasis(field: FieldFx[], userId: string, t: number): FieldFx[] {
  return field.map(f => f.kind === 'stasis' && f.userId === userId && !f.cutAt && t < f.at + STASIS.releaseMs ? { ...f, cutAt: t, ended: true, until: Math.min(f.until, t + 800) } : f);
}
