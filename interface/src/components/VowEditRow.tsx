import { useState } from 'react';
import type { UserId, Vow } from '../backend/types';
import './feedback.css';

/** Vow Altar review (Warden): edit a Vow's words or owner. */
export default function VowEditRow({ vow, party, busy, onSave }: { vow: Vow; party: { userId: UserId; name: string }[]; busy: boolean; onSave: (patch: { text: string; ownerId: UserId | null }) => void }) {
  const [text, setText] = useState(vow.text); const [owner, setOwner] = useState(vow.ownerId ?? '');
  const changed = text.trim() !== vow.text || (owner || null) !== vow.ownerId;
  return <form className="vow-edit-row" aria-label={`Edit Vow: ${vow.text}`} onSubmit={e => { e.preventDefault(); if (changed && text.trim()) onSave({ text: text.trim(), ownerId: owner || null }); }}>
    <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={1000} aria-label="Vow text" />
    <select value={owner} onChange={e => setOwner(e.target.value)} aria-label="Owner"><option value="">Shared by the team</option>{party.map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}</select>
    <button type="submit" disabled={busy || !changed || !text.trim()}>Save</button>
  </form>;
}
