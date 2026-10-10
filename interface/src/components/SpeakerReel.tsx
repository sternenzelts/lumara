import { useEffect, useState } from 'react';
import type { Backend, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { useReducedMotion } from '../hooks';
import { Art } from './ui';
import './speaker.css';

type Member = { userId: UserId; name: string; characterId: string | null };
/** The roulette every screen plays at the same moment when the Warden spins (cue topic 'speaker'). */
export default function SpeakerReel({ backend, sessionId, party }: { backend: Backend; sessionId: string; party: Member[] }) {
  const [frames, setFrames] = useState<UserId[] | null>(null); const [i, setI] = useState(0); const reduced = useReducedMotion();
  useEffect(() => backend.on('speaker', data => {
    const d = data as { sessionId?: string; frames?: UserId[] };
    if (d?.sessionId === sessionId && Array.isArray(d.frames) && d.frames.length) { setFrames(d.frames); setI(reduced ? d.frames.length - 1 : 0); }
  }), [backend, sessionId, reduced]);
  useEffect(() => {
    if (!frames) return;
    if (i >= frames.length - 1) { const t = setTimeout(() => setFrames(null), 1800); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), 70 + i * 18); return () => clearTimeout(t);   // slows down like a reel
  }, [frames, i]);
  if (!frames) return null;
  const m = party.find(p => p.userId === frames[i]); const landed = i >= frames.length - 1;
  return <div className={`speaker-reel${landed ? ' landed' : ''}`} role="status" aria-live="polite">
    <Art character={characterById(m?.characterId)} kind="cutout" decorative /><strong>{m?.name ?? '…'}</strong>{landed && <span>speaks next</span>}
  </div>;
}
