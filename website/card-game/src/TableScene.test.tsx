import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TableScene from './TableScene';
import { createState } from './game';

describe('seated table public information', () => {
  it('renders public counts without reading any private hands or future cards', () => {
    const game = createState(4);
    game.phase = 'playing';
    game.counts = [8, 6, 0, 7];
    Object.defineProperty(game, 'hands', { get: () => { throw new Error('Private hands must not be read'); } });
    Object.defineProperty(game, 'future', { get: () => { throw new Error('Private future must not be read'); } });
    const html = renderToStaticMarkup(<TableScene game={game} me={0}><span>Live piles</span></TableScene>);
    expect(html).toContain('6 cards');
    expect(html).toContain('0 cards');
    expect(html).toContain('7 cards');
    expect(html).not.toContain('8 cards');
  });

  it('highlights the player making a private special action instead of the turn owner', () => {
    const game = createState(4);
    game.phase = 'playing';
    game.current = 1;
    game.stage = { type: 'favor', actor: 2, recipient: 1 };
    const html = renderToStaticMarkup(<TableScene game={game} me={0}>{null}</TableScene>);
    expect(html).toMatch(/scene-seat seat-active[^]*?Player 3/);
    expect((html.match(/seat-active/g) || []).length).toBe(1);
  });

  it('keeps eliminated players visible without card backs or an active turn marker', () => {
    const game = createState(2);
    game.phase = 'playing';
    game.current = 1;
    game.alive[1] = false;
    game.counts[1] = 8;
    const html = renderToStaticMarkup(<TableScene game={game} me={0}>{null}</TableScene>);
    expect(html).toContain('Light extinguished');
    expect(html).not.toContain('seat-active');
    expect(html).not.toContain('--card-angle');
  });

  it('shows every opponent in a ten-player room and safely escapes player names', () => {
    const game = createState(10);
    game.seats[9].name = '<script>test</script>';
    const html = renderToStaticMarkup(<TableScene game={game} me={3}>{null}</TableScene>);
    expect((html.match(/class="seat-nameplate"/g) || []).length).toBe(9);
    expect(html).toContain('large-party');
    expect(html).toContain('&lt;script&gt;test&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('puts a speech bubble with the latest move over the seat that made it', () => {
    const game = createState(4);
    game.phase = 'playing';
    game.seats[2].name = 'Ayaka';
    game.lastEvent = { id: 7, seat: 2, text: 'Ayaka played Time Stop.', kind: 'play', card: 'skip' };
    const html = renderToStaticMarkup(<TableScene game={game} me={0}>{null}</TableScene>);
    expect((html.match(/class="seat-bubble"/g) || []).length).toBe(1);
    expect(html).toMatch(/seat-bubble[^]*?Played Time Stop\./);
    expect(html).toMatch(/Ayaka[^]*?seat-bubble|seat-bubble[^]*?Ayaka/);
  });

  it('shows no seat bubble for my own moves or events without a seat', () => {
    const game = createState(4);
    game.phase = 'playing';
    game.lastEvent = { id: 3, seat: 0, text: 'Player 1 drew a card.', kind: 'draw' };
    expect(renderToStaticMarkup(<TableScene game={game} me={0}>{null}</TableScene>)).not.toContain('seat-bubble');
    game.lastEvent = { id: 4, seat: null, text: 'The action was nullified.', kind: 'cancelled' };
    expect(renderToStaticMarkup(<TableScene game={game} me={0}>{null}</TableScene>)).not.toContain('seat-bubble');
  });
});
