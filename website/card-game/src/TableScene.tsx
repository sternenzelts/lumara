import type { CSSProperties, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { companions } from './catalog';
import type { GameState } from './game';
import { SceneEffect, type Playing, type Point } from './Effects';

/** One identity color per companion, used for the dot on each nameplate. */
export const companionColors: Record<string, string> = {
  seren: '#7c8fb0', mahesvara: '#2f3f78', keira: '#e46a9c', ayaka: '#8fb3e6', azrenth: '#c8303a', lucien: '#3c5a8a', ashvane: '#a8642f',
  suvara: '#3f8f87', sollene: '#8a7cc4', wren: '#4f9a5a', rook: '#8a6a3c', calla: '#7b4fae', kairo: '#3f9a96', dax: '#e0702a',
};

/**
 * Companions with their own high-resolution seated render in public/table/seated/<id>.webp (1024×1024, transparent,
 * same framing as an atlas cell). Add an id here once its file exists; everyone else uses the shared atlas.
 */
const seatedSingles = new Set<string>([]);

export function SeatedCompanion({ id }: { id: string }) {
  if (seatedSingles.has(id)) return <img className="seated-companion" src={`table/seated/${id}.webp`} alt="" aria-hidden="true" />;
  const index = Math.max(0, companions.findIndex(c => c.id === id));
  return <div className="seated-companion" aria-hidden="true" style={{
    backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%`,
  }} />;
}

/** "Ayaka played Time Stop." → "Played Time Stop." for a bubble that already sits on Ayaka. */
export function eventPhrase(text: string, name: string) {
  const rest = text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// The salon plate is 1672×941. Seats are placed in stage percentages so they stay on the painted table.
const STAGE_RATIO = 1672 / 941;
/** Height (stage %) of the painted table's back rim at a horizontal position (stage %). */
const rimTop = (x: number) => 61.7 - 24.2 * Math.sqrt(Math.max(0, 1 - ((x - 50) / 48.5) ** 2));

function seatLayout(count: number) {
  const width = count <= 3 ? 27 : count === 4 ? 22 : Math.max(12, 78 / count);
  const span = count <= 3 ? 31 * (count - 1) : 76;
  return Array.from({ length: count }, (_, order) => {
    const x = count === 1 ? 50 : 50 - span / 2 + order * span / (count - 1);
    return { x, width, top: rimTop(x) - .78 * width * STAGE_RATIO };
  });
}

/** Public seat information only. Opponents' private hands never enter this component. */
export default function TableScene({ game, me, effect, children }: { game: GameState; me: number; effect?: Playing | null; children: ReactNode }) {
  const opponents = game.seats.map((seat, index) => ({ ...seat, index })).filter(s => s.index !== me);
  const many = opponents.length > 4;
  const layout = seatLayout(opponents.length);
  const actor = game.stage?.actor ?? game.pending?.actor ?? game.current;
  const event = game.lastEvent;
  /** Where effects start and land, in stage percentages: a seat's chest, the deck, your hand, or the table centre. */
  const pointOf = (where: number | 'deck' | null): Point => {
    if (where === 'deck') return { x: 45, y: 47 };
    if (where === null) return { x: 50, y: 34 };
    if (where === me) return { x: 50, y: 66 };  // just above my fan, which covers the bottom of the stage
    const order = opponents.findIndex(o => o.index === where); const seat = layout[order];
    return seat ? { x: seat.x, y: seat.top + seat.width * STAGE_RATIO * .42 } : { x: 50, y: 34 };
  };
  return <div className={`table-scene ${many ? 'large-party' : ''} ${effect?.fx.shake ? 'shake' : ''}`} role="group" aria-label="Companions seated around the table">
    <div className="scene-stage">
      <img className="salon-plate" src="table/salon-v1.webp" alt="" fetchPriority="high" />
      <div className="scene-seats">
        {opponents.map((seat, order) => {
          const { x, width, top } = layout[order];
          const active = actor === seat.index && game.alive[seat.index] && game.winner === null;
          const count = game.alive[seat.index] ? game.counts[seat.index] : 0;
          const visibleCards = Math.min(count, 5);
          const said = event && event.seat === seat.index ? eventPhrase(event.text, seat.name) : null;
          return <div key={seat.index} className={`scene-seat ${active ? 'seat-active' : ''} ${game.alive[seat.index] ? '' : 'seat-out'} ${x > 60 ? 'tag-left' : ''}`}
            style={{ '--seat-order': order, left: `${x - width / 2}%`, top: `${top}%`, width: `${width}%` } as CSSProperties}>
            <SeatedCompanion id={seat.companion} />
            <div className="seat-card-fan" aria-hidden="true">{Array.from({ length: visibleCards }, (_, index) => <span key={index} style={{ '--card-angle': `${(index - (visibleCards - 1) / 2) * 13}deg`, '--card-x': `${(index - (visibleCards - 1) / 2) * 6}%` } as CSSProperties}><Sparkles /></span>)}</div>
            <div className="seat-tag">
              <div className="seat-nameplate" style={{ '--seat-color': companionColors[seat.companion] } as CSSProperties}><strong title={seat.name}>{seat.name}</strong><span>{game.alive[seat.index] ? `${count} cards${active ? ' · Playing' : ''}` : 'Light extinguished'}</span></div>
              {said && <p key={event!.id} className="seat-bubble">{said}</p>}
            </div>
          </div>;
        })}
      </div>
      <img className="table-foreground" src="table/salon-v1.webp" alt="" aria-hidden="true" />
      <div className="scene-piles">{children}</div>
      {effect && <SceneEffect key={effect.event.id} playing={effect} pointOf={pointOf} />}
    </div>
  </div>;
}
