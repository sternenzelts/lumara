import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, FastForward, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Art } from '../components/ui';
import NicknamePanel from '../components/NicknamePanel';
import StoryMusic from '../components/StoryMusic';
import { characterById } from '../data/characters';
import { BEACONS, WORLD, worldArt } from '../data/world';
import { useReducedMotion } from '../hooks';
import { readSerenMuted, saveSerenMuted } from '../logic/voice';
import { BEAT_FACE, BEAT_VOICE, beatsFor, canSkip, type Beat, type OpeningKind } from '../logic/opening';
import './opening.css';

const LINES: Record<Beat, (name: string) => string> = {
  welcome: () => 'Welcome to Lumara! I’ve been waiting for you. What should I call you?',
  nickname: () => '',
  greeted: name => `Nice to meet you, ${name}!`,
  scene1: () => 'Long ago, the Dimming put out the beacons of Lumara, one by one.',
  scene2: () => 'After every voyage, we gather here to reflect. Your thoughts stay anonymous — so be honest.',
  call: () => "First, let?s see who answers your call today!",
  scene3: () => 'And every promise we keep brings a little light back to the world.',
};
const art = (file: string) => `${import.meta.env.BASE_URL}art/seren/${file}`;
const RELIT = BEACONS[0];

export default function Opening({ kind, accountName, onNickname, onDone, onSkipStory }: {
  kind: OpeningKind; accountName: string; onNickname: (name: string) => Promise<void>; onDone: () => void; onSkipStory: () => void;
}) {
  const beats = beatsFor(kind);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const [muted, setMuted] = useState(readSerenMuted);
  const [typed, setTyped] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(() => { try { return localStorage.getItem('lumara.motionPaused') === 'true'; } catch { return false; } });
  const reduced = useReducedMotion() || paused;
  const clip = useRef<HTMLAudioElement | null>(null);
  const voiceBlocked = useRef(false);
  const unlockedThisTap = useRef(false);
  const beat = beats[index];
  const text = LINES[beat](name);
  const face = BEAT_FACE[beat];
  const story = beat.startsWith('scene');

  useEffect(() => {
    clip.current?.pause(); clip.current = null;
    setSpeaking(false);
    voiceBlocked.current = false; unlockedThisTap.current = false;
    const id = BEAT_VOICE[beat];
    if (!id || muted || document.hidden) return;
    let retry: (() => void) | null = null;
    try {
      const audio = new Audio(`${import.meta.env.BASE_URL}art/seren/voice/ja/seren_vo_${id}.mp3`);
      audio.volume = .7; clip.current = audio;
      audio.onplaying = () => { if (clip.current === audio) setSpeaking(true); };
      audio.onended = audio.onpause = () => { if (clip.current === audio) setSpeaking(false); };
      audio.play()?.catch(() => {
        // Arriving by link means no tap yet, so the browser blocks sound; replay this line on the first tap.
        if (clip.current !== audio) return;
        voiceBlocked.current = true;
        retry = () => {
          if (clip.current !== audio) return;
          unlockedThisTap.current = true;
          voiceBlocked.current = false;
          audio.play()?.catch(() => { voiceBlocked.current = true; });
        };
        document.addEventListener('pointerdown', retry, { once: true, capture: true });
        document.addEventListener('keydown', retry, { once: true, capture: true });
      });
    } catch { /* Audio unavailable: the text carries the line. */ }
    return () => { if (retry) { document.removeEventListener('pointerdown', retry, { capture: true }); document.removeEventListener('keydown', retry, { capture: true }); } };
  }, [beat, muted]);
  useEffect(() => {
    const hide = () => { if (document.hidden) clip.current?.pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); clip.current?.pause(); };
  }, []);
  useEffect(() => {
    if (reduced) { setTyped(text.length); return; }
    setTyped(0);
    const timer = setInterval(() => setTyped(n => { if (n >= text.length) { clearInterval(timer); return n; } return n + 1; }), 28);
    return () => clearInterval(timer);
  }, [text, reduced]);

  const advance = () => {
    // A tap that unlocks browser audio should let the welcome finish, rather than skip it.
    if (unlockedThisTap.current) { unlockedThisTap.current = false; setTyped(text.length); return; }
    if (voiceBlocked.current && clip.current) {
      voiceBlocked.current = false;
      clip.current.play()?.catch(() => { voiceBlocked.current = true; });
      setTyped(text.length); return;
    }
    if (typed < text.length) { setTyped(text.length); return; }
    if (index + 1 < beats.length) setIndex(index + 1); else onDone();
  };
  const toggleMute = () => {
    const next = !muted; setMuted(next); saveSerenMuted(next);
  };
  const focus = beat === 'scene2' ? WORLD.sanctuary : beat === 'scene3' ? RELIT : null;

  return <div className={`opening opening-${beat} ${story ? 'opening-story' : 'opening-naming'} ${paused ? 'opening-still' : ''}`} data-beat={beat}
    onClick={e => { if (beat !== 'nickname' && beat !== 'call' && !(e.target as HTMLElement).closest('button,form')) advance(); }}>
    <div className="opening-world" aria-hidden="true">
      <div className="opening-canvas" style={{ '--fx': `${focus?.x ?? 50}%`, '--fy': `${focus?.y ?? 50}%` } as CSSProperties}>
        <img src={worldArt(WORLD.image)} alt="" />
        <span className="opening-aurelis" style={{ left: `${WORLD.sanctuary.x}%`, top: `${WORLD.sanctuary.y}%` }} />
        {BEACONS.map(b => <span key={b.id} className={`opening-beacon ${b.id === RELIT.id ? 'relit' : ''}`}
          style={{ left: `${b.x}%`, top: `${b.y}%`, '--i': b.index, '--nation': b.nation.color } as CSSProperties} />)}
      </div>
      <div className="opening-shade" />
    </div>
    <div className="game-screen-frame" aria-hidden="true" />
    <div className="opening-controls"><StoryMusic speaking={speaking} /><button className="game-icon" aria-label={paused ? 'Resume motion' : 'Pause motion'} onClick={() => { const next = !paused; setPaused(next); try { localStorage.setItem('lumara.motionPaused', String(next)); } catch {} }}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
      <button type="button" className="game-icon" aria-label={muted ? 'Unmute Seren' : 'Mute Seren'} aria-pressed={!muted} onClick={toggleMute}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      {BEAT_VOICE[beat] && !muted && <button type="button" className="game-icon" aria-label="Replay Seren's line" onClick={() => {
        unlockedThisTap.current = false;
        if (clip.current) { clip.current.currentTime = 0; clip.current.play()?.catch(() => { voiceBlocked.current = true; }); }
      }}><Play size={18} /></button>}
      {canSkip(beat) && <button type="button" className="opening-skip" aria-label="Skip story" onClick={() => setIndex(beats.indexOf('call'))}><span>Skip</span><FastForward size={15} /></button>}
    </div>
    {!story && <Art character={characterById('seren')} kind="cutout" className="game-seren opening-seren" decorative />}
    {beat === 'nickname'
      ? <section className="opening-name-frame" aria-label="Choose your name"><NicknamePanel initial={accountName.split(/\s+/)[0] || ''} accountName={accountName}
          onSubmit={async value => { await onNickname(value); setName(value); setIndex(index + 1); }} /></section>
      : <section className="game-dialogue opening-dialogue" aria-live="polite">
          {face && <img className="opening-face" src={art(`seren_face_${face}.webp`)} alt="" />}
          <div><div className="game-speaker"><strong>Seren</strong><span>Keeper of the dawn</span></div>
            <p><span className="sr-only">{text}</span><span aria-hidden="true">{text.slice(0, typed)}</span></p></div>
          <button type="button" className={beat === 'call' ? 'opening-call-button game-action' : beat === 'welcome' ? 'opening-name-action game-action' : 'opening-next'} aria-label={beat === 'call' ? 'Go to the Banner' : beat === 'welcome' ? 'Choose your name' : 'Continue'} onClick={beat === 'call' ? onDone : beat === 'welcome' ? () => setIndex(index + 1) : advance}>{beat === 'call' ? 'Go to the Banner' : beat === 'welcome' ? <>Choose your name<ChevronDown size={18} /></> : <ChevronDown size={20} />}</button>
        </section>}
  </div>;
}
