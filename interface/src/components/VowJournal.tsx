import { Check } from 'lucide-react';
import { useUI } from '../App';
import { Empty } from './ui';

export default function VowJournal() {
  const { vows, profiles, me, session, backend, run, busy } = useUI();
  const canEdit = me.isAdmin || session?.wardenId === me.id;
  return <section className="game-vow-journal"><h2>Promises worth keeping</h2><p>Vows · action items carried between voyages. Every fulfilled promise relights a beacon.</p>{vows.length ? <div className="game-journal-rows">{vows.map(v => <div key={v.id} className={`vow-row ${v.status === 'fulfilled' ? 'fulfilled' : ''}`}><button className="vow-check" disabled={!canEdit || busy} aria-pressed={v.status === 'fulfilled'} aria-label={`Mark action item ${v.status === 'fulfilled' ? 'open' : 'fulfilled'}: ${v.text}`} onClick={() => run(() => backend.updateVow(v.id, { status: v.status === 'fulfilled' ? 'open' : 'fulfilled' }))}>{v.status === 'fulfilled' && <Check size={16} />}</button><div className="vow-text"><p>{v.text}</p><span>{v.ownerId ? profiles[v.ownerId]?.name || 'Teammate' : 'Shared by the team'} · {v.status.replace('_', ' ')}</span></div></div>)}</div> : <Empty title="The first light begins with a promise."><p>Action items from your first retrospective will appear here.</p></Empty>}</section>;
}
