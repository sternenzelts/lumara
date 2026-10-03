import { useEffect, useState, type ReactNode } from 'react';

/**
 * Title screen shown once per visit. Browsers only allow sound after a tap, so "Tap to enter" is that tap:
 * it starts the music (via the 'lumara-enter' event) and fades into the site.
 */
export default function EntryGate({ background, seren, emblem }: { background: string; seren: string; emblem: ReactNode }) {
  const [open, setOpen] = useState(() => { try { return sessionStorage.getItem('lumara.entered') !== '1'; } catch { return true; } });
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const enter = (music: boolean) => {
    try { sessionStorage.setItem('lumara.entered', '1'); } catch { /* storage off */ }
    window.dispatchEvent(new CustomEvent('lumara-enter', { detail: music }));
    setLeaving(true);
    window.setTimeout(() => setOpen(false), 900);
  };
  return <div className={`entry-gate ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Welcome to Lumara">
    <div className="entry-bg" style={{ backgroundImage: `url("${background}")` }} aria-hidden="true" />
    <img className="entry-seren" src={seren} alt="" aria-hidden="true" />
    <div className="entry-content">
      <div className="entry-logo">{emblem}<span>LUMARA</span></div>
      <p className="entry-tagline">Where every vow becomes light.</p>
      <button className="entry-tap" onClick={() => enter(true)} autoFocus>Tap to enter</button>
    </div>
  </div>;
}
