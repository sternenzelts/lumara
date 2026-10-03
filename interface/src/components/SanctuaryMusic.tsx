import { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { createPortal } from 'react-dom';
import { isRevealActive, subscribeRevealActivity } from '../logic/revealActivity';
import type { Route } from '../App';

const MUTED_KEY = 'lumara.sanctuaryMusicMuted';
const rememberedMute = () => { try { return localStorage.getItem(MUTED_KEY) === 'true'; } catch { return false; } };
const VOLUME_KEY = 'lumara.sanctuaryMusicVolume';
const rememberedVolume = () => { try { const saved = localStorage.getItem(VOLUME_KEY); const value = saved === null ? .25 : Number(saved); return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : .25; } catch { return .25; } };

/** Sanctuary and voyage music share controls; route changes switch tracks. */
export default function SanctuaryMusic({ route }: { route: Route }) {
  const enabled = route !== 'title' && route !== 'welcome';
  const voyage = route === 'retro';
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const wantsMusic = useRef(!rememberedMute());
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(rememberedVolume);
  const volumeRef = useRef(volume);
  const container = useRef<HTMLDivElement>(null);

  const start = () => {
    const track = audio.current;
    if (!track || !wantsMusic.current || !enabledRef.current || isRevealActive() || document.hidden) return;
    track.volume = volumeRef.current;
    void track.play().catch(() => { /* Autoplay can require a tap. The music button stays available. */ });
  };

  useEffect(() => {
    const track = audio.current!;
    track.src = `${import.meta.env.BASE_URL}audio/dark-aria.mp3`;
    const unlock = (event: Event) => {
      if (event.target instanceof Node && control.current?.contains(event.target)) return;
      if (track.paused && wantsMusic.current) start();
    };
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    const unsubscribe = subscribeRevealActivity(() => { if (isRevealActive()) track.pause(); else start(); });
    start();
    return () => {
      unsubscribe();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
      track.pause();
      track.currentTime = 0;
      track.removeAttribute('src');
      track.load();
    };
  }, []);

  useEffect(() => {
    setSlot(document.getElementById('sanctuary-music-slot'));
    const track = audio.current;
    if (track) {
      const source = `${import.meta.env.BASE_URL}audio/${voyage ? 'swordland' : 'dark-aria'}.mp3`;
      if (track.src !== new URL(source, document.baseURI).href) {
        track.pause(); track.src = source; track.load();
      }
    }
    if (!enabled) track?.pause(); else start();
    setOpen(false);
  }, [route, enabled, voyage]);

  useEffect(() => {
    if (!open) return;
    container.current?.querySelector<HTMLInputElement>('input')?.focus();
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); control.current?.focus(); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  const toggle = () => {
    const track = audio.current;
    if (!track) return;
    wantsMusic.current = !wantsMusic.current;
    try { localStorage.setItem(MUTED_KEY, String(!wantsMusic.current)); } catch { /* Preference storage is optional. */ }
    if (wantsMusic.current) {
      if (failed) { setFailed(false); track.load(); }
      start();
    } else track.pause();
  };
  return <>
    <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/dark-aria.mp3`} loop preload="none"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setFailed(true); }} />
    {slot && enabled && createPortal(<div ref={container} className="sanctuary-music-control"><button ref={control} className="game-icon" aria-label={voyage ? 'Voyage music controls' : 'Sanctuary music controls'} aria-expanded={open}
      onClick={() => { setOpen(!open); start(); }}>
      {playing ? <Music2 size={18} /> : <VolumeX size={18} />}
    </button>
    {open && <div className="sanctuary-music-panel" role="group" aria-label="Sanctuary music settings">
      <label htmlFor="sanctuary-music-volume">Music volume <output>{Math.round(volume * 100)}%</output></label>
      <input id="sanctuary-music-volume" type="range" min="0" max="100" step="1" value={Math.round(volume * 100)} onChange={event => {
        const next = Number(event.target.value) / 100; setVolume(next); volumeRef.current = next;
        if (audio.current) audio.current.volume = next;
        try { localStorage.setItem(VOLUME_KEY, String(next)); } catch { /* Optional preference. */ }
      }} />
      <button className="sanctuary-music-toggle" onClick={toggle}>{failed ? 'Retry music' : playing ? 'Mute music' : 'Play music'}</button>
    </div>}
  </div>, slot)}
  </>;
}
