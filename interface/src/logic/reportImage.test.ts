import { describe, expect, it } from 'vitest';
import type { VoyageReport } from './report';
import { reportFileName, reportLines } from './reportImage';

const pct = { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 };
const r: VoyageReport = { sprintName: 'Sprint 3 · Official', date: new Date(2026, 9, 5).getTime(), portrait: [],
  numbers: { thoughts: 5, votes: 9, vows: 2, promisesKept: 1, myStarlight: 650 }, checkIn: { sat: 90, growth: 70, n: 3, of: 4 },
  peer: [{ userId: 'u1', name: 'Ana', raters: 3, pct }], thoughts: [{ category: 'spark', label: 'Spark', plain: 'Try', items: [{ text: 'Try pairing', votes: 4 }] }],
  vows: [{ text: 'Ship it', owner: 'Bo' }] };
describe('report image', () => {
  it('names the file Lumara-<sprint>-<date>.png', () => {
    expect(reportFileName('Sprint 3 · Official', r.date)).toBe('Lumara-Sprint-3-Official-2026-10-05.png');
    expect(reportFileName('···', r.date)).toBe('Lumara-voyage-2026-10-05.png');
  });
  it('draws the same sections the screen shows, in order', () => {
    const text = reportLines(r, false).map(l => l.text);
    expect(text[0]).toBe('Sprint 3 · Official');
    const order = ['Voyage numbers', 'Team check-in', 'Your peer feedback', 'All thoughts', 'Vows to carry'].map(h => text.indexOf(h));
    expect(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1]))).toBe(true);
    expect(text).toContain('Ana · Party Spirit 80% · Dependable 60% · Clear Comms 100% · Impact 80% · Levels Up 40% · 3 raters');
    expect(text).toContain('Try pairing (4 picks)');
    expect(text.find(l => l.includes('thoughts shared'))).toContain('9 picks made');   // votes are picks now (spec §10)
    expect(text).toContain('Ship it — Bo');
  });
  it('titles the peer section for the Warden', () => {
    expect(reportLines(r, true).map(l => l.text)).toContain('Peer feedback');
  });
});
