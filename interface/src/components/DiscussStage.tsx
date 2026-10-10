import { Clock3, Sparkles } from 'lucide-react';
import type { Fragment, SpeakerState, UserId, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { finishTurn, NO_SPEAKER, reelFrames, speakerPool, spinSpeaker, startVow, turnChoices } from '../logic/speaker';
import SpeakerPanel, { type SpeakerMember } from './SpeakerPanel';
import TurnVowBox from './TurnVowBox';
import './speaker.css';

/** Resonance Hall (feature 3): spin → the chosen player brings one of their picks → the party discusses → the Warden turns it into a Vow. */
export default function DiscussStage({ speaker, meId, warden, busy, party, fragments, ownPicks, vows, onSpeaker, onChoose, onMakeVow, onTimer }: {
  speaker: SpeakerState | null; meId: UserId; warden: boolean; busy: boolean; party: SpeakerMember[]; fragments: Fragment[]; ownPicks: string[]; vows: Vow[];
  onSpeaker: (next: SpeakerState, frames?: UserId[]) => void; onChoose: (fragmentId: string) => void; onMakeVow: (text: string, ownerId: UserId | null) => void; onTimer: () => void;
}) {
  const s = speaker ?? NO_SPEAKER; const ids = party.map(p => p.userId);
  const current = party.find(p => p.userId === s.currentId); const thought = fragments.find(f => f.id === s.thoughtId);
  const canSpin = speakerPool(ids, s).length > 0;
  const spin = () => { const next = spinSpeaker(ids, s); if (next?.currentId) onSpeaker(next, reelFrames(ids, next.currentId)); };
  const cat = (f: Fragment) => CATEGORIES.find(c => c.id === f.category);
  const choices = turnChoices(fragments, ownPicks, s.discussed); const fromOwn = choices.some(f => ownPicks.includes(f.id));
  return <div className="discuss-stage">
    <div className="stage-intro"><h3>Make room for the conversation.</h3><p>The chosen player brings one of their picks, the party talks it through, and the Warden turns it into a Vow.</p></div>
    <section className="turn-card" aria-live="polite">
      {!current ? <p className="turn-idle">{canSpin ? (warden ? 'Spin to choose who speaks next.' : 'Your Warden will spin for the next speaker.') : 'Everyone has had a turn.'}</p>
        : s.phase === 'choosing' ? (current.userId === meId
          ? <div className="turn-chooser"><h4>Your turn — choose a thought to discuss</h4><p>{fromOwn ? 'From the thoughts you picked.' : 'None of your picks are left — choose any thought.'}</p>
              <ul>{choices.map(f => <li key={f.id}><button disabled={busy} onClick={() => onChoose(f.id)}><span className={`category-label ${f.category}`}>{cat(f)?.label}</span>{f.text}</button></li>)}</ul></div>
          : <p className="turn-idle">{current.name} is choosing a thought…</p>)
        : thought && <article key={thought.id} className="hall-fragment turn-thought"><Sparkles size={24} strokeWidth={1} /><span className={`category-label ${thought.category}`}>{cat(thought)?.label} · {cat(thought)?.plain}</span><p>{thought.text}</p><span>{current.name} brought this thought</span></article>}
      {current && s.phase === 'vow' && (warden
        ? <TurnVowBox key={s.thoughtId ?? ''} thought={thought?.text ?? ''} party={party} busy={busy} onMake={onMakeVow} onSkip={() => onSpeaker(finishTurn(s))} />
        : <p className="turn-idle">The Warden is writing a Vow…</p>)}
    </section>
    {warden && <div className="hall-controls">
      {!current && <button className="speaker-spin" disabled={busy || !canSpin} onClick={spin}>Spin</button>}
      {current && s.phase === 'choosing' && <button disabled={busy || !canSpin} onClick={spin}>Spin again</button>}
      {current && s.phase === 'discussing' && <button className="speaker-spin" disabled={busy} onClick={() => onSpeaker(startVow(s))}>Done discussing</button>}
      <button disabled={busy} onClick={onTimer}><Clock3 size={16} />3-minute timer</button>
    </div>}
    <SpeakerPanel party={party} speaker={s} warden={warden} busy={busy} onChange={onSpeaker} />
    {vows.length > 0 && <section className="turn-vows" aria-label="Vows made this voyage"><h4>Vows so far</h4><ul>{vows.map(v => <li key={v.id}>{v.text}</li>)}</ul></section>}
  </div>;
}
