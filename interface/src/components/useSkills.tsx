import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Backend, Me } from '../backend/types';
import { KITS, type Kit, type Skill } from '../data/kits';
import { canCast, cast, cooldownLeft, emptySkillState } from '../logic/skills';
import { readSerenMuted } from '../logic/voice';
import { canCastWhileHeld, cutStasis, type FieldFx, type Pt } from '../logic/fieldEffects';

/** What one character is doing right now: a skill pose/effect and/or true form. */
export type Dir = 'down' | 'right' | 'up' | 'left';
export interface Casting { kit: Kit; skill?: Skill; dir?: Dir; angle?: number; at?: number; until?: number; trueUntil?: number; descending?: boolean }
/** Where a cast is aimed: facing / mouse angle, plus caster position and (Frost Cadenza) the target. */
export interface Aim { dir: Dir; angle?: number; pos?: Pt; to?: Pt; targetId?: string }
interface SkillCue extends Aim { userId: string; characterId: string; skillId: string }

const TRUE_ENTER_MS = 800;   // power pose before the flight starts
const DESCEND_MS = 1000;

function play(src?: string) {
  if (!src || readSerenMuted()) return;
  try { const a = new Audio(src); a.volume = 0.9; void a.play()?.catch(() => {}); } catch { /* no audio */ }
}

/**
 * Cosmetic skills (spec §10). Your casts go out as a 'skill' cue; every tab — including yours — applies cues,
 * so you and your teammates see the same pose + effect on the caster.
 */
