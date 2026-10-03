import { bannerReturnTarget } from '../logic/bannerNavigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, ArrowLeft, ArrowRight, BookOpen, CircleHelp, Compass, Flame, Gem, Pause, Play, Plus, ScrollText, Settings2, Sparkles, UsersRound, Volume2, VolumeX, X } from 'lucide-react';
import { useUI, type Route } from '../App';
import { characterById } from '../data/characters';
import { worldArt, WORLD } from '../data/world';
import { useReducedMotion } from '../hooks';
import { Art } from './ui';
export { default as VowJournal } from './VowJournal';
import TitleMusic from './TitleMusic';
import NicknamePanel from './NicknamePanel';
import { readSerenMuted, saveSerenMuted } from '../logic/voice';
import './game-shell.css';
import './cinematic-shell.css';
import './voyage.css';

const MENU = [
  { route: 'map', label: 'World Map', icon: Compass },
  { route: 'collection', label: 'Companions', icon: BookOpen },
  { route: 'banner', label: 'Wishes', icon: Sparkles },
  { route: 'exchange', label: 'Exchange', icon: Gem },
  { route: 'vows', label: 'Vows', icon: ScrollText },
  { route: 'archives', label: 'Archives', icon: Archive },
] as const;
const TITLES: Partial<Record<Route, string>> = { collection: 'Companions', banner: 'Wishes', exchange: 'Exchange', vows: 'Vow journal', archives: 'Voyage archives', settings: 'Admin settings', retro: 'Your voyage' };
function readPreference(key: string) { try { return localStorage.getItem(key) === 'true'; } catch { return false; } }
const hasUserGesture = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;
const WELCOME_BACK = ['welcome_back_1', 'welcome_back_2', 'welcome_back_3'];
function savePreference(key: string, value: boolean) { try { localStorage.setItem(key, String(value)); } catch { /* Storage is optional. */ } }

