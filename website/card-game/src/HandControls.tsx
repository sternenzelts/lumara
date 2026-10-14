import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';

export default function HandControls({ arranging, locked, offered, count, cardName, index, onToggle, onShuffle, onMove }: {
  arranging: boolean; locked: boolean; offered: boolean; count: number; cardName: string | null; index: number;
  onToggle: () => void; onShuffle: () => void; onMove: (delta: number) => void;
}) {
  return <div className="hand-order-controls" aria-label="Arrange your hand">
    <div className="hand-order-buttons">
      <button className="text-link" aria-pressed={arranging} disabled={locked || count < 2} onClick={onToggle}>{arranging ? 'Done arranging' : 'Arrange hand'}</button>
      <button className="text-link" disabled={locked || count < 2} onClick={onShuffle}><Shuffle size={16} aria-hidden="true"/>Shuffle hand</button>
    </div>
    {arranging && !locked && <div className="hand-move-controls">
      <p>{cardName ? `Move ${cardName}` : 'Choose a card to move, or drag it into place.'}</p>
      <button className="icon-button" disabled={index <= 0} aria-label="Move selected card left" onClick={() => onMove(-1)}><ArrowLeft size={18}/></button>
      <button className="icon-button" disabled={index < 0 || index >= count - 1} aria-label="Move selected card right" onClick={() => onMove(1)}><ArrowRight size={18}/></button>
    </div>}
    {offered && <p className="hand-order-note">Hand order is locked while a card is being stolen.</p>}
  </div>;
}
