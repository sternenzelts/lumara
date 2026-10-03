import { useEffect, useRef, useState } from 'react';
import { characters } from './characters';
import skills from './skills.json';
import voices from './voice-lines.json';

const sheets: Record<string, string> = {
  suvara: 'suvara_chibi_walk_v5.webp', ayaka: 'ayaka_chibi_walk_v2.webp',
};
/** Where each companion stands on the plaza floor (fractions of the map image), two loose rows clear of the crystals and lamps. */
const SPOTS: [number, number][] = [[0.24, 0.46], [0.31, 0.37], [0.42, 0.42], [0.58, 0.41], [0.69, 0.33], [0.77, 0.47], [0.22, 0.60], [0.33, 0.70], [0.44, 0.74], [0.50, 0.80], [0.66, 0.71], [0.79, 0.55], [0.38, 0.55], [0.62, 0.55]];
const featured = ['seren', 'mahesvara', 'keira', 'ayaka', 'azrenth', 'lucien', 'ashvane', 'suvara'];
const signatures = [
  ['Ayaka', 'Chrono Stasis stops time for everyone else.'],
  ['Azrenth', 'Sever cuts through stopped time.'],
  ['Seren', 'Dawnbreak blinds the world white before dawn returns.'],
  ['Lucien', 'Rampart blocks the path.'],
];

export function SkillRow({ id }: { id: string }) {
  const list = (skills as Record<string, {name: string; description: string; icon: string}[]>)[id];
  if (!list) return null;
  return <div className="skill-row"><span>Skills</span><div>{list.map(skill => <div className="skill-item" key={skill.name}><img src={`${import.meta.env.BASE_URL}art/${id}/${skill.icon}`} alt="" loading="lazy" decoding="async"/><span className="skill-tip"><strong>{skill.name}</strong>{skill.description}</span></div>)}</div></div>;
}

export default function Sanctuary({ motion }: { motion: boolean }) {
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { const stop = () => { audio.current?.pause(); audio.current = null; setSpeaker(null); }; window.addEventListener('lumara-voice-stop', stop); return () => { stop(); window.removeEventListener('lumara-voice-stop', stop); }; }, []);
  function speak(id: string) {
    window.dispatchEvent(new Event('lumara-voice-stop'));
    const line = (voices as Record<string, {file: string; caption: string}[]>)[id]?.find(item => /greet|welcome|tap/.test(item.file));
    if (!line) return;
    const clip = new Audio(`${import.meta.env.BASE_URL}audio/voices/${id}/${line.file}`);
    audio.current = clip; setSpeaker(id); setCaption(line.caption);
    window.dispatchEvent(new CustomEvent('lumara-voice', { detail: true }));
    clip.onended = () => { setSpeaker(null); window.dispatchEvent(new CustomEvent('lumara-voice', { detail: false })); };
    clip.onerror = () => { setSpeaker(null); setCaption('Voice could not load. Please try again.'); };
    void clip.play().catch(() => { setSpeaker(null); setCaption('Voice could not play. Please try again.'); });
  }
  return <section className="sanctuary-section" id="sanctuary" aria-labelledby="sanctuary-title">
    <div className="sanctuary-heading"><h2 id="sanctuary-title">Inside the <em>Sanctuary.</em></h2><p>Companions chatter, react to your retro, and answer when you click them, in Japanese voice with English subtitles.</p></div>
    <div className="plaza-scene"><div className="plaza-map" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}art/sanctuary_map.webp)` }}>
      <div className="plaza-walkers">{characters.map((character, i) => <button className="plaza-character" key={character.id} style={{ animationDelay: `${-(i * 1.3)}s`, left: `${SPOTS[i % SPOTS.length][0] * 100}%`, top: `${SPOTS[i % SPOTS.length][1] * 100}%` }} onClick={() => speak(character.id)} aria-label={`Hear ${character.name}`}>
        {character.id === 'keira' ? <span className="keira-float" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}art/keira/keira_chibi_base_poses.webp)` }} /> : <span className={`walk-sprite ${motion ? '' : 'still'}`} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}art/${character.id}/${sheets[character.id] || `${character.id}_chibi_walk.webp`})` }}/>}<span>{character.name}</span>
      </button>)}</div></div>
      {speaker && <p className="plaza-bubble" role="status"><strong>{characters.find(c => c.id === speaker)?.name}</strong> {caption}</p>}
    </div>
    <div className="sanctuary-skills"><h3>Power in every companion</h3><p>Discover their skills in the Sanctuary. These flourishes bring the plaza to life; companions remain cosmetic during a voyage.</p><div className="skill-roster">{featured.map(id => { const character = characters.find(c => c.id === id)!; return <div className="skill-character" key={id}><h4>{character.name} <span>{character.grade}</span></h4><ul>{(skills as Record<string, {name: string; description: string; icon: string}[]>)[id].map(skill => <li key={skill.name}><img src={`${import.meta.env.BASE_URL}art/${id}/${skill.icon}`} alt="" loading="lazy" decoding="async"/><span><strong>{skill.name}</strong>{skill.description}</span></li>)}</ul></div>; })}</div></div>
    <div className="signature-lines">{signatures.map(([name, copy]) => <p key={name}><strong>{name}</strong> {copy}</p>)}</div>
  </section>;
}
