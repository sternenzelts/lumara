// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VoyageReport } from '../logic/report';
import HomecomingReport from './HomecomingReport';
import { reportLines } from '../logic/reportImage';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const pct = { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 };
const report = (extra: Partial<VoyageReport> = {}): VoyageReport => ({
  sprintName: 'Sprint 3', date: Date.UTC(2026, 9, 5), portrait: Array.from({ length: 4 }, (_, i) => ({ userId: 'u' + i, name: 'P' + i, characterId: i ? 'wren' : null, warden: i === 0 })),
  numbers: { thoughts: 5, votes: 9, vows: 2, promisesKept: 1, myStarlight: 650 }, checkIn: { sat: 90, growth: 70, n: 3, of: 4 },
  peer: [{ userId: 'u1', name: 'P1', raters: 3, pct }], thoughts: [{ category: 'spark', label: 'Spark', plain: 'Try', items: [{ text: 'Try pairing', votes: 4 }] }],
  vows: [{ text: 'Ship it', owner: 'Shared by the team' }], ...extra });
async function render(r: VoyageReport, viewerSeesAll = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<HomecomingReport report={r} viewerSeesAll={viewerSeesAll} />));
  return el;
}
describe('HomecomingReport', () => {
  it('shows every section in the spec’s order', async () => {
    const el = await render(report());
    expect([...el.querySelectorAll('section[aria-label]')].map(s => s.getAttribute('aria-label'))).toEqual(['Voyage numbers', 'Team check-in', 'Your peer feedback', 'All thoughts', 'Vows to carry']);
    expect(el.querySelectorAll('.portrait-member')).toHaveLength(4);
    const numbers = el.querySelector('section[aria-label="Voyage numbers"]')!.textContent;
    expect(numbers).toContain('promise kept'); expect(numbers).toContain('650');
    expect(numbers).toContain('picks made');   // votes are picks now (spec §10)
    expect(el.querySelector('section[aria-label="All thoughts"]')?.textContent).toContain('4 picks');
    expect(el.textContent).toContain('Satisfaction 90%'); expect(el.textContent).toContain('3 of 4 checked in');
    expect(el.textContent).toContain('Try pairing'); expect(el.textContent).toContain('Ship it');
    expect(el.textContent).not.toContain('Reward totals will be connected');
  });
  it('labels the peer section for the Warden and handles empty states', async () => {
    const el = await render(report({ peer: [], checkIn: { sat: null, growth: null, n: 0, of: 4 }, numbers: { thoughts: 0, votes: 0, vows: 0, promisesKept: 0, myStarlight: null } }), true);
    expect(el.querySelector('section[aria-label="Peer feedback"]')?.textContent).toContain('No peer feedback this voyage');
    expect(el.textContent).toContain('Nobody checked in'); expect(el.textContent).toContain('—');
  });
  it('lays out 8 companions in two rows', async () => {
    const el = await render(report({ portrait: Array.from({ length: 8 }, (_, i) => ({ userId: 'u' + i, name: 'P' + i, characterId: 'wren', warden: false })) }));
    expect([...el.querySelectorAll('.portrait-row')].map(r => r.children.length)).toEqual([4, 4]);
  });
  it('every peer row in the image is on the screen', async () => {
    const el = await render(report());
    for (const p of report().peer) expect(el.textContent).toContain(p.name);
    expect(reportLines(report(), false).filter(l => l.text.includes('Party Spirit')).length).toBe(report().peer.length);
  });
});
