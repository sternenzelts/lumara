// Azrenth choreography ported from the approved reveal-demos/azrenth/index.html.
import {createPlayback} from './playback.js';
import {assets} from './azrenth-markup.js';
import {primeAzrenthAudio} from './azrenth-audio.js';
export function createRuntime(host,onFinished,base){
const asset=name=>base+assets[name];
const life=createPlayback(host,onFinished);
const $ = id => host.querySelector('#'+id);
const fx = $('fx'), g = fx.getContext('2d'), fx2 = $('fx2'), g2 = fx2.getContext('2d');
const DPR = Math.min(devicePixelRatio, 1.5);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let motionFrozen = false;
function beat(name){ $('stage').dataset.beat = name; }
let W, H; function size(){ W = fx.width = fx2.width = innerWidth * DPR; H = fx.height = fx2.height = innerHeight * DPR; } size(); window.addEventListener('resize', size);
const crystalImg = new Image(); crystalImg.src = asset('crystal.webp');

/* ---------- audio: every level goes through setV so the Sound button can scale it ---------- */
const LEVELS = [{ k:'on', m:1, label:'Sound on' }, { k:'low', m:.3, label:'Sound low' }, { k:'off', m:0, label:'Muted' }];
let level = 0; try { const s = localStorage.getItem('lumara.revealSound'); if (s !== null) level = Math.min(2, Math.max(0, +s || 0)); } catch (e) {}
const ALL = [];
function setV(a, v){ a._v = Math.max(0, Math.min(1, v)); a.volume = a._v * LEVELS[level].m; }
function track(src, v){ const a = new Audio(asset(src)); a.preload = 'auto';ALL.push(a); setV(a, v); return a; }
const SFX = {}; ['pull_fall_whoosh','tell_splusplus','pull_flash_swell','slash','shatter'].forEach(n => SFX[n] = track('sfx_' + n + '.mp3', .75));
const VO = {}; ['reveal','reveal_2','sig_full','sig_short'].forEach(n => VO[n] = track('vo_' + n + '.mp3', 1));
const hasJirasdVO = true; VO.jirasd = track('vo_jirasd.mp3', 1);
// lightning crackle, synthesised: short bursts of filtered noise
let actx = null; const activeCrackles = new Set();
function initSfx(){ actx = primeAzrenthAudio(); }
function crackle(v = .5){ if (!actx || !LEVELS[level].m) return; const n = Math.floor(actx.sampleRate * .14), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) * (Math.random() < .3 ? 1 : .3);
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), gn = actx.createGain(); f.type = 'highpass'; f.frequency.value = 1200; gn.gain.value = v * .45 * LEVELS[level].m;
  src.buffer = b; src.connect(f).connect(gn).connect(actx.destination); activeCrackles.add(src); src.onended = () => activeCrackles.delete(src); src.start(); }
const PULL = track('pull_music.mp3', .6);
const THEME = track('theme.mp3', 0); THEME.loop = true; // 魔王 — BURNOUT SYNDROMES × Nao Tōyama; instrumental intro covers the whole reveal
let themeActive = false;
const ramps = new Map();
function ramp(a, to, step = .03, ms = 80, pauseAtZero = false){
  clearInterval(ramps.get(a));
  ramps.set(a, setInterval(() => { const d = to - a._v; if (Math.abs(d) <= step) { setV(a, to); clearInterval(ramps.get(a)); if (pauseAtZero && to === 0) a.pause(); } else setV(a, a._v + Math.sign(d) * step); }, ms));
}
function resume(a){return a.play();}
function play(a, v){ a.currentTime = 0; if (v !== undefined) setV(a, v); resume(a).catch(() => { $('audioStatus').textContent = 'Sound could not start. Press Sound to retry.'; }); }
function stopAll(){ ALL.forEach(a => { clearInterval(ramps.get(a)); a.pause();a.currentTime=0; }); }
function startTheme(volume = .34){ themeActive = true; clearInterval(ramps.get(THEME)); setV(THEME, volume); life.playMusic(THEME); }
function primeTheme(){ THEME.currentTime = 0; setV(THEME,0); life.primeMusic(THEME); }
function renderSound(){ const L = LEVELS[level], b = $('sound'); b.dataset.level = L.k; b.title = L.label; b.setAttribute('aria-label', L.label + ' (click to change)'); b.querySelector('span').textContent = L.k === 'on' ? 'Sound' : L.k === 'low' ? 'Low' : 'Muted'; }
$('sound').onclick = () => { level = (level + 1) % LEVELS.length; ALL.forEach(a => setV(a, a._v)); $('audioStatus').textContent = ''; if ((themeActive || $('stage').dataset.beat === 'card') && level !== 2) startTheme($('stage').dataset.beat === 'card' ? .45 : THEME._v || .34); try { localStorage.setItem('lumara.revealSound', level); } catch (e) {} renderSound(); };
renderSound();

/* ---------- run control: Replay cancels the running sequence instead of stacking a second one ---------- */
let runId = 0;
function guard(id){ if (id !== runId) throw life.CANCEL; }
const {sleep,tween,voice,setInterval,clearInterval,requestAnimationFrame} = life;
function stream(fn, ms){ return setInterval(fn,ms); }
function anim(el, frames, o = {}){ return life.anim(el,frames,{...o,duration:reduced?1:(o.duration || 500)}); }
function hide(el){ el.getAnimations().forEach(a => a.cancel()); el.style.opacity = 0; }
function show(el){ el.getAnimations().forEach(a => a.cancel()); el.style.opacity = 1; }
const SHOTS = ['azrenth','jirasd','sword','severArt','finalArt'];
function showShot(name){
  if (name === 'severArt' || name === 'finalArt') {
    // The painting owns the whole frame, including its entrance under the flash.
    $('scene').style.opacity = 0;
    $('halfA').style.opacity = 0;
    $('halfB').style.opacity = 0;
  }
  SHOTS.forEach(k => { if(k !== name) hide($(k)); });
  show($(name));
}
async function fadeShotOut(name, duration = 700){
  await anim($(name), [{opacity:1},{opacity:0}], {duration});
  // The caller guards its run before clearing the shot; Replay owns the next run.
}
function ducked(a){const id=runId;ramp(THEME,.07,.05,40);return voice(a).then(()=>{if(id===runId)ramp(THEME,.32,.02,80);});}
function caption(t){ const c = $('caption'); c.textContent = t; c.style.opacity = t ? '.92' : '0'; }

/* ---------- canvas world ---------- */
let zapsF = [], zapsB = [], fissures = [], threads = [], backlight = null, burn = null, orb = null, rift = null, slash = null, glint = null; let cz = null, star = null, cracks = [], shake = 0, shards = [], dust = null, dusts = [], spells = [], rings = [], casters = [], hexes = [], nova = null;
const clouds = Array.from({ length: 26 }, () => ({ x:(Math.random() - .5) * 2, y:(Math.random() - .5) * 1.4, z:Math.random() }));
const parts = [];
function spawn(n, opts){ for (let i = 0; i < n; i++) parts.push(Object.assign({ x:Math.random() * W, y:H + 10, vx:(Math.random() - .5) * .6 * DPR, vy:-(.4 + Math.random() * 1.4) * DPR, s:(1 + Math.random() * 2.5) * DPR, life:1, col:'#bcd8ff' }, opts ? opts(i) : {})); }
function makeCracks(){ cracks = []; for (let k = 0; k < 7; k++) { let x = W * .5, y = H * .2, pts = [[x, y]]; const ang = Math.PI / 2 + (Math.random() - .5) * 2.6; for (let i = 0; i < 9; i++) { x += Math.cos(ang + (Math.random() - .5)) * W * .035; y += Math.sin(ang + (Math.random() - .5)) * H * .03 - H * .02; pts.push([x, y]); } cracks.push({ pts, a:1, h:Math.random() * 360 }); } }

