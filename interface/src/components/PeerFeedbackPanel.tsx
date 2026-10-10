import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import type { PeerScores, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { PEER_TRAITS } from '../data/feedback';
import { Art } from './ui';
import './feedback.css';

type Ally = { userId: UserId; name: string; characterId: string | null };
/** Peer Feedback (feature 2): pick an ally, rate all five traits, "Save & next ally". Ratings are anonymous and editable until the voyage ends. */
export default function PeerFeedbackPanel({ allies, mine, busy, onSave }: { allies: Ally[]; mine: Record<UserId, PeerScores>; busy: boolean; onSave: (targetId: UserId, scores: PeerScores) => Promise<boolean> }) {
  const [target, setTarget] = useState<UserId | null>(allies.find(a => !mine[a.userId])?.userId ?? allies[0]?.userId ?? null);
  const [draft, setDraft] = useState<Partial<PeerScores>>(target ? mine[target] ?? {} : {});
  useEffect(() => { setDraft(target ? mine[target] ?? {} : {}); }, [target, mine]);
  if (!allies.length) return <section className="peer-panel" aria-label="Peer feedback"><header><h3>Peer Feedback</h3><p>No allies to rate yet.</p></header></section>;
  const complete = PEER_TRAITS.every(t => draft[t.key]);
  const save = async () => {
    if (!target || !complete || !(await onSave(target, draft as PeerScores))) return;
    const order = allies.map(a => a.userId); const at = order.indexOf(target);
    const next = [...order.slice(at + 1), ...order.slice(0, at)].find(u => !mine[u]); if (next) setTarget(next);
  };
  return <section className="peer-panel" aria-label="Peer feedback">
    <header><h3>Peer Feedback</h3><p>Anonymous: nobody, not even your Warden, sees who gave which stars.</p></header>
    <div className="peer-chips" role="group" aria-label="Allies">{allies.map(a => <button key={a.userId} type="button" aria-pressed={a.userId === target} aria-label={mine[a.userId] ? `${a.name} · rated` : a.name} onClick={() => setTarget(a.userId)}>
      <Art character={characterById(a.characterId)} kind="cutout" decorative /><span>{a.name}</span>{mine[a.userId] && <Check size={14} className="peer-done" />}</button>)}</div>
    {target && <div className="peer-traits">{PEER_TRAITS.map(t => <div key={t.key} className="peer-trait"><div><strong><span aria-hidden="true">{t.icon}</span> {t.title}</strong><small>{t.hint}</small></div>
      <div className="peer-stars" role="radiogroup" aria-label={t.title}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={draft[t.key] === n} aria-label={`${t.title}: ${n} of 5 stars`} className={(draft[t.key] ?? 0) >= n ? 'lit' : ''} onClick={() => setDraft(d => ({ ...d, [t.key]: n }))}><Star size={20} /></button>)}</div></div>)}</div>}
    <button className="feedback-save" disabled={busy || !complete} onClick={() => void save()}>Save &amp; next ally</button>
  </section>;
}
