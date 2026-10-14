import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);
  // Remember the visitor's choice: if they muted, stay muted after reload; otherwise start on the first interaction.
  const autoPending = useRef((() => { try { return localStorage.getItem('lumara.music') !== 'off'; } catch { return true; } })());
  const ducked = useRef(false);
  const trailerActive = useRef(false);
  const resumeAfterTrailer = useRef(false);
  const playRequest = useRef(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('lumara.music.volume');
      const value = saved === null ? 25 : Number(saved);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 25;
    } catch { return 25; }
  });
  const volumeLevel = useRef(volume / 100);
  const settings = useRef<HTMLDetailsElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function stop() {
    playRequest.current++;
    requested.current = false;
    audio.current?.pause();
    setPlaying(false);
    setLoading(false);
  }

  async function begin(automatic: boolean) {
    const element = audio.current;
    if (!element || requested.current || trailerActive.current) return;
    const request = ++playRequest.current;
    if (element.error) element.load();
    requested.current = true;
    element.volume = volumeLevel.current * (ducked.current ? .2 : 1);
    setError('');
    setLoading(true);
    try {
      await element.play();
      if (request !== playRequest.current) return;
      if (!requested.current) element.pause();
      else autoPending.current = false;
    } catch (reason) {
      const name = reason instanceof DOMException ? reason.name : '';
      if (request !== playRequest.current || !requested.current || name === 'AbortError') return;
      stop();
      if (automatic && name === 'NotAllowedError') return;
      autoPending.current = false;
      setError('Music could not play. Press play to retry.');
    }
  }

  useEffect(() => {
    const element = audio.current!;
    element.volume = volumeLevel.current;
    const hide = () => { if (document.hidden) { resumeAfterTrailer.current = false; if (requested.current) { autoPending.current = false; stop(); } } };
    const voice = (event: Event) => { ducked.current = !!(event as CustomEvent<boolean>).detail; element.volume = volumeLevel.current * (ducked.current ? .2 : 1); };
    const trailer = (event: Event) => {
      trailerActive.current = !!(event as CustomEvent<boolean>).detail;
      if (trailerActive.current) {
        resumeAfterTrailer.current = requested.current;
        autoPending.current = false;
        stop();
        if (settings.current) settings.current.open = false;
      } else {
        const resume = resumeAfterTrailer.current;
        resumeAfterTrailer.current = false;
        if (resume && !document.hidden) void begin(false);
      }
    };
    const dismissSettings = (event: Event) => {
      if (event.target instanceof Node && !settings.current?.contains(event.target) && settings.current) settings.current.open = false;
    };
    const activate = (event: Event) => {
      if (!autoPending.current || requested.current) return;
      if (document.querySelector('.entry-gate[open]:not(.leaving)')) return;
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target instanceof Element && event.target.closest('.background-music')) return;
      void begin(true);
    };
    // Entry is complete only after the visitor skips or finishes the optional trailer.
    const enter = (event: Event) => { const music = !!(event as CustomEvent<boolean>).detail; if (!music) { autoPending.current = false; stop(); try { localStorage.setItem('lumara.music', 'off'); } catch { /* storage off */ } return; } autoPending.current = false; try { localStorage.setItem('lumara.music', 'on'); } catch { /* storage off */ } void begin(false); };
    window.addEventListener('lumara-enter', enter);
    window.addEventListener('lumara-voice', voice);
    window.addEventListener('lumara-trailer', trailer);
    document.addEventListener('pointerdown', dismissSettings);
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('pointerdown', activate, true);
    document.addEventListener('keydown', activate, true);
    document.addEventListener('touchstart', activate, true);
    if (autoPending.current && !document.querySelector('.entry-gate[open]:not(.leaving)')) void begin(true);
    return () => {
      requested.current = false;
      playRequest.current++;
      element.pause();
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('pointerdown', activate, true);
      document.removeEventListener('keydown', activate, true);
      document.removeEventListener('touchstart', activate, true);
      window.removeEventListener('lumara-voice', voice);
      window.removeEventListener('lumara-enter', enter);
      window.removeEventListener('lumara-trailer', trailer);
      document.removeEventListener('pointerdown', dismissSettings);
    };
  }, []);

  function toggle() {
    autoPending.current = false;
    const turningOff = requested.current;
    try { localStorage.setItem('lumara.music', turningOff ? 'off' : 'on'); } catch { /* storage off */ }
    if (turningOff) { stop(); return; }
    void begin(false);
  }

  const active = playing || loading;
  return <div className="background-music">
    <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/kenka.mp3`} loop preload="none"
      onPlaying={() => { if (!requested.current) { audio.current?.pause(); return; } autoPending.current = false; setPlaying(true); setLoading(false); }}
      onPause={() => setPlaying(false)}
      onError={() => { autoPending.current = false; stop(); setError('Music could not load. Press play to retry.'); }}/>
    {error && <p className="music-error" role="status">{error}</p>}
    <button className="music-toggle" onClick={toggle} aria-label={active ? 'Mute background music' : 'Play background music'} aria-pressed={active} title="Kenka — Kujira Yumemi feat. Mimizuku and Fukuro">
      {active ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>{loading ? 'Loading music…' : playing ? 'Music on' : 'Play music'}</span>
    </button>
    <details ref={settings} className="music-settings" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); }
    }}>
      <summary role="button" aria-label="Music volume" title="Adjust music volume"><SlidersHorizontal size={17} aria-hidden="true"/></summary>
      <div className="music-volume-panel">
        <label htmlFor="music-volume">Music volume <output htmlFor="music-volume">{volume}%</output></label>
        <input id="music-volume" aria-label="Music volume" type="range" min="0" max="100" step="1" value={volume} aria-valuetext={`${volume} percent`} onChange={event => {
          const value = Number(event.currentTarget.value);
          volumeLevel.current = value / 100;
          setVolume(value);
          if (audio.current) audio.current.volume = volumeLevel.current * (ducked.current ? .2 : 1);
          try { localStorage.setItem('lumara.music.volume', String(value)); } catch { /* storage off */ }
        }}/>
      </div>
    </details>
  </div>;
}