export default function GameShell({ children, onHelp, error }: { children: ReactNode; onHelp: () => void; error: string | null }) {
  const ui = useUI();
  const { route, navigate, me, backend, player, starlight, stardust, vows, session, named, tutorial } = ui;
  const title = route === 'title', home = route === 'sanctuary';
  const hosting = !!session && session.wardenId === me.id;
  const bannerReturn = route === 'collection' ? bannerReturnTarget() : null;
  const panelBack = () => { if (bannerReturn) location.hash = bannerReturn; else navigate('sanctuary'); };
  const panelTitle = route === 'settings' && !me.isAdmin ? 'Warden panel' : TITLES[route];
  const [renaming, setRenaming] = useState(false);
  const [paused, setPaused] = useState(() => readPreference('lumara.motionPaused'));
  const [muted, setMuted] = useState(readSerenMuted);
  const [hidden, setHidden] = useState(document.hidden);
  const reduced = useReducedMotion();
  const interacted = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  const active = characterById(player?.displayCharacterId);
  const lit = Math.min(12, vows.filter(v => v.status === 'fulfilled').length);
  const playVoice = (id: string) => {
    audio.current?.pause();
    if (muted || !(interacted.current || hasUserGesture()) || document.hidden) return;
    const clip = new Audio(`${import.meta.env.BASE_URL}art/seren/voice/ja/seren_vo_${id}.mp3`);
    clip.volume = .65; audio.current = clip; void clip.play().catch(() => {});
  };
  useEffect(() => { savePreference('lumara.motionPaused', paused); }, [paused]);
  useEffect(() => { if (muted) audio.current?.pause(); }, [muted]);
  useEffect(() => {
    const visibility = () => { setHidden(document.hidden); if (document.hidden) audio.current?.pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); audio.current?.pause(); };
  }, []);
  useEffect(() => {
    audio.current?.pause();
    if (title) playVoice('title_tap');
    if (home && ui.sanctuaryGreeting) {
      // Greet once per visit to the game, not on every return from a menu.
      playVoice(ui.sanctuaryGreeting.startsWith('pull_') ? ui.sanctuaryGreeting : WELCOME_BACK[Math.floor(Math.random() * WELCOME_BACK.length)]);
      ui.clearGreeting();
    }
    if (!title && !home) panel.current?.focus({ preventScroll: true });
    // Route changes select the welcome line; voice never starts before a player gesture.
  }, [route, muted]);

  const voyage = route === 'retro' && !!ui.session;
  return <div className={`game-shell ${title ? 'game-arrival' : home ? 'game-sanctuary' : 'game-menu-open'} ${paused || reduced ? 'game-still' : ''} ${hidden ? 'game-hidden' : ''} ${route === 'banner' && !tutorial ? 'game-wish-screen' : ''} ${voyage ? 'game-voyage-screen' : ''}`} 
    onPointerDownCapture={() => { interacted.current = true; }} onKeyDownCapture={() => { interacted.current = true; }}>
    <div className="game-landscape" aria-hidden="true"><img src={worldArt(WORLD.image)} alt="" /><div className="game-landscape-shade" />
      {title && <div className="title-dawnlight" />}
      {Array.from({ length: 4 }, (_, i) => <i className="game-cloud" key={i} style={{ top: `${18 + i * 20}%`, animationDelay: `${-i * 32}s` }} />)}
      {Array.from({ length: 16 }, (_, i) => <i className="game-mote" key={`m${i}`} style={{ left: `${8 + i * 17 % 86}%`, top: `${25 + i * 19 % 67}%`, animationDelay: `${-i * 1.3}s` }} />)}
    </div>
    <div className="game-screen-frame" aria-hidden="true" />
    <header className="game-hud" inert={tutorial && !title ? true : undefined}>
      {title ? <span className="game-world-seal"><Compass size={25} strokeWidth={1} /><span>Lumara</span></span> : <button className="game-player" onClick={() => home ? setRenaming(true) : navigate('sanctuary')} aria-label={home ? `Change your name, ${me.name}` : 'Return to Sanctuary'}><span className="game-player-portrait">{active ? <Art character={active} /> : <UsersRound size={22} />}</span><span><strong>{me.name}</strong><small>{ui.accountName}{hosting ? ' · Warden' : ''}</small></span></button>}
      <div className="game-hud-right">{!title && <div className="game-wallet"><span title="Starlight"><Sparkles size={16} /><strong>{starlight.toLocaleString()}</strong><small>Starlight</small><button aria-label="Get Starlight" onClick={() => navigate('banner')}><Plus size={14} /></button></span><span title="Stardust"><Gem size={16} /><strong>{stardust.toLocaleString()}</strong><small>Stardust</small><button aria-label="Exchange Stardust" onClick={() => navigate('exchange')}><Plus size={14} /></button></span></div>}
        <div className="game-system-controls">{title && <TitleMusic />}<span id="sanctuary-music-slot" /><button className="game-icon" aria-label={paused ? 'Resume motion' : 'Pause motion'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button><button className="game-icon" aria-label={muted ? 'Unmute Seren' : 'Mute Seren'} aria-pressed={!muted} onClick={() => { setMuted(!muted); saveSerenMuted(!muted); }}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><button className="game-icon" aria-label="Guide to Lumara" onClick={onHelp}><CircleHelp size={19} /></button>{!title && (me.isAdmin || hosting) && <button className="game-icon" aria-label={me.isAdmin ? 'Admin settings' : 'Warden panel'} onClick={() => navigate('settings')}><Settings2 size={19} /></button>}</div>
      </div>
    </header>
    {error && <p className="game-connection-error" role="alert">{error}</p>}
    {title ? <main id="main" tabIndex={-1} className="game-welcome">
      <div className="game-title-lockup"><Compass size={38} strokeWidth={.8} /><h1>Lumara</h1><div className="game-title-rule"><span /><Sparkles size={17} /><span /></div><p>A world of promises and light</p></div>
      <Art character={characterById('seren')} kind="cutout" className="game-seren welcome-seren" decorative />
      <section className="game-dialogue welcome-dialogue" aria-label="Seren welcomes you"><div className="game-speaker"><strong>Seren</strong><span>Keeper of the dawn</span></div><p>{named ? <>Welcome back, {me.name}.<br /></> : null}Whenever you’re ready.</p><span className="game-dialogue-flourish" aria-hidden="true"><Sparkles size={14} /></span></section>
      <button className="game-enter" onClick={() => navigate(named ? 'sanctuary' : 'welcome')}><span>{named ? 'Enter Lumara' : 'Begin'}</span><ArrowRight size={21} /></button><p className="game-enter-note">{named ? 'Your Sanctuary is waiting' : 'Seren is waiting for you'}</p>
    </main> : home ? <main id="main" tabIndex={-1} className="game-hub">
      <div className="game-location"><h1>Aurelis</h1><p>The Sanctuary</p></div>
      <button className="game-beacon-status" onClick={() => navigate('map')}><Flame size={22} strokeWidth={1.2} /><span><span className="game-beacon-pips" role="img" aria-label={`${lit} of 12 beacons lit`}>{Array.from({length:12},(_,i)=><i key={i} className={i < lit ? 'lit' : ''} />)}</span><strong>{lit} <small>/ 12</small></strong><span>Beacons restored</span></span><ArrowRight size={14} /></button>
      <Art character={characterById('seren')} kind="cutout" className="game-seren hub-seren" decorative />
      <section className="game-dialogue hub-dialogue" aria-label="Seren's greeting"><div className="game-speaker"><strong>Seren</strong><span>Your guide</span></div><p>Welcome home, {me.name}.<br />{ui.session ? 'Your party is gathering. A new voyage awaits.' : 'Every promise we keep brings a little light back to the world.'}</p></section>
    </main> : <main id="main" ref={panel} tabIndex={-1} className={`game-panel game-panel-${route}`} aria-label={panelTitle}>
      <header className="game-panel-heading" inert={tutorial ? true : undefined}>{voyage ? <button className="voyage-exit" onClick={panelBack}><ArrowLeft size={18} />Exit voyage</button> : <button className="game-icon" onClick={panelBack} aria-label={bannerReturn ? 'Back to Wishes' : 'Back to Sanctuary'}><ArrowLeft size={20} /></button>}<h1>{panelTitle}</h1></header>
      <div className="game-panel-scroll">{children}</div>
    </main>}
    {!title && !home && <Art character={characterById('seren')} kind="cutout" className="game-seren menu-seren" decorative />}
    {!title && <div className="game-navigation">{home && <VoyageGate />}<nav inert={tutorial ? true : undefined} className="game-dock" aria-label="Game menu">{MENU.map(item => <button key={item.route} className={route === item.route ? 'selected' : ''} aria-current={route === item.route ? 'page' : undefined} aria-label={item.route === 'map' ? 'Explore world map' : item.label} onClick={() => navigate(item.route)}><span className="game-dock-emblem"><item.icon size={24} strokeWidth={1.2} /></span><span>{item.label}</span></button>)}</nav></div>}
    <div className="game-corner-status" inert={tutorial && !title ? true : undefined}>{backend.mode === 'local' && <span>Demo mode</span>}<button onClick={() => navigate(title ? 'map' : 'title')}>{title ? 'Explore the map' : 'Title screen'}</button></div>
    {renaming && <RenameDialog onClose={() => setRenaming(false)} />}
  </div>;
}

