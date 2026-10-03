import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);
  const autoPending = useRef(true);
  const ducked = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function stop() {
    requested.current = false;
    audio.current?.pause();
    setPlaying(false);
    setLoading(false);
  }

  async function begin(automatic: boolean) {
    const element = audio.current;
    if (!element || requested.current) return;
    if (element.error) element.load();
    requested.current = true;
    element.volume = ducked.current ? .05 : .25;
    setError('');
    setLoading(true);
    try {
      await element.play();
      if (!requested.current) element.pause();
      else autoPending.current = false;
    } catch (reason) {
      const name = reason instanceof DOMException ? reason.name : '';
      if (!requested.current || name === 'AbortError') return;
      stop();
      if (automatic && name === 'NotAllowedError') return;
      autoPending.current = false;
      setError('Music could not play. Press play to retry.');
    }
  }

  useEffect(() => {
    const element = audio.current!;
    element.volume = 0.25;
    const hide = () => { if (document.hidden && requested.current) { autoPending.current = false; stop(); } };
    const voice = (event: Event) => { ducked.current = !!(event as CustomEvent<boolean>).detail; element.volume = ducked.current ? .05 : .25; };
    const activate = (event: Event) => {
      if (!autoPending.current || requested.current) return;
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target instanceof Element && event.target.closest('.background-music')) return;
      void begin(true);
    };
    window.addEventListener('lumara-voice', voice);
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('pointerdown', activate, true);
    document.addEventListener('keydown', activate, true);
    void begin(true);
    return () => {
      requested.current = false;
      element.pause();
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('pointerdown', activate, true);
      document.removeEventListener('keydown', activate, true);
      window.removeEventListener('lumara-voice', voice);
    };
  }, []);

  function toggle() {
    autoPending.current = false;
    if (requested.current) { stop(); return; }
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
  </div>;
}
