import { ScrollText } from 'lucide-react';
import type { Fragment } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import './feedback.css';

/** Vow Altar (Warden): thoughts nobody chose to discuss, oldest first; "Make a Vow" copies one into the Vow box. */
export default function ThoughtPicker({ fragments, onPick }: { fragments: Fragment[]; onPick: (text: string) => void }) {
  const list = [...fragments].sort((a, b) => a.createdAt - b.createdAt);
  if (!list.length) return null;
  return <section className="thought-picker" aria-label="Thoughts not discussed"><h4>Thoughts not discussed</h4>
    <ol>{list.map(f => <li key={f.id}>
      <span className={`category-label ${f.category}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</span>
      <p>{f.text}</p>
      <button type="button" onClick={() => onPick(f.text)} aria-label={`Make a Vow from: ${f.text}`}><ScrollText size={14} />Make a Vow</button>
    </li>)}</ol>
  </section>;
}
