import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { cardDefs } from './catalog';
import type { TableEvent } from './game';
import { effectFor, type Effect } from './guide';

export interface Playing { event: TableEvent; fx: Effect }
export type Point = { x: number; y: number };

/**
 * Plays every new public event one after another (a single move can produce several, e.g. a bomb and a win).
 * History is never replayed on mount. `busyUntil` tells the practice bots to wait until the queue is done.
 */
export function useEffectQueue(events: TableEvent[] | undefined, me: number, names: string[], busyUntil: MutableRefObject<number>) {
  const seen = useRef<number | null>(null);
  const queue = useRef<Playing[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [current, setCurrent] = useState<Playing | null>(null);
  const pump = () => {
    if (timer.current) return;
    const next = queue.current.shift();
    if (!next) { setCurrent(null); return; }
    setCurrent(next);
    busyUntil.current = Date.now() + next.fx.duration + queue.current.reduce((t, q) => t + q.fx.duration, 0);
    timer.current = setTimeout(() => { timer.current = null; pump(); }, next.fx.duration);
  };
  const newest = events?.at(-1)?.id ?? 0;
  useEffect(() => {
    if (!events) return;
    if (seen.current === null) { seen.current = newest; return; }
    for (const event of events.filter(e => e.id > seen.current!)) { const fx = effectFor(event, me, names); if (fx) queue.current.push({ event, fx }); }
    seen.current = Math.max(seen.current, newest);
    pump();
  }, [newest]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return current;
}

const PARTICLES = Array.from({ length: 14 }, (_, i) => i);

/** Effect artwork for one event, positioned in stage percentages supplied by the table scene. */
export function SceneEffect({ playing, pointOf }: { playing: Playing; pointOf: (where: number | 'deck' | null) => Point }) {
  const { event, fx } = playing;
  const at = pointOf(event.seat);
  const accent = event.card && event.card !== 'pair' && event.card !== 'trio' ? cardDefs[event.card].color : undefined;
  const fly = fx.fly !== undefined ? { from: pointOf(fx.fly), to: pointOf(fx.to ?? event.seat) } : null;
  const slash = fx.from !== undefined ? (() => {
    const a = pointOf(fx.from!), b = at; const dx = b.x - a.x, dy = (b.y - a.y) / (1672 / 941);
    return { left: `${a.x}%`, top: `${a.y}%`, width: `${Math.hypot(dx, dy)}%`, transform: `rotate(${Math.atan2(dy, dx)}rad)` };
  })() : null;
  return <div className={`fx fx-${fx.tone}`} style={{ '--dur': `${fx.duration}ms`, ...(accent ? { '--fx-accent': accent } : {}) } as CSSProperties} aria-hidden="true">
    {fx.tone === 'explode' && <div className="fx-flash" />}
    {slash && <div className="fx-slash" style={slash} />}
    <div className="fx-origin" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
      <span className="fx-ring" />
      <span className="fx-burst">{PARTICLES.map(i => <i key={i} style={{ '--a': `${i * 360 / PARTICLES.length}deg`, '--d': `${60 + (i % 3) * 32}px` } as CSSProperties} />)}</span>
    </div>
    {fly && <div className="fx-fly" style={{ '--from-x': `${fly.from.x}%`, '--from-y': `${fly.from.y}%`, '--to-x': `${fly.to.x}%`, '--to-y': `${fly.to.y}%` } as CSSProperties}><span /></div>}
    {fx.stamp && <div className="fx-stamp"><strong>{fx.stamp}</strong>{fx.sub && <span>{fx.sub}</span>}</div>}
  </div>;
}
