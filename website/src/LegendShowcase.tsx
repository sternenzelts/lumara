import CompanionPortrait from './CompanionPortrait';
import { useState, type CSSProperties } from 'react';
import { ArrowUpRight, Infinity, Flame, Snowflake, Crown } from 'lucide-react';
import { characters } from './characters';
import CharacterVoice from './CharacterVoice';

const legends = ['mahesvara', 'keira', 'ayaka', 'azrenth'].map(id => characters.find(c => c.id === id)!);
const emblems = [Infinity, Flame, Snowflake, Crown];
export default function LegendShowcase({ onExplore }: { onExplore: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const character = legends[index];
  const Emblem = emblems[index];
  function choose(value: number) { window.dispatchEvent(new Event('lumara-voice-stop')); setIndex(value); }
  return <section className="legends-section" id="legends" aria-labelledby="legends-title">
    <div className="legends-heading"><h2 id="legends-title">Some souls change<br/>the shape of <em>the world.</em></h2><p>Beyond the veil. Inside the flame. Outside time. Beyond reason.<br/>Meet Lumara’s S++ companions.</p></div>
    <div className={`legend-scene legend-${character.id}`} style={{ '--legend-accent': character.accent } as CSSProperties}>
      <div className="legend-art" key={character.id}><img src={`${import.meta.env.BASE_URL}art/landscapes/${character.id}.webp`} alt={`${character.name}, ${character.title}`} loading="lazy" decoding="async"/><div className="legend-energy" aria-hidden="true"/></div>
      <div className="legend-shade" aria-hidden="true"/>
      <div className="legend-copy" key={`copy-${character.id}`}><div className="legend-grade"><Emblem size={26} strokeWidth={1}/><span>S++</span><span>{character.element}</span></div><h3>{character.name}</h3><p className="legend-title">{character.title}</p><CharacterVoice key={character.id} id={character.id} name={character.name}/><a className="legend-profile" href="#character-profile" onClick={() => onExplore(character.id)}>Explore companion <ArrowUpRight size={18}/></a></div>
      <div className="legend-selectors" role="tablist" aria-label="S++ companions">{legends.map((entry, i) => <button key={entry.id} role="tab" aria-selected={index === i} aria-label={`Showcase ${entry.name}`} tabIndex={index === i ? 0 : -1} onClick={() => choose(i)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? legends.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : legends.length - 1)) % legends.length; choose(next); document.getElementById(`legend-${legends[next].id}`)?.focus(); } }} id={`legend-${entry.id}`}><CompanionPortrait character={entry}/><span>{entry.name}</span></button>)}</div>
    </div>
  </section>;
}
