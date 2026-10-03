import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { WORLD, type Character } from './characters';

/** Remount on character selection so a companion always starts in their first form. */
export default function CharacterPresentation({ character, motion, covered }: { character: Character; motion: boolean; covered: boolean }) {
  const forms = character.grade === 'S++' && character.forms?.length
    ? character.forms
    : [{ label: character.title, cutout: character.cutout || character.splash!, background: character.splash || WORLD }];
  const multiple = forms.length > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(!multiple);
  const [unavailable, setUnavailable] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [onscreen, setOnscreen] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const figure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!multiple) return;
    let cancelled = false;
    // Decode both artwork planes before starting; slow connections keep the first form visible.
    const urls = [...new Set(forms.flatMap(form => [form.cutout, form.background]))];
    Promise.all(urls.map(src => {
      const image = new Image();
      image.src = src;
      return image.decode();
    })).then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setUnavailable(true); });
    return () => { cancelled = true; };
  }, [character]);

  useEffect(() => {
    if (!multiple || !figure.current) return;
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting), { threshold: 0 });
    observer.observe(figure.current);
    const visibility = () => setHidden(document.hidden);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(preference.matches);
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', change);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      preference.removeEventListener('change', change);
    };
  }, [multiple]);

  useEffect(() => {
    if (!multiple || !ready || !motion || reduced || paused || !onscreen || hidden || covered) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % forms.length), 3000);
    return () => window.clearInterval(timer);
  }, [multiple, ready, motion, reduced, paused, onscreen, hidden, covered, forms.length]);

  return <>
    <div className="character-backdrop" aria-hidden="true">
      {forms.map((form, i) => <div key={form.cutout} className={`character-backdrop-layer ${index === i ? 'is-active' : ''}`} style={{ backgroundImage: `url("${form.background}")` }}/>) }
    </div>
    <div ref={figure} className={`character-figure ${character.cutout ? '' : 'splash-only'} ${multiple ? 'has-forms' : ''}`} data-form={forms[index].label}>
      {forms.map((form, i) => <img key={form.cutout} className={`character-form ${index === i ? 'is-active' : ''}`} src={form.cutout} alt={index === i ? `${character.name}, ${form.label}` : ''} aria-hidden={index !== i} loading="lazy" decoding="async" onError={() => setFailedImages(current => current.includes(form.cutout) ? current : [...current, form.cutout])}/>) }
      {failedImages.includes(forms[index].cutout) && <div className="art-unavailable form-unavailable"><span>Artwork is unavailable. Refresh to retry.</span></div>}
    </div>
    {multiple && <div className="character-form-controls" role="group" aria-label={`${character.name} forms`}>
      {forms.map((form, i) => <button key={form.cutout} className="form-choice" aria-pressed={index === i} disabled={i > 0 && !ready} onClick={() => { setIndex(i); setPaused(true); }}>{form.label}</button>)}
      {motion && !reduced && <button className="icon-button form-pause" disabled={!ready} aria-pressed={paused} aria-label={paused ? 'Resume form rotation' : 'Pause form rotation'} onClick={() => setPaused(current => !current)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>}
      {!ready && <span className="form-loading" role="status">{unavailable ? 'Alternate form unavailable. Refresh to retry.' : 'Loading forms…'}</span>}
    </div>}
  </>;
}
