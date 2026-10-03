import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { PullRecord } from '../backend/types';
import { characterById } from '../data/characters';
import { Art, Button, GradeBadge } from './ui';
import AyakaReveal from './AyakaReveal';
import { beginReveal } from '../logic/revealActivity';
import { nextRevealIndex } from '../logic/pullPresentation';
import './pull-sequence.css';

export interface RevealCue { records: PullRecord[]; name: string; sessionId?: string; cueId: string; preview?: boolean; tutorial?: boolean }
export default function PullReveal({ cue, onClose }: { cue: RevealCue; onClose: () => void }) {
  useEffect(beginReveal, []);
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const record = cue.records[index];
  const character = characterById(record?.characterId);
  const summary = index >= cue.records.length;
  const advance = () => {
    if (cue.preview) onClose();
    else setIndex(current => nextRevealIndex(cue.records, current, premiumOnly));
  };
  const skipCommon = () => {
    setPremiumOnly(true);
    if (record?.grade === 'A') setIndex(current => nextRevealIndex(cue.records, current, true));
  };
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') || []).filter(item => !item.hidden && item.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); old?.focus(); };
  }, [onClose]);
  useEffect(() => { if (summary) ref.current?.querySelector<HTMLButtonElement>('.batch-reveal button')?.focus(); }, [summary]);
  return createPortal(<div ref={ref} onDoubleClickCapture={event => {
    if (!summary && !cue.preview && !(event.target as Element).closest('button,input')) setIndex(cue.records.length);
  }} className={`pull-overlay beat-${summary ? 'reveal' : 'ayaka'} rarity-${record?.grade.replaceAll('+', 'plus') || 'A'}`} role="dialog" aria-modal="true" aria-label={`${cue.name}'s character reveal`} style={{ '--accent': record?.grade === 'A' ? '#8b63b6' : character?.accent || '#987a3b' } as CSSProperties}>
    <button ref={closeRef} className="icon-button reveal-close" aria-label="Close reveal" onClick={onClose}><X /></button>
    {!summary && cue.records.length > 1 && <div className="pull-sequence-progress" role="status" aria-label={`Wish ${index + 1} of ${cue.records.length}`}>{index + 1} / {cue.records.length}</div>}
    {!summary ? <AyakaReveal key={`${cue.cueId}-${index}`} character={character} onDone={advance} autoAdvance={!cue.preview} onSkip={cue.preview ? undefined : skipCommon} /> : <div className="batch-reveal"><h2>Your new companions</h2><p>{cue.name}'s {cue.records.length}-wish reveal</p><div className="batch-cards">{cue.records.map((result, i) => <div key={i} className={`result-${result.grade.replaceAll('+', 'plus')}`} style={{ '--delay': `${i * 70}ms` } as CSSProperties}><Art character={characterById(result.characterId)} /><GradeBadge grade={result.grade} /><strong>{characterById(result.characterId)?.name}</strong><small>{result.duplicate ? 'Duplicate - Stardust' : 'New companion'}</small></div>)}</div><Button onClick={onClose}>Done</Button></div>}
  </div>, document.body);
}
