import { Sparkles } from 'lucide-react';
import type { Fragment, SpeakerState, UserId, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { finishTurn, nextThought, NO_SPEAKER, reelFrames, speakerPool, spinSpeaker, startVow, turnChoices } from '../logic/speaker';
import SpeakerPanel, { type SpeakerMember } from './SpeakerPanel';
import TurnVowBox from './TurnVowBox';
import './speaker.css';

/** Resonance Hall (feature 3): spin → the chosen player brings their picks one at a time → the party discusses each → the Warden turns it into a Vow → the Warden finishes the turn. */
export default function DiscussStage({ speaker, meId, warden, busy, party, fragments, ownPicks, vows, onSpeaker, onChoose, onMakeVow }: {
  speaker: SpeakerState | null; meId: UserId; warden: boolean; busy: boolean; party: SpeakerMember[]; fragments: Fragment[]; ownPicks: string[]; vows: Vow[];
  onSpeaker: (next: SpeakerState, frames?: UserId[]) => void; onChoose: (fragmentId: string) => void; onMakeVow: (text: string, ownerId: UserId | null) => void;
}) {
  const s = speaker ?? NO_SPEAKER; const ids = party.map(p => p.userId);
  const current = party.find(p => p.userId === s.currentId); const thought = fragments.find(f => f.id === s.thoughtId);
  const canSpin = speakerPool(ids, s).length > 0;
  const spin = () => { const next = spinSpeaker(ids, s); if (next?.currentId) onSpeaker(next, reelFrames(ids, next.currentId)); };
  const cat = (f: Fragment) => CATEGORIES.find(c => c.id === f.category);
  const turnDone = s.turnDone ?? []; const choices = turnChoices(fragments, ownPicks, s.discussed, turnDone); const fromOwn = choices.some(f => ownPicks.includes(f.id));
  return <div className="discuss-stage">
    <div className="stage-intro"><h3>Make room for the conversation.</h3><p>The chosen player brings their picks one at a time, the party talks each through, and the Warden turns it into a Vow.</p></div>
    <section className="turn-card" aria-live="polite">
      {!current ? <p className="turn-idle">{canSpin ? (warden ? 'Spin to choose who speaks next.' : 'Your Warden will spin for the next speaker.') : 'Everyone has had a turn.'}</p>
        : s.phase === 'choosing' ? (current.userId === meId
          ? !choices.length ? <p className="turn-idle">That’s all your picks. Your Warden will finish your turn.</p>
          : <div className="turn-chooser"><h4>{turnDone.length ? 'Choose your next thought to discuss' : 'Your turn — choose a thought to discuss'}</h4><p>{fromOwn ? 'From the thoughts you picked.' : 'You didn’t pick any thoughts — choose any one.'}</p>
              <ul>{choices.map(f => <li key={f.id}><button disabled={busy} onClick={() => onChoose(f.id)}><span className="turn-choice-tags"><span className={`category-label ${f.category}`}>{cat(f)?.label}</span>{s.discussed.includes(f.id) && <span className="turn-discussed">Discussed</span>}</span>{f.text}</button></li>)}</ul></div>
          : <p className="turn-idle">{current.name} is choosing a thought…</p>)
        : thought && <article key={thought.id} className="hall-fragment turn-thought"><Sparkles size={24} strokeWidth={1} /><span className={`category-label ${thought.category}`}>{cat(thought)?.label} · {cat(thought)?.plain}</span><p>{thought.text}</p><span>{current.name} brought this thought</span></article>}
      {current && s.phase === 'vow' && (warden
        ? <TurnVowBox key={s.thoughtId ?? ''} thought={thought?.text ?? ''} party={party} busy={busy} onMake={onMakeVow} onSkip={() => onSpeaker(nextThought(s))} />
        : <p className="turn-idle">The Warden is writing a Vow…</p>)}
    </section>
    {warden && <div className="hall-controls">
      {!current && <button className="speaker-spin" disabled={busy || !canSpin} onClick={spin}>Spin</button>}
      {current && s.phase === 'choosing' && (turnDone.length
        ? <button className="speaker-spin" disabled={busy} onClick={() => onSpeaker(finishTurn(s))}>Finish turn</button>
        : <button disabled={busy || !canSpin} onClick={spin}>Spin again</button>)}
      {current && s.phase === 'discussing' && <button className="speaker-spin" disabled={busy} onClick={() => onSpeaker(startVow(s))}>Done discussing</button>}
    </div>}
    <SpeakerPanel party={party} speaker={s} warden={warden} busy={busy} onChange={onSpeaker} />
    {vows.length > 0 && <section className="turn-vows" aria-label="Vows made this voyage"><h4>Vows so far</h4><ul>{vows.map(v => <li key={v.id}>{v.text}</li>)}</ul></section>}
  </div>;
}