export function useSkills({ backend, me, characterId, sessionId, enabled, aim, onCast }: { backend: Backend; me: Me; characterId: string | null; sessionId: string; enabled: boolean; aim: (skill: Skill) => Aim; onCast?: (skill: Skill, aimed: Aim) => void }) {
  const kit: Kit | undefined = characterId ? KITS[characterId] : undefined;
  const [state, setState] = useState(emptySkillState);
  const [casting, setCasting] = useState<Record<string, Casting>>({});
  const castingRef = useRef(casting); castingRef.current = casting;
  // Screen shake (+ phone vibration for the ultimate): 'small' when someone changes form, 'big' for Return to Dust.
  const [shake, setShake] = useState<'small' | 'big' | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startShake = (kind: 'small' | 'big', ms: number) => { setShake(kind); clearTimeout(shakeTimer.current); shakeTimer.current = setTimeout(() => setShake(null), ms); };
  useEffect(() => () => clearTimeout(shakeTimer.current), []);
  const [now, setNow] = useState(Date.now());
  const stateRef = useRef(state); stateRef.current = state;
  // Field effects on the map (Ayaka): kept apart from casting so a second cast doesn't wipe the first.
  const [field, setField] = useState<FieldFx[]>([]);
  const fieldRef = useRef(field); fieldRef.current = field;

  // tick for cooldown sweeps and expiring effects
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t); }, []);
  useEffect(() => {
    setCasting(c => {
      let changed = false; const next: Record<string, Casting> = {};
      for (const [id, x] of Object.entries(c)) {
        const y = { ...x };
        if (y.until && now >= y.until) { delete y.skill; delete y.until; changed = true; }
        if (y.trueUntil && !y.descending && now >= y.trueUntil) { y.descending = true; changed = true; }
        if (y.trueUntil && y.descending && now >= y.trueUntil + DESCEND_MS) { delete y.trueUntil; delete y.descending; changed = true; }
        if (y.skill || y.trueUntil) next[id] = y; else changed = true;
      }
      return changed ? next : c;
    });
    setField(f => f.some(x => now >= x.until) ? f.filter(x => now < x.until) : f);
  }, [now, me.id]);

  // apply casts (ours and teammates')
  useEffect(() => backend.on('skill', data => {
    const cue = data as SkillCue; const skill = KITS[cue.characterId]?.skills.find(s => s.id === cue.skillId); if (!skill) return;
    const t = Date.now();
    if (cue.userId !== me.id) { play(skill.voice); }
    const kit = KITS[cue.characterId];
    if (skill.counters === 'stasis') setField(f => cutStasis(f, t));   // Venuzdonoa severs stopped time for everyone
    if (skill.field && cue.pos) { const f: FieldFx = { id: `${cue.userId}-${skill.id}-${t}`, userId: cue.userId, kind: skill.field.kind, at: t, until: t + skill.field.ms, pos: cue.pos, to: cue.to, targetId: cue.targetId }; setField(x => [...x, f]); }
    if (skill.effect === 'ultimate' && kit?.ultCinematic?.kind === 'soar') { try { navigator.vibrate?.([1, 1450, 90]); } catch { /* not supported */ } }   // one thump as Yulan lands
    else if (skill.effect === 'ultimate' && kit?.ultCinematic?.kind === 'thunder') { setTimeout(() => startShake('small', 450), 380); try { navigator.vibrate?.([1, 370, 60, 40, 60]); } catch { /* not supported */ } }   // the strike
    else if (skill.effect === 'ultimate' && kit?.ultCinematic?.kind === 'dawn') { try { navigator.vibrate?.([1, 500, 160]); } catch { /* not supported */ } }   // the flash
    else if (skill.effect === 'ultimate' && kit?.ultCinematic?.kind === 'skyfall') { setTimeout(() => startShake('small', 500), 900); try { navigator.vibrate?.([1, 880, 120]); } catch { /* not supported */ } }   // the spear lands
    else if (skill.effect === 'ultimate' && kit?.ultCinematic?.kind === 'stasis') { try { navigator.vibrate?.([1, 1100, 70]); } catch { /* not supported */ } }   // one 'tick' — a frozen world doesn't shake
    else if (skill.effect === 'ultimate') {
      const dive = kit?.ultMove === 'dive';   // the hit lands ~1.15 s in, after she flies up and dives
      startShake('big', dive ? 5600 : 3000);
      try { navigator.vibrate?.(dive ? [1, 1780, 260, 60, 320, 80, 260, 120, 160] : [90, 50, 160, 60, 240, 80, 120]); } catch { /* not supported */ }
    }
    else if (skill.effect === 'transform') startShake('small', 1400);
    setCasting(c => {
      const prev = c[cue.userId];
      if (skill.effect === 'transform') {
        const inTrue = prev?.trueUntil && !prev.descending;
        if (inTrue) return { ...c, [cue.userId]: { ...prev, kit, skill: undefined, until: undefined, trueUntil: t, descending: true } };   // back to base form
        return { ...c, [cue.userId]: { kit, skill, until: t + TRUE_ENTER_MS, trueUntil: Infinity } };
      }
      return { ...c, [cue.userId]: { ...prev, kit, skill, dir: cue.dir, angle: cue.angle, at: t, until: t + skill.durationMs } };
    });
  }), [backend, me.id]);

  const inTrueForm = (id: string) => { const x = castingRef.current[id]; return !!(x?.trueUntil && !x.descending); };
  const castSkill = (skill: Skill) => {
    if (!enabled || !characterId) return;
    const t = Date.now();
    if (!canCastWhileHeld(me.id, skill, fieldRef.current, t)) return;   // frozen / stunned / seated: no casting (except a time-stop counter)
    if (skill.requiresTrueForm && !inTrueForm(me.id)) return;
    if (!canCast(skill, stateRef.current, t, sessionId, characterId)) return;
    setState(s => cast(skill, s, t, sessionId, characterId));
    if (skill.effect === 'transform' && inTrueForm(me.id)) play(KITS[characterId]?.revertVoice);
    else { play(skill.voice); play(skill.sfx); }
    const aimed = aim(skill);
    onCast?.(skill, aimed);
    backend.emit('skill', { userId: me.id, characterId, skillId: skill.id, ...aimed } satisfies SkillCue);
  };
  const castRef = useRef(castSkill); castRef.current = castSkill;

  // keys 1 / 2 / 3 (not while typing)
  useEffect(() => {
    if (!enabled || !kit) return;
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))) return;
      const skill = kit.skills.find(s => s.key === e.key); if (!skill) return;
      e.preventDefault(); castRef.current(skill);
    };
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down);
  }, [enabled, kit]);

  const cooldowns = Object.fromEntries((kit?.skills || []).map(s => [s.id, characterId ? cooldownLeft(s, state, now, sessionId, characterId) : 0]));
  const locked = Object.fromEntries((kit?.skills || []).map(s => [s.id, !!s.requiresTrueForm && !inTrueForm(me.id)]));
  return { kit, cooldowns, locked, castSkill, casting, shake, field, fieldRef, now };
}

/** Effect layer drawn at a character's feet (CSS-animated; no art needed). */
/** Max shot range (px) and screen direction per facing. */
export const SHOT: Record<Dir, { x: number; y: number; max: number }> = { right: { x: 1, y: 0, max: 190 }, left: { x: -1, y: 0, max: 190 }, up: { x: 0, y: -1, max: 150 }, down: { x: 0, y: 1, max: 110 } };

/** Unit screen vector + range for a shot: the aimed angle if known, else the facing direction. */
export function shotVector(dir: Dir = 'down', angle?: number) {
  if (angle === undefined) return SHOT[dir];
  return { x: Math.cos(angle), y: Math.sin(angle), max: 200 };
}

