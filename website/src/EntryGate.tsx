import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Play } from 'lucide-react';

const TRAILER = `${import.meta.env.BASE_URL}video/lumara-anima-trailer.mp4`;
const POSTER = `${import.meta.env.BASE_URL}video/poster.jpg`;

/** Title screen, optional trailer, then the website. Shown once per visit. */
export default function EntryGate({ background, seren, emblem }: { background: string; seren: string; emblem: ReactNode }) {
  const [open, setOpen] = useState(() => { try { return sessionStorage.getItem('lumara.entered') !== '1'; } catch { return true; } });
  const [step, setStep] = useState<'welcome' | 'choice' | 'trailer'>('welcome');
  const [leaving, setLeaving] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const watchButton = useRef<HTMLButtonElement>(null);
  const entered = useRef(false);
  const playRequest = useRef(0);
  const exitTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const clip = video.current!;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    if (!element.open) element.showModal();
    return () => {
      window.clearTimeout(exitTimer.current);
      playRequest.current++;
      clip.pause();
      clip.removeAttribute('src');
      clip.load();
      element.close();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (step === 'choice') watchButton.current?.focus({ preventScroll: true });
    if (step === 'trailer') video.current?.focus({ preventScroll: true });
  }, [step, open]);

  const enter = () => {
    if (entered.current) return;
    entered.current = true;
    playRequest.current++;
    video.current?.pause();
    try { sessionStorage.setItem('lumara.entered', '1'); } catch { /* storage off */ }
    window.dispatchEvent(new CustomEvent('lumara-enter', { detail: true }));
    setLeaving(true);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    exitTimer.current = window.setTimeout(() => {
      dialog.current?.close();
      setOpen(false);
      document.querySelector<HTMLElement>('#main .button-primary')?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 900);
  };

  const watch = () => {
    const clip = video.current;
    if (!clip || entered.current) return;
    const request = ++playRequest.current;
    setStep('trailer');
    setError('');
    setBuffering(true);
    window.dispatchEvent(new Event('lumara-voice-stop'));
    // The element is already mounted: begin playback inside the visitor's click, including on phones.
    if (!clip.getAttribute('src')) clip.src = TRAILER;
    else if (clip.error) clip.load();
    void clip.play().then(() => {
      if (request !== playRequest.current || entered.current) { clip.pause(); return; }
      setBuffering(false);
    }).catch(reason => {
      if (request !== playRequest.current || entered.current) return;
      setBuffering(false);
      setError(reason instanceof DOMException && reason.name === 'NotAllowedError'
        ? 'Press play to start the trailer.'
        : 'The trailer could not play. Try again or skip to Lumara.');
    });
  };

  if (!open) return null;
  return <dialog ref={dialog} className={`entry-gate is-${step} ${leaving ? 'leaving' : ''}`}
    aria-label={step === 'trailer' ? 'Lumara trailer' : step === 'choice' ? 'Watch the Lumara trailer' : 'Welcome to Lumara'}
    onCancel={event => { event.preventDefault(); enter(); }}>
    <div className="entry-bg" style={{ backgroundImage: `url("${background}")` }} aria-hidden="true" />
    <img className="entry-seren" src={seren} alt="" aria-hidden="true" />
    {step === 'welcome' && <div className="entry-content">
      <div className="entry-logo">{emblem}<span>LUMARA</span></div>
      <p className="entry-tagline">Where every vow becomes light.</p>
      <button className="entry-tap" onClick={() => setStep('choice')} autoFocus>Tap to enter</button>
    </div>}
    {step === 'choice' && <div className="entry-content entry-choice">
      <div className="entry-logo">{emblem}<span>LUMARA</span></div>
      <h2>Watch the trailer?</h2>
      <p>1 minute 30 seconds · ANIMA</p>
      <div className="entry-actions">
        <button ref={watchButton} className="entry-tap entry-watch" onClick={watch}><Play size={18} aria-hidden="true"/>Watch trailer</button>
        <button className="entry-skip" onClick={enter}>Skip trailer<ArrowRight size={17} aria-hidden="true"/></button>
      </div>
    </div>}
    <div className="entry-player" hidden={step !== 'trailer'}>
      <div className="entry-player-header">
        <div><h2>Lumara trailer</h2><p>ANIMA · 1:30</p></div>
        <button className="entry-skip" onClick={enter}>Skip trailer<ArrowRight size={17} aria-hidden="true"/></button>
      </div>
      <div className="entry-video-stage">
        <video ref={video} className="entry-video" controls playsInline preload="none" tabIndex={0}
          poster={step === 'trailer' ? POSTER : undefined} aria-label="Lumara ANIMA trailer"
          onEnded={enter}
          onWaiting={() => { if (!entered.current) setBuffering(true); }}
          onPlaying={() => { if (entered.current) { video.current?.pause(); return; } setBuffering(false); setError(''); }}
          onCanPlay={() => setBuffering(false)}
          onError={() => { if (!entered.current) { setBuffering(false); setError('The trailer could not load. Try again or skip to Lumara.'); } }}/>
        {buffering && !error && <p className="entry-video-loading" role="status">Loading trailer…</p>}
      </div>
      {error && <div className="entry-video-error" role="status"><p>{error}</p><button className="entry-retry" onClick={watch}>Try again</button></div>}
    </div>
  </dialog>;
}
