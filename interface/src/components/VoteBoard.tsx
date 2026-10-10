import { useState, type CSSProperties } from 'react';
import { Check, Plus } from 'lucide-react';
import type { Fragment, FragmentCategory, Vote } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { minPicks } from '../logic/picks';
import './vote-board.css';

const TINT: Record<FragmentCategory, string> = { radiance: '#ffe09b', fracture: '#faacb8', spark: '#b7f3dc', wildcard: '#c7c1ff' };

/** Starlight Vote: pick the thoughts you want to discuss — at least minPicks, no upper limit. Picks stay private until you're chosen to speak. */
export default function VoteBoard({ fragments, votes, ownVotes, busy, onVote, onUnvote }: {
  fragments: Fragment[]; votes: Vote[]; ownVotes: string[]; busy: boolean; onVote: (fragmentId: string) => void; onUnvote: (fragmentId: string) => void;
}) {
  const [filter, setFilter] = useState<FragmentCategory | 'all'>('all');
  const min = minPicks(fragments.length); const picked = ownVotes.length;
  if (!fragments.length) return <div className="vote-board vb-empty"><h3>No thoughts to vote on yet</h3><p>The Warden can go back to Write to give the party more time.</p></div>;
  const shown = filter === 'all' ? fragments : fragments.filter(f => f.category === filter);
  return <div className="vote-board">
    <header className="vb-head">
      <div>
        <h3>Pick what you want to talk about</h3>
        <p>Pick at least {min}. Your picks stay private until you’re chosen to speak. Then you choose one to discuss.</p>
      </div>
      <div className="vb-hand" role="img" aria-label={`You picked ${picked} of at least ${min}`}>
        {Array.from({ length: min }, (_, i) => <i key={i} className={`vb-orb ${i < picked ? '' : 'spent'}`}><Check size={18} strokeWidth={2} /></i>)}
        {picked > min && <span className="vb-extra">+{picked - min}</span>}
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
        const mine = ownVotes.includes(f.id);
        return <article key={f.id} data-fragment={f.id} className={`vb-card ${mine ? 'chosen' : ''}`} style={{ '--tint': TINT[f.category] } as CSSProperties}>
          <span className="vb-cat"><c.icon size={14} />{c.label}<small>{c.plain}</small></span>
          <p>{f.text}</p>
          <footer>
            <span className="vb-count">{total} {total === 1 ? 'pick' : 'picks'}</span>
            <button className={`vb-give ${mine ? 'on' : ''}`} aria-pressed={mine} disabled={busy} onClick={() => mine ? onUnvote(f.id) : onVote(f.id)}>{mine ? <><Check size={15} />Picked</> : <><Plus size={15} />Pick</>}</button>
          </footer>
        </article>;
      })}
    </div>
  </div>;
}
