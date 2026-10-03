import EntryGate from './EntryGate';
import Preregister from './Preregister';
import CompanionPortrait from './CompanionPortrait';
import LegendShowcase from './LegendShowcase';
import WorldAtlas, { characterRegion } from './WorldAtlas';
import CharacterVoice from './CharacterVoice';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ChevronRight, Expand, Menu, Pause, Play, Sparkles, Sun, X } from 'lucide-react';
import gsap from 'gsap';
import { characters, WORLD, type Grade } from './characters';
import CharacterPresentation from './CharacterPresentation';
import BackgroundMusic from './BackgroundMusic';
import Sanctuary, { SkillRow } from './Sanctuary';

function Emblem({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1"/><path d="m32 3 5 24 24 5-24 5-5 24-5-24-24-5 24-5Z" fill="currentColor"/><circle cx="32" cy="32" r="8" fill="var(--paper)"/><path d="m32 23 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="currentColor"/></svg>;
}

function Artwork({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <div className={`art-unavailable ${className}`}><Emblem/><span>Artwork is unavailable.</span></div> : <img className={className} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} onError={() => setFailed(true)}/>;
}

const links = [{ href: '#world', label: 'The world' }, { href: '#legends', label: 'S++ companions' }, { href: '#characters', label: 'Characters' }, { href: '#sanctuary', label: 'The Sanctuary' }, { href: '#voyage', label: 'The experience' }];
const stages = [
  { name: 'Vow review', description: "At the beacon, look back at last voyage's vows. Confirm the promises you kept ? every one relights a lamp.", plain: 'Review the last action items' },
  { name: 'Write', description: 'Leave anonymous thoughts at the crystals: Keep, Problem, Try, or Wild.', plain: 'Share what is on your mind' },
  { name: 'Vote', description: 'Give your 3 Starlight votes to the thoughts that matter most.', plain: 'Choose what matters most' },
  { name: 'Discuss', description: 'The Warden draws the most-voted thoughts from the beacon for the team to discuss.', plain: 'Talk through the top thoughts' },
  { name: 'New vows', description: 'Cross to the vow island and make promises for the next sprint.', plain: 'Agree on next steps' },
  { name: 'Homecoming', description: 'Return for the voyage summary, your Starlight, and your free wish.', plain: 'See your progress and make a wish' },
];

export default function App() {
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [motion, setMotion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [filter, setFilter] = useState<Grade | 'All'>('All');
  const [selectedId, setSelectedId] = useState('seren');
  const [expanded, setExpanded] = useState<'world' | 'character' | null>(null);
  const [artworkIndex, setArtworkIndex] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const portraitRail = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = characters.filter(character => filter === 'All' || character.grade === filter);
  const selected = characters.find(character => character.id === selectedId)!;
  const selectedIndex = visible.findIndex(character => character.id === selectedId);
  const artworkChoices = expanded === 'world'
    ? [{ label: 'The Sanctuary above the cloud sea', src: WORLD }]
    : [{ label: selected.splashLabel || selected.title, src: selected.splash || selected.cutout! }, ...(selected.extraArt || [])];
  const activeArtwork = artworkChoices[artworkIndex] || artworkChoices[0];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setMotion(!query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-25% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = hero.current;
    if (!element || !motion || !window.matchMedia('(pointer: fine)').matches) return;
    const x = gsap.quickTo(element, '--pointer-x', { duration: 1, ease: 'power3.out' });
    const y = gsap.quickTo(element, '--pointer-y', { duration: 1, ease: 'power3.out' });
    const move = (event: PointerEvent) => { const bounds = element.getBoundingClientRect(); x((event.clientX / bounds.width - .5) * 18); y(((event.clientY - bounds.top) / bounds.height - .5) * 12); };
    const leave = () => { x(0); y(0); };
    element.addEventListener('pointermove', move); element.addEventListener('pointerleave', leave);
    return () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); x.tween.kill(); y.tween.kill(); element.style.setProperty('--pointer-x', '0'); element.style.setProperty('--pointer-y', '0'); };
  }, [motion]);

  useEffect(() => {
    if (!motion) return;
    const context = gsap.context(() => {
      gsap.fromTo('.character-figure', { opacity: .55, x: 16, filter: 'blur(4px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: .65, ease: 'power3.out' });
    }, root);
    return () => context.revert();
  }, [selectedId, motion]);

  useEffect(() => {
    const rail = portraitRail.current;
    const active = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (rail && active) rail.scrollTo({ left: active.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2, behavior: motion ? 'smooth' : 'instant' });
  }, [selectedId, filter, motion]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (expanded && !element.open) element.showModal();
    if (!expanded && element.open) element.close();
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);

  function chooseFilter(next: Grade | 'All') {
    window.dispatchEvent(new Event('lumara-voice-stop'));
    setFilter(next);
    if (next !== 'All' && selected.grade !== next) setSelectedId(characters.find(character => character.grade === next)!.id);
  }
  function step(direction: number) { window.dispatchEvent(new Event('lumara-voice-stop')); setSelectedId(visible[(selectedIndex + direction + visible.length) % visible.length].id); }
  function navigate() { setMenu(false); }
  function openArtwork(kind: 'world' | 'character') {
    setArtworkIndex(0);
    setExpanded(kind);
  }
  function exploreCharacter(id: string) {
    window.dispatchEvent(new Event('lumara-voice-stop'));
    setFilter('All');
    setSelectedId(id);
    requestAnimationFrame(() => document.getElementById('character-name')?.focus({ preventScroll: true }));
  }

  return <div ref={root} className={`site ${motion ? 'motion-on' : 'motion-off'}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Lumara home" onClick={navigate}><Emblem/><span>LUMARA</span></a>
      <nav aria-label="Main navigation" className={menu ? 'navigation is-open' : 'navigation'}>{links.map(link => <a key={link.href} href={link.href} aria-current={activeSection === link.href.slice(1) ? 'location' : undefined} onClick={navigate}>{link.label}</a>)}</nav>
      <a className="header-discover" href="#characters">Meet the companions <ArrowRight size={15}/></a>
      <BackgroundMusic/>
      <EntryGate background={WORLD} seren={`${import.meta.env.BASE_URL}art/seren/seren_cutout_v2.webp`} emblem={<Emblem/>}/>
      <button className="menu-button icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
    </header>

    <main id="main">
      <section className="hero" id="home" ref={hero} aria-labelledby="hero-title">
        <div className="world-plane" aria-hidden="true"><Artwork src={WORLD} alt="" eager/></div>
        <div className="hero-veil"/>
        <div className="hero-mascot-plane"><Artwork src={characters[0].cutout!} alt="Seren, Dawnlight, Lumara’s silver-haired guide with her crystal sword" className="hero-mascot" eager/></div>
        <div className="light-motes" aria-hidden="true">{Array.from({length: 14}, (_, i) => <span key={i} style={{ '--i': i, left: `${7 + (i * 37) % 88}%`, top: `${12 + (i * 19) % 70}%` } as CSSProperties}/>)}</div>
        <div className="hero-content"><h1 id="hero-title">Where every vow<br/>becomes <em>light.</em></h1><p>A world dimmed by the Dimming.<br/>A promise to bring it back, one beacon at a time.</p><div className="hero-actions"><a className="button button-primary" href="#characters">Discover the characters <ArrowRight size={18}/></a><a className="text-link" href="#world">Explore Lumara <ChevronRight size={16}/></a></div></div>
        <div className="hero-baseline"><a className="scroll-cue" href="#world"><ArrowDown size={16}/><span>Your journey begins here</span></a><div className="mascot-caption"><span className="caption-line"/><div><strong>Seren</strong><span>Dawnlight · Your guide to Lumara</span></div></div><button className="motion-toggle" onClick={() => setMotion(!motion)} aria-pressed={!motion} aria-label={motion ? 'Pause ambient motion' : 'Enable ambient motion'}>{motion ? <Pause size={14}/> : <Play size={14}/>}<span>{motion ? 'Pause motion' : 'Enable motion'}</span></button></div>
      </section>

      <section className="world-section" id="world" aria-labelledby="world-title">
        <div className="world-intro"><Emblem className="section-emblem"/><h2 id="world-title">A world waiting for<br/>its next <em>dawn.</em></h2><div className="world-copy"><p>Across open plains, vast seas, and mountains, colossal ruins of a lost civilization rise from the wild. Then came the Dimming, and the great beacons went dark.</p><p>The Wardens return to the Sanctuary after every voyage—to share what they saw, remember what matters, and make a promise for tomorrow.</p></div></div>
        <div className="world-panorama"><Artwork src={WORLD} alt="Lumara’s floating white-stone Sanctuary and distant sky islands above a golden cloud sea"/><div className="panorama-caption"><span>The Sanctuary</span><button className="art-expand" onClick={() => openArtwork('world')} aria-label="View Lumara world artwork fullscreen"><Expand size={17}/><span>Explore the view</span></button></div></div>
        <div className="world-afterword"><Sun size={23}/><p>One fulfilled vow. One beacon relit.<br/><strong>A little more light to come home to.</strong></p><span>Twelve beacons. A shared promise.</span></div>
      </section>

      <WorldAtlas onExplore={exploreCharacter}/>
      <LegendShowcase onExplore={exploreCharacter}/>

      <section className="characters-section" id="characters" aria-labelledby="characters-title">
        <div className="section-heading"><h2 id="characters-title">Meet your <em>companions.</em></h2><a className="text-link" href="#character-overview">Read the character overview <ArrowDown size={15}/></a></div>
        <div className="character-showcase" id="character-profile" style={{ '--character-accent': selected.accent } as CSSProperties}>
          <CharacterPresentation key={selected.id} character={selected} motion={motion} covered={expanded !== null}/><div className="character-wash"/>
          <div className="character-info"><h3 id="character-name" tabIndex={-1}>{selected.name}</h3><p className="character-title">{selected.title}</p><p className="character-region">{characterRegion(selected.id)}</p><div className="character-traits"><span className="grade">{selected.grade}</span><span>{selected.element}</span>{selected.id === 'seren' && <span className="guide-label">Mascot & guide</span>}</div><p className="character-description">{selected.description}</p><CharacterVoice key={selected.id} id={selected.id} name={selected.name}/><SkillRow id={selected.id}/><button className="text-link" onClick={() => openArtwork('character')}>View the artwork <Expand size={15}/></button></div>
          <div className="character-pagination"><span>{String(selectedIndex + 1).padStart(2,'0')} <span>/ {String(visible.length).padStart(2,'0')}</span></span><button className="icon-button" onClick={() => step(-1)} aria-label="Previous character"><ArrowLeft size={19}/></button><button className="icon-button" onClick={() => step(1)} aria-label="Next character"><ArrowRight size={19}/></button></div>
          <Emblem className="character-watermark"/>
        </div>
        <div className="roster-toolbar"><span>Choose your companion</span><div className="grade-filters" role="group" aria-label="Filter characters by grade">{(['All','S++','S+','A'] as const).map(grade => <button key={grade} aria-pressed={filter === grade} onClick={() => chooseFilter(grade)}>{grade}</button>)}</div></div>
        <div className="portrait-rail" ref={portraitRail} role="group" aria-label="Character selection">{visible.map(character => <button className="portrait-choice" key={character.id} aria-pressed={selectedId === character.id} aria-label={`Meet ${character.name}, ${character.grade}, ${character.element}`} onClick={() => setSelectedId(character.id)} style={{ '--portrait-accent': character.accent } as CSSProperties}><CompanionPortrait character={character}/><span className="portrait-grade">{character.grade}</span><span className="portrait-name">{character.name}</span></button>)}</div>
        <p className="companion-chatter">Companions chatter, react to your retro, and answer when you click them, in Japanese voice with English subtitles.</p><p className="cosmetic-note"><Sparkles size={14}/> Collect companions for their stories and their style. Every character is cosmetic.</p>
        <div className="character-overview" id="character-overview" aria-labelledby="overview-title">
          <div className="overview-heading"><h3 id="overview-title">The companions of <em>Lumara.</em></h3><p>Meet the guide, the quiet guardians, and the unpredictable souls who call this world home.</p></div>
          <ul className="overview-roster">{characters.map(character => <li className="overview-entry" key={character.id} style={{ '--overview-accent': character.accent } as CSSProperties}>
            <div className={`overview-portrait ${character.splash ? '' : 'overview-cutout'}`}><CompanionPortrait character={character}/></div>
            <div className="overview-copy"><h4>{character.name}{character.id === 'seren' && <span>Mascot & guide</span>}</h4><p className="overview-traits">{character.grade} <span aria-hidden="true">·</span> {character.element} / {characterRegion(character.id)}</p><p>{character.description}</p><a className="text-link" href="#character-profile" aria-label={`Explore ${character.name} profile`} onClick={() => exploreCharacter(character.id)}>Explore profile <ArrowRight size={14}/></a></div>
          </li>)}</ul>
        </div>
      </section>

      <Sanctuary motion={motion}/>

      <section className="voyage-section" id="voyage" aria-labelledby="voyage-title">
        <div className="voyage-heading"><h2 id="voyage-title">A voyage you<br/>take <em>together.</em></h2><p>Lumara is a retrospective game for teams.<br/>Reflect on your sprint, collect companions, and let the promises you keep restore your shared world.</p></div>
        <div className="voyage-path"><div className="voyage-tabs" role="tablist" aria-label="How a voyage works">{stages.map((stage,i) => <button key={stage.name} id={`stage-tab-${i}`} role="tab" aria-selected={activeStage === i} aria-controls="stage-panel" tabIndex={activeStage === i ? 0 : -1} onClick={() => setActiveStage(i)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : stages.length - 1)) % stages.length; setActiveStage(next); document.getElementById(`stage-tab-${next}`)?.focus(); } }}><span className="stage-number">{i + 1}</span><span>{stage.name}</span><ChevronRight size={18}/></button>)}</div><div className="voyage-detail" id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${activeStage}`} tabIndex={0}><img className="voyage-seren" src={`${import.meta.env.BASE_URL}art/seren/seren_face_${['happy', 'thinking', 'thinking', 'proud', 'proud', 'happy'][activeStage]}.webp`} alt="Seren guides your voyage" loading="lazy" decoding="async"/><h3>{stages[activeStage].name}</h3><p>{stages[activeStage].description}</p><span>{stages[activeStage].plain}</span></div></div>
        <div className="promise-kept"><span className="promise-spark"/><span className="promise-lamp"/><p>Confirm the promises you kept ? every one relights a lamp.</p></div><div className="seren-guide"><img src={`${import.meta.env.BASE_URL}art/seren/seren_chibi.webp`} alt="Chibi Seren" loading="lazy" decoding="async"/><p>Come back with a story.<br/>Leave with a promise.<span>Seren / Your guide through every voyage</span></p></div><div className="voyage-footnotes"><p><strong>Your thoughts stay anonymous.</strong> Share openly. Vote on what matters. Discuss together.</p><p><strong>Follow-through becomes visible.</strong> Action items carry into the next voyage, where fulfilled promises relight the Sanctuary.</p></div>
      </section>

      <Preregister background={WORLD} emblem={<Emblem/>}/>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#home"><Emblem/><span>LUMARA</span></a><p>A world waiting for its next dawn.<br/>Built around the promises we keep.</p><a href="#home" className="text-link">Back to the beginning <ArrowDown className="up-arrow" size={15}/></a></footer>

    <dialog ref={dialog} className={`art-dialog ${artworkChoices.length > 1 ? 'has-gallery' : ''}`} onCancel={() => setExpanded(null)} onClose={() => setExpanded(null)} aria-label={expanded === 'world' ? 'Lumara world artwork' : `${selected.name} artwork`} onClick={event => { if (event.target === event.currentTarget) setExpanded(null); }}><div className="dialog-body"><button className="dialog-close icon-button" onClick={() => setExpanded(null)} aria-label="Close artwork"><X/></button>{expanded && <Artwork src={activeArtwork.src} alt={expanded === 'world' ? 'The world of Lumara' : `${selected.name} — ${activeArtwork.label}`} eager/>}<div className="dialog-caption"><strong>{expanded === 'world' ? 'The world of Lumara' : selected.name}</strong><span aria-live="polite">{activeArtwork.label}</span>{artworkChoices.length > 1 && <span className="artwork-count">{artworkIndex + 1} / {artworkChoices.length}</span>}</div>{expanded && artworkChoices.length > 1 && <div className="gallery-options" role="group" aria-label="Artwork versions">{artworkChoices.map((artwork, index) => <button key={artwork.src} className="gallery-choice" aria-label={`View ${artwork.label} artwork`} aria-pressed={artworkIndex === index} onClick={() => setArtworkIndex(index)}><Artwork src={artwork.src} alt="" eager/><span>{artwork.label}</span></button>)}</div>}</div></dialog>
  </div>;
}
