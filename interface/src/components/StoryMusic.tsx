import { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';

const MUTE = 'lumara.storyMusicMuted', VOLUME = 'lumara.storyMusicVolume';
function preference() {
  try {
    const raw = localStorage.getItem(VOLUME), value = raw === null ? .18 : Number(raw);
    return { muted: localStorage.getItem(MUTE) === 'true', volume: Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : .18 };
  } catch { return { muted: false, volume: .18 }; }
}

/** Stays mounted across opening beats; leaves with the story before the wish. */
export default function StoryMusic({ speaking }: { speaking: boolean }) {
  const [muted, setMuted] = useState(() => preference().muted);
  const [volume, setVolume] = useState(() => preference().volume);
  const [open, setOpen] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const start = () => {
    if (!audio.current || mutedRef.current || document.hidden) return;
    void audio.current.play().catch(() => {});
  };
  useEffect(() => {
    const track = audio.current!;
    track.src = `${import.meta.env.BASE_URL}audio/kenka.mp3`;
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', visibility);
    start();
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('visibilitychange', visibility);
      track.pause(); track.currentTime = 0; track.removeAttribute('src'); track.load();
    };
  }, []);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.volume = volume * (speaking ? .3 : 1);
    if (muted) audio.current.pause(); else start();
  }, [volume, speaking, muted]);
  return <div className="sanctuary-music-control">
    <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/kenka.mp3`} loop preload="auto" data-story-music />
    <button type="button" className="game-icon" aria-label="Story music controls" aria-expanded={open} onClick={() => setOpen(!open)}>
      {muted ? <VolumeX size={18} /> : <Music2 size={18} />}
    </button>
    {open && <div className="sanctuary-music-panel" role="group" aria-label="Story music settings">
      <label htmlFor="story-volume">Music volume <output>{Math.round(volume * 100)}%</output></label>
      <input id="story-volume" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={event => {
        const next = Number(event.target.value) / 100; setVolume(next);
        try { localStorage.setItem(VOLUME, String(next)); } catch {}
      }} />
      <button type="button" className="sanctuary-music-toggle" onClick={() => {
        const next = !muted; setMuted(next); mutedRef.current = next;
        try { localStorage.setItem(MUTE, String(next)); } catch {}
      }}>{muted ? 'Play story music' : 'Mute story music'}</button>
      <button type="button" className="sanctuary-music-toggle" onClick={() => setOpen(false)}>Close music controls</button>
    </div>}
  </div>;
}
