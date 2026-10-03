import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import type { CharacterDef } from '../data/characters';
import { CHARACTER_KITS } from '../data/characterKits';
import { Art, GradeBadge } from './ui';
import './character-details-popup.css';

export default function CharacterDetailsPopup({ character, companions = [], onClose, onPreview }: { character: CharacterDef; companions?: CharacterDef[]; onClose: () => void; onPreview?: (character: CharacterDef) => void }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const controls = [...panel.current!.querySelectorAll<HTMLElement>('button,a[href],[tabindex="0"]')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return createPortal(<div className="character-popup-scrim" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} className="character-popup" role="dialog" aria-modal="true" aria-labelledby="character-popup-name">
      <button ref={close} className="character-popup-close" onClick={onClose} aria-label="Close character details"><X size={23} /></button>
      <div className="character-popup-scroll" tabIndex={0} aria-label={`${character.name} and supporting character details`}>
        {[character, ...companions].map((entry, index) => {
          const kit = CHARACTER_KITS[entry.id];
          return <section key={entry.id} className="character-popup-entry" aria-label={`${entry.name} details`}>
            <div className="character-popup-art"><Art character={entry} kind="cutout" decorative /></div>
            <div className="character-popup-copy">
              <GradeBadge grade={entry.grade} />{index === 0 ? <h2 id="character-popup-name">{entry.name}</h2> : <h3>{entry.name}</h3>}
              {(kit?.title || entry.title) && <p className="character-popup-title">{kit?.title || entry.title}</p>}<span className="character-popup-element">{entry.element}</span><p className="character-popup-flavor">{entry.flavor}</p>
              {kit && <dl>{kit.abilities.map(ability => <div key={ability.name}><dt>{ability.name}</dt><dd>{ability.description}</dd></div>)}</dl>}
              {(entry.id === 'seren' || entry.id === 'lucien') && onPreview && <button className="character-popup-preview" aria-label={`Preview ${entry.name} reveal`} title={`Preview ${entry.name} reveal`} onClick={() => onPreview(entry)}><Play size={22} /></button>}
            </div>
          </section>;
        })}
      </div>
    </section>
  </div>, document.body);
}
