import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Framed game window over the Sanctuary holding the current stage's content (the spec's button fallback). */
export default function VoyageWindow({ title, open, onClose, children, variant }: { title: string; open: boolean; onClose: () => void; children: ReactNode; variant?: 'vow-review' }) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [open, onClose]);
  if (!open) return null;
  return <section className={`voyage-window${variant ? ` voyage-window--${variant}` : ''}`} role="dialog" aria-label={title}>
    <header><h2>{title}</h2><button className="voyage-window-close" aria-label="Close" onClick={onClose}><X size={18} /></button></header>
    <div className="voyage-window-body">{children}</div>
  </section>;
}
