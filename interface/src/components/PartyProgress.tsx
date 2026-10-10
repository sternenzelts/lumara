import { Check, Star } from 'lucide-react';
import type { Attendance, CheckIn, UserId } from '../backend/types';
import { peerDone } from '../logic/feedback';
import './feedback.css';

/** Warden/admin only: who has finished peer feedback; from Homecoming, each player's check-in answers too. Never anyone's peer ratings. */
export default function PartyProgress({ members, attendance, checkins }: { members: { userId: UserId; name: string }[]; attendance: Attendance[]; checkins: CheckIn[] }) {
  return <section className="party-progress" aria-label="Party progress"><h4>Party progress</h4>
    <ul>{members.map(m => { const a = attendance.find(x => x.userId === m.userId); const c = checkins.find(x => x.userId === m.userId); const peer = a ? peerDone(a, attendance) : false;
      return <li key={m.userId}><span>{m.name}</span>
        <span className={peer ? 'done' : ''} aria-label={peer ? 'Peer feedback done' : 'Peer feedback not done'}><Star size={14} />{peer && <Check size={12} />}</span>
        <small>{c ? `♥ ${c.sat} · ◆ ${c.growth}` : ''}</small></li>; })}</ul>
  </section>;
}
