import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, Shield, Sparkles, X } from 'lucide-react';
import { cardDefs, companionFor, officialOriginal, officialParty, type CardType } from './catalog';
import type { Edition } from './game';

const lessons = ['Your hand', 'Your turn', 'Stay alive', 'Steal cards', 'Attack & Skip', 'Nullify'];

function ExampleCard({ type, label }: { type?: CardType; label?: string }) {
  const def = type ? cardDefs[type] : null;
  return <figure className="lesson-card" style={{ '--accent': def?.color || '#263c4c' } as CSSProperties}>
    {def ? <><img src={companionFor(def.companion).art} alt="" /><figcaption><span>{def.rule}</span><strong>{def.title}</strong></figcaption></> : <><div className="lesson-back"><Sparkles aria-hidden="true" /><strong>Lumara</strong></div><figcaption><strong>{label || 'A hidden card'}</strong></figcaption></>}
  </figure>;
}

export default function Rules({ close, edition }: { close: () => void; edition: Edition }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [protectedExample, setProtectedExample] = useState(true);
  const [combo, setCombo] = useState(2);
  const [nopes, setNopes] = useState(0);
  useEffect(() => {
    const el = dialog.current!;
    const trigger = document.activeElement as HTMLElement;
    el.showModal();
    return () => { el.close(); trigger?.focus(); };
  }, []);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
    navigation.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [step]);
  const arrow = <ArrowRight className="lesson-arrow" aria-hidden="true" />;
  return <dialog ref={dialog} className="rules-dialog illustrated-rules" onCancel={close} aria-labelledby="rules-title">
    <div className="dialog-heading"><div><h2 id="rules-title">How to play Last Light</h2><p>Keep your light. Be the last player standing.</p></div><button className="icon-button" onClick={close} aria-label="Close rules" autoFocus><X /></button></div>
    <nav ref={navigation} className="lesson-nav" aria-label="Choose a lesson">{lessons.map((label, i) => <button key={label} onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}><span>{i + 1}</span>{label}</button>)}</nav>
    <div className="lesson-content" ref={content}>
      <section className="lesson" aria-labelledby="lesson-title" key={step}>
        <div className="lesson-copy" aria-live="polite">
          <h3 id="lesson-title">{['Eight cards. One lifeline.', 'Play first. Draw last.', 'A Collapse is trouble.', 'A pair is better than one.', 'Pass the trouble along.', 'One little “no” changes everything.'][step]}</h3>
          <p>{[
            'Everyone starts with 1 Dawn’s Protection and 7 random safe cards. Keep your hand private.',
            'Play as many actions as you like, or none. Draw one card to end your turn.',
            'Dawn’s Protection is your Defuse. Without one, drawing a World Collapse puts you out of the game.',
            'Companion cards are our Cat cards. A single one has no effect. Collect matching cards to steal.',
            'Double Strike ends your turn without drawing and makes the next player take two turns. Time Stop skips just one turn.',
            'Nullify is our Nope. Use it from your hand to cancel a pending action—even on someone else’s turn.',
          ][step]}</p>
        </div>
        {step === 0 && <><div className="lesson-scene"><ExampleCard type="defuse" /><span className="lesson-plus" aria-hidden="true">+</span><div className="starting-hand"><div className="mini-hand" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ '--i': i } as CSSProperties}><Sparkles /></span>)}</div><strong>7 random cards</strong></div></div><p className="lesson-result"><Shield size={18} aria-hidden="true" /> You begin with 8 cards, including one Protection.</p></>}
        {step === 1 && <><div className="lesson-scene turn-example"><ExampleCard type="shuffle" />{arrow}<ExampleCard type="future" />{arrow}<ExampleCard label="Draw to end your turn" /></div><p className="lesson-result">You could Shuffle, peek at the future, then draw. Drawing a safe card passes the turn.</p></>}
        {step === 2 && <><div className="lesson-toggle" aria-label="Protection example"><button aria-pressed={protectedExample} onClick={() => setProtectedExample(true)}>With Protection</button><button aria-pressed={!protectedExample} onClick={() => setProtectedExample(false)}>Without Protection</button></div><div className={`lesson-scene ${protectedExample ? '' : 'collapse-example'}`}><ExampleCard type="collapse" />{arrow}{protectedExample ? <ExampleCard type="defuse" /> : <div className="lesson-out"><X aria-hidden="true" /><strong>Your light goes out.</strong><span>You’re out of this round.</span></div>}</div><p className="lesson-result" role="status">{protectedExample ? 'Protection is used automatically. Then secretly return the Collapse anywhere in the deck—even on top.' : 'No Protection means elimination. Your remaining cards are removed privately. The last survivor wins.'}</p></>}
        {step === 3 && <><div className="lesson-toggle" aria-label="Stealing example"><button aria-pressed={combo === 2} onClick={() => setCombo(2)}>2 matching · blind pick</button><button aria-pressed={combo === 3} onClick={() => setCombo(3)}>3 matching · choose a card</button></div><div className="lesson-scene combo-scene"><div className="matching-cards">{Array.from({ length: combo }, (_, i) => <ExampleCard key={i} type="ashvane" />)}</div>{arrow}<ExampleCard type={combo === 3 ? 'defuse' : undefined} label="Pick one face-down card" /></div><p className="lesson-result" role="status">{combo === 2 ? 'Choose another player. Play two Ashvane cards, then choose one face-down card from their hand.' : 'Choose a player and ask for a specific card, such as Protection. You get it only if they have it.'}</p><p className="lesson-note">{edition === 'party' ? 'Digital Mimic can stand in for a Companion. Matching pairs and trios also work with other identical card titles.' : 'Matching pairs and trios also work with other identical card titles.'}</p></>}
        {step === 4 && <><div className="lesson-scene attack-scene"><div><ExampleCard type="attack" /><p><SwordsIcon /> Next player: <strong>2 turns</strong></p></div><div><ExampleCard type="skip" /><p><Check size={17} aria-hidden="true" /> Skip <strong>1 turn</strong></p></div></div><p className="lesson-result">Under attack with 2 turns left? A Time Stop leaves 1. Playing another Double Strike passes the remaining turns + 2.</p></>}
        {step === 5 && <><div className="lesson-scene"><ExampleCard type="attack" />{arrow}<div className="nullify-example"><ExampleCard type="nope" /><span className={nopes % 2 ? 'cancelled-action' : 'restored-action'}>{nopes === 0 ? 'Action is pending' : nopes % 2 ? 'Action cancelled' : 'Action restored'}</span></div></div><button className="button secondary demo-nope" onClick={() => setNopes(n => n + 1)}>{nopes % 2 ? 'Nullify again to restore it' : 'Try a Nullify'} <ArrowRight size={17} /></button><p className="lesson-result" role="status">{nopes === 0 ? 'Try the example. Nullify cancels an action; another Nullify brings it back.' : `${nopes} Nullify ${nopes === 1 ? 'played' : 'cards played'}. ${nopes % 2 ? 'The Attack will not happen.' : 'The Attack will happen again.'}`}</p><p className="lesson-note">There is no timer. A played card waits only for players holding a Nullify, and after each Nullify they decide again. Nullify cannot stop a Collapse or Protection.</p></>}
      </section>
      <details className="illustrated-catalog"><summary>Explore every {edition === 'party' ? 'Party Pack' : 'Original'} card</summary><div>{Object.entries(cardDefs).filter(([type]) => edition === 'party' || !['targeted', 'alter', 'bottom', 'wild'].includes(type)).map(([type, def]) => <article key={type}><ExampleCard type={type as CardType} /><p>{def.text}</p></article>)}</div></details>
      <a className="text-link official-rules" href={edition === 'party' ? officialParty : officialOriginal} target="_blank" rel="noreferrer">Publisher’s official rules <ArrowRight size={16} /></a>
    </div>
    <div className="lesson-footer"><button className="text-link" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ArrowLeft size={17} /> Previous</button><span>{step + 1} of {lessons.length}</span><button className="button primary" onClick={() => step === lessons.length - 1 ? close() : setStep(s => s + 1)}>{step === lessons.length - 1 ? 'Ready to play' : 'Next'} <ArrowRight size={17} /></button></div>
  </dialog>;
}

function SwordsIcon() { return <ArrowRight size={17} aria-hidden="true" />; }
