// Character choreography ported from reveal-demos/mahesvara/index.html (approved 2026-09-27).
import {standardPull} from './standard-pull.js';
import {createPlayback} from './playback.js';
import {assets} from './mahesvara-markup.js';
export function createRuntime(host,onFinished,base){
const asset=name=>base+assets[name];
const locals={};
const life=createPlayback(host,onFinished);
const {sleep,tween,anim,voice,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame}=life;
let runId=0; function guard(id){if(id!==runId)throw life.CANCEL;}
life.onCancel=()=>{runId++;ALL.forEach(a=>{a.pause();a.currentTime=0});};

const $ = id => host.querySelector('#'+id);
const fx = $('fx'), g = fx.getContext('2d'), fx2 = $('fx2'), g2 = fx2.getContext('2d');
const DPR = devicePixelRatio;
let W, H; function size(){ W = fx.width = fx2.width = innerWidth * DPR; H = fx.height = fx2.height = innerHeight * DPR; } size(); window.addEventListener('resize', size);
const crystalImg = new Image(); crystalImg.src = asset('crystal.webp');

/* ---------- audio: every level goes through setV so the Sound button can scale it ---------- */
const LEVELS = [{ k:'on', m:1, label:'Sound on' }, { k:'low', m:.3, label:'Sound low' }, { k:'off', m:0, label:'Muted' }];
let level = 0; try { const s = localStorage.getItem('lumara.revealSound'); if (s !== null) level = Math.min(2, Math.max(0, +s || 0)); } catch (e) {}
const ALL = [];
function setV(a, v){ a._v = Math.max(0, Math.min(1, v)); a.volume = a._v * LEVELS[level].m; }
function track(src, v){ const a = new Audio(asset(src)); a.preload = 'auto'; ALL.push(a); setV(a, v); return a; }
const SFX = {}; ['pull_fall_whoosh','tell_splusplus','pull_flash_swell','destroy','restore'].forEach(n => SFX[n] = track('sfx_' + n + '.mp3', .75));
const VO = {}; ['reveal','reveal_2','transform','true_reveal','sig_destroy','sig_restore','nullify','sig_full'].forEach(n => VO[n] = track('vo_' + n + '.mp3', 1));
const PULL = track('pull_music.mp3', .6);
const THEME = track('theme.mp3', 0); THEME.loop = true; // slot: drop Mahesvara's theme in as theme.mp3
const ramps = new Map();
function ramp(a, to, step = .03, ms = 80, pauseAtZero = false){
  clearInterval(ramps.get(a));
  ramps.set(a, setInterval(() => { const d = to - a._v; if (Math.abs(d) <= step) { setV(a, to); clearInterval(ramps.get(a)); if (pauseAtZero && to === 0) a.pause(); } else setV(a, a._v + Math.sign(d) * step); }, ms));
}
function play(a, v){ a.currentTime = 0; if (v !== undefined) setV(a, v); a.play().catch(() => {}); }
function stopAll(){ ALL.forEach(a => { clearInterval(ramps.get(a)); a.pause(); }); }
function renderSound(){ const L = LEVELS[level], b = $('sound'); b.dataset.level = L.k; b.title = L.label; b.setAttribute('aria-label', L.label + ' (click to change)'); b.querySelector('span').textContent = L.k === 'on' ? 'Sound' : L.k === 'low' ? 'Low' : 'Muted'; }
$('sound').onclick = () => { level = (level + 1) % LEVELS.length; ALL.forEach(a => setV(a, a._v)); try { localStorage.setItem('lumara.revealSound', level); } catch (e) {} renderSound(); };
renderSound();

/* ---------- run control: Replay cancels the running sequence instead of stacking a second one ---------- */

function hide(el){ el.getAnimations().forEach(a => a.cancel()); el.style.opacity = 0; }
function show(el){ el.getAnimations().forEach(a => a.cancel()); el.style.opacity = 1; }
function caption(t){ const c = $('caption'); c.textContent = t; c.style.opacity = t ? '.92' : '0'; }

/* ---------- canvas world ---------- */
let cz = null, star = null, cracks = [], shake = 0, shards = [], dust = null, dusts = [], spells = [], rings = [], casters = [], hexes = [];
const clouds = Array.from({ length: 26 }, () => ({ x:(Math.random() - .5) * 2, y:(Math.random() - .5) * 1.4, z:Math.random() }));
const parts = [];
function spawn(n, opts){ for (let i = 0; i < n; i++) parts.push(Object.assign({ x:Math.random() * W, y:H + 10, vx:(Math.random() - .5) * .6 * DPR, vy:-(.4 + Math.random() * 1.4) * DPR, s:(1 + Math.random() * 2.5) * DPR, life:1, col:'#bcd8ff' }, opts ? opts(i) : {})); }
function makeCracks(){ cracks = []; for (let k = 0; k < 7; k++) { let x = W * .5, y = H * .2, pts = [[x, y]]; const ang = Math.PI / 2 + (Math.random() - .5) * 2.6; for (let i = 0; i < 9; i++) { x += Math.cos(ang + (Math.random() - .5)) * W * .035; y += Math.sin(ang + (Math.random() - .5)) * H * .03 - H * .02; pts.push([x, y]); } cracks.push({ pts, a:1, h:Math.random() * 360 }); } }

// Dissolve an <img> into particles sampled from its own pixels; t=0 whole, t=1 fully dispersed into mist.
function makeDust(el, colorShift){
  const r = el.getBoundingClientRect(), off = document.createElement('canvas');
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height)); off.width = w; off.height = h;
  const c = off.getContext('2d'); c.drawImage(el, 0, 0, w, h);
  const data = c.getImageData(0, 0, w, h).data, step = Math.max(3, Math.round(Math.sqrt(w * h / 5200))), list = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const i = (y * w + x) * 4; if (data[i + 3] < 60) continue;
    const ang = Math.random() * Math.PI * 2, sp = .25 + Math.random();
    list.push({ ox:(r.left + x) * DPR, oy:(r.top + y) * DPR, dx:Math.cos(ang) * sp * W * .22 + (x / w - .5) * W * .12, dy:-(Math.random() * .9 + .2) * H * .5 + Math.sin(ang) * H * .08,
      col: colorShift ? `rgb(${data[i] * .5 + 70},${data[i + 1] * .6 + 110},255)` : `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, s:step * DPR * .9, delay:(1 - y / h) * .35 + Math.random() * .15 }); }
  return { list, t:0, glow:colorShift };
}
function drawDust(ctx, d){
  for (const p of d.list) { const k = Math.max(0, Math.min(1, (d.t - p.delay) / (1 - p.delay * .6))); const e = k * k * (3 - 2 * k);
    ctx.globalAlpha = (1 - e * .85) * (1 - (p.fade || 0)); ctx.fillStyle = e > .15 && d.glow ? '#9cc7ff' : p.col;
    ctx.fillRect(p.ox + p.dx * e, p.oy + p.dy * e, p.s * (1 - e * .5), p.s * (1 - e * .5)); }
  ctx.globalAlpha = 1;
}
function loop(t){
  g.clearRect(0, 0, W, H); g2.clearRect(0, 0, W, H);
  const sx = shake ? (Math.random() - .5) * shake : 0, sy = shake ? (Math.random() - .5) * shake : 0; $('stage').style.transform = shake ? `translate(${sx}px,${sy}px)` : '';
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
  if (dust) drawDust(g2, dust); for (const d of dusts) drawDust(g2, d);
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
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function orbit(el, n){ const r = el.getBoundingClientRect(); shards = Array.from({ length:n }, (_, i) => ({ cx:(r.left + r.width / 2) * DPR, cy:(r.top + r.height * .45) * DPR,
  rx:r.width * DPR * (.55 + Math.random() * .25), ry:r.height * DPR * (.12 + Math.random() * .1), a:i / n * Math.PI * 2, w:.012 + Math.random() * .01, z:(8 + Math.random() * 12) * DPR, o:0 })); }

function center(el, fy = .45){ const r = el.getBoundingClientRect(); return [(r.left + r.width / 2) * DPR, (r.top + r.height * fy) * DPR, r.width * DPR]; }
async function spellAt(id, from, hue, big = false){
  const [cx, cy, w] = center($('awakened'), .42), R = w * (big ? .55 : .45), ang = Math.atan2(cy - from[1], cx - from[0]);
  const caster = { x:from[0], y:from[1], r:big ? 70 : 46, rot:0, a:0, h:hue, crack:0 }; casters.push(caster);
  await tween(450, p => { caster.a = p; }); guard(id);
  const stopX = cx - Math.cos(ang) * R, stopY = cy - Math.sin(ang) * R;
  const sp = { x:from[0], y:from[1], o:1, h:hue, drain:0, size:big ? 30 : 18, scale:1, trail:[] }; spells.push(sp);
  await tween(big ? 820 : 620, p => { const e = p * p; sp.x = from[0] + (stopX - from[0]) * e; sp.y = from[1] + (stopY - from[1]) * e; }); guard(id);
  // stopped cold: the barrier flashes where it hit and the spell trembles
  hexes.push({ x:stopX, y:stopY, t:0, rot:ang }); shake = big ? 8 : 3;
  await tween(big ? 420 : 260, p => { sp.x = stopX + (Math.random() - .5) * 6 * DPR; sp.y = stopY + (Math.random() - .5) * 6 * DPR; }); guard(id); shake = 0;
  // erased: drains from its colour to blue, shrinks, and is pulled apart into his hand
  const hand = center($('awakened'), .5);
  spawn(big ? 80 : 36, () => ({ x:stopX, y:stopY, vx:(hand[0] - stopX) * (.012 + Math.random() * .01), vy:(hand[1] - stopY) * (.012 + Math.random() * .01), s:(1.5 + Math.random() * 2.5) * DPR, col:Math.random() < .75 ? '#9cc7ff' : '#ffffff', life:.6 }));
  await tween(big ? 700 : 480, p => { sp.drain = p; sp.scale = 1 - p * .9; sp.o = 1 - p * .8; caster.crack = p; caster.a = 1 - p; }); guard(id);
  spells.splice(spells.indexOf(sp), 1); casters.splice(casters.indexOf(caster), 1);
}
function reset(){
  stopAll(); caption(''); cz = null; star = null; cracks = []; parts.length = 0; shards = []; dust = null; dusts = []; spells = []; rings = []; casters = []; hexes = []; shake = 0;
  host.querySelectorAll('.layer,.cut,#card,#flash').forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; e.style.filter = ''; e.style.transform = ''; });
  $('scene').style.opacity = 1;
}

async function run(){
  const id = runId; reset();
  const step = async p => { await p; guard(id); };
  // 1-5 · standard pull (shared by every character)
  await standardPull({state:{get cz(){return cz},set cz(v){cz=v},get shake(){return shake},set shake(v){shake=v},set cracks(v){cracks=v}}, $, tween, anim, animateRaw:(e,f,o)=>e.animate(f,o), wait:sleep, caption, sfx:n=>{const a=SFX[n];a.currentTime=0;a.play().catch(()=>{})},playPull:()=>{PULL.currentTime=0;setV(PULL,.6);PULL.play().catch(()=>{})},stopSfx:()=>{},spawn,makeCracks,W,H,DPR,check:()=>guard(id),background:'scene',stopBeforeSilhouette:true},'S++');
  const sil = $('base'); sil.style.opacity = 1;
  sil.animate([{ filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #8fc4ff)', opacity:0, transform:'translateX(-50%) scale(.92)' }, { filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #8fc4ff)', opacity:1, transform:'translateX(-50%) scale(1)' }], { duration:900, fill:'forwards' });
  await step(sleep(1500)); cz = null;
  anim($('flash'), [{ opacity:0 }, { opacity:.9, offset:.25 }, { opacity:0 }], { duration:600 });
  await step(anim(sil, [{ filter:'brightness(3)', opacity:1, transform:'translateX(-50%)' }, { filter:'brightness(1)', opacity:0, transform:'translateX(-50%)' }], { duration:700 }));

  cracks=[]; parts.length=0;
  // 6 · base form: moon splash, then he stands on the ledge — his theme starts the moment he appears
  ramp(PULL, 0, .05, 80, true); THEME.currentTime = 0; setV(THEME, 0); life.playMusic(THEME); ramp(THEME, .3);
  spawn(80, () => ({ col:Math.random() < .75 ? '#9cc7ff' : '#e4eeff' }));
  anim($('splashBase'), [{ opacity:0, transform:'scale(1.02)', filter:'brightness(2) blur(6px)' }, { opacity:1, transform:'scale(1)', filter:'brightness(1) blur(0)' }], { duration:1400 });
  await step(sleep(1900));
  await step(anim($('splashBase'), [{ opacity:1, transform:'scale(1)' }, { opacity:0, transform:'scale(1.02)' }], { duration:600 }));
  $('scene').getAnimations().forEach(a => a.cancel()); $('scene').style.filter = 'brightness(.62) saturate(.95)';
  await step(anim($('base'), [{ opacity:0, transform:'translateX(-50%) translateY(30px)' }, { opacity:1, transform:'translateX(-50%)' }], { duration:700 }));
  caption('“…So you’re the one who called me.”'); await step(voice(VO.reveal));
  caption('“Very well. I won’t let you be bored.”'); await step(voice(VO.reveal_2)); caption('');

  // 7 · transformation: his base form breaks into blue mist, and the same mist pulls back together as his true form
  orbit($('base'), 14); caption('“Let me show you. This is my true form.”'); const tf = voice(VO.transform);
  await step(tween(600, p => shards.forEach(s => s.o = p)));
  const out = makeDust($('base'), true), into = makeDust($('awakened'), true); into.t = 1;
  dusts = [out]; hide($('base')); shake = 2;
  await step(tween(1500, p => { out.t = p; }));
  dusts = [out, into];
  await step(tween(1600, p => { out.t = 1; into.t = 1 - p; for (const q of out.list) q.fade = p; }));
  dusts = []; shake = 0; show($('awakened'));
  anim($('flash'), [{ opacity:0 }, { opacity:.45, offset:.3 }, { opacity:0 }], { duration:700 });
  anim($('awakened'), [{ filter:'brightness(2.4) drop-shadow(0 0 30px #cfe4ff)' }, { filter:'brightness(1) drop-shadow(0 0 24px #8fc4ff88)' }], { duration:900 });
  await step(tf);

  // 8 · true form speaks; the pillar he is about to use appears beside him
  anim($('pillar'), [{ opacity:0 }, { opacity:1 }], { duration:700 }); show($('pillar'));
  caption('“Destroy or restore — all of it answers to me.”'); await step(voice(VO.true_reveal)); caption('');
  await step(sleep(400));

  // 9a · nullify: enemy spells streak in and are stopped short of him, cracking into blue mist
  show($('knight')); anim($('knight'), [{ opacity:0, filter:'saturate(.5) brightness(.7)' }, { opacity:1, filter:'saturate(.6) brightness(.85)' }], { duration:800 });
  $('knight').style.filter = 'saturate(.6) brightness(.85)';
  caption('“You thought magic like that could reach me?”'); const vn = voice(VO.nullify);
  await step(sleep(250));
  const edges = [[W * .08, H * .22], [W * .92, H * .3], [W * .25, H * .07], [W * .82, H * .1]], hues = [350, 285, 8, 300];
  await step(Promise.all(edges.map((e, i) => sleep(i * 380).then(() => spellAt(id, e, hues[i])))));
  const fin = spellAt(id, [W * .12, H * .6], 340, true);
  await step(sleep(1500)); $('stage').animate([{ filter:'saturate(1)' }, { filter:'saturate(.15) brightness(.9)' }, { filter:'saturate(1)' }], { duration:900 });
  await step(fin);
  await step(vn); caption(''); await step(sleep(300));

  // 9 · signature: Destroy & Restore — the pillar disperses into mist, holds, then rewinds into place in white light
  caption('“Vanish.”'); const v1 = voice(VO.sig_destroy); play(SFX.destroy);
  dust = makeDust($('pillar'), true); hide($('pillar')); shake = 3;
  await step(tween(1300, p => { dust.t = p; })); shake = 0; await step(v1);
  await step(sleep(500));
  caption('“…Return.”'); const v2 = voice(VO.sig_restore); play(SFX.restore);
  $('flash').style.background = '#ffffff'; anim($('flash'), [{ opacity:0 }, { opacity:.35, offset:.5 }, { opacity:0 }], { duration:1300 });
  await step(tween(1200, p => { dust.t = 1 - p; }));
  dust = null; show($('pillar')); anim($('pillar'), [{ filter:'brightness(2.6) drop-shadow(0 0 30px #fff)' }, { filter:'brightness(1)' }], { duration:900 });
  await step(v2); await step(sleep(700)); caption('');

  // 9d · heal: the wounded knight's injuries rewind closed in white light
  caption('“What exists, to nothing. What is lost, to form.”'); const vf = voice(VO.sig_full);
  const [kx, ky] = center($('knight'), .5);
  spawn(60, () => ({ x:kx + (Math.random() - .5) * W * .12, y:ky + (Math.random() - .5) * H * .3, vx:(Math.random() - .5) * .8 * DPR, vy:-(0.6 + Math.random() * 1.6) * DPR, col:Math.random() < .6 ? '#ffffff' : '#bcd8ff' }));
  await step(anim($('knight'), [{ filter:'saturate(.6) brightness(.85)' }, { filter:'saturate(1) brightness(2.2) drop-shadow(0 0 30px #ffffff)' }], { duration:1300 }));
  if (!$('knightHealed').dataset.missing && $('knightHealed').complete && $('knightHealed').naturalWidth) {
    show($('knightHealed')); $('knightHealed').style.filter = 'brightness(2.2) drop-shadow(0 0 30px #fff)'; hide($('knight'));
    await step(anim($('knightHealed'), [{ filter:'brightness(2.2) drop-shadow(0 0 30px #fff)' }, { filter:'brightness(1) drop-shadow(0 0 14px #cfe4ff88)' }], { duration:1300 }));
  } else {
    await step(anim($('knight'), [{ filter:'saturate(1) brightness(2.2) drop-shadow(0 0 30px #ffffff)' }, { filter:'saturate(1) brightness(1) drop-shadow(0 0 14px #cfe4ff88)' }], { duration:1300 }));
  }
  await step(vf); await step(sleep(500)); caption('');

  // 10 · name card over the mirror splash (base and true form back to back)
  await step(tween(500, p => shards.forEach(s => s.o = .8 * (1 - p)))); shards = [];
  ['awakened','pillar','knight','knightHealed'].forEach(k => anim($(k), [{ opacity:parseFloat(getComputedStyle($(k)).opacity) }, { opacity:0 }], { duration:600 }));
  anim($('splashMirror'), [{ opacity:0, transform:'scale(1.02)' }, { opacity:1, transform:'scale(1)' }], { duration:1200 });
  ramp(THEME, .55);
  await step(anim($('card'), [{ opacity:0, transform:'translateX(-40px)' }, { opacity:1, transform:'translateX(0)' }], { duration:800 }));
}

function finalPose(){ reset(); host.querySelectorAll('canvas').forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height)); $('stage').style.filter=''; $('stage').style.transform=''; const p=$('splashMirror');p.style.opacity=1;p.style.transform='none';$('card').style.opacity=1;$('card').style.transform='none'; }
life.primeMusic(THEME);
return { replay:()=>life.replay(run), skip:()=>{life.cancel();finalPose();onFinished()}, dispose:()=>{life.dispose();window.removeEventListener('resize',size)}, getLevel:()=>level };

}
