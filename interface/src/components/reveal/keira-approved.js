// Character choreography ported from reveal-demos/keira/index.html (approved 2026-09-27).
import {standardPull} from './standard-pull.js';
import {createPlayback} from './playback.js';
import {assets} from './keira-markup.js';
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
const SFX = {}; ['pull_fall_whoosh','tell_splusplus','pull_flash_swell','slam','summon'].forEach(n => SFX[n] = track('sfx_' + n + '.mp3', .75));
const VO = {}; ['reveal','reveal_2','sig_full','sig_mech','ultimate'].forEach(n => VO[n] = track('vo_' + n + '.mp3', 1));
const PULL = track('pull_music.mp3', .6);
const THEME = track('theme.mp3', 0); THEME.loop = true; // TACTIC (DAOKO): vocals from 0:06, so it ducks under her lines
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
let glitchUntil = 0, waves = [], beam = null, orb = null, tiles = [], blade = null; const mechImg = new Image(); mechImg.src = asset('mech.webp'); const swordImg = new Image();  let cz = null, star = null, cracks = [], shake = 0, shards = [], dust = null, dusts = [], spells = [], rings = [];
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
      col: colorShift === 'pink' ? `rgb(255,${data[i + 1] * .45 + 110},${data[i + 2] * .3 + 190})` : colorShift ? `rgb(${data[i] * .5 + 70},${data[i + 1] * .6 + 110},255)` : `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, s:step * DPR * .9, delay:(1 - y / h) * .35 + Math.random() * .15 }); }
  return { list, t:0, glow:colorShift };
}
function drawDust(ctx, d){
  for (const p of d.list) { const k = Math.max(0, Math.min(1, (d.t - p.delay) / (1 - p.delay * .6))); const e = k * k * (3 - 2 * k);
    ctx.globalAlpha = (1 - e * .85) * (1 - (p.fade || 0)); ctx.fillStyle = e > .15 && d.glow ? (d.glow === 'pink' ? '#ff9ad5' : '#9cc7ff') : p.col;
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
  for (const sp of spells) { const x = sp.x0 + (sp.x1 - sp.x0) * sp.p, y = sp.y0 + (sp.y1 - sp.y0) * sp.p; sp.trail.push([x, y]); if (sp.trail.length > 22) sp.trail.shift();
    for (let i = 1; i < sp.trail.length; i++) { const [ax, ay] = sp.trail[i - 1], [bx, by] = sp.trail[i], k = i / sp.trail.length;
      g2.strokeStyle = `hsla(${sp.h},100%,${55 + k * 20}%,${k * sp.o})`; g2.lineWidth = (2 + k * 9) * DPR; g2.lineCap = 'round'; g2.shadowColor = `hsl(${sp.h},100%,60%)`; g2.shadowBlur = 20 * DPR; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(bx, by); g2.stroke(); }
    g2.shadowBlur = 0; }
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += .035; if (r.t >= 1) { rings.splice(i, 1); continue; }
    g2.save(); g2.globalAlpha = 1 - r.t; g2.strokeStyle = '#cfe4ff'; g2.shadowColor = '#8fc4ff'; g2.shadowBlur = 16 * DPR; g2.lineWidth = 2 * DPR;
    for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI * 2 + r.rot, a1 = a0 + .7; g2.beginPath(); g2.arc(r.x, r.y, (14 + r.t * 46) * DPR, a0, a1); g2.stroke(); } g2.restore(); }
  for (const s of shards) { s.a += s.w; const x = s.cx + Math.cos(s.a) * s.rx, y = s.cy + Math.sin(s.a) * s.ry; g2.save(); g2.translate(x, y); g2.rotate(s.a * 2); g2.globalAlpha = s.o;
    g2.fillStyle = 'rgba(190,220,255,.85)'; g2.shadowColor = '#8fc4ff'; g2.shadowBlur = 14 * DPR; g2.beginPath(); g2.moveTo(0, -s.z); g2.lineTo(s.z * .45, 0); g2.lineTo(0, s.z); g2.lineTo(-s.z * .45, 0); g2.closePath(); g2.fill(); g2.restore(); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.life -= .0035;
    if (p.life <= 0 || p.y < -40 || p.y > H + 40) { parts.splice(i, 1); continue; }
    g2.globalAlpha = Math.min(1, p.life); g2.fillStyle = p.col; g2.shadowColor = p.col; g2.shadowBlur = 8 * DPR; g2.beginPath(); g2.arc(p.x, p.y, p.s, 0, Math.PI * 2); g2.fill(); g2.shadowBlur = 0; g2.globalAlpha = 1; }
  if (performance.now() < glitchUntil) { for (let i = 0; i < 22; i++) { const w = (20 + Math.random() * 140) * DPR, h = (4 + Math.random() * 26) * DPR;
      g2.globalAlpha = .25 + Math.random() * .45; g2.fillStyle = ['#ff5fb8', '#7ff6ff', '#ffffff', '#ff9ad5'][i % 4]; g2.fillRect(Math.random() * W, Math.random() * H, w, h); }
    g2.globalAlpha = 1; $('stage').style.filter = `hue-rotate(${(Math.random() - .5) * 40}deg) saturate(1.3)`; } else if ($('stage').style.filter) $('stage').style.filter = '';
  for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.t += .018; if (w.t >= 1) { waves.splice(i, 1); continue; }
    const rx = (40 + w.t * W * .55), ry = rx * .16; g2.save(); g2.globalAlpha = (1 - w.t) * .9; g2.strokeStyle = '#ff7fc4'; g2.shadowColor = '#ff3fa0'; g2.shadowBlur = 30 * DPR; g2.lineWidth = (10 * (1 - w.t) + 2) * DPR;
    g2.beginPath(); g2.ellipse(w.x, w.y, rx, ry, 0, 0, Math.PI * 2); g2.stroke(); g2.restore(); }
  if (orb) { const r = orb.r * DPR; const gr = g2.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2.2); gr.addColorStop(0, `rgba(255,255,255,${orb.a})`); gr.addColorStop(.25, `rgba(255,150,210,${orb.a})`); gr.addColorStop(1, 'rgba(255,60,170,0)');
    g2.fillStyle = gr; g2.beginPath(); g2.arc(orb.x, orb.y, r * 2.2, 0, Math.PI * 2); g2.fill(); }
  if (beam) { const b = beam, R = b.r * (1 + Math.sin(t / 30) * .03);
    g2.save(); g2.globalCompositeOperation = 'lighter';
    const gr = g2.createRadialGradient(b.x, b.y, 0, b.x, b.y, R); gr.addColorStop(0, `rgba(255,255,255,${b.a})`); gr.addColorStop(.22, `rgba(255,210,235,${b.a})`); gr.addColorStop(.55, `rgba(255,90,190,${b.a * .7})`); gr.addColorStop(1, 'rgba(255,40,160,0)');
    g2.fillStyle = gr; g2.beginPath(); g2.arc(b.x, b.y, R, 0, Math.PI * 2); g2.fill();
    g2.translate(b.x, b.y); g2.rotate(t / 700);
    for (let i = 0; i < 16; i++) { g2.rotate(Math.PI / 8); g2.fillStyle = `rgba(255,${150 + (i % 2) * 80},220,${.22 * b.a})`; g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(-R * .06, -R * 1.6); g2.lineTo(R * .06, -R * 1.6); g2.fill(); }
    for (const k of [.35, .6, .85]) { g2.strokeStyle = `rgba(255,255,255,${.35 * b.a})`; g2.lineWidth = 3 * DPR; g2.beginPath(); g2.arc(0, 0, R * ((k + t / 900) % 1), 0, Math.PI * 2); g2.stroke(); }
    g2.restore(); }
  for (const tl of tiles) { const e = tl.p * tl.p * (3 - 2 * tl.p), x = tl.x0 + (tl.x1 - tl.x0) * e, y = tl.y0 + (tl.y1 - tl.y0) * e - Math.sin(e * Math.PI) * tl.arc;
    g2.save(); g2.translate(x, y); g2.rotate(tl.rot * e); const sc = 1 - e * .7; g2.globalAlpha = 1 - Math.max(0, e - .85) / .15;
    g2.shadowColor = '#ff5fb8'; g2.shadowBlur = 16 * DPR; if (mechImg.complete) g2.drawImage(mechImg, tl.sx, tl.sy, tl.sw, tl.sh, -tl.dw * sc / 2, -tl.dh * sc / 2, tl.dw * sc, tl.dh * sc); g2.restore(); }
  if (blade && swordImg.complete && swordImg.naturalWidth) { const b = blade, GRIP = .80;
    // painted sword points up; the grip (80 % down the image) sits in her hand
    const h = b.len / GRIP, w = h * swordImg.naturalWidth / swordImg.naturalHeight, glow = Math.min(1, b.w / 30);
    const draw = (ang, alpha) => { g.save(); g.translate(b.x, b.y); g.rotate(ang + Math.PI / 2); g.globalAlpha = alpha; g.drawImage(swordImg, -w / 2, -h * GRIP, w, h); g.restore(); };
    g.save(); g.globalCompositeOperation = 'lighter'; for (const tr of b.trail) draw(tr, .16); g.restore();
    g.save(); g.shadowColor = '#ff4fae'; g.shadowBlur = 40 * DPR * glow; draw(b.ang, 1); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; draw(b.ang, .35 * glow); g.restore(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function glitchFor(ms){ glitchUntil = Math.max(glitchUntil, performance.now() + ms); }
function ducked(a){ ramp(THEME, .07, .05, 40); const line=voice(a).then(() => ramp(THEME, .32, .02, 80)); line.catch(()=>{}); return line; }
function orbit(el, n){ const r = el.getBoundingClientRect(); shards = Array.from({ length:n }, (_, i) => ({ cx:(r.left + r.width / 2) * DPR, cy:(r.top + r.height * .45) * DPR,
  rx:r.width * DPR * (.55 + Math.random() * .25), ry:r.height * DPR * (.12 + Math.random() * .1), a:i / n * Math.PI * 2, w:.012 + Math.random() * .01, z:(8 + Math.random() * 12) * DPR, o:0 })); }

function center(el, fy = .45){ const r = el.getBoundingClientRect(); return [(r.left + r.width / 2) * DPR, (r.top + r.height * fy) * DPR, r.width * DPR]; }
async function spellAt(id, from, hue){
  const [cx, cy, w] = center($('keira'), .42), R = w * .42, ang = Math.atan2(cy - from[1], cx - from[0]);
  const sp = { x0:from[0], y0:from[1], x1:cx - Math.cos(ang) * R, y1:cy - Math.sin(ang) * R, p:0, o:1, h:hue, trail:[] }; spells.push(sp);
  await tween(620, p => { sp.p = p * p * (3 - 2 * p); }); guard(id);
  rings.push({ x:sp.x1, y:sp.y1, t:0, rot:Math.random() * 6 });
  spawn(26, () => ({ x:sp.x1, y:sp.y1, vx:(Math.random() - .5) * 5 * DPR, vy:(Math.random() - .5) * 5 * DPR - 1 * DPR, s:(1.5 + Math.random() * 2.5) * DPR, col:Math.random() < .7 ? '#9cc7ff' : `hsl(${hue},100%,70%)` }));
  await tween(300, p => { sp.o = 1 - p; }); spells.splice(spells.indexOf(sp), 1);
}
function reset(){
  clearInterval(locals.boost);
  $('keira').classList.remove('bob'); $('armored').classList.remove('bob'); $('keira').style.left = ''; $('stage').getAnimations().forEach(x => x.cancel()); stopAll(); caption(''); cz = null; star = null; cracks = []; parts.length = 0; shards = []; dust = null; dusts = []; spells = []; rings = []; waves = []; glitchUntil = 0; beam = null; orb = null; tiles = []; blade = null; shake = 0;
  host.querySelectorAll('.layer,.cut,#card,#flash').forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; e.style.filter = ''; e.style.transform = ''; });
  $('scene').style.opacity = 1;
}

async function run(){
  const id = runId; reset();
  const step = async p => { await p; guard(id); };
  // 1-5 · standard pull (shared by every character)
  await standardPull({state:{get cz(){return cz},set cz(v){cz=v},get shake(){return shake},set shake(v){shake=v},set cracks(v){cracks=v}}, $, tween, anim, animateRaw:(e,f,o)=>e.animate(f,o), wait:sleep, caption, sfx:n=>{const a=SFX[n];a.currentTime=0;a.play().catch(()=>{})},playPull:()=>{PULL.currentTime=0;setV(PULL,.6);PULL.play().catch(()=>{})},stopSfx:()=>{},spawn,makeCracks,W,H,DPR,check:()=>guard(id),background:'scene',stopBeforeSilhouette:true},'S++');
  const sil = $('keira'); sil.style.left = '50%'; sil.style.opacity = 1;
  const SH = 'brightness(0) drop-shadow(0 0 3px #fff) drop-shadow(0 0 26px #ff8fc8) drop-shadow(0 0 60px #ff4fae)';
  sil.animate([{ filter:SH, opacity:0, transform:'translateX(-50%) scale(1.05)' }, { filter:SH, opacity:1, transform:'translateX(-50%) scale(1.32)' }], { duration:1600, fill:'forwards', easing:'cubic-bezier(.2,.7,.2,1)' });
  spawn(60, () => ({ x:W / 2 + (Math.random() - .5) * W * .5, y:H * .9, vy:-(0.8 + Math.random() * 1.8) * DPR, col:Math.random() < .6 ? '#ff9ad5' : '#ffffff' }));
  await step(sleep(1700)); cz = null;
  await step(anim($('flash'), [{ opacity:0 }, { opacity:.35, offset:.5 }, { opacity:0 }], { duration:500 }));   // heartbeat 1
  await step(anim($('flash'), [{ opacity:0 }, { opacity:.45, offset:.5 }, { opacity:0 }], { duration:420 }));   // heartbeat 2
  glitchFor(260); await step(sleep(250));
  $('flash').style.background = '#fff'; anim($('flash'), [{ opacity:0 }, { opacity:1, offset:.25 }, { opacity:0 }], { duration:900 });
  spawn(150, () => ({ x:W / 2, y:H * .45, vx:(Math.random() - .5) * 24 * DPR, vy:(Math.random() - .5) * 24 * DPR, s:(2 + Math.random() * 4) * DPR, col:Math.random() < .7 ? '#ff7fc4' : '#ffffff' }));
  await step(anim(sil, [{ filter:'brightness(3)', opacity:1, transform:'translateX(-50%) scale(1.32)' }, { filter:'brightness(1)', opacity:0, transform:'translateX(-50%) scale(1.5)' }], { duration:1000 }));
  hide(sil); sil.style.left = '';

  cracks=[]; parts.length=0;
  // 6 · glitch-in: the screen stutters pink and her floating splash pushes in; TACTIC starts on its intro
  ramp(PULL, 0, .05, 80, true); THEME.currentTime = 0; setV(THEME, 0); life.playMusic(THEME); ramp(THEME, .32);
  glitchFor(900); play(SFX.summon, .5); spawn(80, () => ({ col:Math.random() < .7 ? '#ff9ad5' : '#ffffff' }));
  anim($('splash'), [{ opacity:0, transform:'scale(1.02)', filter:'brightness(2) blur(6px) hue-rotate(40deg)' }, { opacity:1, transform:'scale(1.02)', filter:'brightness(1) blur(0)' }], { duration:1300 });
  await step(sleep(2300)); glitchFor(400);
  await step(anim($('splash'), [{ opacity:1 }, { opacity:0 }], { duration:500 }));

  // 7 · she assembles from pink pixels above the magic circle
  $('scene').getAnimations().forEach(a => a.cancel()); $('scene').style.filter = 'brightness(.82) saturate(1.05)';
  const into = makeDust($('keira'), 'pink'); into.t = 1; dusts = [into];
  await step(tween(1400, p => { into.t = 1 - p; }));
  dusts = []; show($('keira')); $('keira').classList.add('bob'); glitchFor(250);
  caption('“H-hiii! …Hehe, I glitched a little. Did you call me?”'); await step(ducked(VO.reveal));
  caption('“I’m Keira! Let’s be partners from today!”'); await step(ducked(VO.reveal_2)); caption('');

  // 8 · mech summon: a pink hologram draws itself in behind her, then turns solid
  caption('“Guardian, online! Blow it all away!”'); const vs = ducked(VO.sig_full); play(SFX.summon, .75);
  show($('mech'));
  await step(anim($('mech'), [{ clipPath:'inset(0 0 100% 0)', filter:'brightness(1.7) saturate(2) opacity(.55) drop-shadow(0 0 22px #ff5fb8)' }, { clipPath:'inset(0 0 0% 0)', filter:'brightness(1.7) saturate(2) opacity(.6) drop-shadow(0 0 22px #ff5fb8)' }], { duration:1200, easing:'linear' }));
  glitchFor(300);
  await step(anim($('mech'), [{ filter:'brightness(1.7) saturate(2) opacity(.6) drop-shadow(0 0 22px #ff5fb8)' }, { filter:'brightness(1) saturate(1) opacity(1) drop-shadow(0 0 16px #ff5fb888)' }], { duration:700 }));
  await step(vs); caption('');

  // 9 · mech beam: charge at the fist → fire across the sky → fade
  const mr = $('mech').getBoundingClientRect(), ox = (mr.left + mr.width * .68) * DPR, oy = (mr.top + mr.height * .70) * DPR;
  $('mech').animate([{ translate:'0 0' }, { translate:'-1.5vw -1vh' }], { duration:900, fill:'forwards', easing:'ease-out' });
  orb = { x:ox, y:oy, r:4, a:.9 };
  const charge = setInterval(() => spawn(8, () => { const a0 = Math.random() * Math.PI * 2, r0 = (80 + Math.random() * 120) * DPR; return { x:ox + Math.cos(a0) * r0, y:oy + Math.sin(a0) * r0, vx:-Math.cos(a0) * 3 * DPR, vy:-Math.sin(a0) * 3 * DPR, s:(1.5 + Math.random() * 2.5) * DPR, col:Math.random() < .7 ? '#ff9ad5' : '#ffffff', life:.45 }; }), 40);
  play(SFX.summon, .6);
  await step(tween(1100, p => { orb.r = 4 + p * 38; shake = p * 3; })); clearInterval(charge);
  // fire
  caption('“Go get ’em!”'); const vm = ducked(VO.sig_mech);
  $('flash').style.background = '#ffe6f4'; anim($('flash'), [{ opacity:0 }, { opacity:.8, offset:.15 }, { opacity:0 }], { duration:500 });
  play(SFX.slam); glitchFor(700); shake = 12; beam = { x:ox, y:oy, r:40 * DPR, a:1 }; orb = null;
  $('mech').animate([{ translate:'-1.5vw -1vh' }, { translate:'-3.5vw -2.5vh' }], { duration:200, fill:'forwards' });
  const maxR = Math.hypot(W, H) * .75;
  await step(tween(320, p => { beam.r = 40 * DPR + (maxR * .55) * (1 - Math.pow(1 - p, 3)); }));
  const sparks = setInterval(() => spawn(10, () => { const a0 = Math.random() * Math.PI * 2, sp = (6 + Math.random() * 14) * DPR; return { x:ox, y:oy, vx:Math.cos(a0) * sp, vy:Math.sin(a0) * sp, s:(2 + Math.random() * 4) * DPR, col:Math.random() < .6 ? '#ff5fb8' : '#ffffff', life:.5 }; }), 30);
  await step(tween(1400, p => { shake = 12 - p * 7; beam.r = maxR * .55 + maxR * .45 * p; }));
  clearInterval(sparks);
  // fade
  await step(tween(600, p => { beam.a = 1 - p; shake = 5 * (1 - p); }));
  beam = null; orb = null; shake = 0;
  $('mech').animate([{ translate:'-3.5vw -2.5vh' }, { translate:'0 0' }], { duration:700, fill:'forwards', easing:'ease-out' });
  await step(vm); await step(sleep(700)); caption('');

  // 9b · armour fusion: the mech breaks into plates that fly onto Keira → armoured Keira with boosters
  const mr2 = $('mech').getBoundingClientRect(), kr = $('keira').getBoundingClientRect();
  const cols = 4, rows = 6, iw = mechImg.naturalWidth || 1024, ih = mechImg.naturalHeight || 1536;
  tiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const sw = iw / cols, sh = ih / rows, dw = mr2.width / cols * DPR, dh = mr2.height / rows * DPR;
    const mx = mr2.right - (c + .5) * mr2.width / cols; // the mech is drawn mirrored
    tiles.push({ sx:c * sw, sy:r * sh, sw, sh, dw, dh, x0:mx * DPR, y0:(mr2.top + (r + .5) * mr2.height / rows) * DPR,
      x1:(kr.left + kr.width * (.3 + Math.random() * .4)) * DPR, y1:(kr.top + kr.height * (.25 + Math.random() * .5)) * DPR, p:0, rot:(Math.random() - .5) * 4, arc:(40 + Math.random() * 120) * DPR, delay:Math.random() * 500 });
  }
  hide($('mech')); glitchFor(400); play(SFX.summon, .7);
  await step(tween(1500, p => { for (const tl of tiles) tl.p = Math.max(0, Math.min(1, (p * 1500 - tl.delay) / 900)); if (Math.random() < .25) { $('flash').style.background = '#ffd0ea'; anim($('flash'), [{ opacity:0 }, { opacity:.25 }, { opacity:0 }], { duration:160 }); } }));
  tiles = [];
  $('flash').style.background = '#ffffff'; anim($('flash'), [{ opacity:0 }, { opacity:1, offset:.2 }, { opacity:0 }], { duration:800 });
  spawn(140, () => ({ x:(kr.left + kr.width / 2) * DPR, y:(kr.top + kr.height / 2) * DPR, vx:(Math.random() - .5) * 20 * DPR, vy:(Math.random() - .5) * 20 * DPR, s:(2 + Math.random() * 4) * DPR, col:Math.random() < .7 ? '#ff7fc4' : '#ffffff' }));
  $('keira').classList.remove('bob'); hide($('keira')); show($('armored')); $('armored').classList.add('bob');
  await step(anim($('armored'), [{ filter:'brightness(3) drop-shadow(0 0 40px #fff)', transform:'translateX(-50%) scale(.9)' }, { filter:'brightness(1) drop-shadow(0 0 20px #ff5fb8aa)', transform:'translateX(-50%) scale(1)' }], { duration:900 }));
  clearInterval(locals.boost); const boost = locals.boost = setInterval(() => { const ar = $('armored').getBoundingClientRect(); for (const [fx, fy] of [[.12, .12], [.86, .16], [.44, .97], [.56, .97]]) spawn(2, () => ({ x:(ar.left + ar.width * fx) * DPR, y:(ar.top + ar.height * fy) * DPR, vx:(Math.random() - .5) * 1.5 * DPR, vy:(1.5 + Math.random() * 2) * DPR, s:(2 + Math.random() * 3) * DPR, col:Math.random() < .6 ? '#ff5fb8' : '#ffd0ea', life:.4 })); }, 50);
  await step(sleep(900));

  // 9c · ultimate (finale): the sword becomes a giant blade, slashes the ground — KABOOM
  caption('“All systems unlocked! Guardian Protocol!”'); const vu = ducked(VO.ultimate);
  $('armored').animate([{ translate:'0 0' }, { translate:'0 -6vh' }], { duration:700, fill:'forwards', easing:'ease-out' });
  // she flies up out of frame, then drops and drives the sword two-handed into the ground
  await step(tween(700, p => { shake = p * 4; }));
  await step(anim($('armored'), [{ translate:'0 -6vh', opacity:1 }, { translate:'0 -110vh', opacity:1 }], { duration:380, easing:'cubic-bezier(.6,0,1,.6)' }));
  $('armored').classList.remove('bob'); hide($('armored')); shake = 0; glitchFor(200); await step(sleep(250));
  show($('dive'));
  await step(anim($('dive'), [{ transform:'translateX(-50%) translateY(-110vh)', filter:'brightness(1.4) drop-shadow(0 0 30px #ff5fb8)' }, { transform:'translateX(-50%) translateY(0)', filter:'brightness(1.2) drop-shadow(0 0 30px #ff5fb8)' }], { duration:320, easing:'cubic-bezier(.7,0,1,.5)' }));
  hide($('dive')); show($('stab')); // impact frame: the painted crystal burst at the tip
  // hit-stop, then the ground explodes from the sword tip
  const sr = $('stab').getBoundingClientRect(), gx = (sr.left + sr.width * .52) * DPR, gy = (sr.bottom - sr.height * .06) * DPR;
  $('flash').style.background = '#ffffff'; $('flash').style.opacity = .95; await step(sleep(110)); $('flash').style.opacity = 0;
  play(SFX.slam); play(SFX.pull_flash_swell); glitchFor(900); shake = 30;
  $('stage').animate([{ scale:'1.1' }, { scale:'1' }], { duration:700, easing:'cubic-bezier(.2,.8,.2,1)' });
  beam = { x:gx, y:gy, r:30 * DPR, a:1 };
  for (let i = 0; i < 4; i++) setTimeout(() => waves.push({ x:gx, y:gy, t:0 }), i * 130);
  cracks = Array.from({ length:14 }, () => { let x = gx, y = gy, pts = [[x, y]]; const ang0 = Math.random() * Math.PI * 2; for (let i = 0; i < 8; i++) { x += Math.cos(ang0 + (Math.random() - .5) * .6) * W * .045; y += Math.sin(ang0 + (Math.random() - .5) * .6) * H * .02; pts.push([x, y]); } return { pts, a:1, h:330 }; });
  spawn(180, () => ({ x:gx + (Math.random() - .5) * W * .25, y:gy, vx:(Math.random() - .5) * 9 * DPR, vy:-(4 + Math.random() * 15) * DPR, s:(2 + Math.random() * 6) * DPR, col:Math.random() < .6 ? '#ff4fae' : '#ffd0ea', life:.9 }));
  $('stab').animate([{ filter:'brightness(2.4) drop-shadow(0 0 50px #fff)' }, { filter:'brightness(1) drop-shadow(0 0 22px #ff5fb8aa)' }], { duration:1400, fill:'forwards' });
  const kmax = Math.hypot(W, H) * .8;
  await step(tween(1100, p => { beam.r = 30 * DPR + kmax * (1 - Math.pow(1 - p, 3)); shake = 30 * (1 - p * .7); }));
  await step(tween(700, p => { beam.a = 1 - p; shake = 8 * (1 - p); })); beam = null; shake = 0;
  clearInterval(boost);
  await step(vu); await step(sleep(600)); caption('');

  // 10 · name card over her floating splash
  ['mech', 'keira', 'armored', 'dive', 'stab'].forEach(k => { $(k).getAnimations().forEach(x => { if (x.effect && x.effect.getKeyframes().some(f => f.translate)) x.cancel(); }); const o = parseFloat(getComputedStyle($(k)).opacity); if (o > 0) anim($(k), [{ opacity:o }, { opacity:0 }], { duration:600 }); });
  anim($('splash'), [{ opacity:0, transform:'scale(1.02)' }, { opacity:1, transform:'scale(1)' }], { duration:1200 });
  ramp(THEME, .55);
  await step(anim($('card'), [{ opacity:0, transform:'translateX(-40px)' }, { opacity:1, transform:'translateX(0)' }], { duration:800 }));
}

function finalPose(){ reset(); host.querySelectorAll('canvas').forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height)); $('stage').style.filter=''; $('stage').style.transform=''; const p=$('splash');p.style.opacity=1;p.style.transform='none';$('card').style.opacity=1;$('card').style.transform='none'; }
life.primeMusic(THEME);
return { replay:()=>life.replay(run), skip:()=>{life.cancel();finalPose();onFinished()}, dispose:()=>{life.dispose();window.removeEventListener('resize',size)}, getLevel:()=>level };
}