export function SkillFx({ skill, dir = 'down', angle, reach }: { skill?: Skill; dir?: Dir; angle?: number; reach?: number }) {
  if (!skill || skill.effect === 'field') return null;   // field skills draw on the map (FieldLayer)
  if (skill.effect === 'ultimate') {
    if (skill.vfx?.sever) return <div className="skill-fx fx-sever" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx.sever})` }} />;
    return skill.vfx?.blast ? <div className="skill-fx fx-blast" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx.blast})` }} /> : null;
  }
  if (skill.effect === 'transform' && skill.vfx?.summon) return <><div className="skill-fx fx-rift" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx.rift})` }} /><div className="skill-fx fx-summon" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx.summon})` }} /></>;
  if (skill.effect === 'ruin' || skill.effect === 'blacksun') {
    const s = shotVector(dir, angle), r = Math.min(reach ?? s.max, skill.effect === 'ruin' ? 170 : 200);
    return <div className={`skill-fx fx-${skill.effect}`} aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx?.[skill.effect]})`, '--tx': `${s.x * r}px`, '--ty': `${s.y * r}px`, '--angle': `${Math.atan2(s.y, s.x)}rad` } as CSSProperties} />;
  }
  if (skill.effect === 'crescent') {
    const s = shotVector(dir, angle), r = Math.min(reach ?? s.max, 150);
    return <div className="skill-fx fx-crescent" aria-hidden="true" style={{ animationDelay: `${skill.syncMs ?? 0}ms`, opacity: skill.syncMs ? 0 : undefined, backgroundImage: `url(${skill.vfx?.crescent})`, '--tx': `${s.x * r}px`, '--ty': `${s.y * r}px`, '--flip': s.x < 0 ? -1 : 1 } as CSSProperties} />;
  }
  if (skill.effect === 'lunge') { const s = shotVector(dir, angle); return <div className="skill-fx fx-fang" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx?.fang})`, '--angle': `${Math.atan2(s.y, s.x)}rad` } as CSSProperties} />; }
  if (skill.effect === 'blossom') return <div className="skill-fx fx-blossom" aria-hidden="true" style={{ backgroundImage: `url(${skill.vfx?.blossom})` }} />;
  if (skill.effect === 'blink') return <div className="skill-fx fx-blink" aria-hidden="true" style={skill.vfx?.burst ? { backgroundImage: `url(${skill.vfx.burst})` } : undefined} />;
  if (skill.effect === 'slash') { const s = shotVector(dir, angle); return <div className="skill-fx fx-slash" aria-hidden="true" style={{ backgroundImage: skill.vfx?.slash ? `url(${skill.vfx.slash})` : undefined, '--angle': `${Math.atan2(s.y, s.x)}rad`, '--flipy': s.x < 0 ? -1 : 1 } as CSSProperties} />; }
  if (skill.effect === 'transform') return <div className="skill-fx fx-transform" aria-hidden="true"><b /><b className="ring" />{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>;
  if (skill.effect === 'disassemble') {
    const s = shotVector(dir, angle), r = reach ?? s.max;
    const v = skill.vfx;
    return <div className={`skill-fx fx-disassemble ${v ? 'painted' : ''}`} data-dir={dir} aria-hidden="true" style={{ '--tx': `${s.x * r}px`, '--ty': `${s.y * r}px`, '--reach': `${r}px`, '--angle': `${Math.atan2(s.y, s.x)}rad` } as CSSProperties}>
    <b className="muzzle" style={v ? { backgroundImage: `url(${v.muzzle})` } : undefined} /><b className="tracer" /><b className="bullet" style={v ? { backgroundImage: `url(${v.bullet})` } : undefined} /><span className="impact" style={v ? { backgroundImage: `url(${v.impact})` } : undefined}>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>
  </div>;
  }
  return <div className={`skill-fx fx-${skill.effect}`} aria-hidden="true">
    {skill.effect === 'nullify' && <><b className="hex" />{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</>}
  </div>;
}

/** S++ aura around the body: pulsing glow, rising energy flames, floating sparks. Stronger in true form. */
export function BodyAura({ characterId, casting }: { characterId: string | null; casting?: Casting }) {
  const kit = characterId ? KITS[characterId] : undefined;
  if (!kit?.bodyAura) return null;
  const strong = !!(casting?.trueUntil && !casting.descending);
  return <div className={`body-aura ${strong ? 'strong' : ''}`} style={{ '--aura': kit.bodyAura, '--af': kit.bodyAuraFrames ?? 8 } as CSSProperties} aria-hidden="true">
    <i className="glow" />
    {kit.bodyAuraSheet
      ? <><i className="aura-sheet" style={{ backgroundImage: `url(${kit.bodyAuraSheet})` }} /><i className="aura-sheet echo" style={{ backgroundImage: `url(${kit.bodyAuraSheet})` }} /></>
      : Array.from({ length: 9 }, (_, i) => <i key={`f${i}`} className="flame" style={{ '--i': i } as CSSProperties} />)}
    {Array.from({ length: 6 }, (_, i) => <i key={`s${i}`} className="spark" style={{ '--i': i } as CSSProperties} />)}
  </div>;
}
