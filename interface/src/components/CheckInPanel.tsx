import { useEffect, useState } from 'react';
import type { CheckIn } from '../backend/types';
import type { CharacterDef } from '../data/characters';
import { CHECKIN_QUESTIONS } from '../data/feedback';
import { Art } from './ui';
import './feedback.css';

type Picks = { sat: number | null; growth: number | null };
/** Lobby Self Check-In (feature 1): choose this voyage's companion, rate both questions, Finalize. Editable until the voyage starts. */
export default function CheckInPanel({ owned, companionId, saved, busy, onSave }: { owned: CharacterDef[]; companionId: string | null; saved: CheckIn | null; busy: boolean; onSave: (companionId: string, sat: number, growth: number) => void }) {
  const [companion, setCompanion] = useState(companionId);
  const [picks, setPicks] = useState<Picks>({ sat: saved?.sat ?? null, growth: saved?.growth ?? null });
  useEffect(() => { setCompanion(companionId); }, [companionId]);
  useEffect(() => { setPicks({ sat: saved?.sat ?? null, growth: saved?.growth ?? null }); }, [saved?.sat, saved?.growth]);
  const ready = companion !== null && picks.sat !== null && picks.growth !== null;
  return <section className="checkin-panel" aria-label="Self check-in">
    <header><h3>Before we set sail</h3><p>Pick your companion and check in. Answers stay private until Homecoming, when the party sees team averages and your Warden sees each answer.</p></header>
    <fieldset><legend>Voyage companion</legend>{owned.length
      ? <div className="checkin-companions" role="radiogroup" aria-label="Voyage companion">{owned.map(c => <button key={c.id} type="button" role="radio" aria-checked={companion === c.id} aria-label={c.name} className={companion === c.id ? 'on' : ''} onClick={() => setCompanion(c.id)}><Art character={c} kind="cutout" decorative /><span>{c.name}</span></button>)}</div>
      : <p>You have no companions yet. Make a wish at the banner first.</p>}</fieldset>
    {CHECKIN_QUESTIONS.map(q => <fieldset key={q.key}><legend><span aria-hidden="true">{q.icon}</span> {q.title}</legend><p>{q.ask}</p>
      <div className="checkin-scale" role="radiogroup" aria-label={q.title}>{q.labels.map((label, i) => { const v = i + 1; const on = picks[q.key] === v;
        return <button key={v} type="button" role="radio" aria-checked={on} aria-label={`${v} · ${label}`} className={on ? 'on' : ''} onClick={() => setPicks(p => ({ ...p, [q.key]: v }))}><strong>{v}</strong><span>{label}</span></button>; })}</div>
    </fieldset>)}
    <div className="checkin-actions"><button className="feedback-save" disabled={busy || !ready} onClick={() => { if (companion && picks.sat !== null && picks.growth !== null) onSave(companion, picks.sat, picks.growth); }}>{saved ? 'Update check-in' : 'Finalize check-in'}</button></div>
  </section>;
}
