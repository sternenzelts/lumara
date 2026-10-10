import type { ReactNode } from 'react';
import { PEER_TRAITS } from '../data/feedback';
import type { VoyageReport } from '../logic/report';
import PartyPortrait from './PartyPortrait';
import './report.css';

/** Homecoming mission report (feature 4) — also the Archives view. Built from one VoyageReport, the same model the saved image draws. */
export default function HomecomingReport({ report: r, viewerSeesAll, actions }: { report: VoyageReport; viewerSeesAll: boolean; actions?: ReactNode }) {
  const n = r.numbers;
  return <article className="homecoming-report">
    <PartyPortrait members={r.portrait} />
    <header><h3>{r.sprintName}</h3><p>{new Date(r.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p></header>
    {actions && <div className="report-actions">{actions}</div>}
    <section aria-label="Voyage numbers" className="report-numbers">
      <div><strong>{n.thoughts}</strong><span>thoughts shared</span></div><div><strong>{n.votes}</strong><span>picks made</span></div>
      <div><strong>{n.vows}</strong><span>Vows made</span></div><div><strong>{n.promisesKept}</strong><span>{n.promisesKept === 1 ? 'promise kept' : 'promises kept'}</span></div>
      <div className="report-starlight"><strong>{n.myStarlight === null ? '—' : n.myStarlight.toLocaleString()}</strong><span>Starlight you earned</span></div>
    </section>
    <section aria-label="Team check-in" className="report-checkin">{r.checkIn && r.checkIn.sat !== null && r.checkIn.growth !== null
      ? <><p><span>♥</span> Satisfaction {r.checkIn.sat}%</p><p><span>◆</span> Growth {r.checkIn.growth}%</p><small>{r.checkIn.n} of {r.checkIn.of} checked in</small></>
      : <p>Nobody checked in this voyage.</p>}</section>
    <section aria-label={viewerSeesAll ? 'Peer feedback' : 'Your peer feedback'} className="report-peer">{r.peer.length
      ? <table><thead><tr><th scope="col">{viewerSeesAll ? 'Ally' : 'You'}</th>{PEER_TRAITS.map(t => <th scope="col" key={t.key} title={t.measures}><span aria-hidden="true">{t.icon}</span> {t.title}</th>)}<th scope="col">Raters</th></tr></thead>
        <tbody>{r.peer.map(p => <tr key={p.userId}><th scope="row">{p.name}</th>{PEER_TRAITS.map(t => <td key={t.key}>{p.pct[t.key]}%</td>)}<td>{p.raters}</td></tr>)}</tbody></table>
      : <p>{viewerSeesAll ? 'No peer feedback this voyage.' : 'No allies rated you this voyage.'}</p>}</section>
    <section aria-label="All thoughts" className="report-thoughts">{r.thoughts.length ? r.thoughts.map(g => <div key={g.category}><h4><span className={`category-label ${g.category}`}>{g.label}</span> {g.plain}</h4>
      <ol>{g.items.map((t, k) => <li key={k}><p>{t.text}</p><span>{t.votes} {t.votes === 1 ? 'pick' : 'picks'}</span></li>)}</ol></div>) : <p>No thoughts were shared.</p>}</section>
    <section aria-label="Vows to carry" className="report-vows">{r.vows.length ? <ul>{r.vows.map((v, k) => <li key={k}><p>{v.text}</p><span>{v.owner}</span></li>)}</ul> : <p>No Vows were made.</p>}</section>
  </article>;
}
