import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowLeft, Check, Compass, Droplets, Flame, Mountain, Pause, Play, RotateCcw, Snowflake, Sparkles, Sun, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { Backend, Vow } from '../backend/types';
import { characterById } from '../data/characters';
import { BEACONS, GUIDE, NATIONS, WORLD, clampPan, mapGeometry, worldArt, type Nation } from '../data/world';
import { useReducedMotion } from '../hooks';
import { Art } from '../components/ui';
import { readSerenMuted, saveSerenMuted } from '../logic/voice';
import './world-map.css';

const icons = { Light: Sun, Ice: Snowflake, Lightning: Zap, Earth: Mountain, Water: Droplets };
const preference = (key: string) => { try { return localStorage.getItem(key) === 'true'; } catch { return false; } };
const remember = (key: string, value: boolean) => { try { localStorage.setItem(key, String(value)); } catch { /* Preferences are optional. */ } };
const pointStyle = (x: number, y: number, color?: string) => ({ left: `${x}%`, top: `${y}%`, '--nation': color } as CSSProperties);

interface Props {
  backend: Pick<Backend, 'mode' | 'watchVows'>; onBack: () => void; onCharacter: (id: string) => void;
}
export default function WorldMap({ backend, onBack, onCharacter }: Props) {
  const [vows, setVows] = useState<Vow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Nation | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [preview, setPreview] = useState(0);
  const [paused, setPaused] = useState(() => preference('lumara.motionPaused'));
  const [muted, setMuted] = useState(readSerenMuted);
  const [hidden, setHidden] = useState(document.hidden);
  const [igniting, setIgniting] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [mapFailed, setMapFailed] = useState(false);
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const interacted = useRef(false);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lastCount = useRef<number | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const staticMotion = paused || reduced;
  const lit = Math.min(WORLD.beaconsTotal, (vows?.filter(v => v.status === 'fulfilled').length || 0) + preview);
  const geometry = mapGeometry(size.width, size.height);
  const zoom = igniting !== null && !staticMotion ? 1.055 : 1;
  const focusPoint = (x: number, y: number, scale = zoom) => setPan(clampPan((.5 - x / 100) * geometry.width * scale, (.5 - y / 100) * geometry.height * scale, size.width, size.height, scale));
  useEffect(() => { setPan(p => clampPan(p.x, p.y, size.width, size.height, zoom)); }, [zoom, size.width, size.height]);

  useEffect(() => {
    setLoadError(false); lastCount.current = null;
    try { return backend.watchVows(value => setVows(value)); }
    catch { setLoadError(true); }
  }, [backend, retry]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height }); setPan(p => clampPan(p.x, p.y, width, height));
    });
    if (root.current) observer.observe(root.current);
    const visibility = () => { setHidden(document.hidden); if (document.hidden) audio.current?.pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); audio.current?.pause(); };
  }, []);
  useEffect(() => {
    if (vows === null) return;
    const old = lastCount.current; lastCount.current = lit;
    if (old === null || lit <= old) { setIgniting(null); setAnnouncement(''); return; }
    const beacon = BEACONS[lit - 1];
    setIgniting(lit - 1);
    setAnnouncement(lit === WORLD.beaconsTotal ? 'Every beacon is shining… Lumara is alive again. Thank you — truly.' : 'A promise kept! Look — a beacon is waking up.');
    if (!staticMotion) focusPoint(beacon.x, beacon.y, 1.055);
    if (!muted && interacted.current && !document.hidden) {
      audio.current?.pause();
      const clip = new Audio(`${import.meta.env.BASE_URL}art/seren/voice/ja/seren_vo_${lit === WORLD.beaconsTotal ? 'beacon_all_12' : 'vow_fulfilled'}.mp3`);
      audio.current = clip; clip.volume = .65; void clip.play().catch(() => {});
    }
    // Each new count replaces the preceding ignition; persisted counts load quietly.
    const timer = window.setTimeout(() => { setIgniting(null); setAnnouncement(''); }, 5200);
    return () => window.clearTimeout(timer);
  }, [lit, vows === null]);
  useEffect(() => { if (muted) audio.current?.pause(); }, [muted]);
  useEffect(() => { remember('lumara.motionPaused', paused); }, [paused]);
  useEffect(() => {
    if (!selected) return;
    previousFocus.current = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { previousFocus.current?.focus({ preventScroll: true }); };
  }, [selected?.id]);

  const selectNation = (nation: Nation) => { setSelected(nation); setHovered(nation.id); focusPoint(nation.x, nation.y); };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId); setDragging(true);
  };
  const closePanel = () => { setSelected(null); setHovered(null); };
  const bubble = announcement || GUIDE[hovered || selected?.id || ''] || 'The Dimming quieted our beacons. Each fulfilled Vow — an action item — brings one back to life.';
  return <main id="main" tabIndex={-1} ref={root} className={`world-map ${staticMotion ? 'map-static' : ''} ${hidden ? 'map-hidden' : ''} ${dragging ? 'map-dragging' : ''}`}
    aria-label="Lumara world map" onPointerDownCapture={() => { interacted.current = true; }} onKeyDownCapture={() => { interacted.current = true; }}
    onKeyDown={e => { if (e.key === 'Escape') closePanel(); }}>
    <div className="map-viewport" onPointerDown={onPointerDown} onPointerMove={e => {
      if (!drag.current) return;
      setPan(clampPan(drag.current.panX + e.clientX - drag.current.x, drag.current.panY + e.clientY - drag.current.y, size.width, size.height, zoom));
    }} onPointerUp={() => { drag.current = null; setDragging(false); }} onPointerCancel={() => { drag.current = null; setDragging(false); }}>
      <div className="map-painting" style={{ width: geometry.width, height: geometry.height, marginLeft: -geometry.width / 2, marginTop: -geometry.height / 2, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <img className="map-image" src={worldArt(WORLD.image)} alt="Lumara: four island nations surrounding the golden Sanctuary of Aurelis" draggable={false} onError={() => setMapFailed(true)} />
        <div className="map-atmosphere" aria-hidden="true">
          <i className="map-aurora" /><i className="map-lightning" /><i className="map-mist" /><i className="map-sanctuary-halo" style={pointStyle(WORLD.sanctuary.x, WORLD.sanctuary.y)} />
          {Array.from({ length: 4 }, (_, i) => <i key={`cloud${i}`} className="map-cloud" style={{ top: `${20 + i * 19}%`, '--delay': `${-i * 29}s`, '--duration': `${110 + i * 13}s` } as CSSProperties} />)}
          {[[12, 65], [20, 31], [37, 21], [70, 54], [84, 64], [70, 88], [20, 82], [93, 68]].map(([x, y], i) => <i key={`water${i}`} className="map-shimmer" style={{ ...pointStyle(x, y), animationDelay: `${-i * .7}s` }} />)}
          {Array.from({ length: 20 }, (_, i) => <i key={`mote${i}`} className={`map-mote ${i % 4 === 0 ? 'map-glitch' : ''}`} style={{ ...pointStyle(6 + (i * 37) % 88, 18 + (i * 23) % 76), '--delay': `${-i * 1.7}s`, '--duration': `${12 + i % 7}s` } as CSSProperties} />)}
          {Array.from({ length: 7 }, (_, i) => <i key={`petal${i}`} className="map-petal" style={{ ...pointStyle(72 + i * 3, 25 + i % 3 * 7), animationDelay: `${-i * 1.4}s` }} />)}
          {[0, 1, 2, 3].map(i => <i key={`canal${i}`} className="map-canal" style={{ ...pointStyle(13 + i * 4, 44 + i % 2 * 5), animationDelay: `${-i}s` }} />)}
          {NATIONS.map(n => <i key={n.id} className={`map-region-glow ${hovered === n.id || selected?.id === n.id ? 'visible' : ''}`} style={pointStyle(n.x, n.y, n.color)} />)}
        </div>
        <div className="map-beacons" aria-label="Beacon locations">
          {BEACONS.map(b => <span key={b.id} className={`map-beacon ${b.index < lit ? 'lit' : ''} ${igniting === b.index ? 'igniting' : ''}`} style={{ ...pointStyle(b.x, b.y, b.nation.color), '--delay': `${-b.index * .31}s` } as CSSProperties} role="img" aria-label={`${b.nation.name} beacon ${Number(b.id.split(':')[1]) + 1}: ${b.index < lit ? 'lit' : 'dim'}`}><i className="beacon-halo" /><Flame size={15} /><i className="beacon-rays" />{igniting === b.index && <i className="beacon-burst" />}</span>)}
        </div>
        <div className="map-nations" aria-label="Nations">
          {NATIONS.map(n => {
            const Icon = icons[n.element as keyof typeof icons];
            const restored = n.id !== 'aurelis' && BEACONS.filter(b => b.nation.id === n.id && b.index < lit).length === 3;
            return <button key={n.id} className={`nation-label ${n.id === 'aurelis' ? 'sanctuary-label' : ''} ${restored ? 'restored' : ''}`} style={pointStyle(n.x, n.y, n.color)}
              aria-label={`Explore ${n.name}${restored ? ', restored' : ''}`} aria-expanded={selected?.id === n.id} aria-controls="nation-panel"
              onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} onFocus={e => { setHovered(n.id); if (e.currentTarget.matches(':focus-visible')) focusPoint(n.x, n.y); }} onBlur={() => setHovered(null)} onClick={() => selectNation(n)}>
              <Icon size={17} strokeWidth={1.4} /><span>{n.name}</span><small>{n.subtitle || (restored ? 'Restored' : n.element)}</small>{restored && <Check className="nation-restored-check" size={13} />}
            </button>;
          })}
        </div>
      </div>
    </div>
    <div className="map-edge-shade" aria-hidden="true" />
    <header className="map-hud-top">
      <div className="map-heading"><button className="map-round" onClick={onBack} aria-label="Back to Sanctuary"><ArrowLeft size={22} /></button><div><h1>Lumara</h1><p>World map</p></div>{backend.mode === 'local' && <span className="map-demo">Demo mode</span>}</div>
      <div className="map-progress" aria-live="polite"><Flame size={21} strokeWidth={1.3} /><span>Beacons <strong>{vows === null ? '—' : lit} <small>/ {WORLD.beaconsTotal}</small></strong></span><div className="map-progress-stars" aria-hidden="true">{BEACONS.map(b => <i key={b.id} className={b.index < lit ? 'lit' : ''} />)}</div></div>
    </header>
    <div className="map-tools" aria-label="Map settings">
      <button className="map-round" aria-label={paused ? 'Resume motion' : 'Pause motion'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
      <button className="map-round" aria-label={muted ? 'Unmute Seren' : 'Mute Seren'} aria-pressed={!muted} onClick={() => { setMuted(!muted); saveSerenMuted(!muted); }}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      <button className="map-round" aria-label="Recenter map" onClick={() => setPan({ x: 0, y: 0 })}><Compass size={20} /></button>
    </div>
    {(mapFailed || loadError) && <div className="map-load-error" role="alert">{mapFailed ? 'The painting could not load. You can still explore each nation below.' : 'Beacon progress could not load.'}{loadError && <button onClick={() => setRetry(n => n + 1)}>Retry progress</button>}</div>}
    <nav className="map-mobile-nations" aria-label="Find a nation">{NATIONS.map(n => <button key={n.id} aria-label={`Find ${n.name}`} aria-pressed={selected?.id === n.id} onClick={() => selectNation(n)}>{n.name}</button>)}</nav>
    <div className="map-guide" aria-live="polite"><img key={announcement ? 'proud' : 'chibi'} src={`${import.meta.env.BASE_URL}art/seren/${announcement ? 'seren_face_proud.webp' : 'seren_chibi.webp'}`} alt="Seren" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /><div><strong>Seren <span>Your guide</span></strong><p>{bubble}</p></div></div>
    <footer className="map-hud-bottom"><span className="map-hint"><Compass size={14} />Drag to explore · Select a nation</span>{backend.mode === 'local' && <div className="map-demo-tools">{preview > 0 && <button aria-label="Reset beacon preview" onClick={() => { lastCount.current = null; setPreview(0); setAnnouncement(''); setIgniting(null); }}><RotateCcw size={13} /></button>}<button disabled={lit >= WORLD.beaconsTotal || vows === null} onClick={() => setPreview(p => p + 1)}><Sparkles size={14} />Light next beacon<span>{preview ? 'Preview' : 'Demo'}</span></button></div>}</footer>
    {selected && <section ref={panel} id="nation-panel" className="nation-panel" role="dialog" aria-modal="true" aria-labelledby="nation-panel-title" style={{ '--nation': selected.color } as CSSProperties}
      onKeyDown={e => {
        if (e.key !== 'Tab') return;
        const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button'); if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }}>
      <div className="nation-scene"><img key={selected.id} src={worldArt(selected.art)} alt={`${selected.name} landscape`} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /><button className="map-round" onClick={closePanel} aria-label="Close nation details"><X size={19} /></button><span className="nation-scene-element">{selected.element}</span></div>
      <div className="nation-panel-copy"><h2 id="nation-panel-title">{selected.name}</h2><p className="nation-inspiration">{selected.inspiredBy === 'original' ? 'The Sanctuary · the heart of Lumara' : `Inspired by ${selected.inspiredBy}`}</p><p>{GUIDE[selected.id].split(' — ')[1]}</p>
        <div className="nation-beacon-progress"><Flame size={21} /><div><strong>{selected.id === 'aurelis' ? 'An everlasting light' : `${BEACONS.filter(b => b.nation.id === selected.id && b.index < lit).length} / 3 beacons restored`}</strong><span>{selected.id === 'aurelis' ? 'Our Sanctuary is always lit.' : 'Each fulfilled action item rekindles a beacon.'}</span></div></div>
        <h3>Companions of {selected.name}</h3><div className="nation-characters">{selected.characters.map(id => { const c = characterById(id); return <button key={id} onClick={() => onCharacter(id)} aria-label={`View ${c?.name || id} in collection`}><span className={`nation-portrait portrait-${id}`}><Art character={c} kind="cutout" /></span><strong>{c?.name || id}</strong><small>{c?.grade}</small></button>; })}</div><p className="nation-collection-hint">Select a companion to visit their collection page.</p>
      </div>
    </section>}
    {selected && <button className="nation-dismiss" onClick={closePanel} tabIndex={-1} aria-label="Close nation details backdrop" />}
  </main>;
}
