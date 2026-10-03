import { useState, type CSSProperties } from 'react';
import { Star } from 'lucide-react';
import type { Fragment, FragmentCategory, Vote } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import './vote-board.css';

const MAX = 3;
const TINT: Record<FragmentCategory, string> = { radiance: '#ffe09b', fracture: '#faacb8', spark: '#b7f3dc', wildcard: '#c7c1ff' };

/** Starlight Vote: three stars in hand; give them to the thoughts that matter. Votes stay anonymous (counts only). */
export default function VoteBoard({ fragments, votes, ownVotes, busy, onVote, onUnvote }: {
  fragments: Fragment[]; votes: Vote[]; ownVotes: string[]; busy: boolean; onVote: (fragmentId: string) => void; onUnvote: (fragmentId: string) => void;
}) {
  const [filter, setFilter] = useState<FragmentCategory | 'all'>('all');
  const left = Math.max(0, MAX - ownVotes.length);
  if (!fragments.length) return <div className="vote-board vb-empty"><h3>No thoughts to vote on yet</h3><p>The Warden can go back to Write to give the party more time.</p></div>;
  const shown = filter === 'all' ? fragments : fragments.filter(f => f.category === filter);
  return <div className="vote-board">
    <header className="vb-head">
      <div>
        <h3>Give the important things a little light</h3>
        <p>{left ? 'Stack your stars on one thought or spread them out. Nobody sees who gave which.' : 'All three stars given. Take one back to move it.'}</p>
      </div>
      <div className="vb-hand" role="img" aria-label={`${left} of ${MAX} stars left`}>
        {Array.from({ length: MAX }, (_, i) => <i key={i} className={`vb-orb ${i >= left ? 'spent' : ''}`}><Star size={18} strokeWidth={1.5} /></i>)}
      </div>
    </header>
    <nav className="vb-filter" aria-label="Filter by crystal">
      <button className={filter === 'all' ? 'on' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All <b>{fragments.length}</b></button>
      {CATEGORIES.map(c => { const n = fragments.filter(f => f.category === c.id).length; return n ? <button key={c.id} className={filter === c.id ? 'on' : ''} aria-pressed={filter === c.id} style={{ '--tint': TINT[c.id] } as CSSProperties} onClick={() => setFilter(c.id)}><c.icon size={14} />{c.label} <b>{n}</b></button> : null; })}
    </nav>
    <div className="vb-list">
      {shown.map(f => {
        const c = CATEGORIES.find(x => x.id === f.category)!;
        const total = votes.filter(v => v.fragmentId === f.id).length;
        const mine = ownVotes.filter(id => id === f.id).length;
        return <article key={f.id} data-fragment={f.id} className={`vb-card ${mine ? 'chosen' : ''}`} style={{ '--tint': TINT[f.category] } as CSSProperties}>
          <span className="vb-cat"><c.icon size={14} />{c.label}<small>{c.plain}</small></span>
          <p>{f.text}</p>
          <footer>
            <span className="vb-stars" aria-label={`${total} star${total === 1 ? '' : 's'}${mine ? `, ${mine} from you` : ''}`}>
              {Array.from({ length: mine }, (_, i) => <button key={`m${i}`} className="vb-star mine" disabled={busy} aria-label="Take your star back" title="Take your star back" onClick={() => onUnvote(f.id)}><Star size={15} fill="currentColor" /></button>)}
              {Array.from({ length: total - mine }, (_, i) => <i key={`o${i}`} className="vb-star" aria-hidden="true"><Star size={13} fill="currentColor" /></i>)}
            </span>
            <button className="vb-give" disabled={busy || !left} onClick={() => onVote(f.id)}><Star size={15} />Give a star</button>
          </footer>
        </article>;
      })}
    </div>
  </div>;
}
