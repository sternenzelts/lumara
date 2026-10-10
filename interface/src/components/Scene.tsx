import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Navigation, ScrollText, Star } from 'lucide-react';
import type { Backend, Fragment, FragmentCategory, Me, Player, Presence, Stage, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { characterById } from '../data/characters';
import { SANCTUARY_CLOUDS } from '../data/art';
import { MAP } from '../data/sanctuaryMap';
import occluders from '../../public/art/sanctuary/occluders/occluders.json';
import { cameraOffset, gatherPoint, gatherSpot, mapSize, resolveMove, shotDistance, stepMove } from '../logic/mapWorld';
import { walkDirection, WALK_ROWS, type WalkDir } from '../logic/walk';
import { useReducedMotion } from '../hooks';
import { KITS, type Skill } from '../data/kits';
import { CADENZA, SKYFALL, SOAR, STASIS, THUNDER, WALL, inLantern, isHeld, pickCadenzaTarget, slowFactor, soarTarget, wallBlocks } from '../logic/fieldEffects';
import FieldLayer, { SkyLayer, StasisOverlay } from './FieldLayer';
import { useChatter } from './useChatter';
import { LAMP_STEP_MS, lampMomentMs, lampsToCelebrate } from '../logic/lamps';
import { Art } from './ui';
import Minimap from './Minimap';
import SkillBar from './SkillBar';
import { BodyAura, SkillFx, shotVector, useSkills, type Aim, type Casting } from './useSkills';
import './world.css';

type Pt = { x: number; y: number };
const KEYS: Record<string, Pt> = { arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 }, arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 }, arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 } };
const raf = (cb: (t: number) => void) => requestAnimationFrame(cb);
const GUN_HEIGHT = 60;   // px above the feet where shots leave his gun

