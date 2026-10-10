import { useEffect, useState } from 'react';
import type { Attendance, Backend, CheckInSummary, PeerResult, Stage } from '../backend/types';

/** Check-in averages and peer results for one voyage. Re-fetched when anyone's progress changes, and every 15 s during Homecoming (an edit doesn't change progress). */
export function useVoyageSummaries(backend: Backend, sessionId: string | null, attendance: Attendance[], stage: Stage | undefined) {
  const [checkIn, setCheckIn] = useState<CheckInSummary | null>(null); const [peer, setPeer] = useState<PeerResult[]>([]);
  const key = attendance.map(a => `${a.userId}:${a.checkinDone ? 1 : 0}:${a.peerGiven}`).sort().join('|');
  useEffect(() => {
    if (!sessionId) return; let live = true;
    const load = () => Promise.all([backend.checkInSummary(sessionId), backend.peerSummary(sessionId)]).then(([c, p]) => { if (live) { setCheckIn(c); setPeer(p); } }).catch(() => {});
    void load(); const t = stage === 'rewards' ? setInterval(load, 15000) : undefined;
    return () => { live = false; if (t) clearInterval(t); };
  }, [backend, sessionId, key, stage]);
  return { checkIn, peer };
}
