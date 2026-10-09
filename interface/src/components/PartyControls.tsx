import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import type { LobbyMember } from './VoyageLobby';
import './feedback.css';

/** Warden, during the voyage: remove a teammate. Joining is closed until the party returns to the lobby. */
export default function PartyControls({ members, busy, onRemove }: { members: LobbyMember[]; busy: boolean; onRemove: (userId: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="party-controls">
    <button disabled={busy} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Party controls"><UsersRound size={16} /><span className="voyage-btn-text">Party</span></button>
    {open && <div className="party-controls-panel" role="dialog" aria-label="Party">
      <p>Joining is closed while the voyage runs. A removed player can’t rejoin until you return to the lobby.</p>
      <ul>{members.map(m => <li key={m.userId}><span>{m.name}{m.warden && <small> · Warden</small>}</span>{!m.warden && <button disabled={busy} onClick={() => onRemove(m.userId)} aria-label={`Remove ${m.name} from the party`}>Remove</button>}</li>)}</ul>
    </div>}
  </div>;
}