// Dissolve an <img> into particles sampled from its own pixels; t=0 whole, t=1 fully dispersed into mist.
function makeDust(el, colorShift){
  const r = el.getBoundingClientRect(), off = document.createElement('canvas');
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height)); off.width = w; off.height = h;
  const c = off.getContext('2d'), cover = Math.max(w / el.naturalWidth, h / el.naturalHeight);
  const iw = el.naturalWidth * cover, ih = el.naturalHeight * cover;
  const position = getComputedStyle(el).objectPosition.split(' ').map(parseFloat);
  c.filter = getComputedStyle(el).filter;
  c.drawImage(el, (w - iw) * (position[0] / 100), (h - ih) * (position[1] / 100), iw, ih);
  const data = c.getImageData(0, 0, w, h).data, step = Math.max(3, Math.round(Math.sqrt(w * h / 5200))), list = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const i = (y * w + x) * 4; if (data[i + 3] < 60) continue;
    const ang = Math.random() * Math.PI * 2, sp = .25 + Math.random();
    list.push({ ox:(r.left + x) * DPR, oy:(r.top + y) * DPR, dx:Math.cos(ang) * sp * W * .22 + (x / w - .5) * W * .12, dy:-(Math.random() * .9 + .2) * H * .5 + Math.sin(ang) * H * .08,
      col: colorShift ? `rgb(${data[i] * .5 + 70},${data[i + 1] * .6 + 110},255)` : `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, s:step * DPR * .9, delay:(1 - y / h) * .35 + Math.random() * .15 }); }
  return { list, t:0, glow:colorShift };
}
function drawDust(ctx, d){
  for (const p of d.list) { const k = Math.max(0, Math.min(1, (d.t - p.delay) / (1 - p.delay * .6))); const e = k * k * (3 - 2 * k);
    ctx.globalAlpha = (1 - e * .85) * (1 - (p.fade || 0)) * (d.alpha ?? 1); ctx.fillStyle = d.annihilate && e > .1 ? (e < .3 ? '#ff502b' : '#130805') : e > .15 && d.glow ? '#9cc7ff' : p.col;
    ctx.fillRect(p.ox + p.dx * e, p.oy + p.dy * e, p.s * (1 - e * .5), p.s * (1 - e * .5)); }
  ctx.globalAlpha = 1;
}
function loop(t){
  if(motionFrozen){ requestAnimationFrame(loop); return; }
  g.clearRect(0, 0, W, H); g2.clearRect(0, 0, W, H);
  const sx = shake && !reduced ? (Math.random() - .5) * shake : 0, sy = shake && !reduced ? (Math.random() - .5) * shake : 0; $('stage').style.transform = shake && !reduced ? `translate(${sx}px,${sy}px)` : '';
  for (const c of cracks) { g.strokeStyle = `hsla(${c.h},100%,80%,${c.a})`; g.lineWidth = 2 * DPR; g.shadowColor = '#fff'; g.shadowBlur = 12 * DPR; g.beginPath(); c.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.shadowBlur = 0; c.a = Math.max(0, c.a - .004); }
  if (cz) { const cx = W / 2, cy = H * .46;
    for (const c of clouds) { c.z -= .012 * cz.flight; if (c.z < .05) { c.z = 1; c.x = (Math.random() - .5) * 2; c.y = (Math.random() - .5) * 1.4; }
      const k = 1 / c.z, px = cx + c.x * W * .35 * k, py = cy + c.y * H * .35 * k, r = 60 * DPR * k, a = Math.min(.45, (1 - c.z)) * cz.flight;
      const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, `rgba(200,220,255,${a})`); gr.addColorStop(1, 'rgba(200,220,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill(); }
    if (cz.rays > 0) { g.save(); g.translate(cx, cy); g.rotate(t / 2500); for (let i = 0; i < 18; i++) { g.rotate(Math.PI / 9); g.fillStyle = cz.stage >= 2 ? `hsla(${(t / 5 + i * 20) % 360},100%,70%,${.14 * cz.rays})` : `rgba(255,215,120,${.14 * cz.rays})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(-W * .05, -H * 1.3); g.lineTo(W * .05, -H * 1.3); g.fill(); } g.restore(); }
    if (cz.show) { const d = Math.min(W, H) * cz.s; g.save(); g.translate(cx, cy); g.rotate(cz.r); g.globalAlpha = cz.alpha;
      g.shadowColor = cz.stage === 0 ? '#b48cff' : cz.stage === 1 ? '#f4cf7a' : `hsl(${t / 3 % 360},100%,70%)`; g.shadowBlur = 60 * DPR;
      g.filter = cz.stage === 0 ? 'hue-rotate(25deg) saturate(1.8)' : cz.stage === 1 ? 'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08)' : `hue-rotate(${(t / 4) % 360}deg) saturate(2.3) brightness(1.15)`;
      if (crystalImg.complete) g.drawImage(crystalImg, -d / 2, -d / 2, d, d); g.filter = 'none'; g.restore(); } }
  if (dust) drawDust(dust.behind ? g : g2, dust); for (const d of dusts) drawDust(g2, d);
  // crimson backlight behind the shadow, so a pure-black silhouette reads
  if (backlight) { const b = backlight, R = b.r * (1 + b.pulse * .14), a = b.a * (1 + b.pulse * .5), gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
    gr.addColorStop(0, `rgba(255,90,60,${Math.min(1, .9 * a)})`); gr.addColorStop(.3, `rgba(220,24,20,${Math.min(1, .6 * a)})`); gr.addColorStop(1, 'rgba(120,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // Jirasd: the burning front that eats the castle (the castle itself is masked to match)
  if (burn && burn.r > 0) { g.save(); g.lineJoin = 'round';
    const band = 150 * DPR, fg = g.createRadialGradient(burn.x, burn.y, Math.max(0, burn.r - band), burn.x, burn.y, burn.r + band * .5);
    fg.addColorStop(0, 'rgba(40,0,0,0)'); fg.addColorStop(.35, 'rgba(140,12,0,.55)'); fg.addColorStop(.58, 'rgba(255,80,24,.85)'); fg.addColorStop(.66, 'rgba(255,214,160,.95)'); fg.addColorStop(.74, 'rgba(255,70,20,.6)'); fg.addColorStop(1, 'rgba(255,40,0,0)');
    g.fillStyle = fg; g.fillRect(0, 0, W, H);
    for (const [w, col, blur] of [[8, 'rgba(255,140,50,.7)', 18], [2, 'rgba(255,236,196,.9)', 6]]) {
      g.strokeStyle = col; g.lineWidth = w * DPR; g.shadowColor = '#ff3a10'; g.shadowBlur = blur * DPR; g.beginPath();
      for (let i = 0; i <= 140; i++) { const a = i / 140 * Math.PI * 2, j = Math.sin(a * 7 + t / 90) * .5 + Math.sin(a * 13 - t / 60) * .5, rr = burn.r + j * 12 * DPR;
        const x = burn.x + Math.cos(a) * rr, y = burn.y + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); }
    g.restore(); }
  // Venuzdonoa: the rift between the two halves of the world, drawn to match the Sever painting
  if (rift) { const L = rift.L, gp = rift.gap * DPR, off = (p, s) => [p[0] + L.n[0] * gp * s, p[1] + L.n[1] * gp * s];
    const a0 = off(L.e0, 1), a1 = off(L.e1, 1), b0 = off(L.e0, -1), b1 = off(L.e1, -1);
    g.save(); g.globalAlpha = rift.a; const vg = g.createLinearGradient(...a0.map((v, i) => (v + b0[i]) / 2 + L.n[i] * gp), ...a0.map((v, i) => (v + b0[i]) / 2 - L.n[i] * gp));
    vg.addColorStop(0, '#2a0508'); vg.addColorStop(.3, '#0a0414'); vg.addColorStop(.5, '#1b1036'); vg.addColorStop(.7, '#0a0414'); vg.addColorStop(1, '#2a0508'); g.fillStyle = vg; g.beginPath(); g.moveTo(...a0); g.lineTo(...a1); g.lineTo(...b1); g.lineTo(...b0); g.closePath(); g.fill();
    for (const s of rift.stars) { g.globalAlpha = rift.a * s.b * (.6 + .4 * Math.sin(t / 300 + s.ph)); g.fillStyle = s.c;
      g.fillRect(L.e0[0] + (L.e1[0] - L.e0[0]) * s.u + L.n[0] * s.o * gp, L.e0[1] + (L.e1[1] - L.e0[1]) * s.u + L.n[1] * s.o * gp, s.z, s.z); }
    g.globalAlpha = rift.a; g.lineCap = 'round';
    for (const [p0, p1] of [[a0, a1], [b0, b1]]) for (const [w, col, blur] of [[10, 'rgba(255,40,30,.6)', 30], [2.4, '#ffe2d6', 8]]) {
      g.strokeStyle = col; g.lineWidth = w * DPR; g.shadowColor = '#ff2a1a'; g.shadowBlur = blur * DPR; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
    g.restore(); }
  for (const c of casters) { c.rot += .02; g2.save(); g2.translate(c.x, c.y); g2.rotate(c.rot); g2.globalAlpha = c.a;
    g2.strokeStyle = `hsl(${c.h},100%,62%)`; g2.shadowColor = `hsl(${c.h},100%,55%)`; g2.shadowBlur = 20 * DPR; g2.lineWidth = 2.2 * DPR; const R = c.r * DPR;
    g2.beginPath(); g2.arc(0, 0, R, 0, Math.PI * 2); g2.stroke(); g2.beginPath(); g2.arc(0, 0, R * .72, 0, Math.PI * 2); g2.stroke();
    g2.beginPath(); for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI * 2; const px = Math.cos(a0) * R * .72, py = Math.sin(a0) * R * .72; k ? g2.lineTo(px, py) : g2.moveTo(px, py); } g2.closePath(); g2.stroke();
    for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2; g2.fillStyle = `hsl(${c.h},100%,75%)`; g2.fillRect(Math.cos(a0) * R * .86 - 3 * DPR, Math.sin(a0) * R * .86 - 3 * DPR, 6 * DPR, 6 * DPR); }
    if (c.crack > 0) { g2.strokeStyle = `rgba(255,255,255,${c.crack})`; g2.lineWidth = 1.5 * DPR; for (let k = 0; k < 5; k++) { const a0 = k * 1.3; g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(Math.cos(a0) * R * 1.1, Math.sin(a0) * R * 1.1); g2.stroke(); } }
    g2.restore(); }
  for (const sp of spells) { const x = sp.x, y = sp.y; sp.trail.push([x, y]); if (sp.trail.length > 26) sp.trail.shift();
    const hue = sp.h + (205 - sp.h) * sp.drain; // drains from red/violet to blue as it is erased
    for (let i = 1; i < sp.trail.length; i++) { const [ax, ay] = sp.trail[i - 1], [bx, by] = sp.trail[i], k = i / sp.trail.length;
      g2.strokeStyle = `hsla(${hue},100%,${55 + k * 20}%,${k * sp.o * .8})`; g2.lineWidth = sp.size * (.3 + k * .9) * DPR; g2.lineCap = 'round'; g2.shadowColor = `hsl(${hue},100%,60%)`; g2.shadowBlur = 24 * DPR; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(bx, by); g2.stroke(); }
    const R = sp.size * sp.scale * DPR, gr = g2.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(255,255,255,${sp.o})`); gr.addColorStop(.35, `hsla(${hue},100%,70%,${sp.o})`); gr.addColorStop(1, `hsla(${hue},100%,50%,0)`);
    g2.fillStyle = gr; g2.beginPath(); g2.arc(x, y, R, 0, Math.PI * 2); g2.fill(); g2.shadowBlur = 0; }
  for (let i = hexes.length - 1; i >= 0; i--) { const hx = hexes[i]; hx.t += .03; if (hx.t >= 1) { hexes.splice(i, 1); continue; }
    g2.save(); g2.translate(hx.x, hx.y); g2.rotate(hx.rot); g2.globalAlpha = (1 - hx.t) * .9; g2.strokeStyle = '#cfe4ff'; g2.shadowColor = '#8fc4ff'; g2.shadowBlur = 18 * DPR; g2.lineWidth = 2 * DPR;
    for (const [dx, dy] of [[0, 0], [1.5, .87], [-1.5, .87], [0, 1.74], [0, -1.74], [1.5, -.87], [-1.5, -.87]]) { const r = (14 + hx.t * 10) * DPR; g2.beginPath();
      for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI * 2 + Math.PI / 6; const px = dx * r + Math.cos(a0) * r, py = dy * r + Math.sin(a0) * r; k ? g2.lineTo(px, py) : g2.moveTo(px, py); } g2.closePath(); g2.stroke(); }
    g2.restore(); }
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += .035; if (r.t >= 1) { rings.splice(i, 1); continue; }
    g2.save(); g2.globalAlpha = 1 - r.t; g2.strokeStyle = '#cfe4ff'; g2.shadowColor = '#8fc4ff'; g2.shadowBlur = 16 * DPR; g2.lineWidth = 2 * DPR;
    for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI * 2 + r.rot, a1 = a0 + .7; g2.beginPath(); g2.arc(r.x, r.y, (14 + r.t * 46) * DPR, a0, a1); g2.stroke(); } g2.restore(); }
  for (const s of shards) { s.a += s.w; const x = s.cx + Math.cos(s.a) * s.rx, y = s.cy + Math.sin(s.a) * s.ry; g2.save(); g2.translate(x, y); g2.rotate(s.a * 2); g2.globalAlpha = s.o;
    g2.fillStyle = 'rgba(190,220,255,.85)'; g2.shadowColor = '#8fc4ff'; g2.shadowBlur = 14 * DPR; g2.beginPath(); g2.moveTo(0, -s.z); g2.lineTo(s.z * .45, 0); g2.lineTo(0, s.z); g2.lineTo(-s.z * .45, 0); g2.closePath(); g2.fill(); g2.restore(); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.life -= .0035;
    if (p.life <= 0 || p.y < -40 || p.y > H + 40) { parts.splice(i, 1); continue; }
    g2.globalAlpha = Math.min(1, p.life); g2.fillStyle = p.col; g2.shadowColor = p.col; g2.shadowBlur = 8 * DPR; g2.beginPath(); g2.arc(p.x, p.y, p.s, 0, Math.PI * 2); g2.fill(); g2.shadowBlur = 0; g2.globalAlpha = 1; }
  drawZaps(g, zapsB);
  if (fissures.length && rift) { const gp = rift.gap * DPR, G0 = rift.G * DPR; g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = rift.a * (.85 + Math.random() * .15);
    for (const f of fissures) { const dx = L_off(rift.L, f.side, gp - G0), n = Math.max(2, Math.ceil(f.pts.length * f.grow));
      for (const [w, col, blur] of [[5, 'rgba(255,36,24,.5)', 16], [2, '#0c0101', 0], [.8, '#ff8a66', 4]]) { g.strokeStyle = col; g.lineWidth = w * DPR; g.shadowColor = '#ff2a1a'; g.shadowBlur = blur * DPR;
        g.beginPath(); f.pts.slice(0, n).forEach(([x, y], j) => j ? g.lineTo(x + dx[0], y + dx[1]) : g.moveTo(x + dx[0], y + dx[1]));
        if (f.grow > .6) { g.moveTo(f.branch[0][0] + dx[0], f.branch[0][1] + dx[1]); g.lineTo(f.branch[0][0] + (f.branch[1][0] - f.branch[0][0]) * (f.grow - .6) / .4 + dx[0], f.branch[0][1] + (f.branch[1][1] - f.branch[0][1]) * (f.grow - .6) / .4 + dx[1]); }
        g.stroke(); } }
    g.restore(); }
  // the golden threads of order: behind him, and each one snaps where the cut crosses it
  for (const th of threads) { g.save(); g.lineCap = 'round';
    const pieces = th.hit == null ? [[0, 1]] : [[0, th.hit * (1 - th.k * .6)], [th.hit + (1 - th.hit) * th.k * .6, 1]];
    for (const [u0, u1] of pieces) { if (u1 <= u0) continue;
      for (const [w, col, blur] of [[5, 'rgba(255,190,90,.3)', 16], [1.5, '#ffe7b0', 6]]) {
        g.globalAlpha = th.a * (1 - th.k); g.strokeStyle = col; g.lineWidth = w * DPR; g.shadowColor = '#ffc860'; g.shadowBlur = blur * DPR; g.beginPath();
        for (let i = 0; i <= 40; i++) { const [x, y] = qpt(th, u0 + (u1 - u0) * i / 40); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); } }
    if (th.hit == null && th.a > 0) { const [x, y] = qpt(th, (t / 2600 + th.ph) % 1), gr = g.createRadialGradient(x, y, 0, x, y, 16 * DPR);
      gr.addColorStop(0, `rgba(255,248,220,${th.a})`); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.globalAlpha = 1; g.shadowBlur = 0; g.fillStyle = gr; g.fillRect(x - 16 * DPR, y - 16 * DPR, 32 * DPR, 32 * DPR); }
    g.restore(); }
  // Jirasd's gathered flame
  if (orb) { const R = orb.r * (1 + Math.sin(t / 45) * .06), gr = g2.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, R);
    gr.addColorStop(0, `rgba(255,244,236,${orb.a})`); gr.addColorStop(.16, `rgba(255,70,44,${orb.a})`); gr.addColorStop(.5, `rgba(160,0,0,${orb.a * .5})`); gr.addColorStop(1, 'rgba(60,0,0,0)');
    g2.fillStyle = gr; g2.beginPath(); g2.arc(orb.x, orb.y, R, 0, Math.PI * 2); g2.fill(); }
  // Venuzdonoa's cut: one tapered blade of light, thin at both ends, white-hot at the core
  if (slash) { const L = slash.L, p = slash.p, at = u => [L.e0[0] + (L.e1[0] - L.e0[0]) * u, L.e0[1] + (L.e1[1] - L.e0[1]) * u];
    g.save(); g.globalAlpha = slash.a;
    for (const [hw, col, blur] of [[38, 'rgba(255,30,30,.35)', 50], [15, '#ff3b2e', 22], [5, '#fff6f0', 8]]) {
      const w = hw * DPR * slash.w; g.fillStyle = col; g.shadowColor = '#ff2a1a'; g.shadowBlur = blur * DPR; g.beginPath();
      for (let i = 0; i <= 60; i++) { const u = p * i / 60, [x, y] = at(u), h = w * Math.pow(Math.sin(Math.PI * u), .6); i ? g.lineTo(x + L.n[0] * h, y + L.n[1] * h) : g.moveTo(x, y); }
      for (let i = 60; i >= 0; i--) { const u = p * i / 60, [x, y] = at(u), h = w * Math.pow(Math.sin(Math.PI * u), .6) * .55; g.lineTo(x - L.n[0] * h, y - L.n[1] * h); }
      g.closePath(); g.fill(); }
    if (p < 1) { const [x, y] = at(p), gr = g.createRadialGradient(x, y, 0, x, y, 70 * DPR); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, 'rgba(255,120,90,.7)'); gr.addColorStop(1, 'rgba(255,40,30,0)');
      g.shadowBlur = 0; g.fillStyle = gr; g.fillRect(x - 70 * DPR, y - 70 * DPR, 140 * DPR, 140 * DPR); }
    g.restore(); }
  drawZaps(g2, zapsF);
  // a glint running down the blade, hilt to tip
  if (glint && glint.a > 0) { const { x, y } = glint, R = 46 * DPR * glint.a; g2.save(); g2.globalCompositeOperation = 'lighter';
    const gr = g2.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.25, 'rgba(255,215,140,.6)'); gr.addColorStop(1, 'rgba(255,120,60,0)');
    g2.fillStyle = gr; g2.fillRect(x - R, y - R, R * 2, R * 2); g2.strokeStyle = 'rgba(255,245,220,.9)'; g2.lineWidth = 1.5 * DPR;
    g2.beginPath(); g2.moveTo(x - R * 1.6, y); g2.lineTo(x + R * 1.6, y); g2.moveTo(x, y - R * 1.1); g2.lineTo(x, y + R * 1.1); g2.stroke(); g2.restore(); }
  requestAnimationFrame(loop);
}
function orbit(el, n){ const r = el.getBoundingClientRect(); shards = Array.from({ length:n }, (_, i) => ({ cx:(r.left + r.width / 2) * DPR, cy:(r.top + r.height * .45) * DPR,
  rx:r.width * DPR * (.55 + Math.random() * .25), ry:r.height * DPR * (.12 + Math.random() * .1), a:i / n * Math.PI * 2, w:.012 + Math.random() * .01, z:(8 + Math.random() * 12) * DPR, o:0 })); }

function center(el, fy = .45){ const r = el.getBoundingClientRect(); return [(r.left + r.width / 2) * DPR, (r.top + r.height * fy) * DPR, r.width * DPR]; }
// image pixel on a full-bleed (object-fit:cover) layer -> canvas pixel
function artPoint(el, ix, iy){ const r = el.getBoundingClientRect(), s = Math.max(r.width / el.naturalWidth, r.height / el.naturalHeight), [px, py] = getComputedStyle(el).objectPosition.split(' ').map(parseFloat);
  return [(r.left + (r.width - el.naturalWidth * s) * px / 100 + ix * s) * DPR, (r.top + (r.height - el.naturalHeight * s) * py / 100 + iy * s) * DPR]; }
// image pixel on a cutout (object-fit:contain) -> canvas pixel, following its live transform
function cutPoint(el, ix, iy){ const r = el.getBoundingClientRect(), s = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight);
  return [(r.left + (r.width - el.naturalWidth * s) / 2 + ix * s) * DPR, (r.top + (r.height - el.naturalHeight * s) / 2 + iy * s) * DPR]; }
// jagged lightning path by midpoint displacement
function zapPath(x0, y0, x1, y1, rough = .22, depth = 6){ let pts = [[x0, y0], [x1, y1]], off = Math.hypot(x1 - x0, y1 - y0) * rough;
  for (let i = 0; i < depth; i++) { const np = [pts[0]]; for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, o = (Math.random() - .5) * off;
    np.push([(ax + bx) / 2 - dy / l * o, (ay + by) / 2 + dx / l * o], [bx, by]); } pts = np; off /= 2; }
  return pts; }
function zap(x0, y0, x1, y1, o = {}){ const main = zapPath(x0, y0, x1, y1, o.rough, o.depth), paths = [main];
  for (let b = 0; b < (o.branches ?? 1); b++) { const [bx, by] = main[Math.floor(main.length * (.2 + Math.random() * .6))], a = Math.atan2(y1 - y0, x1 - x0) + (Math.random() - .5) * 1.8, len = Math.hypot(x1 - x0, y1 - y0) * (.2 + Math.random() * .3);
    paths.push(zapPath(bx, by, bx + Math.cos(a) * len, by + Math.sin(a) * len, .3, 4)); }
  const life = o.life ?? (5 + Math.floor(Math.random() * 4)); return { paths, w:(o.w ?? 1.6) * DPR, life, max:life }; }
// black lightning: red glow, black body, a thin red-hot seam
function drawZaps(ctx, list){ for (let i = list.length - 1; i >= 0; i--) { const z = list[i]; if (--z.life < 0) { list.splice(i, 1); continue; }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = Math.min(1, z.life / z.max * 1.6);
  z.paths.forEach((pts, pi) => { const w = z.w * (pi ? .55 : 1);
    for (const [k, col, blur] of [[5, 'rgba(255,34,24,.55)', 26], [2, '#070000', 0], [.55, '#ff6a4a', 4]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.shadowColor = '#ff2010'; ctx.shadowBlur = blur * DPR; ctx.beginPath(); pts.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); } });
  ctx.restore(); } }
// cracks in reality, running out from both edges of the rift
function makeFissures(L, gapPx){ return Array.from({ length:18 }, (_, i) => { const side = i % 2 ? 1 : -1, u = .04 + Math.random() * .92;
  const ox = L.e0[0] + (L.e1[0] - L.e0[0]) * u, oy = L.e0[1] + (L.e1[1] - L.e0[1]) * u; let a = Math.atan2(L.n[1] * side, L.n[0] * side) + (Math.random() - .5) * 1.3, x = ox + L.n[0] * side * gapPx, y = oy + L.n[1] * side * gapPx;
  const pts = [[x, y]], n = 5 + Math.floor(Math.random() * 5); for (let k = 0; k < n; k++) { a += (Math.random() - .5) * .9; const len = (18 + Math.random() * 34) * DPR; x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); }
  const m = pts[Math.floor(n / 2)], ba = a + (Math.random() < .5 ? 1 : -1) * (.6 + Math.random() * .6), bl = (30 + Math.random() * 60) * DPR;
  return { side, pts, branch:[m, [m[0] + Math.cos(ba) * bl, m[1] + Math.sin(ba) * bl]], grow:0 }; }); }
function qpt(th, u){ const v = 1 - u; return [v * v * th.p0[0] + 2 * v * u * th.c[0] + u * u * th.p1[0], v * v * th.p0[1] + 2 * v * u * th.c[1] + u * u * th.p1[1]]; }
// The rift in sever-landscape.png, measured in its own pixels. The live cut is laid on it, so the flash into the painting continues the same slash.
const RIFT = [[200, 590], [1100, 40]];
function riftLine(){
  let [a, b] = RIFT.map(p => artPoint($('severArt'), p[0], p[1]));
  if (!isFinite(a[0] + a[1] + b[0] + b[1])) { a = [W * .05, H * .78]; b = [W * .7, H * .04]; }
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  let t0 = -Infinity, t1 = Infinity;
  [[0, W], [1, H]].forEach(([k, max]) => { if (Math.abs(d[k]) < 1e-6) return; const ta = -a[k] / d[k], tb = (max - a[k]) / d[k]; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); });
  const m = 60 * DPR; t0 -= m; t1 += m;
  let n = [d[1], -d[0]]; const e0 = [a[0] + d[0] * t0, a[1] + d[1] * t0], e1 = [a[0] + d[0] * t1, a[1] + d[1] * t1];
  if (n[0] * (0 - e0[0]) + n[1] * (0 - e0[1]) < 0) n = [-n[0], -n[1]]; // n points to the top-left half
  return { e0, e1, d, n };
}
// CSS clip-path for one side of the cut line (s = 1 top-left half, -1 bottom-right half)
function sideClip(L, s){ const B = 5000 * DPR, ext = (p, k) => [p[0] + L.d[0] * B * k, p[1] + L.d[1] * B * k], far = p => [p[0] + L.n[0] * B * s, p[1] + L.n[1] * B * s];
  const e0 = ext(L.e0, -1), e1 = ext(L.e1, 1); return `polygon(${[e0, e1, far(e1), far(e0)].map(p => `${p[0] / DPR}px ${p[1] / DPR}px`).join(',')})`; }
function L_off(L, side, px){ return [L.n[0] * side * px, L.n[1] * side * px]; }
function burnMask(el, x, y, r){ const m = r <= 0 ? 'none' : `radial-gradient(circle at ${x / DPR}px ${y / DPR}px, transparent ${r / DPR}px, #000 ${r / DPR + 70}px)`; el.style.maskImage = m; el.style.webkitMaskImage = m; }
async function spellAt(id, from, hue, big = false){
  const [cx, cy, w] = center($('azrenth'), .42), R = w * (big ? .55 : .45), ang = Math.atan2(cy - from[1], cx - from[0]);
  const caster = { x:from[0], y:from[1], r:big ? 70 : 46, rot:0, a:0, h:hue, crack:0 }; casters.push(caster);
  await tween(450, p => { caster.a = p; }); guard(id);
  const stopX = cx - Math.cos(ang) * R, stopY = cy - Math.sin(ang) * R;
  const sp = { x:from[0], y:from[1], o:1, h:hue, drain:0, size:big ? 30 : 18, scale:1, trail:[] }; spells.push(sp);
  await tween(big ? 820 : 620, p => { const e = p * p; sp.x = from[0] + (stopX - from[0]) * e; sp.y = from[1] + (stopY - from[1]) * e; }); guard(id);
  // stopped cold: the barrier flashes where it hit and the spell trembles
  hexes.push({ x:stopX, y:stopY, t:0, rot:ang }); shake = big ? 8 : 3;
  await tween(big ? 420 : 260, p => { sp.x = stopX + (Math.random() - .5) * 6 * DPR; sp.y = stopY + (Math.random() - .5) * 6 * DPR; }); guard(id); shake = 0;
  // erased: drains from its colour to blue, shrinks, and is pulled apart into his hand
  const hand = center($('azrenth'), .5);
  spawn(big ? 80 : 36, () => ({ x:stopX, y:stopY, vx:(hand[0] - stopX) * (.012 + Math.random() * .01), vy:(hand[1] - stopY) * (.012 + Math.random() * .01), s:(1.5 + Math.random() * 2.5) * DPR, col:Math.random() < .75 ? '#9cc7ff' : '#ffffff', life:.6 }));
  await tween(big ? 700 : 480, p => { sp.drain = p; sp.scale = 1 - p * .9; sp.o = 1 - p * .8; caster.crack = p; caster.a = 1 - p; }); guard(id);
  spells.splice(spells.indexOf(sp), 1); casters.splice(casters.indexOf(caster), 1);
}
function reset(){
  themeActive = false; g.clearRect(0,0,W,H);g2.clearRect(0,0,W,H);motionFrozen=false; beat('pull'); $('audioStatus').textContent=''; $('stage').style.filter='';
  ['azrenth','sword','jirasd'].forEach(k => { $(k).classList.remove('bob'); $(k).style.translate = ''; hide($(k)); }); ['halfA','halfB'].forEach(k => { const e = $(k); e.getAnimations().forEach(a => a.cancel()); e.style.opacity = 0; e.style.clipPath = ''; e.style.translate = ''; e.style.filter = ''; burnMask(e, 0, 0, 0); }); $('scene').style.opacity = ''; stopAll(); caption(''); cz = null; star = null; cracks = []; parts.length = 0; zapsF = []; zapsB = []; fissures = []; threads = []; backlight = null; burn = null; orb = null; rift = null; slash = null; glint = null; shards = []; dust = null; dusts = []; spells = []; rings = []; casters = []; hexes = []; shake = 0;
  host.querySelectorAll('.layer,.cut,#card,#flash').forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; e.style.filter = ''; e.style.transform = ''; });
  $('scene').style.opacity = 1;
}

async function run(){
  const id = ++runId; reset(); requestAnimationFrame(loop);
  const step = async p => { await p; guard(id); };
  primeTheme();
  // 1-5 · standard pull (shared by every character)
  $('scene').animate([{ transform:'scale(1.6) translateY(-6%)', filter:'brightness(.25) blur(6px)' }, { transform:'scale(1.05)', filter:'brightness(.32) blur(0)' }], { duration:3400, fill:'forwards', easing:'cubic-bezier(.3,.6,.2,1)' });
  beat('pull');
  cz = { s:.05, r:0, stage:0, alpha:1, show:true, flight:1, rays:0 };
  caption('A Starlight crystal falls…'); play(SFX.pull_fall_whoosh); play(PULL, .6);
  await step(tween(1500, p => { cz.s = .05 + .25 * p * p; cz.r += .06; }));
  caption(''); cz.stage = 1; cz.rays = .6; shake = 4; $('flash').style.background = '#ffd98a'; anim($('flash'), [{ opacity:0 }, { opacity:.55, offset:.2 }, { opacity:0 }]);
  await step(tween(900, p => { cz.s = .3 + .12 * p; cz.r += .05; })); shake = 0;
  play(SFX.tell_splusplus); cz.stage=2; makeCracks(); cz.rays = 1; shake = 6; caption(''); beat('prismatic'); $('flash').style.background = '#ffe7a8'; anim($('flash'), [{ opacity:0 }, { opacity:.55, offset:.2 }, { opacity:0 }]);
  await step(tween(900, p => { cz.s = .42 + .25 * p; cz.r += .04; })); shake = 3; cz.flight = .2;
  await step(tween(1000, p => { cz.s = .67 + .3 * p; cz.r += .012 * (1 - p); })); shake = 0; caption('');
  play(SFX.pull_flash_swell); cz.show = false; cracks = []; spawn(140, () => ({ x:W / 2, y:H * .46, vx:(Math.random() - .5) * 22 * DPR, vy:(Math.random() - .5) * 22 * DPR, s:(2 + Math.random() * 4) * DPR, col:`hsl(${355 + Math.random() * 20},100%,70%)` }));
  $('flash').style.background = '#fff3d6'; await step(anim($('flash'), [{ opacity:0 }, { opacity:1, offset:.3 }, { opacity:0 }], { duration:800 }));
  beat('shadow');
  setV(PULL,.16); cz = null; parts.length = 0;
  // The shadow: pure black against a crimson backlight, so it reads as a figure, never a grey ghost.
  const sil = $('azrenth'); showShot('azrenth');
  $('scene').getAnimations().forEach(a => a.cancel()); $('scene').style.filter = 'brightness(.2) saturate(.7)';
  const SH = 'brightness(0) drop-shadow(0 0 1px #ffb3a3) drop-shadow(0 0 7px #ff3a2a) drop-shadow(0 0 30px #d00000)';
  const [bx, by] = center(sil, .42); backlight = { x:bx, y:by, r:H * .62, a:0, pulse:0 };
  await step(Promise.all([
    anim(sil, [{ filter:SH, opacity:0, transform:'translateX(-50%) scale(.94)' }, { filter:SH, opacity:1, transform:'translateX(-50%) scale(.975)', offset:.4 }, { filter:SH, opacity:1, transform:'translateX(-50%) scale(1)' }], { duration:2600, easing:'cubic-bezier(.2,.7,.2,1)' }),
    tween(2600, p => { backlight.a = Math.min(1, p * 1.6); })
  ]));
  spawn(60, () => ({ x:W / 2 + (Math.random() - .5) * W * .5, y:H * .9, vy:-(0.8 + Math.random() * 1.8) * DPR, col:Math.random() < .6 ? '#ff6a6a' : '#ffd0d0' }));
  // two heartbeats
  for (let i = 0; i < 2; i++) {
    anim(sil, [{ filter:SH, opacity:1, transform:'translateX(-50%) scale(1)' }, { filter:SH, opacity:1, transform:'translateX(-50%) scale(1.025)', offset:.35 }, { filter:SH, opacity:1, transform:'translateX(-50%) scale(1)' }], { duration:520, easing:'ease-out' });
    await step(tween(520, p => { backlight.pulse = Math.sin(Math.min(1, p / .7) * Math.PI); })); backlight.pulse = 0;
    await step(sleep(i ? 980 : 180));
  }
  // Let the shadow resolve into the character before leaving the shot.
  beat('shadow-reveal');
  ramp(PULL,0,.05,80,true); startTheme();
  await step(Promise.all([
    anim(sil, [{ filter:SH, opacity:1, transform:'translateX(-50%) scale(1)' }, { filter:'brightness(1) drop-shadow(0 0 18px #ff202066)', opacity:1, transform:'translateX(-50%) scale(1)' }], { duration:2800, easing:'ease-in-out' }),
    anim($('scene'), [{ filter:'brightness(.2) saturate(.7)' }, { filter:'brightness(.68)' }], { duration:2800, easing:'ease-in-out' }),
    tween(2800, p => { backlight.a = 1 - p; })
  ]));
  backlight = null;
  await step(sleep(1800));

  // Hold the same revealed pose against character-free ruins; no second Azrenth underneath.
  beat('arrival');
  await step(sleep(1400));

  $('scene').getAnimations().forEach(a => a.cancel()); $('scene').style.filter = '';
  const embers = stream(() => spawn(3, () => ({ x:Math.random() * W, y:H + 10, vy:-(0.6 + Math.random() * 1.6) * DPR, col:Math.random() < .7 ? '#ff4a2a' : '#2a0000', life:.8 })), 70);
  beat('voice-intro');
  caption('“So you’re the one who summoned me. …Interesting.”'); await step(ducked(VO.reveal));
  caption('“Azrenth, the Demon King. Don’t forget that name.”'); await step(ducked(VO.reveal_2)); caption('');

  // Jirasd: the flame gathers in his open hand, flies into the castle, and burns the world down to charred ruin.
  beat('jirasd'); caption(hasJirasdVO ? '“Black sun — turn to ash.”' : 'Jirasd');
  await step(fadeShotOut('azrenth')); hide($('azrenth')); parts.length = 0;
  showShot('jirasd');
  await step(anim($('jirasd'), [{opacity:0,filter:'brightness(.35)'},{opacity:1,filter:'brightness(1)'}], {duration:1200}));
  const [jx,jy,jw] = center($('jirasd'), .26), handX = jx - jw * .055;
  const charge = stream(() => spawn(reduced ? 1 : 5, () => {
    const a = Math.random() * Math.PI * 2, r = (35 + Math.random() * 100) * DPR;
    return {x:handX + Math.cos(a) * r,y:jy + Math.sin(a) * r,vx:-Math.cos(a) * 1.5 * DPR,vy:-Math.sin(a) * 1.5 * DPR,s:(1 + Math.random() * 2) * DPR,col:Math.random() < .7 ? '#ff3621' : '#ffdec0',life:.55};
  }),70);
  orb = { x:handX, y:jy, r:0, a:0 };
  const jr = $('jirasd').getBoundingClientRect(), jb = [jr.left * DPR, jr.top * DPR, jr.width * DPR, jr.height * DPR];
  let power = 0;
  const storm = stream(() => {
    // arcs leap from the gathering flame in his hand
    for (let k = 0; k < 1 + Math.round(power * 2); k++) { const a = (60 + Math.random() * 200) * Math.PI / 180, // away from his face (up-right of the hand)
        r = (90 + Math.random() * 240 * (.5 + power)) * DPR;
      zapsF.push(zap(handX, jy, handX + Math.cos(a) * r, jy + Math.sin(a) * r, { w:1.4 + power * 1.6, branches:1 + (Math.random() < .5), life:8 + Math.floor(Math.random() * 6) })); }
    // and crawl over his body
    if (Math.random() < .35 + power * .4) { const px = () => jb[0] + jb[2] * (.3 + Math.random() * .4), py = () => jb[1] + jb[3] * (.36 + Math.random() * .5); zapsF.push(zap(px(), py(), px(), py(), { w:1.1, branches:1, depth:5, life:7 })); }
    // he trembles with it
    $('jirasd').style.translate = reduced ? '' : `${(Math.random() - .5) * (2 + power * 5)}px ${(Math.random() - .5) * (2 + power * 4)}px`;
    if (Math.random() < .5) crackle(.18 + power * .4);
  }, reduced ? 400 : 60);
  const jv = ducked(VO.jirasd);
  await step(tween(reduced ? 1 : 1900, p => { power = p; orb.r = (10 + 60 * p * p) * DPR; orb.a = Math.min(1, p * 1.5); shake = reduced ? 0 : 1 + 4 * p; }));
  await step(jv);
  clearInterval(charge); clearInterval(storm); $('jirasd').style.translate = '';
  play(SFX.pull_flash_swell,.6);
  beat('jirasd-cast'); caption('');
  const target = [W * .2, H * .42];
  // the strike: one bolt of black lightning, flickering, hand to castle
  for (let i = 0; i < (reduced ? 1 : 6); i++) { zapsF.push(zap(handX, jy, target[0], target[1], { w:3.4, branches:4, life:3, rough:.18 })); crackle(.9); shake = reduced ? 0 : 12;
    if (orb) { orb.x = handX + (target[0] - handX) * i / 5; orb.y = jy + (target[1] - jy) * i / 5; orb.r = (70 - 40 * i / 5) * DPR; }
    await step(sleep(55)); }
  orb = null;
  // impact: the castle burns away outward from where it hit, and is left charred behind the fire
  beat('annihilation'); play(SFX.shatter,.85);
  $('flash').style.background = '#ff5a3a'; anim($('flash'), [{ opacity:0 }, { opacity:.55, offset:.15 }, { opacity:0 }], { duration:600 });
  const intact = $('halfA'); intact.style.clipPath = ''; intact.style.opacity = 1;
  $('scene').style.filter = 'brightness(.24) saturate(.5) contrast(1.15)';
  burn = { x:target[0], y:target[1], r:0 };
  const maxR = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - target[0], y - target[1]))) + 40 * DPR;
  const ash = stream(() => { if (!burn) return; spawn(reduced ? 2 : 10, () => { const a = Math.random() * Math.PI * 2;
    return { x:burn.x + Math.cos(a) * burn.r, y:burn.y + Math.sin(a) * burn.r, vx:Math.cos(a) * (1 + Math.random() * 2) * DPR, vy:-(1 + Math.random() * 2.5) * DPR, s:(1 + Math.random() * 2.2) * DPR, col:Math.random() < .5 ? '#1a0604' : '#ff5a24', life:.7 }; });
    if (Math.random() < .45) { const a = Math.random() * Math.PI * 2, r0 = burn.r * (.2 + Math.random() * .5); zapsB.push(zap(burn.x + Math.cos(a) * r0, burn.y + Math.sin(a) * r0, burn.x + Math.cos(a) * burn.r, burn.y + Math.sin(a) * burn.r, { w:1.6, branches:1 })); if (Math.random() < .4) crackle(.3); } }, 40);
  await step(tween(reduced ? 1 : 2400, p => { const e = 1 - Math.pow(1 - p, 2); burn.r = e * maxR; burnMask(intact, burn.x, burn.y, burn.r); shake = reduced ? 0 : 6 * (1 - p); }));
  clearInterval(ash); burn = null; shake = 0; intact.style.opacity = 0; burnMask(intact, 0, 0, 0);
  await step(sleep(1400));
  await step(anim($('jirasd'),[{opacity:1},{opacity:0}],{duration:800})); hide($('jirasd'));
  await step(sleep(400));

  // Venuzdonoa: framed tight on the blade (unlike Jirasd's open hand); the laws of the world show as golden threads behind him.
  beat('venuzdonoa');
  caption('“All that my eyes behold — return to ash. Sever reason itself — Venuzdonoa!”'); const vs = ducked(VO.sig_full);
  const sw = $('sword'); showShot('sword');
  const LIT = 'brightness(1) drop-shadow(0 0 22px #ff2020aa)';
  anim(sw, [{ opacity:0, filter:'brightness(0) drop-shadow(0 0 40px #ff2020)', transform:'translateX(-50%) scale(1)' }, { opacity:1, filter:LIT, transform:'translateX(-50%) scale(1.02)', offset:.18 }, { opacity:1, filter:LIT, transform:'translateX(-50%) scale(1.1)' }], { duration:7000, easing:'linear' });
  threads = [[.1, .42, .1], [.34, .08, .07], [.2, .62, .12], [.58, .3, .06]].map(([y0, y1, sag]) => ({ p0:[-W * .05, H * y0], p1:[W * 1.05, H * y1],
    c:[W * (.4 + Math.random() * .2), H * ((y0 + y1) / 2 + sag)], a:0, k:0, hit:null, ph:Math.random() }));
  await step(tween(1400, p => { threads.forEach(th => th.a = p); }));
  await step(sleep(500));
  // a glint runs down the blade, hilt to tip
  glint = { x:0, y:0, a:0 };
  await step(tween(reduced ? 1 : 1000, p => { [glint.x, glint.y] = cutPoint(sw, 285 + (960 - 285) * p, 355 + (1040 - 355) * p); glint.a = Math.sin(p * Math.PI); }));
  glint = null;
  await step(vs);
  // silence: the theme stops and the world holds its breath
  beat('sever');
  clearInterval(ramps.get(THEME)); themeActive = false; THEME.pause(); PULL.pause();
  $('flash').style.background = '#000';
  await step(Promise.all([anim($('flash'), [{ opacity:0 }, { opacity:.45 }], { duration:500 }), tween(500, p => { shake = reduced ? 0 : 3 * p; })]));
  caption('“Sever.”'); const vc = voice(VO.sig_short);
  await step(sleep(380));
  // the cut: one stroke, edge to edge, on the exact line the Sever painting continues. It passes behind him; he is untouched.
  const L = riftLine();
  $('flash').getAnimations().forEach(a => a.cancel()); $('flash').style.opacity = 0;
  slash = { L, p:0, a:1, w:1 }; play(SFX.slash, .9);
  await step(tween(reduced ? 1 : 130, p => { slash.p = 1 - Math.pow(1 - p, 2); })); slash.p = 1;
  threads.forEach(th => { let prev = null; for (let i = 0; i <= 80; i++) { const [x, y] = qpt(th, i / 80), s = (x - L.e0[0]) * L.n[0] + (y - L.e0[1]) * L.n[1];
    if (prev !== null && Math.sign(s) !== Math.sign(prev)) { th.hit = i / 80; break; } prev = s; } });
  $('flash').style.background = '#fff'; anim($('flash'), [{ opacity:.85 }, { opacity:0 }], { duration:280, easing:'ease-out' });
  beat('reality-break'); play(SFX.shatter); shake = reduced ? 0 : 18;
  // the world splits along the cut: the two halves of the charred castle slide apart and the void shows between them
  const hA = $('halfA'), hB = $('halfB');
  [[hA, 1], [hB, -1]].forEach(([e, s]) => { e.style.filter = $('scene').style.filter; e.style.clipPath = sideClip(L, s); e.style.opacity = 1; });
  $('scene').style.opacity = 0;
  rift = { L, gap:0, a:1, stars:Array.from({ length:220 }, () => ({ u:Math.random(), o:Math.random() * 2 - 1, z:(Math.random() < .9 ? 1 : 2) * DPR, b:.4 + Math.random() * .6, ph:Math.random() * 6, c:Math.random() < .75 ? '#ffffff' : Math.random() < .5 ? '#c9b3ff' : '#ff9a8a' })) };
  // gravity fails: debris rises out of the broken world
  spawn(reduced ? 20 : 110, () => ({ x:Math.random() * W, y:H * (.45 + Math.random() * .55), vx:(Math.random() - .5) * 1.2 * DPR, vy:-(1.5 + Math.random() * 4) * DPR, s:(1.5 + Math.random() * 3.5) * DPR, col:Math.random() < .55 ? '#2a0a0a' : '#ff4a2a', life:1 }));
  const G = Math.min(innerWidth, innerHeight) * .05; rift.G = G; fissures = makeFissures(L, G * DPR);
  await step(tween(reduced ? 1 : 1000, p => { const e = 1 - Math.pow(1 - p, 3); rift.gap = G * e;
    hA.style.translate = `${L.n[0] * G * e}px ${L.n[1] * G * e}px`; hB.style.translate = `${-L.n[0] * G * e}px ${-L.n[1] * G * e}px`;
    slash.w = 1 - e * .6; slash.a = 1 - e * .7; shake = reduced ? 0 : 4 + 14 * (1 - p); threads.forEach(th => th.k = e); fissures.forEach(f => f.grow = Math.min(1, e * 1.25)); }));
  threads = [];
  // the broken world keeps shuddering; the cracks keep spreading
  const tremor = stream(() => { shake = reduced ? 0 : 2.5 + Math.random() * 3; }, 60);
  await step(vc); await step(sleep(900)); clearInterval(tremor); shake = 0;
  // white flash, and the same cut carries on in the painting. Only one full-screen image is ever visible.
  $('flash').style.background = '#fff';
  await step(anim($('flash'), [{ opacity:0 }, { opacity:1 }], { duration:160, easing:'ease-in' }));
  hide(sw); slash = null; rift = null; fissures = []; zapsB = []; zapsF = []; parts.length = 0; caption('');
  [hA, hB].forEach(e => { e.style.opacity = 0; e.style.clipPath = ''; e.style.translate = ''; });
  showShot('severArt');
  beat('sever-aftermath'); startTheme(.34);
  anim($('severArt'), [{ transform:'scale(1)' }, { transform:'scale(1.035)' }], { duration:4600, easing:'ease-in-out' });
  await step(anim($('flash'), [{ opacity:1 }, { opacity:0 }], { duration:700, easing:'ease-out' }));
  beat('black-ash');
  await step(sleep(2800));
  clearInterval(embers);
  // dip to black, then the throne
  $('flash').style.background = '#000';
  await step(anim($('flash'), [{ opacity:0 }, { opacity:1 }], { duration:700, easing:'ease-in' }));
  parts.length = 0; caption('');
  beat('card');
  // 9 · name card over the throne
  showShot('finalArt'); startTheme(.45);
  anim($('finalArt'), [{ transform:'scale(1.03)' }, { transform:'scale(1)' }], { duration:2600, easing:'cubic-bezier(.2,.7,.2,1)' });
  await step(anim($('flash'), [{ opacity:1 }, { opacity:0 }], { duration:1100, easing:'ease-out' }));
  await step(anim($('card'), [{ opacity:0, transform:'translateX(-20px)' }, { opacity:1, transform:'translateX(0)' }], { duration:1000 }));
}

life.onCancel=()=>{ runId++; stopAll(); activeCrackles.forEach(src=>{try{src.stop()}catch(e){}}); activeCrackles.clear(); reset(); $('stage').style.transform=''; $('jirasd').style.translate=''; };
const engine = {
  replay(){ initSfx(); return life.replay(run); },
  skip(){ life.cancel(); beat('card'); motionFrozen=true; showShot('finalArt'); $('scene').style.opacity=0; $('card').style.opacity=1; $('card').style.transform='none'; startTheme(.45); onFinished(); },
  dispose(){ life.dispose(); window.removeEventListener('resize',size); }
};
$('stage').ondblclick = event => { if (!event.target.closest('button')) engine.skip(); };
return engine;
}
