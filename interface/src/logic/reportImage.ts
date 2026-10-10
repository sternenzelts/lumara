import { characterById } from '../data/characters';
import { PEER_TRAITS } from '../data/feedback';
import { MAP } from '../data/sanctuaryMap';
import { portraitGroups, type VoyageReport } from './report';

export type ReportLine = { kind: 'title' | 'heading' | 'text' | 'muted'; text: string };
export const slug = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const ymd = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const reportFileName = (sprintName: string, date: number) => `Lumara-${slug(sprintName) || 'voyage'}-${ymd(date)}.png`;

/** The report as lines of text, in the screen's section order (the canvas draws exactly these). */
export function reportLines(r: VoyageReport, viewerSeesAll: boolean): ReportLine[] {
  const n = r.numbers; const L: ReportLine[] = [{ kind: 'title', text: r.sprintName }, { kind: 'muted', text: new Date(r.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) }];
  L.push({ kind: 'heading', text: 'Voyage numbers' }, { kind: 'text', text: `${n.thoughts} thoughts shared · ${n.votes} picks made · ${n.vows} Vows made · ${n.promisesKept} ${n.promisesKept === 1 ? 'promise' : 'promises'} kept` },
    { kind: 'text', text: `Starlight you earned: ${n.myStarlight === null ? '—' : n.myStarlight.toLocaleString()}` });
  L.push({ kind: 'heading', text: 'Team check-in' }, r.checkIn && r.checkIn.sat !== null ? { kind: 'text', text: `♥ Satisfaction ${r.checkIn.sat}% · ◆ Growth ${r.checkIn.growth}% · ${r.checkIn.n} of ${r.checkIn.of} checked in` } : { kind: 'muted', text: 'Nobody checked in this voyage.' });
  L.push({ kind: 'heading', text: viewerSeesAll ? 'Peer feedback' : 'Your peer feedback' });
  if (r.peer.length) for (const p of r.peer) L.push({ kind: 'text', text: `${p.name} · ${PEER_TRAITS.map(t => `${t.title} ${p.pct[t.key]}%`).join(' · ')} · ${p.raters} ${p.raters === 1 ? 'rater' : 'raters'}` });
  else L.push({ kind: 'muted', text: viewerSeesAll ? 'No peer feedback this voyage.' : 'No allies rated you this voyage.' });
  L.push({ kind: 'heading', text: 'All thoughts' });
  for (const g of r.thoughts) { L.push({ kind: 'muted', text: `${g.label} · ${g.plain}` }); for (const t of g.items) L.push({ kind: 'text', text: `${t.text} (${t.votes} ${t.votes === 1 ? 'pick' : 'picks'})` }); }
  if (!r.thoughts.length) L.push({ kind: 'muted', text: 'No thoughts were shared.' });
  L.push({ kind: 'heading', text: 'Vows to carry' }, ...(r.vows.length ? r.vows.map(v => ({ kind: 'text' as const, text: `${v.text} — ${v.owner}` })) : [{ kind: 'muted' as const, text: 'No Vows were made.' }]));
  return L;
}

const W = 1080, PAD = 64, BAND = 440;
const FONT = { title: "400 46px Marcellus, serif", heading: "400 30px Marcellus, serif", text: "400 24px Manrope, sans-serif", muted: "400 21px Manrope, sans-serif" };
const COLOR = { title: '#fff4dc', heading: '#e9cf8f', text: '#e4ebf1', muted: '#b9c6d2' };
const GAP = { title: 60, heading: 56, text: 34, muted: 30 };
const loadImage = (src: string) => new Promise<HTMLImageElement | null>(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function wrap(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? `${line} ${word}` : word; if (g.measureText(next).width > max && line) { out.push(line); line = word; } else line = next; }
  return [...out, line];
}
/** Draws the report (portrait band on the plaza, then the text) onto a canvas. */
export async function renderReportImage(r: VoyageReport, viewerSeesAll: boolean): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const c = document.createElement('canvas'); let g = c.getContext('2d')!;
  const rows = reportLines(r, viewerSeesAll).flatMap(l => { g.font = FONT[l.kind]; return wrap(g, l.text, W - PAD * 2).map((text, k) => ({ ...l, text, first: k === 0 })); });
  c.width = W; c.height = PAD + BAND + 28 + rows.reduce((h, l) => h + (l.first ? GAP[l.kind] : 30), 0) + PAD; g = c.getContext('2d')!;
  g.fillStyle = '#0a1a2c'; g.fillRect(0, 0, c.width, c.height);
  const plaza = await loadImage(MAP.image);
  if (plaza) { const s = Math.max(W / plaza.width, BAND / plaza.height); g.globalAlpha = .8; g.drawImage(plaza, (W - plaza.width * s) / 2, PAD - (plaza.height * s - BAND) * .58, plaza.width * s, plaza.height * s); g.globalAlpha = 1; }
  g.fillStyle = '#0a1a2c'; g.fillRect(0, 0, W, PAD); g.fillRect(0, PAD + BAND, W, c.height);   // crop the plaza to its band
  const groups = portraitGroups(r.portrait); const rowH = BAND / Math.max(1, groups.length);
  g.textAlign = 'center'; g.font = "400 22px Marcellus, serif";
  for (const [ri, row] of groups.entries()) for (const [i, m] of row.entries()) {
    const slot = W / row.length, cx = slot * i + slot / 2, bottom = PAD + (ri + 1) * rowH - 26;
    const src = characterById(m.characterId)?.art.cutout; const img = src ? await loadImage(src) : null;
    if (img) { const h = rowH - 34, w = h * img.width / img.height; g.drawImage(img, cx - w / 2, bottom - h, w, h); }
    g.fillStyle = '#fff4dc'; g.fillText(m.name, cx, bottom + 22, slot - 8);
  }
  g.textAlign = 'left'; let y = PAD + BAND + 28;
  for (const l of rows) { y += l.first ? GAP[l.kind] : 30; g.font = FONT[l.kind]; g.fillStyle = COLOR[l.kind]; g.fillText(l.text, PAD, y); }
  return c;
}
/** A normal browser download (GitHub Pages; no artifact download feature needed). */
export async function saveCanvas(c: HTMLCanvasElement, fileName: string) {
  const blob = await new Promise<Blob | null>(res => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Your browser couldn’t draw the image. Try again or use a screenshot.');
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
