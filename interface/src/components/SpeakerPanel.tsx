import type { SpeakerState, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { addBack, skipSpeaker, speakerCounts, speakerMark, type SpeakerMark } from '../logic/speaker';
import { Art } from './ui';
import './speaker.css';

export type SpeakerMember = { userId: UserId; name: string; characterId: string | null };
const MARK: Record<SpeakerMark, string> = { speaking: 'Speaking', spoken: 'Spoken', skipped: 'Skipped', waiting: 'Waiting' };
/** The party's turns: who has spoken, who is waiting, who was skipped. The Warden can skip an absent player or add them back. */
export default function SpeakerPanel({ party, speaker, warden, busy, onChange }: { party: SpeakerMember[]; speaker: SpeakerState | null; warden: boolean; busy: boolean; onChange: (next: SpeakerState) => void }) {
  const { spoken, remaining } = speakerCounts(party.map(p => p.userId), speaker);
  return <section className="speaker-panel" aria-label="Speaker turns">
    <header><h4>Speaker turns</h4><p>Spoken {spoken} · Remaining {remaining}</p></header>
    <ul>{party.map(m => { const mark = speakerMark(speaker, m.userId); return <li key={m.userId} className={`mark-${mark}`}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative /><span>{m.name}</span><small>{MARK[mark]}</small>
      {warden && (mark === 'waiting' || mark === 'speaking') && <button disabled={busy} aria-label={`Skip ${m.name}`} onClick={() => onChange(skipSpeaker(speaker, m.userId))}>Skip</button>}
      {warden && mark === 'skipped' && <button disabled={busy} aria-label={`Add ${m.name} back`} onClick={() => onChange(addBack(speaker, m.userId))}>Add back</button>}
    </li>; })}</ul>
  </section>;
}
