import { MAP } from '../data/sanctuaryMap';

type Pt = { x: number; y: number };
const CRYSTAL_COLOURS = { radiance: '#f2c94c', fracture: '#e5484d', spark: '#2fc9a0', wildcard: '#9a6cf0' } as const;

/** Small overview of the Sanctuary: the painted map with you, teammates, crystals, the beacon and lit lamps. */
export default function Minimap({ you, mates, lit }: { you: Pt; mates: Pt[]; lit: number }) {
  const at = (p: Pt) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%` });
  return <div className="minimap" role="img" aria-label={`Map: you, ${mates.length} teammates, ${lit} of 12 lamps lit`}>
    <img src={MAP.image} alt="" draggable={false} />
    {MAP.lamps.map((p, i) => <i key={`l${i}`} className={`lamp ${i < lit ? 'lit' : ''}`} style={at(p)} />)}
    {(Object.keys(CRYSTAL_COLOURS) as (keyof typeof CRYSTAL_COLOURS)[]).map(k => <i key={k} className="crystal" style={{ ...at(MAP.crystals[k]), background: CRYSTAL_COLOURS[k] }} />)}
    <i className="beacon" style={at(MAP.beacon)} />
    {mates.map((p, i) => <i key={`m${i}`} className="mate" style={at(p)} />)}
    <i className="you" style={at(you)} />
  </div>;
}
