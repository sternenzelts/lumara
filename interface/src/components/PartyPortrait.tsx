import type { CSSProperties } from 'react';
import { characterById } from '../data/characters';
import { HOMECOMING_BACKDROP } from '../data/sanctuaryMap';
import { portraitGroups, type PortraitMember } from '../logic/report';
import { Art } from './ui';
import './report.css';

/** Party Portrait (feature 6): every voyage companion together on the Sanctuary plaza, nicknames beneath.
 *  The backdrop URL is absolute: a relative url() in a CSS variable resolves against the built stylesheet in /assets/. */
export default function PartyPortrait({ members }: { members: PortraitMember[] }) {
  return <figure className={`party-portrait${members.length > 10 ? ' crowded' : ''}`} style={{ '--plaza': `url(${new URL(HOMECOMING_BACKDROP, document.baseURI).href})` } as CSSProperties} aria-label="Party portrait">
    {portraitGroups(members).map((row, r) => <div className="portrait-row" key={r}>{row.map(m => <div className="portrait-member" key={m.userId}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative /><span>{m.name}{m.warden && <small>Warden</small>}</span></div>)}</div>)}
  </figure>;
}
