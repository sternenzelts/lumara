import { Copy, Hourglass, Lock, LockOpen, Swords, UserPlus, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { Stage } from '../backend/types';
import { characterById } from '../data/characters';
import { VOYAGE_BRIEFING } from '../logic/voyage';
import { Art } from './ui';
import './voyage-lobby.css';

export type LobbyMember = { userId: string; name: string; characterId: string | null; warden: boolean; you: boolean; /** Checked in (✓). */ ready: boolean };

export default function VoyageLobby({ sprintName, code, members, steps, joined, warden, busy, paused, locked, started = false, checkIn, onJoin, onEnter, onCopyCode, onToggleLock, onRemove }: {
  sprintName: string; code: string; members: LobbyMember[]; steps: Stage[];
  joined: boolean; warden: boolean; busy: boolean; paused: boolean; locked: boolean; /** The voyage has left the lobby (a newcomer or removed player is looking). */ started?: boolean; checkIn?: ReactNode;
  onJoin: () => void; onEnter: () => void; onCopyCode: () => void; onToggleLock?: () => void; onRemove?: (userId: string) => void;
}) {
  const waiting = members.filter(m => !m.ready).length;
  const briefing = steps.filter((s): s is keyof typeof VOYAGE_BRIEFING => s in VOYAGE_BRIEFING);
  return <section className="voyage-lobby" aria-label={`${sprintName} voyage lobby`}>
    <div className="lobby-brief">
      <p className="lobby-kicker">Voyage lobby</p>
      <h1>{sprintName}</h1>
      {checkIn ? <div className="lobby-checkin">{checkIn}</div>
        : <ol className="lobby-briefing" style={{ '--rows': Math.ceil(briefing.length / 2) } as CSSProperties}>{briefing.map(s => <li key={s}><strong>{VOYAGE_BRIEFING[s].title}</strong><span>{VOYAGE_BRIEFING[s].text}</span></li>)}</ol>}
    </div>
    <div className="lobby-side">
      <button className="lobby-code" onClick={onCopyCode} aria-label={`Copy invite code ${code}`}><span>Invite code</span><strong>{code}</strong><Copy size={15} /></button>
      <div className="lobby-action">
        {!joined && started ? <button className="lobby-primary" disabled><Hourglass size={19} />Voyage under way</button>
          : !joined ? <button className="lobby-primary" disabled={busy || locked} onClick={onJoin}>{locked ? <><Lock size={19} />Party locked</> : <><UserPlus size={19} />Join the party</>}</button>
          : warden ? <button className="lobby-primary" disabled={busy || paused || waiting > 0} onClick={onEnter}><Swords size={19} />Enter the Sanctuary</button>
          : <p className="lobby-waiting"><Hourglass size={17} />Waiting for the Warden to open the Sanctuary…</p>}
        <p className="lobby-count">{members.length} in the party</p>
        {warden && <p className="lobby-count">{waiting ? `Waiting for ${waiting} to check in` : 'Everyone is checked in'}</p>}
        {warden && onToggleLock && <button className="lobby-lock" disabled={busy} aria-pressed={locked} onClick={onToggleLock}>{locked ? <><LockOpen size={15} />Unlock party</> : <><Lock size={15} />Lock party</>}</button>}
      </div>
    </div>
    <ul className="lobby-party" aria-label="Party">{members.map(m => <li key={m.userId} className={m.you ? 'you' : ''}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative />
      <span className="lobby-name">{m.name}{(m.you || m.warden) && <small>{[m.you && 'You', m.warden && 'Warden'].filter(Boolean).join(' · ')}</small>}</span>
      {m.ready && (warden || m.you) && <span className="lobby-ready" aria-label={`${m.name} is checked in`}>✓</span>}
      {warden && onRemove && !m.warden && <button className="lobby-remove" disabled={busy} aria-label={`Remove ${m.name} from the party`} onClick={() => onRemove(m.userId)}><X size={14} /></button>}
    </li>)}</ul>
  </section>;
}
