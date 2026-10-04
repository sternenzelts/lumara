import { canPlayReveal } from '../hooks';
import { useEffect, useRef, useState } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { characterById, type CharacterDef } from '../data/characters';
import { createAyakaRuntime, type AyakaRuntime } from './reveal/ayaka-runtime.js';
import './ayaka-reveal.css';
const ART = `${import.meta.env.BASE_URL}art/ayaka/`;
const AUDIO = `${import.meta.env.BASE_URL}audio/ayaka-reveal/`;
export default function AyakaReveal({ onDone, character = characterById('ayaka')!, autoAdvance = false, onSkip }: { onDone: () => void; character?: CharacterDef; autoAdvance?: boolean; onSkip?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<AyakaRuntime | null>(null);
  const [level, setLevel] = useState(0);
  const [finished, setFinished] = useState(false);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (!finished || !autoAdvance || character.grade !== 'A') return;
    const timer = setTimeout(() => done.current(), 1400);
    return () => clearTimeout(timer);
  }, [finished, autoAdvance, character.grade]);
  const reduced = !canPlayReveal();   // only a browser that can't draw skips; 'reduce motion' PCs still get the full reveal (Jay, 2026-10-04)
  const isAyaka = character.id === 'ayaka';
  const pose = isAyaka ? `${ART}reveal-timestop.webp` : character.art.cutout || character.art.splash;
  const theme = isAyaka ? `${ART}reveal-theme.mp3` : character.id === 'mahesvara' ? `${import.meta.env.BASE_URL}art/mahesvara/reveal-theme.mp3` : undefined;
  useEffect(() => {
    if (reduced) { setFinished(true); return; }
    const engine = createAyakaRuntime(host.current!, () => setFinished(true), {grade:character.grade, ayaka:isAyaka, theme});
    runtime.current = engine; setLevel(engine.getLevel());
    if (reduced) engine.skip(); else void engine.replay();
    return () => { engine.dispose(); runtime.current = null; };
  }, [reduced, character.id]);
  const awaitingClick = finished && autoAdvance && character.grade !== 'A';
  useEffect(() => { if (awaitingClick) host.current?.focus({ preventScroll: true }); }, [awaitingClick]);
  return <div ref={host} className={`ayaka-cinematic ${awaitingClick ? 'reveal-awaiting-click' : ''}`} aria-label={`${character.name} character reveal`} tabIndex={awaitingClick ? 0 : undefined} onClick={event => {
    if (awaitingClick && !(event.target as Element).closest('button,input')) done.current();
  }} onKeyDown={event => {
    if (awaitingClick && (event.key === 'Enter' || event.key === ' ') && !(event.target as Element).closest('button,input')) { event.preventDefault(); done.current(); }
  }}>
    <div data-reveal="stage">
      <img data-reveal="bg" src={`${ART}reveal-bg.webp`} data-audio-base={AUDIO} data-ayaka-base={ART} data-pull-music={`${import.meta.env.BASE_URL}audio/pull_music.mp3`} alt="" />
      <img data-reveal="crystal" src={`${ART}reveal-crystal.webp`} hidden alt="" />
      <canvas data-reveal="fx" aria-hidden="true" />
      <img data-reveal="splash" className="art" src={character.art.splash} alt="" />
      <img data-reveal="throne" className="art" src={isAyaka ? `${ART}reveal-throne.webp` : pose} alt="" />
      <img data-reveal="timestop" className="art" src={pose} style={reduced ? {opacity:1, transform:'translateX(-30%)'} : undefined} alt="" />
      <canvas data-reveal="fx2" aria-hidden="true" />
      <div data-reveal="flash" /><div data-reveal="vignette" />
      <div data-reveal="caption" aria-live="polite" />
      <div data-reveal="card" style={reduced ? {opacity:1,transform:'none'} : undefined}><span className="grade">{character.grade} · {character.grade === 'S++' ? 'LEGENDARY' : character.grade === 'S+' ? 'PREMIUM' : 'COMPANION'}</span><h1>{character.name.toUpperCase()}</h1><div className="sub">{isAyaka ? 'Ice · Time — The Frozen Hour' : `${character.element}${character.title ? ` — ${character.title}` : ''}`}</div><div className="line" /></div>
    </div>
    <button data-reveal="sound" type="button" data-level={['on','low','off'][level]} aria-label={`${['Sound on','Sound low','Muted'][level]} (click to change)`} onClick={() => setLevel(runtime.current?.cycleSound() ?? (level + 1) % 3)}>{level === 0 ? <Volume2 /> : level === 1 ? <Volume1 /> : <VolumeX />}<span>{['Sound','Low','Muted'][level]}</span></button>
    <div data-reveal="ui"><button onClick={() => { setFinished(false); if(reduced) setFinished(true); else void runtime.current?.replay(); }}>Replay</button><button onClick={() => onSkip ? onSkip() : runtime.current?.skip()}>{onSkip ? 'Skip A reveals' : 'Skip'}</button>{finished && !autoAdvance && <button onClick={onDone}>Continue</button>}</div>
  </div>;
}
