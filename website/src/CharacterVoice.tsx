import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, AudioLines } from 'lucide-react';
import voices from './voice-lines.json';

type VoiceLine = { file: string; caption: string };
export default function CharacterVoice({ id, name }: { id: string; name: string }) {
  const lines = (voices as Record<string, VoiceLine[]>)[id] || [];
  const audio = useRef<HTMLAudioElement | null>(null);
  const next = useRef(0);
  const generation = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  function stop() {
    generation.current++;
    audio.current?.pause();
    audio.current = null;
    setPlaying(false);
    window.dispatchEvent(new CustomEvent('lumara-voice', { detail: false }));
  }
  useEffect(() => {
    const interrupt = () => stop();
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('lumara-voice-stop', interrupt);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('lumara-voice-stop', interrupt); document.removeEventListener('visibilitychange', visibility); stop(); };
  }, [id]);
  async function speak() {
    window.dispatchEvent(new Event('lumara-voice-stop'));
    const token = ++generation.current;
    const line = lines[next.current++ % lines.length];
    const element = new Audio(`${import.meta.env.BASE_URL}audio/voices/${id}/${line.file}`);
    element.volume = .85;
    audio.current = element;
    setCaption(line.caption); setError(''); setPlaying(true);
    window.dispatchEvent(new CustomEvent('lumara-voice', { detail: true }));
    element.onended = () => { if (token === generation.current) stop(); };
    element.onerror = () => { if (token === generation.current) { stop(); setError('Voice could not load. Please try again.'); } };
    try { await element.play(); if (token !== generation.current) element.pause(); }
    catch { if (token === generation.current) { stop(); setError('Voice could not play. Please try again.'); } }
  }
  return <div className={`character-voice ${playing ? 'is-speaking' : ''}`}>
    <div className="voice-actions"><button className="voice-button" disabled={!lines.length} onClick={speak} aria-label={lines.length ? `Hear ${name}'s voice${playing ? ', next line' : ''}` : `${name}'s voice is not yet available`}><Volume2 size={18}/><span>{lines.length ? playing ? 'Hear another line' : 'Hear their voice' : 'Voice coming later'}</span>{playing && <AudioLines size={18}/>}</button>{playing && <button className="voice-stop icon-button" onClick={stop} aria-label={`Stop ${name}'s voice`}><Square size={14}/></button>}</div>
    <p className="voice-caption" aria-live="polite">{error || caption || (lines.length ? 'Japanese voice · English subtitles' : '')}</p>
  </div>;
}
