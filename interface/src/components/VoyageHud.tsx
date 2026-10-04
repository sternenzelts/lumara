import { useState } from 'react';
import { ArrowLeft, ArrowRight, DoorOpen, Pause, Play, ScrollText, Undo2 } from 'lucide-react';

/** Sanctuary HUD during a voyage: where the party is, the stage action, and the Warden's pace controls. */
export default function VoyageHud({ progress, paused, warden, busy, canBack, nextLabel, actionLabel, onBack, onNext, onOpen, onPauseToggle, onLobby, onCancel }: {
  progress: { title: string; index: number; total: number } | null; paused: boolean;
  warden: boolean; busy: boolean; canBack: boolean; nextLabel: string; /** null hides the button (the stage opens from the map instead). */ actionLabel: string | null;
  onBack: () => void; onNext: () => void; onOpen: () => void; onPauseToggle?: () => void; onLobby?: () => void; /** Warden/admin: wipe this voyage as if it never happened. */ onCancel?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return <div className="voyage-hud">
    {progress && <p className="voyage-stage-label" aria-live="polite"><span>{progress.title} · {progress.index} of {progress.total}</span>{paused && <em>Paused</em>}</p>}
    {!progress && paused && <p className="voyage-stage-label"><em>Paused</em></p>}
    {actionLabel && <button className="voyage-action" onClick={onOpen}><ScrollText size={18} />{actionLabel}</button>}
    {warden ? <div className="voyage-warden" role="group" aria-label="Warden controls">
      {onCancel && <button disabled={busy} onClick={() => setConfirming(true)} aria-label="Cancel voyage" className="voyage-cancel"><Undo2 size={16} /><span className="voyage-btn-text">Cancel voyage</span></button>}
      {onLobby && <button disabled={busy} onClick={onLobby} aria-label="Return to lobby"><DoorOpen size={16} /><span className="voyage-btn-text">Return to lobby</span></button>}
      <button disabled={busy || !canBack} onClick={onBack}><ArrowLeft size={16} />Back</button>
      {onPauseToggle && <button disabled={busy} onClick={onPauseToggle} aria-pressed={paused} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? <Play size={16} /> : <Pause size={16} />}<span className="voyage-btn-text">{paused ? 'Resume' : 'Pause'}</span></button>}
      <button className="voyage-next" disabled={busy || paused} onClick={onNext}>{nextLabel}<ArrowRight size={16} /></button>
    </div> : <p className="voyage-follow">Your Warden guides the stages.</p>}
    {warden && confirming && onCancel && <div className="voyage-confirm" role="alertdialog" aria-modal="true" aria-labelledby="voyage-confirm-title">
      <h3 id="voyage-confirm-title">Cancel this voyage?</h3>
      <p>Every thought, vote and vow from it is erased for everyone, along with the Starlight and free wishes it gave, as if it never happened. You can then start a fresh voyage.</p>
      <div><button autoFocus onClick={() => setConfirming(false)}>Keep voyage</button><button className="danger" disabled={busy} onClick={() => { setConfirming(false); onCancel(); }}>Cancel voyage</button></div>
    </div>}
  </div>;
}
