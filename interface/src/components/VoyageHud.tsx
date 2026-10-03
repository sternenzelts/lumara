import { ArrowLeft, ArrowRight, DoorOpen, Pause, Play, ScrollText } from 'lucide-react';

/** Sanctuary HUD during a voyage: where the party is, the stage action, and the Warden's pace controls. */
export default function VoyageHud({ progress, paused, warden, busy, canBack, nextLabel, actionLabel, onBack, onNext, onOpen, onPauseToggle, onLobby }: {
  progress: { title: string; index: number; total: number } | null; paused: boolean;
  warden: boolean; busy: boolean; canBack: boolean; nextLabel: string; actionLabel: string;
  onBack: () => void; onNext: () => void; onOpen: () => void; onPauseToggle?: () => void; onLobby?: () => void;
}) {
  return <div className="voyage-hud">
    {progress && <p className="voyage-stage-label" aria-live="polite"><span>{progress.title} · {progress.index} of {progress.total}</span>{paused && <em>Paused</em>}</p>}
    {!progress && paused && <p className="voyage-stage-label"><em>Paused</em></p>}
    <button className="voyage-action" onClick={onOpen}><ScrollText size={18} />{actionLabel}</button>
    {warden ? <div className="voyage-warden" role="group" aria-label="Warden controls">
      {onLobby && <button disabled={busy} onClick={onLobby} aria-label="Return to lobby"><DoorOpen size={16} /><span className="voyage-btn-text">Return to lobby</span></button>}
      <button disabled={busy || !canBack} onClick={onBack}><ArrowLeft size={16} />Back</button>
      {onPauseToggle && <button disabled={busy} onClick={onPauseToggle} aria-pressed={paused} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? <Play size={16} /> : <Pause size={16} />}<span className="voyage-btn-text">{paused ? 'Resume' : 'Pause'}</span></button>}
      <button className="voyage-next" disabled={busy || paused} onClick={onNext}>{nextLabel}<ArrowRight size={16} /></button>
    </div> : <p className="voyage-follow">Your Warden guides the stages.</p>}
  </div>;
}
