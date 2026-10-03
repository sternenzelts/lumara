import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { characterById, type CharacterDef } from '../data/characters';
import { useReducedMotion } from '../hooks';
import GenericReveal from './GenericReveal';
import { createRuntime as ayaka } from './reveal/ayaka-approved.js';
import { createRuntime as mahesvara } from './reveal/mahesvara-approved.js';
import { createRuntime as keira } from './reveal/keira-approved.js';
import { markup as ayakaMarkup } from './reveal/ayaka-markup.js';
import { markup as mahesvaraMarkup } from './reveal/mahesvara-markup.js';
import { markup as keiraMarkup } from './reveal/keira-markup.js';
import { createRuntime as seren } from './reveal/seren-approved.js';
import { markup as serenMarkup } from './reveal/seren-markup.js';
import { createRuntime as azrenth } from './reveal/azrenth-approved.js';
import { markup as azrenthMarkup } from './reveal/azrenth-markup.js';
import { createRuntime as lucien } from './reveal/lucien-approved.js';
import { markup as lucienMarkup } from './reveal/lucien-markup.js';
import { createRuntime as suvara } from './reveal/suvara-approved.js';
import { markup as suvaraMarkup } from './reveal/suvara-markup.js';
import { createRuntime as ashvane } from './reveal/ashvane-approved.js';
import { markup as ashvaneMarkup } from './reveal/ashvane-markup.js';
import './approved-reveals.css';
import './seren-reveal.css';
import './reveal-landscapes.css';
import './azrenth-reveal.css';
import './lucien-reveal.css';
import './suvara-reveal.css';
import './ashvane-reveal.css';
const reveals = { ayaka: { create: ayaka, markup: ayakaMarkup }, mahesvara: { create: mahesvara, markup: mahesvaraMarkup }, keira: { create: keira, markup: keiraMarkup }, seren: { create: seren, markup: serenMarkup }, azrenth: { create: azrenth, markup: azrenthMarkup }, lucien: { create: lucien, markup: lucienMarkup }, suvara: { create: suvara, markup: suvaraMarkup }, ashvane: { create: ashvane, markup: ashvaneMarkup } };
interface RevealProps { onDone: () => void; character?: CharacterDef; autoAdvance?: boolean; onSkip?: () => void }
function ApprovedReveal({ character, onDone, autoAdvance = false, onSkip }: RevealProps & { character: CharacterDef }) {
  const host = useRef<HTMLDivElement>(null);
  const done = useRef(onDone); done.current = onDone;
  const skip = useRef(onSkip); skip.current = onSkip;
  const reduced = useReducedMotion();
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  useEffect(() => { if (readyToAdvance) host.current?.focus({ preventScroll: true }); }, [readyToAdvance]);
  const reveal = reveals[character.id as keyof typeof reveals];
  useLayoutEffect(() => {
    const root = host.current!;
    root.innerHTML = reveal.markup.replaceAll('__BASE__', import.meta.env.BASE_URL);
    const next = root.querySelector<HTMLButtonElement>('#continue')!;
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    const engine = reveal.create(root, () => {
      clearTimeout(advanceTimer);
      if (autoAdvance && character.grade === 'A') advanceTimer = setTimeout(() => done.current(), 1400);
      else if (autoAdvance) setReadyToAdvance(true);
      else next.hidden = false;
    }, import.meta.env.BASE_URL);
    next.onclick = () => done.current();
    let controlled = false;
    root.querySelector<HTMLButtonElement>('#replay')!.onclick = () => { setReadyToAdvance(false); clearTimeout(advanceTimer); controlled = true; next.hidden = true; if (reduced) engine.skip(); else void engine.replay(); };
    const skipButton = root.querySelector<HTMLButtonElement>('#skip')!;
    skipButton.textContent = onSkip ? 'Skip A reveals' : 'Skip';
    skipButton.onclick = () => { if (skip.current) skip.current(); else { controlled = true; engine.skip(); } };
    let canceled = false;
    const ready = Promise.all([...root.querySelectorAll<HTMLImageElement>('img[src]')].map(image => image.decode().catch(() => {})));
    void ready.then(() => { if (!canceled && !controlled) { if (reduced) engine.skip(); else void engine.replay(); } });
    return () => { canceled = true; clearTimeout(advanceTimer); engine.dispose(); root.innerHTML = ''; };
  }, [character.id, reduced, reveal, autoAdvance]);
  return <div ref={host} className={`approved-reveal ${readyToAdvance ? 'reveal-awaiting-click' : ''}`} data-character={character.id} aria-label={`${character.name} character reveal`} onClick={event => {
    if (readyToAdvance && !(event.target as Element).closest('button,input')) done.current();
  }} onKeyDown={event => {
    if (readyToAdvance && (event.key === 'Enter' || event.key === ' ') && !(event.target as Element).closest('button,input')) { event.preventDefault(); done.current(); }
  }} tabIndex={readyToAdvance ? 0 : undefined} />;
}
export default function SplusplusReveal({ character = characterById('ayaka')!, ...props }: RevealProps) {
  return character.id in reveals ? <ApprovedReveal character={character} {...props} /> : <GenericReveal character={character} {...props} />;
}
