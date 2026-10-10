// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RecognitionCard from './RecognitionCard';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); localStorage.clear(); });
async function render(characterId: string | null) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const played: string[] = [];
  vi.stubGlobal('Audio', class { volume = 1; src: string; constructor(src: string) { this.src = src; played.push(src); } play() { return Promise.resolve(); } pause() {} });
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<RecognitionCard characterId={characterId} nickname="Ana" sprintName="Sprint 3" starlight={650} date={1} onClose={vi.fn()} />));
  return { el, played };
}
describe('RecognitionCard', () => {
  it('shows the companion, nickname, sprint, line and Starlight, and plays the voiced line', async () => {
    const { el, played } = await render('wren');
    expect(el.textContent).toContain('Ana'); expect(el.textContent).toContain('Sprint 3'); expect(el.textContent).toContain('650');
    expect(el.textContent).toContain('chase the next wind');
    expect(played[0]).toContain('art/wren/voice/retro_end.mp3');
  });
  it('never shows thought or vote counts', async () => {
    const { el } = await render('wren');
    expect(el.textContent).not.toMatch(/thought|vote/i);
  });
  it('falls back to Seren when no companion is set', async () => {
    const { el } = await render(null);
    expect(el.textContent).toContain('Lumara shines a little brighter');
  });
});
