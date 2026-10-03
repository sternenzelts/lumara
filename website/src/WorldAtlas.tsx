import CompanionPortrait from './CompanionPortrait';
import { useState, type CSSProperties } from 'react';
import { ArrowUpRight, Sun } from 'lucide-react';
import map from './map-regions.json';
import { characters } from './characters';
export const regions = [map.sanctuary, ...map.regions];
export const characterRegion = (id: string) => regions.find(region => region.characters.includes(id))?.name || 'Lumara';
export default function WorldAtlas({ onExplore }: { onExplore: (id: string) => void }) {
  const [selected, setSelected] = useState('aurelis');
  const region = regions.find(entry => entry.id === selected)!;
  return <section id="atlas" className="atlas-section" aria-labelledby="atlas-title">
    <div className="atlas-heading"><h2 id="atlas-title">The world of <em>Lumara.</em></h2><p>Four nations. A Sanctuary at their heart.<br/>Twelve beacons waiting for the promises you keep.</p></div>
    <div className="atlas-layout"><div className="atlas-map"><img src={`${import.meta.env.BASE_URL}art/world/${map.image}`} alt="Lumara world map: Zaryeva to the north, Hoshimura to the east, Lianzhou to the south, Belcourt to the west, and Aurelis at the center." loading="lazy" decoding="async"/>
      {regions.map(entry => <button className={`atlas-pin ${entry.id === 'aurelis' ? 'sanctuary-pin' : ''}`} key={entry.id} style={{ left: `${entry.x}%`, top: `${entry.y}%`, '--region-color': entry.color } as CSSProperties} aria-label={`Explore ${entry.name}`} aria-pressed={selected === entry.id} onClick={() => setSelected(entry.id)}><Sun size={20}/><span>{entry.name}</span></button>)}
      {map.regions.flatMap((entry, r) => entry.beacons.map((beacon, i) => <span key={`${entry.id}-${i}`} className={`atlas-beacon ${i === 0 && r < 2 ? 'is-lit' : ''}`} style={{ left: `${beacon.x}%`, top: `${beacon.y}%` }} aria-hidden="true"/>))}
    </div><div className="atlas-region" key={region.id}><img className="atlas-region-art" src={`${import.meta.env.BASE_URL}art/world/${region.art}`} alt={`${region.name} landscape`} loading="lazy" decoding="async"/><div className="atlas-region-copy"><h3>{region.name}</h3><p>{region.id === 'aurelis' ? 'The Sanctuary · Your home between voyages' : `${region.element} · A nation of Lumara`}</p><div className="atlas-companions">{region.characters.map(id => { const companion = characters.find(c => c.id === id)!; return <a key={id} href="#character-profile" onClick={() => onExplore(id)} aria-label={`Meet ${companion.name} from ${region.name}`}><CompanionPortrait character={companion}/><span>{companion.name}</span><ArrowUpRight size={12}/></a>; })}</div></div></div></div>
    <div className="atlas-legend"><span><i className="is-lit"/>Relit beacon</span><span><i/>Awaiting a vow</span><p>Illustrated preview of the world’s restoration.</p></div>
  </section>;
}
