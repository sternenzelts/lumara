import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import VowJournal from './VowJournal';

/** Keep the voyage and its walking scene mounted while reading the journal. */
export default function VowJournalWindow({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    return () => { el?.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="voyage-window vow-journal-window" aria-label="Vow journal"
    onCancel={e => { e.preventDefault(); onClose(); }}>
    <header><h2>Vow journal</h2><button className="voyage-window-close" aria-label="Close vow journal" onClick={onClose}><X size={18} /></button></header>
    <div className="voyage-window-body"><VowJournal /></div>
  </dialog>;
}