function RenameDialog({ onClose }: { onClose: () => void }) {
  const { me, accountName, backend, tell } = useUI();
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; frame.current?.querySelector<HTMLInputElement>('input')?.focus();
    const key = (e: KeyboardEvent) => { if(e.key === 'Escape') onClose(); if(e.key === 'Tab'){ const items = Array.from(frame.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input') || []); const first=items[0],last=items[items.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus()} } };
    document.addEventListener('keydown',key); return () => { document.removeEventListener('keydown',key); previous?.focus(); };
  }, [onClose]);
  return <div className="rename-scrim" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={frame} className="opening-name-frame rename-frame" role="dialog" aria-modal="true" aria-label="Change your name">
      <button className="game-icon rename-close" aria-label="Keep my name" onClick={onClose}><X size={18} /></button>
      <NicknamePanel initial={me.name} accountName={accountName} submitLabel="Save name"
        onSubmit={async name => { await backend.setMyNickname(name); onClose(); tell(`Seren will call you ${name} now.`); }} />
    </section>
  </div>;
}

function VoyageGate() {
  const { session, attendance, me, backend, navigate, run, busy, openCreate, openJoin } = useUI();
  const joined = attendance.some(a => a.userId === me.id && a.sessionId === session?.id);
  const label = session ? joined ? 'Continue Voyage' : 'Join Voyage' : me.isAdmin ? 'Start a Retro' : 'Join Retro';
  const action = session ? () => run(async () => { await backend.join(session.id); navigate('retro'); }) : me.isAdmin ? openCreate : openJoin;
  return <section className="game-voyage-gate">
    <button className={`game-voyage-emblem ${session?.status === 'active' ? 'voyage-live' : ''}`} disabled={busy} aria-label={label} onClick={action}>
      <span className="game-gate-symbol"><Compass size={52} strokeWidth={1} /></span><span className="game-voyage-copy"><h2>Voyage</h2><strong>{session ? session.sprintName : 'Gather your party'}</strong>
      {session && <span>{attendance.length} in the party</span>}<small>{label}<ArrowRight size={16} /></small></span>
    </button>{!session && me.isAdmin && <button className="game-action secondary" onClick={openJoin}>Join Retro<UsersRound size={17} /></button>}
  </section>;
}

