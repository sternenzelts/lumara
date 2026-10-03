import { BANNER_LINEUPS } from '../data/banners';
import CharacterDetailsPopup from './CharacterDetailsPopup';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Clock3, Flame, Info, Infinity, Play, Repeat2, Snowflake, Sparkles, Star, X } from 'lucide-react';
import PullReveal, { type RevealCue } from './PullReveal';
import { useUI } from '../App';
import { CHARACTERS, characterById, type CharacterDef } from '../data/characters';
import { pityProgress } from '../logic';
import { Art, GradeBadge } from './ui';
import { CHARACTER_KITS } from '../data/characterKits';
import { bannerCharacterLink, selectedBanner } from '../logic/bannerNavigation';
import { primeAzrenthAudio } from './reveal/azrenth-audio.js';
import './wish-lineups.css';

const LINEUPS = BANNER_LINEUPS.map((lineup, index) => ({ ...lineup, ...[
  { icon: Infinity, face: '845 20 190 190' },
  { icon: Flame, face: '850 70 200 200' },
  { icon: Snowflake, face: '685 125 200 200' },
  { icon: Flame, face: '615 25 200 200' },
][index] }));
// Portrait framing follows the supplied face/bust references using matching cutouts.
const SUPPORT_PORTRAITS: Record<string, string> = {
  seren: '430 65 300 375',
  lucien: '345 30 330 413',
  dax: '320 25 540 675',
  kairo: '375 0 570 713',
  rook: '220 0 580 725',
  wren: '280 0 600 750',
  suvara: '345 160 260 320',
  ashvane: '355 45 260 325',
  sollene: '355 160 360 450',
  calla: '285 20 370 463',
};
function Rarity({ character }: { character: CharacterDef }) {
  return <span className="wish-stars" role="img" aria-label={character.grade}>{Array.from({ length: character.grade === 'S++' ? 3 : character.grade === 'S+' ? 2 : 1 }, (_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={1} />)}</span>;
}
export default function WishLineups() {
  const { settings, busy, pull, starlight, me, player } = useUI();
  const [selected, setSelected] = useState(() => Math.max(0, LINEUPS.findIndex(lineup => lineup.featured === selectedBanner())));
  useEffect(() => { const sync = () => setSelected(Math.max(0, LINEUPS.findIndex(lineup => lineup.featured === selectedBanner()))); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  const [characterDetails, setCharacterDetails] = useState(false);
  const closeCharacterDetails = useCallback(() => setCharacterDetails(false), []);
  const [details, setDetails] = useState<'rates' | 'history' | null>(null);
  const [preview, setPreview] = useState<RevealCue | null>(null);
  const lineup = LINEUPS[selected];
  const featured = characterById(lineup.featured)!;
  const Emblem = lineup.icon;
  const cost = settings.starlight.pullCost;
  const pity = pityProgress(player?.pulls || [], settings);
  const choose = (index: number) => { setSelected(index); setDetails(null); location.hash = `banner/${LINEUPS[index].featured}`; };
  return <section className={`wish-stage wish-${featured.id}`} style={{ '--wish-accent': featured.accent } as CSSProperties} aria-label={`${featured.name} wish banner`}>
    {characterDetails && <CharacterDetailsPopup character={featured} companions={lineup.companions.map(id => characterById(id)!)} onClose={closeCharacterDetails} onPreview={entry => { setCharacterDetails(false); setPreview({ cueId: crypto.randomUUID(), name: me.name, preview: true, records: [{ characterId: entry.id, grade: entry.grade, duplicate: false, at: Date.now(), source: 'banner' }] }); }} />}
    {preview && <PullReveal key={preview.cueId} cue={preview} onClose={() => setPreview(null)} />}
    <img key={featured.id} src={`${import.meta.env.BASE_URL}art/banners/banner_${featured.id}.webp`} className="wish-stage-art" alt="" />
    <div className="wish-stage-shade" aria-hidden="true" />
    <div className="wish-banner-tabs" role="tablist" aria-label="Featured wish banners">{LINEUPS.map((banner, index) => {
      const character = characterById(banner.featured)!;
      return <button key={character.id} id={`wish-tab-${character.id}`} role="tab" aria-selected={selected === index} aria-controls="wish-selected-banner" aria-label={`${character.name} banner`} tabIndex={selected === index ? 0 : -1} onClick={() => choose(index)} onKeyDown={event => { if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? LINEUPS.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : LINEUPS.length - 1)) % LINEUPS.length; choose(next); document.getElementById(`wish-tab-${LINEUPS[next].featured}`)?.focus(); } }}>
        <svg className="wish-banner-face" viewBox={banner.face} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={`${import.meta.env.BASE_URL}art/banners/banner_${character.id}.webp`} width="1280" height="720" /></svg>
      </button>;
    })}</div>
    <div id="wish-selected-banner" role="tabpanel" aria-labelledby={`wish-tab-${featured.id}`} className="wish-banner-content">
      <div className="wish-character-group"><section key={featured.id} className="wish-character-panel" aria-label={`${featured.name} featured character`}><div className="wish-character-grade"><GradeBadge grade={featured.grade} /><Emblem size={22} strokeWidth={1.2} /></div><h2>{featured.name}</h2><p className="wish-character-title">{CHARACTER_KITS[featured.id]?.title ?? featured.title}</p><span className="wish-character-element">{featured.element}</span><button className="wish-character-details" aria-label={`View ${featured.name} details`} title="View character details" aria-haspopup="dialog" onClick={() => setCharacterDetails(true)}><ArrowUpRight size={22} /></button></section>
      <div className="wish-support-row" aria-label={`${featured.name} featured companions`}>{lineup.companions.map(id => {
        const character = characterById(id)!;
        return <div key={id} className="wish-companion" role="img" aria-label={`${character.name}, ${character.grade}`} title={character.name}>{SUPPORT_PORTRAITS[id] ? <svg className="wish-support-portrait" viewBox={SUPPORT_PORTRAITS[id]} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={character.art.cutout} width="1024" height="1536" /></svg> : <Art character={character} decorative />}<Rarity character={character} /></div>;
      })}</div></div>
    </div>
    <div className="wish-toolbar">
      <div className="wish-utility-controls"><button aria-label="Banner rates and shared character pool" aria-expanded={details === 'rates'} aria-controls="wish-details" onClick={() => setDetails(details === 'rates' ? null : 'rates')}><Info size={22} /></button><button aria-label="Your wish history" aria-expanded={details === 'history'} aria-controls="wish-details" onClick={() => setDetails(details === 'history' ? null : 'history')}><Clock3 size={22} /></button><button aria-label={`Preview ${featured.name} reveal`} title={`Preview ${featured.name} reveal`} onClick={() => { primeAzrenthAudio(); setPreview({ cueId: crypto.randomUUID(), name: me.name, preview: true, records: [{ characterId: featured.id, grade: 'S++', duplicate: false, at: Date.now(), source: 'banner' }] }); }}><Play size={22} /></button></div>
      <div className="wish-pull-controls">{[1, 10].map(count => <button key={count} className={`wish-pull wish-pull-${count}`} aria-label={`Wish ×${count}, ${cost * count} Starlight`} disabled={busy || starlight < cost * count} onClick={() => { primeAzrenthAudio(); pull('banner', count); }}><span className="wish-pull-count"><Sparkles size={25} strokeWidth={1.4} /><b>×{count}</b></span><span className="wish-pull-cost"><Sparkles size={13} /><span>{(cost * count).toLocaleString()}</span></span></button>)}</div>
    </div>
    {details && <section id="wish-details" className="wish-details-sheet" aria-label={details === 'rates' ? `Featured banner rates, shared pity and all ${CHARACTERS.length} possible companions` : 'Recent wish history'}><button className="wish-details-close" aria-label="Close banner details" onClick={() => setDetails(null)}><X size={18} /></button>
      {details === 'rates' ? <><div className="wish-probabilities">{['S++', 'S+', 'A'].map((grade, index) => <div key={grade} aria-label={`${grade}: ${[settings.rates.sPlusPlus, settings.rates.sPlus, 1-settings.rates.sPlus-settings.rates.sPlusPlus][index] * 100}%`}><Rarity character={CHARACTERS.find(c => c.grade === grade)!} /><strong>{([settings.rates.sPlusPlus, settings.rates.sPlus, 1-settings.rates.sPlus-settings.rates.sPlusPlus][index] * 100).toFixed(1)}%</strong></div>)}</div>
        {settings.pity.enabled && <div className="wish-guarantees">{[['S+', pity.sPlus, settings.pity.sPlus], ['S++', pity.sPlusPlus, settings.pity.sPlusPlus]].map(([grade, value, max]) => <div key={grade} aria-label={`${grade} pity ${value} of ${max}`}><Clock3 size={17} /><Rarity character={CHARACTERS.find(c => c.grade === grade)!} /><span>{value}/{max}</span></div>)}</div>}
        <p className="small-copy">When an S++ drops: 50% {featured.name}, 50% other S++ characters. When an S+ drops: 50% {lineup.companions.map(id => characterById(id)!).filter(c => c.grade === 'S+').map(c => c.name).join(' / ')} (split equally), 50% other S+ characters. Shared pity; no featured guarantee after an off-banner pull.</p>
        <div className="wish-pool" aria-label="All banners share the character pool and pity; featured S++ and S+ groups each receive 50% of their rarity">{CHARACTERS.map(character => <a key={character.id} href={bannerCharacterLink(character.id, featured.id)} aria-label={`View ${character.name}, ${character.grade}`} title={character.name}><Art character={character} decorative /><Rarity character={character} /></a>)}</div>
      </> : <div className="wish-history">{(player?.pulls || []).length ? [...player!.pulls].slice(-12).reverse().map((record, index) => { const character = characterById(record.characterId)!; return <a href={bannerCharacterLink(character.id, featured.id)} key={index} aria-label={`${character.name}, ${record.grade}, ${record.duplicate ? 'duplicate' : 'new companion'}`}><Art character={character} decorative /><Rarity character={character} />{record.duplicate && <Repeat2 size={16} />}</a>; }) : <Clock3 size={36} aria-label="No wishes yet" />}</div>}
    </section>}
  </section>;
}
