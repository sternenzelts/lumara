import type { CSSProperties } from 'react';
import { KITS, type Skill } from '../data/kits';
import { DECEL, SOAR, type FieldFx, type FieldKind, type Pt } from '../logic/fieldEffects';

const skillFor = (kind: FieldKind): Skill | undefined => Object.values(KITS).flatMap(k => k.skills).find(s => s.field?.kind === kind);
const at = (p: Pt, z: number, extra?: Record<string, string | number | undefined>) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: z, ...extra }) as CSSProperties;
const depth = (p: Pt) => 10 + Math.round(p.y * 1000);
const bg = (src?: string) => (src ? { backgroundImage: `url(${src})` } : {});

/**
 * Ayaka's field skills, drawn on the map where they were cast (they stay put while she walks away).
 * Painted strips are 7 frames (4 painted + 3 blended in-betweens); timing lives in skills.css.
 */
export default function FieldLayer({ field, posOf, size }: { field: FieldFx[]; posOf: (userId: string) => Pt | undefined; size: { w: number; h: number } }) {
  return <>{field.map(f => {
    const v = skillFor(f.kind)?.vfx;
    if (f.kind === 'decel') return <i key={f.id} className="field-fx fx-dome" aria-hidden="true" style={at(f.pos, depth(f.pos) - 1, { ...bg(v?.dome), '--w': `${Math.round(DECEL.radius * 2 / 0.8)}px` })} />;
    if (f.kind === 'cadenza') {
      const to = f.to ?? f.pos, target = (f.targetId && posOf(f.targetId)) || to;
      return <span key={f.id}>
        {[0.28, 0.52, 0.76].map((k, i) => { const p = { x: f.pos.x + (to.x - f.pos.x) * k, y: f.pos.y + (to.y - f.pos.y) * k }; return <i key={i} className="field-fx fx-spire" aria-hidden="true" style={at(p, depth(p) + 1, { ...bg(v?.spires), '--d': `${i * 0.12}s` })} />; })}
        {f.targetId ? <i className="field-fx fx-prison" aria-hidden="true" style={at(target, depth(target) + 2, bg(v?.prison))} /> : <i className="field-fx fx-spire last" aria-hidden="true" style={at(to, depth(to) + 1, { ...bg(v?.spires), '--d': '.36s' })} />}
      </span>;
    }
    if (f.kind === 'niflheim') return <span key={f.id}>
      <i className="field-fx fx-frost" aria-hidden="true" style={at(f.pos, 5)} />
      <i className="field-fx fx-throne" aria-hidden="true" style={at(f.pos, depth(f.pos) - 1, bg(v?.throne))} />
      <i className="field-fx fx-mist" aria-hidden="true" style={at(f.pos, depth(f.pos) - 2, bg(v?.mist))} />
      <i className="field-fx fx-mist front" aria-hidden="true" style={at(f.pos, depth(f.pos) + 3, bg(v?.mist))} />
      <i className="field-fx fx-puff" aria-hidden="true" style={at(f.pos, depth(f.pos) + 4)} />
      <i className="field-fx fx-puff late" aria-hidden="true" style={at(f.pos, depth(f.pos) + 4)} />
    </span>;
    if (f.kind === 'wall') { const c = f.to ?? f.pos; return <i key={f.id} className="field-fx fx-wall" aria-hidden="true" style={at(c, depth(c) + 1, bg(v?.wall))} />; }
    if (f.kind === 'aegis') return <i key={f.id} className="field-fx fx-aegis" aria-hidden="true" style={at(f.pos, depth(f.pos) - 1, bg(v?.aegis))} />;
    if (f.kind === 'thunder') { const to = f.to ?? f.pos; return <span key={f.id}><i className="field-fx fx-bolt-out" aria-hidden="true" style={at(f.pos, depth(f.pos) + 2)} /><i className="field-fx fx-thunder" aria-hidden="true" style={at(to, depth(to) + 2, bg(v?.thunder))} /></span>; }
    if (f.kind === 'guide') return <i key={f.id} className="field-fx fx-halo" aria-hidden="true" style={at(f.pos, depth(f.pos) - 1, bg(v?.halo))} />;
    if (f.kind === 'dawn') return <i key={f.id} className="field-fx fx-pillar" aria-hidden="true" style={at(f.pos, depth(f.pos) + 2, { ...bg(v?.pillar), animationDelay: `${(skillFor('dawn')?.syncMs ?? 0) - 400}ms` })} />;
    if (f.kind === 'skyfall') { const to = f.to ?? f.pos; return <i key={f.id} className="field-fx fx-slam" aria-hidden="true" style={at(to, depth(to) + 2, bg(v?.slam))} />; }
    if (f.kind === 'lantern') return <i key={f.id} className="field-fx fx-lanterns" aria-hidden="true" style={at(f.pos, depth(f.pos) + 2, bg(v?.lanterns))} />;
    if (f.kind === 'soar') {   // Yulan swoops in, carries her along an arc, sets her down, rises away
      const to = f.to ?? f.pos, dx = (to.x - f.pos.x) * size.w, dy = (to.y - f.pos.y) * size.h;
      return <span key={f.id}>
        <i className="field-fx fx-yulan-shadow" aria-hidden="true" style={at(f.pos, 6, flight(dx, dy))} />
        <i className="field-fx fx-wings" aria-hidden="true" style={at(to, depth(to) + 2, bg(v?.wings))} />
      </span>;
    }
    return null;
  })}</>;
}

/** Path vars for Yulan's flight: offset to the landing spot, facing, and a tilt into the direction of travel. */
function flight(dx: number, dy: number) {
  const flip = dx < 0 ? -1 : 1, tilt = Math.max(-22, Math.min(22, Math.atan2(dy, Math.abs(dx) || 1) * 180 / Math.PI * 0.6));
  return { '--dx': `${dx}px`, '--dy': `${dy}px`, '--flip': flip, '--tilt': `${tilt}deg` };
}

/** Yulan flies ABOVE the plaza's haze and clouds (a sky layer that follows the camera), so he stays solid and bright. */
export function SkyLayer({ field, size }: { field: FieldFx[]; size: { w: number; h: number } }) {
  return <>{field.filter(f => f.kind === 'soar').map(f => {
    const to = f.to ?? f.pos, dx = (to.x - f.pos.x) * size.w, dy = (to.y - f.pos.y) * size.h;
    return <i key={f.id} className="fx-yulan" aria-hidden="true" style={at(f.pos, 1, flight(dx, dy))}>
      <i className="yulan-trail" /><i className="yulan-body" style={bg(skillFor('soar')?.vfx?.yulan)} />
    </i>;
  })}</>;
}

/** Chrono Stasis: the golden clock ticks once, the world turns to stone-grey for 10 s (Ayaka can release it early), then shatters back into colour. */
export function StasisOverlay({ fx }: { fx: FieldFx }) {
  return <div key={fx.id} className={`ult-overlay cine-stasis ${fx.ended ? 'ended' : fx.cutAt ? 'cut' : ''}`} aria-hidden="true">
    <i className="st-veil" />
    <i className="st-clock" style={bg(skillFor('stasis')?.vfx?.clock)} />
    <i className="st-flash" /><i className="st-flash release" />
  </div>;
}
