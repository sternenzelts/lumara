import { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';

const MUTED_KEY = 'lumara.titleMusicMuted';
const rememberedMute = () => { try { return localStorage.getItem(MUTED_KEY) === 'true'; } catch { return false; } };

/** Mounted only on #title. Navigation unmounts and resets the track. */
export default function TitleMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const wantsMusic = useRef(!rememberedMute());
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = () => {
    const track = audio.current;
    if (!track || !wantsMusic.current || document.hidden) return;
    track.volume = .25;
    void track.play().catch(() => { /* Autoplay can require a tap. The music button stays available. */ });
  };

  useEffect(() => {
    const track = audio.current!;
    track.src = `${import.meta.env.BASE_URL}audio/kenka.mp3`;
    const unlock = (event: Event) => {
      if (event.target instanceof Node && control.current?.contains(event.target)) return;
      if (track.paused && wantsMusic.current) start();
    };
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    start();
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
      track.pause();
      track.currentTime = 0;
      track.removeAttribute('src');
      track.load();
    };
  }, []);

  const toggle = () => {
    const track = audio.current;
    if (!track) return;
    wantsMusic.current = !playing;
    try { localStorage.setItem(MUTED_KEY, String(!wantsMusic.current)); } catch { /* Preference storage is optional. */ }
    if (wantsMusic.current) {
      if (failed) { setFailed(false); track.load(); }
      start();
    } else track.pause();
  };
  return <>
    <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/kenka.mp3`} loop preload="none"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setFailed(true); }} />
    <button ref={control} className="game-icon" aria-label={failed ? 'Retry title music' : playing ? 'Mute title music' : 'Play title music'} aria-pressed={playing}
      title={`${playing ? 'Mute' : 'Play'} title music: Kenka — Kujira Yumemi feat. Mimizuku and Fukuro`} onClick={toggle}>
      {playing ? <Music2 size={18} /> : <VolumeX size={18} />}
    </button>
  </>;
}
