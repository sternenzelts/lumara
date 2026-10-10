import { useState } from 'react';
import type { UserId } from '../backend/types';

/** After a turn: the Warden turns the discussed thought into a Vow (pre-filled), or skips it. */
export default function TurnVowBox({ thought, party, busy, onMake, onSkip }: { thought: string; party: { userId: UserId; name: string }[]; busy: boolean; onMake: (text: string, ownerId: UserId | null) => void; onSkip: () => void }) {
  const [text, setText] = useState(thought.slice(0, 1000)); const [owner, setOwner] = useState('');
  return <form className="vow-form turn-vow" aria-label="Make a Vow from this thought" onSubmit={e => { e.preventDefault(); if (text.trim()) onMake(text.trim(), owner || null); }}>
    <label>Vow · action item<textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={1000} required /></label>
    <div><label>Owner · optional<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">Shared by the team</option>{party.map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}</select></label>
      <button type="submit" className="speaker-spin" disabled={busy || !text.trim()}>Make Vow</button><button type="button" disabled={busy} onClick={onSkip}>Skip this Vow</button></div>
  </form>;
}