/** The Sanctuary: Jay's painted map at 2× zoom with a camera that follows your character. Positions are map fractions. */
export default function Scene({ backend, me, player, vows, fragments = [], movement, cooldownMode, frozen = false, activeCharacterId, stage, sessionId = 'sanctuary', onOpenVows, onOpenVote, editThought, onEditDone, onFragmentSaved, speakerId }: { sessionId?: string; backend: Backend; me: Me; player: Player | null; vows: Vow[]; fragments?: Fragment[]; movement: boolean; cooldownMode?: 'normal' | 'half' | 'none'; frozen?: boolean; activeCharacterId?: string | null; stage?: Stage; onOpenVows?: () => void; onOpenVote?: () => void; editThought?: { id: string; text: string; category: FragmentCategory } | null; onEditDone?: () => void; onFragmentSaved?: (message: string, error?: boolean) => void; /** Resonance Hall: the chosen speaker (spotlight; walks to the beacon on their own screen). */ speakerId?: string | null }) {
  const reduced = useReducedMotion();
  const [position, setPosition] = useState(() => ({ ...resolveMove({ x: MAP.floor.cx, y: MAP.floor.cy }, { x: MAP.floor.cx - 0.12 + [...me.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 24 / 100, y: MAP.floor.cy + 0.16 }), facing: 'right' as Presence['facing'], dir: 'down' as WalkDir, moving: false }));
  const [peers, setPeers] = useState<Record<string, Presence>>({});
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  const ref = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);   // same size + camera as the world, drawn above the haze
  const lit = Math.min(12, vows.filter(v => v.status === 'fulfilled').length);
  // A vow confirmed kept: every screen watches the next lamp ignite (camera eases there, the stage window steps aside).
  const prevLit = useRef<number | null>(null);
  const batchFrom = useRef<number | null>(null);
  const [lampMoment, setLampMoment] = useState<{ lamps: number[]; key: number } | null>(null);
  const lampFocus = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const from = prevLit.current; prevLit.current = lit;
    if (from === null || lit <= from) return;
    if (batchFrom.current === null) batchFrom.current = from;   // one confirm saves vows one by one: collect them
    const t = setTimeout(() => {
      const lamps = lampsToCelebrate(batchFrom.current, lit); batchFrom.current = null;
      if (!lamps.length) return;
      const pts = lamps.map(i => MAP.lamps[i]);
      lampFocus.current = { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
      setLampMoment({ lamps, key: Date.now() }); document.body.classList.add('lamp-moment');
      setTimeout(() => { setLampMoment(null); lampFocus.current = null; document.body.classList.remove('lamp-moment'); }, lampMomentMs(lamps.length));
    }, 450);
    return () => clearTimeout(t);
  }, [lit]);
  useEffect(() => () => document.body.classList.remove('lamp-moment'), []);
  const characterId = activeCharacterId === undefined ? player?.displayCharacterId || null : activeCharacterId;
  const enabled = movement && !frozen;
  const nearBeacon = movement && characterId && onOpenVows && Math.hypot(position.x - MAP.beacon.x, (position.y - MAP.beacon.y) / MAP.aspect) <= 0.065;
  const writing = stage === 'fragment_drop' && !frozen;
  const nearCrystal = writing && characterId ? CATEGORIES.map(c => ({ ...c, distance: Math.hypot(position.x - MAP.crystals[c.id].x, (position.y - MAP.crystals[c.id].y) / MAP.aspect) })).filter(c => c.distance <= 0.07).sort((a, b) => a.distance - b.distance)[0] : undefined;
  const [writer, setWriter] = useState<FragmentCategory | null>(null);
  const [drafts, setDrafts] = useState<Record<FragmentCategory, string>>({ radiance: '', fracture: '', spark: '', wildcard: '' });
  const [saving, setSaving] = useState(false);
  const [arrival, setArrival] = useState<FragmentCategory | null>(null);
  const [flight, setFlight] = useState<{ category: FragmentCategory; key: number } | null>(null);
  useEffect(() => { if (writer && (!writing || (movement && characterId && nearCrystal?.id !== writer && editThought?.category !== writer))) setWriter(null); }, [writing, movement, characterId, nearCrystal?.id, writer, editThought?.category]);
  useEffect(() => { if (arrival && nearCrystal?.id === arrival) { setWriter(arrival); setArrival(null); } }, [arrival, nearCrystal?.id]);
  useEffect(() => { if (!editThought || !writing) return; setDrafts(d => ({ ...d, [editThought.category]: editThought.text })); setWriter(editThought.category); }, [editThought, writing]);
  useEffect(() => { if (!writing) return; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (e.type === 'keydown') setWriter(null); return; } const target = e.target as HTMLElement | null; if (e.ctrlKey || e.metaKey || e.altKey || target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return; if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearCrystal) { e.preventDefault(); if (e.type === 'keyup') setWriter(nearCrystal.id); } };   // open on release: opening on key-down focuses the box in time to type the 'e' into it
    window.addEventListener('keydown', key); window.addEventListener('keyup', key); return () => { window.removeEventListener('keydown', key); window.removeEventListener('keyup', key); }; }, [writing, nearCrystal?.id]);

  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { if (el.clientWidth && el.clientHeight) setView({ w: el.clientWidth, h: el.clientHeight }); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => backend.onPeers(setPeers), [backend]);
  const facingRef = useRef<WalkDir>('down');
  // Mouse aiming: last pointer position over the plaza (null on touch screens → fire the way he faces).
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const overBar = useRef(false);   // clicking a skill icon: Frost Cadenza auto-targets instead of aiming under the bar
  const peersRef = useRef(peers); peersRef.current = peers;
  const aim = (skill: Skill): Aim => {
    const pos = { x: here.current.x, y: here.current.y }, base = aimAngle();
    const reachFor: Record<string, number> = { soar: SOAR.range, skyfall: SKYFALL.range, wall: WALL.range, thunder: THUNDER.range };
    if (skill.field?.kind !== 'cadenza' && !(skill.field && skill.field.kind in reachFor)) return { ...base, pos };
    const m = mouse.current, w = world.current?.getBoundingClientRect();
    const cursor = m && w?.width && !overBar.current ? { x: (m.x - w.left) / w.width, y: (m.y - w.top + GUN_HEIGHT / 2) / w.height } : null;   // pointing at a body ≈ their feet
    if (skill.field && skill.field.kind in reachFor) { const to = { ...pos, ...resolveMove(pos, soarTarget(pos, cursor, mapSize(viewRef.current.w, viewRef.current.h), shotVector(facingRef.current), reachFor[skill.field.kind])) }; return { ...base, pos, to: { x: to.x, y: to.y }, dir: to.x < pos.x ? 'left' : 'right' }; }
    const f = shotVector(facingRef.current), others = Object.entries(peersRef.current).filter(([, p]) => p.characterId).map(([id, p]) => ({ id, x: p.x, y: p.y }));
    const pick = pickCadenzaTarget(pos, cursor, others, mapSize(viewRef.current.w, viewRef.current.h), f);
    return { ...base, pos, ...pick, dir: pick.to.x < pos.x ? 'left' : 'right' };
  };
  const aimAngle = (): Aim => {
    const m = mouse.current, w = world.current?.getBoundingClientRect();
    if (!m || !w || !w.width) return { dir: facingRef.current };
    const gx = w.left + here.current.x * w.width, gy = w.top + here.current.y * w.height - GUN_HEIGHT;
    const dx = m.x - gx, dy = m.y - gy; if (Math.hypot(dx, dy) < 8) return { dir: facingRef.current };
    return { dir: (dx >= 0 ? 'right' : 'left') as WalkDir, angle: Math.atan2(dy, dx) };
  };
  // Pixel Blink: hop ~ a tenth of the map toward the aim, stopping at objects / the rim.
  const onCast = (skill: Skill, aimed: Aim) => {
    if ((skill.field?.kind === 'soar' || skill.field?.kind === 'skyfall' || skill.field?.kind === 'thunder') && aimed.to) {   // Yulan sets her down / Ashvane lands / Lucien reforms
      const to = aimed.to, landMs = skill.field.kind === 'skyfall' ? SKYFALL.landMs + 40 : skill.field.kind === 'thunder' ? THUNDER.landMs : SOAR.landMs;
      setTimeout(() => { const state = { ...here.current, x: to.x, y: to.y, moving: false }; here.current = state; setPosition(state); backend.setPresence({ name: me.name, x: to.x, y: to.y, facing: state.facing, dir: state.dir, characterId, moving: false }); }, landMs);
      return;
    }
    if (skill.effect !== 'blink' && skill.effect !== 'lunge') return;
    const v = shotVector(aimed.dir, aimed.angle), hop = skill.effect === 'lunge' ? 0.06 : 0.075, p = here.current;
    const to = resolveMove(p, { x: p.x + v.x / Math.hypot(v.x, v.y) * hop, y: p.y + v.y / Math.hypot(v.x, v.y) * hop * MAP.aspect });
    const state = { ...p, ...to }; here.current = state; setPosition(state);
  };
  const { kit, cooldowns, locked, castSkill, casting, shake, field, fieldRef } = useSkills({ backend, me, characterId, sessionId, enabled, aim, onCast, cooldownMode });
  const { bubbles, poke } = useChatter({ backend, me, characterId, peers, enabled, stage, vows, sessionId });
  // Clicking a character makes them talk (instead of walking there). Feet are at the map position; bodies rise ~150 px.
  const characterAt = (cx: number, cy: number) => {
    const w = world.current?.getBoundingClientRect(); if (!w?.width) return null;
    const all = [{ id: me.id, x: here.current.x, y: here.current.y, characterId }, ...Object.entries(peers).filter(([, p]) => p.characterId).map(([id, p]) => ({ id, x: p.x, y: p.y, characterId: p.characterId }))];
    return all.map(c => ({ c, dx: cx - (w.left + c.x * w.width), dy: cy - (w.top + c.y * w.height) })).filter(h => Math.abs(h.dx) < 45 && h.dy > -150 && h.dy < 20).sort((a, b) => Math.abs(a.dx) - Math.abs(b.dx))[0]?.c ?? null;
  };
  // Idle flourish: standing still for 8 s shows the idle pose.
  const [idle, setIdle] = useState(false);
  const idleRef = useRef(idle); idleRef.current = idle;
  useEffect(() => { setIdle(false); if (position.moving) return; const t = setTimeout(() => setIdle(true), 8000); return () => clearTimeout(t); }, [position.moving, position.x, position.y]);

  const here = useRef(position); here.current = position; facingRef.current = position.dir;
  const keys = useRef(new Set<string>());
  const target = useRef<{ to: Pt; speed: number } | null>(null);
  const loop = useRef<number | null>(null);

  // Presence: ~8×/s while moving, a heartbeat every second otherwise.
  const sent = useRef(0);
  useEffect(() => {
    const tick = setInterval(() => {
      const p = here.current; const now = Date.now();
      if (p.moving || now - sent.current > 1000) { sent.current = now; backend.setPresence({ name: me.name, idle: idleRef.current, x: p.x, y: p.y, facing: p.facing, dir: p.dir, characterId, moving: enabled && p.moving }); }
    }, 120);
    return () => clearInterval(tick);
  }, [backend, characterId, enabled, me.name]);

  // Movement loop: held keys walk at a steady speed (diagonals too); a click or gathering target is walked to.
  const ensureLoop = () => {
    if (loop.current !== null) return;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
      const dir = { x: 0, y: 0 }; keys.current.forEach(k => { dir.x += KEYS[k].x; dir.y += KEYS[k].y; });
      let speed = 1;
      if (dir.x || dir.y) target.current = null;
      else if (target.current) {
        const p = here.current, to = target.current.to;
        const dx = to.x - p.x, dy = (to.y - p.y) / MAP.aspect;   // screen-proportional units
        if (Math.hypot(dx, dy) < 0.004) target.current = null; else { dir.x = dx; dir.y = dy; speed = target.current.speed; }
      }
      const p = here.current, nowMs = Date.now();
      if (!dir.x && !dir.y) {
        loop.current = null;
        if (p.moving) { const still = { ...p, moving: false }; here.current = still; setPosition(still); }
        return;
      }
      const mapPx = mapSize(viewRef.current.w, viewRef.current.h);
      if (isHeld(me.id, fieldRef.current, nowMs, { [me.id]: p }, mapPx)) {   // keep the target: a gathering walk resumes after the freeze
        if (p.moving) { const still = { ...p, moving: false }; here.current = still; setPosition(still); }
        loop.current = raf(frame); return;
      }
      speed *= slowFactor(me.id, p, fieldRef.current, nowMs, mapSize(viewRef.current.w, viewRef.current.h));
      let next = resolveMove(p, stepMove(p, dir, dt * speed));
      if (wallBlocks(p, next, fieldRef.current, nowMs, mapPx)) { next = { x: p.x, y: p.y }; target.current = null; }   // Rampart of Stone
      if (target.current && dt > 0 && Math.hypot(next.x - p.x, next.y - p.y) < 1e-6) target.current = null;   // blocked: stop
      const mx = next.x - p.x, my = (next.y - p.y) / MAP.aspect;
      const state = { ...next, facing: (mx < 0 ? 'left' : mx > 0 ? 'right' : p.facing) as Presence['facing'], dir: walkDirection(mx * 1000, my * 1000, p.dir), moving: true };
      here.current = state; setPosition(state);
      loop.current = raf(frame);
    };
    loop.current = raf(frame);
  };
  useEffect(() => () => { if (loop.current !== null) cancelAnimationFrame(loop.current); }, []);
  const walkTo = (to: Pt, speed = 1) => { target.current = { to, speed }; ensureLoop(); };

  // Shared moments: when the Warden starts a step with a gathering place, everyone hurries there (spread in an arc).
  const party = [me.id, ...Object.keys(peers).filter(id => peers[id].characterId)].sort();
  const lastStage = useRef(stage);
  useEffect(() => {
    const changed = lastStage.current !== stage; lastStage.current = stage;
    const point = changed && stage ? gatherPoint(stage) : null;   // not on first load / reload mid-step
    if (point) { keys.current.clear(); walkTo(gatherSpot(point, party.indexOf(me.id), party.length), 2.2); }
    // Only on stage change: later party changes must not yank people back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Speaker turns: the chosen player walks to the beacon. Positions are self-broadcast, so only their own screen moves them.
  const lastSpeaker = useRef(speakerId);
  useEffect(() => {
    const changed = lastSpeaker.current !== speakerId; lastSpeaker.current = speakerId;
    if (changed && speakerId === me.id && movement) { keys.current.clear(); walkTo(gatherSpot({ x: MAP.beacon.x, y: MAP.beacon.y + 0.06 }, 0, 1), 2.2); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  // Walk keys work anywhere on the page (no need to click the plaza first), except while typing.
  const walkToRef = useRef(walkTo); walkToRef.current = walkTo;
  const loopRef = useRef(ensureLoop); loopRef.current = ensureLoop;
  useEffect(() => {
    const held = keys.current;
    if (!enabled) {
      held.clear(); target.current = null;
      if (loop.current !== null) { cancelAnimationFrame(loop.current); loop.current = null; }
      if (here.current.moving) { const still = { ...here.current, moving: false }; here.current = still; setPosition(still); }
      return;
    }
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
      const k = e.key.toLowerCase(); if (!KEYS[k]) return;
      e.preventDefault(); held.add(k); loopRef.current();
    };
    const up = (e: KeyboardEvent) => { held.delete(e.key.toLowerCase()); };
    const clear = () => held.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); held.clear(); };
  }, [enabled]);
  const move = (x: number, y: number) => { if (enabled) walkToRef.current({ x, y }); };

  // Camera: eases after your character every frame (snaps when motion is reduced).
  const camAt = useRef<Pt | null>(null);
  const viewRef = useRef(view); viewRef.current = view;
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  useEffect(() => {
    let id = 0, last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
      const goal = cameraOffset(lampFocus.current ?? here.current, viewRef.current.w, viewRef.current.h);
      const c = camAt.current && !reducedRef.current ? camAt.current : goal;
      const k = 1 - Math.exp(-dt * 7);
      const nextCam = { x: c.x + (goal.x - c.x) * k, y: c.y + (goal.y - c.y) * k };
      camAt.current = nextCam;
      const tf = `translate3d(${nextCam.x.toFixed(1)}px, ${nextCam.y.toFixed(1)}px, 0)`;
      if (world.current) world.current.style.transform = tf;
      if (sky.current) sky.current.style.transform = tf;
      id = raf(frame);
    };
    id = raf(frame); return () => cancelAnimationFrame(id);
  }, []);

  const size = mapSize(view.w, view.h);
  // Aimed shots stop at the first object in their path (the object itself is untouched).
  const t = Date.now();
  const stasis = field.find(f => f.kind === 'stasis');
  const timeStopped = !!stasis && !stasis.cutAt && t >= stasis.at + STASIS.tickMs && t < stasis.at + STASIS.releaseMs;
  // Venuzdonoa ignores stopped time: a summoned sword stays in colour and glows — its owner can cut the stop.
  const resists = (id: string) => { const c = casting[id]; return !!(stasis && !stasis.cutAt && stasis.userId !== id && c?.kit.weapon && c.trueUntil && !c.descending && c.kit.skills.some(s => s.counters === 'stasis')); };
  // Skyfall: the caster arcs from the take-off spot to the landing spot (offset in px), until he lands
  const leap = (id: string) => { const f = field.find(x => x.kind === 'skyfall' && x.userId === id && t < x.at + SKYFALL.landMs); if (!f?.to) return undefined; return { '--jx': `${(f.to.x - f.pos.x) * size.w}px`, '--jy': `${(f.to.y - f.pos.y) * size.h}px` }; };
  const fieldClass = (id: string, p: { x: number; y: number }) => [
    leap(id) ? 'leaping' : '',
    slowFactor(id, p, field, t, size) < 1 ? 'slowed' : '',
    field.some(f => f.kind === 'cadenza' && f.targetId === id && t < f.at + CADENZA.hitMs + CADENZA.stunMs) ? 'iced' : '',
    stasis?.userId === id ? 'stasis-caster' : '',
    inLantern(p, field, t, size) ? 'lantern-lit' : '',
    field.some(f => (f.kind === 'soar' && f.userId === id && t >= f.at + SOAR.pickupMs && t < f.at + SOAR.landMs + 150) || (f.kind === 'thunder' && f.userId === id && t < f.at + THUNDER.landMs + 60)) ? 'riding' : '',
    resists(id) ? 'time-resist' : '',
    speakerId && speakerId === id ? 'speaker-spotlight' : '',
  ].join(' ');
  const posOf = (id: string) => id === me.id ? position : peers[id];
  const reachOf = (from: { x: number; y: number }, dir?: WalkDir, angle?: number) => { const s = shotVector(dir || 'down', angle); return shotDistance(from, s, s.max, size.w); };
  return <div ref={ref} className={`sanctuary-scene ${reduced ? 'reduce' : ''} ${shake && !reduced ? `shake-${shake}` : ''} ${stasis && !stasis.cutAt ? 'stasis' : ''} ${timeStopped ? 'time-stopped' : ''}`} tabIndex={enabled ? 0 : -1} role="group" aria-label="Sanctuary. Use WASD or the arrow keys to move your character, or click where to go."
    onPointerMove={e => { if (e.pointerType !== 'touch') { mouse.current = { x: e.clientX, y: e.clientY }; overBar.current = !!(e.target as HTMLElement).closest('.skill-bar'); } }}
    onPointerDown={e => { if (!enabled || (e.target as HTMLElement).closest('button')) return; const hit = characterAt(e.clientX, e.clientY); if (hit) { poke(hit.id, hit.characterId); return; } const r = world.current!.getBoundingClientRect(); move((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); ref.current?.focus(); }}>
    <div className="scene-sky" aria-hidden="true"><i className="cloud-band far" style={{ backgroundImage: `url(${SANCTUARY_CLOUDS.far})` }} /></div>
    <div ref={world} className="world" style={{ width: size.w, height: size.h }}>
      <img className="world-map" src={MAP.image} alt={`The Sanctuary plaza with ${lit} of 12 lamps lit`} draggable={false} />
      {MAP.lamps.map((p, i) => <i key={i} className={`lamp-glow ${i < lit ? 'lit' : ''} ${lampMoment?.lamps.includes(i) ? 'igniting' : ''}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: 11 + Math.round((p.y + 92 / 1024) * 1000), '--k': lampMoment ? lampMoment.lamps.indexOf(i) : 0 } as CSSProperties}   /* just above the lamp's own occluder cut-out (base = orb + 92 src px) */ aria-hidden="true" />)}
      {lampMoment && lampMoment.lamps.map((li, k) => <span key={`${lampMoment.key}-${li}`} className="lamp-moment-fx" aria-hidden="true" style={{ '--bx': `${MAP.beacon.x * 100}%`, '--by': `${MAP.beacon.y * 100}%`, '--lx': `${MAP.lamps[li].x * 100}%`, '--ly': `${MAP.lamps[li].y * 100}%`, '--k': k, '--step': `${LAMP_STEP_MS}ms` } as CSSProperties}><i className="lm-spark" /><i className="lm-burst" /><i className="lm-ring" /></span>)}
      {occluders.map(({ id, x, y, w, h, baseY }) => <img key={id} className="world-occluder" src={`${import.meta.env.BASE_URL}art/sanctuary/occluders/${id}.webp`} alt="" aria-hidden="true" draggable={false} style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, zIndex: 10 + Math.round(baseY * 1000), pointerEvents: 'none' }} />)}
      {writing && CATEGORIES.map(c => { const point = MAP.crystals[c.id], count = fragments.filter(f => f.category === c.id).length; return <div key={c.id} className={`write-crystal ${c.id} ${nearCrystal?.id === c.id ? 'near' : ''} ${flight?.category === c.id ? 'pulse' : ''}`} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, zIndex: 12 + Math.round((point.y + .04) * 1000), '--count': Math.min(count, 12) } as CSSProperties}><i className="write-crystal-aura" aria-hidden="true" /><i className="write-crystal-count" aria-hidden="true" /><button aria-label={`Write a ${c.label} thought (${c.plain})`} onClick={() => { if (!movement || !characterId || nearCrystal?.id === c.id) setWriter(c.id); else { setArrival(c.id); move(point.x, point.y + .045); } }}><span className="write-crystal-prompt">E · Write a {c.label} thought</span></button></div>; })}
      {flight && <i key={flight.key} className="fragment-flight" aria-hidden="true" style={{ '--from-x': `${position.x * 100}%`, '--from-y': `${position.y * 100}%`, '--to-x': `${MAP.crystals[flight.category].x * 100}%`, '--to-y': `${MAP.crystals[flight.category].y * 100}%` } as CSSProperties} />}
      <div className={`scene-character own ${position.moving ? 'walking' : ''} ${fieldClass(me.id, position)}`} style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%`, zIndex: 10 + Math.round(position.y * 1000), '--facing': position.facing === 'left' ? -1 : 1, ...leap(me.id) } as CSSProperties}><BodyAura characterId={characterId} casting={casting[me.id]} /><SkillFx skill={casting[me.id]?.skill} dir={casting[me.id]?.dir} angle={casting[me.id]?.angle} reach={reachOf(position, casting[me.id]?.dir, casting[me.id]?.angle)} /><Figure characterId={characterId} dir={position.dir} casting={casting[me.id]} idle={idle} /><span>{me.name}<small>you</small></span></div>
      <FieldLayer field={field} posOf={posOf} size={size} />
      {Object.entries(bubbles).map(([id, b]) => { const p = posOf(id); if (!p) return null; const name = id === me.id ? me.name : id.charAt(0).toUpperCase() + id.slice(1);
        return <div key={`${id}-${b.key}`} className="say-bubble" role="status" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, '--say-ms': `${b.until - b.key}ms` } as CSSProperties}><p>{b.text.replace('{nickname}', name)}</p></div>; })}
      {Object.entries(peers).filter(([, p]) => p.characterId).map(([id, p]) => <div key={id} className={`scene-character peer ${p.moving ? 'walking' : ''} ${fieldClass(id, p)}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: 10 + Math.round(p.y * 1000), '--facing': p.facing === 'left' ? -1 : 1, ...leap(id) } as CSSProperties}><BodyAura characterId={p.characterId} casting={casting[id]} /><SkillFx skill={casting[id]?.skill} dir={casting[id]?.dir} angle={casting[id]?.angle} reach={reachOf(p, casting[id]?.dir, casting[id]?.angle)} /><Figure characterId={p.characterId} dir={p.dir || 'down'} casting={casting[id]} idle={!!p.idle && !p.moving} /><span>{p.name || id.charAt(0).toUpperCase() + id.slice(1)}</span></div>)}
    </div>
    {stasis && <StasisOverlay key={stasis.id} fx={stasis} />}
    {field.filter(f => f.kind === 'dawn').map(f => createPortal(<div key={f.id} className="ult-overlay cine-dawn" aria-hidden="true"><i style={{ animationDelay: `${(KITS.seren.skills.find(s => s.field?.kind === 'dawn')?.syncMs ?? 0) - 400}ms` }} /></div>, document.body))}
    {(() => { const u = Object.values(casting).find(c => c.skill?.effect === 'ultimate'); const cine = u?.kit.ultCinematic; return cine?.kind === 'sever' ? <div className={`ult-overlay theme-${u!.kit.theme} cine-sever`} aria-hidden="true">
      <i className="sv-dim" />
      <div className="sv-half a"><i className="sv-threads">{[0, 1, 2, 3].map(i => <i key={i} className="sv-thread" style={{ '--i': i } as CSSProperties} />)}</i></div>
      <div className="sv-half b"><i className="sv-threads">{[0, 1, 2, 3].map(i => <i key={i} className="sv-thread b" style={{ '--i': i } as CSSProperties} />)}</i></div>
      <i className="sv-void" /><i className="sv-blade" /><i className="sv-cracks" />
      <i className="sv-flash" />
    </div> : null; })()}
    {Object.values(casting).some(c => c.skill?.effect === 'ultimate' && !c.kit.ultCinematic) && <div className={`ult-overlay theme-${Object.values(casting).find(c => c.skill?.effect === 'ultimate')?.kit.theme || 'blue'}`} aria-hidden="true">
      <i className="ult-dim" /><i className="ult-shockwave" /><i className="ult-shockwave late" />
      <span className="ult-dust">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--y': `${(i * 61) % 100}%` } as CSSProperties} />)}</span>
      <i className="ult-flash" />
    </div>}
    <div className="scene-mist" aria-hidden="true"><i className="cloud-band near" style={{ backgroundImage: `url(${SANCTUARY_CLOUDS.near})` }} /></div>
    <div className="scene-wash" />
    <div ref={sky} className="sky-world" aria-hidden="true" style={{ width: size.w, height: size.h }}><SkyLayer field={field} size={size} /></div>
    <div className="scene-copy"><h3>A little brighter, together.</h3><p>Every fulfilled Vow restores a light.</p></div>
    {lampMoment && <div className="lamp-moment-banner" role="status" style={{ '--n': lampMoment.lamps.length } as CSSProperties}>{lampMoment.lamps.length === 1 ? 'A promise kept — a light returns' : `${lampMoment.lamps.length} promises kept — ${lampMoment.lamps.length} lights return`} · {lit} / 12</div>}
    <div className="lamp-row" aria-label={`${lit} of 12 Sanctuary lamps lit`}>{Array.from({ length: 12 }, (_, i) => <span key={i} className={`lamp ${i < lit ? 'lit' : ''}`}><Flame size={17} fill={i < lit ? 'currentColor' : 'none'} strokeWidth={1.3} /></span>)}<span className="lamp-count">{lit} / 12 lights restored</span></div>
    {kit && enabled && <SkillBar skills={kit.skills} cooldowns={cooldowns} locked={locked} onCast={castSkill} />}
    <Minimap you={position} mates={Object.values(peers).filter(p => p.characterId)} lit={lit} />
    {nearBeacon && <nav className="crystal-options" aria-label="Central crystal options" hidden={!enabled}>
      <strong>Central Crystal</strong>
      {onOpenVote && <button className="crystal-vote" onClick={onOpenVote} aria-label="Open the Starlight Vote"><Star size={20} /><span>Vote<small>Pick what to discuss</small></span></button>}
      <button onClick={onOpenVows} aria-label="Open vow journal"><ScrollText size={20} /><span>Vow<small>View your journal</small></span></button>
    </nav>}
    {writer && writing && <form className="crystal-options crystal-writer" style={(() => { const p = MAP.crystals[writer], cam = cameraOffset(position, view.w, view.h), x = p.x * size.w + cam.x, y = p.y * size.h + cam.y; return { '--writer-color': { radiance: '#ffe09b', fracture: '#faacb8', spark: '#b7f3dc', wildcard: '#c7c1ff' }[writer], ...(view.w <= 760 || view.h > view.w ? {} : { left: Math.max(12, Math.min(view.w - 282, x + 42)), top: Math.max(72, Math.min(view.h - 270, y - 90)), right: 'auto', bottom: 'auto' }) } as CSSProperties; })()}   /* phones: world.css pins it to the bottom */ onSubmit={async e => { e.preventDefault(); const value = drafts[writer].trim(); if (!value || saving) return; setSaving(true); try { await backend.addFragment(sessionId, value, writer); if (editThought) { await backend.deleteMyFragment(sessionId, editThought.id); onEditDone?.(); } setDrafts(d => ({ ...d, [writer]: '' })); setWriter(null); const key = Date.now(); setFlight({ category: writer, key }); setTimeout(() => setFlight(f => f?.key === key ? null : f), 650); onFragmentSaved?.(editThought ? 'Your thought was updated.' : 'Your Fragment is in the constellation.'); } catch (error) { onFragmentSaved?.(error instanceof Error ? error.message : String(error), true); } finally { setSaving(false); } }}><strong>{(() => { const c = CATEGORIES.find(c => c.id === writer)!; return <><c.icon size={19} />{c.label} · {c.plain}</>; })()}</strong><label>Your anonymous thought<textarea value={drafts[writer]} onChange={e => setDrafts(d => ({ ...d, [writer]: e.target.value }))} rows={4} maxLength={1500} required autoFocus /></label><p>Anonymous to the party.</p><button type="submit" disabled={saving || !drafts[writer].trim()}>Drop it into the crystal</button></form>}
    <div className="scene-hint"><Navigation size={13} />{enabled ? 'Click to wander · WASD / arrows' : frozen ? 'Characters rest while you focus' : 'Movement is off'}</div>
  </div>;
}

/** A character on the plaza: ghost float, 4-direction walk sprite, or the painted cutout. */
function Figure({ characterId, dir, casting, idle = false }: { characterId: string | null; dir: WalkDir; casting?: Casting; idle?: boolean }) {
  const character = characterById(characterId);
  const kit = casting?.kit;
  if (kit?.trueForm && !kit.weapon && casting?.trueUntil && !(casting.until && casting.skill?.effect === 'transform')) {
    // True form: flies — hover / destroy / restore / descend poses, aura beneath.
    const pose = casting.descending ? 3 : casting.skill && casting.until ? casting.skill.truePose ?? 0 : idle && kit.trueIdlePose !== undefined ? kit.trueIdlePose : 0;
    const diving = kit.ultMove === 'dive' && casting.skill?.effect === 'ultimate' && !!casting.until;
    return <div className={`true-form ${diving ? 'ult-dive' : ''}`} data-dir={dir} style={{ '--true-size': `${kit.trueSize ?? 400}%`, '--true-bottom': `${kit.trueBottom ?? 26}%` } as CSSProperties}>
      {kit.aura && <img className="kit-aura strong" src={kit.aura} alt="" draggable={false} />}
      <i className="ghost-shadow" />
      <span className="true-body"><span className="true-pose" style={{ backgroundImage: `url(${kit.trueFormPoses})`, '--pose': pose, '--true-frames': kit.trueFrames ?? 4 } as CSSProperties} /></span>
      <span className="void-trail" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>
    </div>;
  }
  const ownKit = kit || (characterId ? KITS[characterId] : undefined);
  const idlePose = ownKit?.idlePose === undefined ? 3 : ownKit.idlePose;
  const posing = casting?.skill && casting.until && Date.now() >= (casting.at ?? 0) + (casting.skill.poseAtMs ?? 0) ? casting.skill.pose : idle && ownKit?.poses && idlePose !== null ? idlePose : null;
  const aura = ownKit?.aura ? <img className="kit-aura" src={ownKit.aura} alt="" draggable={false} /> : null;
  const weaponOut = !!(ownKit?.weapon && casting?.trueUntil && !casting.descending && !(casting.until && casting.skill?.effect === 'transform'));
  const weapon = weaponOut ? <img className="kit-weapon" data-dir={dir} src={ownKit!.weapon} alt="" draggable={false} /> : null;
  const companion = ownKit?.companion ? <i className="kit-companion" data-dir={dir} style={{ backgroundImage: `url(${ownKit.companion})`, '--pose': casting?.skill?.effect === 'transform' && casting.until ? 3 : casting?.skill?.effect === 'slash' && casting.until ? 1 : idle ? 2 : 0 } as CSSProperties} /> : null;
  if (ownKit?.floats && ownKit.poses) return <>{companion}<div className="ghost-figure kit-float" data-dir={dir}>
    <i className="ghost-shadow" /><span className="ghost-trail" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>
    <span className="ghost-body"><span className="pose-sprite" style={{ backgroundImage: `url(${ownKit.poses})`, '--pose': posing ?? ownKit.hoverPose ?? 0 } as CSSProperties} /></span>
  </div></>;
  if (ownKit?.weapon) {
    if (ownKit.poses && posing !== null) return <>{weapon}<div className="pose-sprite" data-dir={casting?.dir || 'down'} style={{ backgroundImage: `url(${ownKit.poses})`, '--pose': posing, ...(ownKit.poseCell && { '--pose-ar': ownKit.poseCell.aspect, '--pose-w': `${ownKit.poseCell.width}%`, '--pose-n': ownKit.poseCell.frames ?? 4 }) } as CSSProperties} /></>;
    return <>{weapon}<FigureBase character={character} characterId={characterId} dir={dir} /></>;
  }
  if (ownKit?.poses && posing !== null) return <>{aura}<div className="pose-sprite" data-dir={casting?.dir || 'down'} style={{ backgroundImage: `url(${ownKit.poses})`, '--pose': posing, ...(ownKit.poseCell && { '--pose-ar': ownKit.poseCell.aspect, '--pose-w': `${ownKit.poseCell.width}%`, '--pose-n': ownKit.poseCell.frames ?? 4 }) } as CSSProperties} /></>;
  if (aura) return <>{aura}<FigureBase character={character} characterId={characterId} dir={dir} /></>;
  return <FigureBase character={character} characterId={characterId} dir={dir} />;
}

function FigureBase({ character, characterId, dir }: { character: ReturnType<typeof characterById>; characterId: string | null; dir: WalkDir }) {
  if (character?.art.float) return <div className="ghost-figure" data-dir={dir}>
    <i className="ghost-shadow" /><span className="ghost-trail" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>
    <span className="ghost-body"><img src={character.art.float} alt="" draggable={false} /></span>
  </div>;
  if (!character?.art.walk) return <Art key={characterId} character={character} kind="cutout" decorative />;
  return <div className="walk-sprite" data-dir={dir} style={{ backgroundImage: `url(${character.art.walk})`, '--row': WALK_ROWS.indexOf(dir), '--frames': character.art.walkFrames ?? 8 } as CSSProperties} />;
}
