import { ScrollText } from 'lucide-react';
import type { Fragment, Vote } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { rankByVotes } from '../logic/report';
import './feedback.css';

/** Vow Altar (Warden): the voyage's thoughts, most-voted first; "Make a Vow" copies one into the Vow box. */
export default function ThoughtPicker({ fragments, votes, onPick }: { fragments: Fragment[]; votes: Vote[]; onPick: (text: string) => void }) {
  const ranked = rankByVotes(fragments, votes);
  if (!ranked.length) return null;
  return <section className="thought-picker" aria-label="Thoughts from this voyage"><h4>Thoughts from this voyage</h4>
    <ol>{ranked.map(({ fragment: f, votes: n }) => <li key={f.id}>
      <span className={`category-label ${f.category}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</span>
      <p>{f.text}</p><span className="thought-votes">{n} {n === 1 ? 'vote' : 'votes'}</span>
      <button type="button" onClick={() => onPick(f.text)} aria-label={`Make a Vow from: ${f.text}`}><ScrollText size={14} />Make a Vow</button>
    </li>)}</ol>
  </section>;
}
