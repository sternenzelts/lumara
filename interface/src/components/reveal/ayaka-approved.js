// Character choreography ported from reveal-demos/ayaka/index.html (approved 2026-09-27).
import {standardPull} from './standard-pull.js';
import {createPlayback} from './playback.js';
import {assets} from './ayaka-markup.js';
export function createRuntime(host,onFinished,base){
const asset=name=>base+assets[name];
const locals={};
const life=createPlayback(host,onFinished);
const {sleep,tween,anim,voice,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame}=life;
let runId=0; function guard(id){if(id!==runId)throw life.CANCEL;}
life.onCancel=()=>{runId++;ALL.forEach(a=>{a.pause();a.currentTime=0});};

const $=id=>host.querySelector('#'+id);
const fx=$('fx'), g=fx.getContext('2d'), fx2=$('fx2'), g2=fx2.getContext('2d');
let W,H; function size(){ W=fx.width=fx2.width=innerWidth*devicePixelRatio; H=fx.height=fx2.height=innerHeight*devicePixelRatio; } size(); window.addEventListener('resize',size);
const DPR=devicePixelRatio;
const crystalImg=new Image(); crystalImg.src=asset('crystal.webp');
const SPEED=1.0; const wait=sleep;
let cz=null, clouds=Array.from({length:26},()=>({x:(Math.random()-.5)*2,y:(Math.random()-.5)*1.4,z:Math.random()}));
let frozen=false, timers=[], running=false, clockA=0, clockOn=0, shake=0, star=null, cracks=[];
const parts=[];
let frost=0, mistWave=null, spires=[], vortex=0;
function spawn(n,opts){ for(let i=0;i<n;i++) parts.push(Object.assign({x:Math.random()*W,y:H+10,vx:(Math.random()-.5)*.6*DPR,vy:-(0.4+Math.random()*1.4)*DPR,s:(1+Math.random()*2.5)*DPR,life:1,col:'#bfeeff',kind:'dot'},opts?opts(i):{})); }
function snow(n){ spawn(n,()=>({y:-10,vy:(0.5+Math.random()*1.2)*DPR,vx:(Math.random()-.5)*.8*DPR,kind:'flake',col:'#e8f8ff',s:(2+Math.random()*3)*DPR,rot:Math.random()*6})); }
function drawFlake(ctx,p){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.strokeStyle=p.col; ctx.globalAlpha=Math.min(1,p.life); ctx.lineWidth=1*DPR;
  for(let k=0;k<3;k++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(-p.s,0); ctx.lineTo(p.s,0); ctx.stroke(); } ctx.restore(); }
function drawClock(ctx,a){ if(a<=0) return; const cx=W/2, cy=H*0.42, R=Math.min(W,H)*0.36; ctx.save(); ctx.globalAlpha=a; ctx.translate(cx,cy);
  ctx.strokeStyle='rgba(244,207,122,.9)'; ctx.shadowColor='#f4cf7a'; ctx.shadowBlur=18*DPR;
  for(const [r,w] of [[R,2],[R*0.86,1],[R*0.55,1.5],[R*0.2,1]]){ ctx.lineWidth=w*DPR; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle='rgba(244,207,122,.95)'; ctx.font=`${22*DPR}px Marcellus`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const nums=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  nums.forEach((n,i)=>{ const t=i/12*Math.PI*2-Math.PI/2; ctx.fillText(n,Math.cos(t)*R*0.93,Math.sin(t)*R*0.93); ctx.beginPath(); ctx.moveTo(Math.cos(t)*R*0.8,Math.sin(t)*R*0.8); ctx.lineTo(Math.cos(t)*R*0.86,Math.sin(t)*R*0.86); ctx.stroke(); });
  const spin = frozen ? 0 : clockOn;
  ctx.rotate(spin*0.0006); for(let i=0;i<6;i++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-R*0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-R*0.32); ctx.lineTo(-R*0.06,-R*0.4); ctx.moveTo(0,-R*0.32); ctx.lineTo(R*0.06,-R*0.4); ctx.stroke(); }
  ctx.lineWidth=4*DPR; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-R*0.62); ctx.stroke(); ctx.lineWidth=5*DPR; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R*0.4,0); ctx.stroke();
  ctx.restore(); }
function loop(t){
  g.clearRect(0,0,W,H); g2.clearRect(0,0,W,H);
  const sx=shake?(Math.random()-.5)*shake*DPR:0, sy=shake?(Math.random()-.5)*shake*DPR:0; $('stage').style.transform=`translate(${sx/DPR}px,${sy/DPR}px)`;
  if(star){ const s=star; if(!frozen){ s.p=Math.min(1,s.p+0.012/SPEED); }
    const x0=W*0.85,y0=-H*0.1,x1=W*0.5,y1=H*0.62, e=1-Math.pow(1-s.p,3), x=x0+(x1-x0)*e, y=y0+(y1-y0)*e;
    s.trail.push([x,y]); if(s.trail.length>40) s.trail.shift();
    for(let i=1;i<s.trail.length;i++){ const [ax,ay]=s.trail[i-1],[bx,by]=s.trail[i]; const k=i/s.trail.length;
      g.strokeStyle= s.prism ? `hsla(${(t/4+i*9)%360},100%,75%,${k})` : `rgba(191,238,255,${k})`; g.lineWidth=(2+k*8)*DPR; g.lineCap='round'; g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); }
    const d=110*DPR; g.save(); g.translate(x,y); g.rotate(s.p*8 + (s.prism? t/300 : 0));
    g.shadowColor= s.prism?`hsl(${t/3%360},100%,70%)`:'#bfeeff'; g.shadowBlur=50*DPR;
    if(s.prism) g.filter=`hue-rotate(${(t/4)%360}deg) saturate(2.2) brightness(1.15)`;
    if(crystalImg.complete) g.drawImage(crystalImg,-d/2,-d/2,d,d);
    g.filter='none'; g.shadowBlur=0; g.restore(); }
  for(const c of cracks){ g.strokeStyle=`hsla(${c.h},100%,80%,${c.a})`; g.lineWidth=2*DPR; g.shadowColor='#fff'; g.shadowBlur=12*DPR; g.beginPath(); c.pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.shadowBlur=0; if(!frozen) c.a=Math.max(0,c.a-0.004); }
  if(cz){ const cx=W/2, cy=H*0.46;
    for(const c of clouds){ if(!frozen){ c.z-=0.012*cz.flight; if(c.z<0.05){ c.z=1; c.x=(Math.random()-.5)*2; c.y=(Math.random()-.5)*1.4; } }
      const k=1/c.z, px=cx+c.x*W*0.35*k, py=cy+c.y*H*0.35*k, r=60*DPR*k; const a=Math.min(.5,(1-c.z))*cz.flight;
      const gr=g.createRadialGradient(px,py,0,px,py,r); gr.addColorStop(0,`rgba(255,255,255,${a})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(px,py,r,0,Math.PI*2); g.fill(); }
    if(cz.rays>0){ g.save(); g.translate(cx,cy); g.rotate(t/2500); for(let i=0;i<18;i++){ g.rotate(Math.PI/9); g.fillStyle= cz.stage>=2?`hsla(${(t/5+i*20)%360},100%,70%,${0.14*cz.rays})`:`rgba(255,215,120,${0.14*cz.rays})`; g.beginPath(); g.moveTo(0,0); g.lineTo(-W*0.05,-H*1.3); g.lineTo(W*0.05,-H*1.3); g.fill(); } g.restore(); }
    if(cz.show){ const d=Math.min(W,H)*cz.s; g.save(); g.translate(cx,cy); g.rotate(cz.r); g.globalAlpha=cz.alpha;
      const glow = cz.stage===0?'#b48cff': cz.stage===1?'#f4cf7a':`hsl(${t/3%360},100%,70%)`; g.shadowColor=glow; g.shadowBlur=60*DPR;
      g.filter = cz.stage===0?'hue-rotate(25deg) saturate(1.8)': cz.stage===1?'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08)':`hue-rotate(${(t/4)%360}deg) saturate(2.3) brightness(1.15)`;
      if(crystalImg.complete) g.drawImage(crystalImg,-d/2,-d/2,d,d); g.filter='none'; g.restore(); }
  }
  drawClock(g,clockA); if(clockA>0 && !frozen) clockOn+=16;
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i];
    if(!frozen){ p.x+=p.vx; p.y+=p.vy; if(p.rot!==undefined) p.rot+=0.01; p.life-=0.0035; }
    if(p.life<=0||p.y<-40||p.y>H+40){ parts.splice(i,1); continue; }
    if(p.kind==='flake') drawFlake(g2,p); else { g2.globalAlpha=Math.min(1,p.life); g2.fillStyle=p.col; g2.shadowColor=p.col; g2.shadowBlur=8*DPR; g2.beginPath(); g2.arc(p.x,p.y,p.s,0,Math.PI*2); g2.fill(); g2.shadowBlur=0; g2.globalAlpha=1; } }
  if(frozen){ g2.fillStyle='rgba(159,231,255,.06)'; g2.fillRect(0,0,W,H); }
  if(frost>0){ const gr=g.createLinearGradient(0,H,0,H*(1-.55*frost)); gr.addColorStop(0,`rgba(200,240,255,${.32*frost})`); gr.addColorStop(1,'rgba(200,240,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
   }
  if(mistWave){ const m=mistWave; if(!frozen) m.t=Math.min(1,m.t+.012); const rx=W*.08+m.t*W*.75, ry=rx*.2;
    const gr=g2.createRadialGradient(W/2,H*.86,rx*.4,W/2,H*.86,rx); gr.addColorStop(0,'rgba(220,245,255,0)'); gr.addColorStop(.7,`rgba(220,245,255,${.45*(1-m.t)})`); gr.addColorStop(1,'rgba(220,245,255,0)');
    g2.save(); g2.translate(0,H*.86); g2.scale(1,ry/rx); g2.translate(0,-H*.86); g2.fillStyle=gr; g2.beginPath(); g2.arc(W/2,H*.86,rx,0,Math.PI*2); g2.fill(); g2.restore(); }
  for(const sp of spires){ if(!frozen) sp.h=Math.min(sp.max,sp.h+sp.max*.09); const x=sp.x, y=H*.95, h=sp.h, w=sp.w;
    const gr=g2.createLinearGradient(x,y,x,y-h); gr.addColorStop(0,'rgba(150,210,245,.95)'); gr.addColorStop(1,'rgba(240,252,255,.95)');
    g2.fillStyle=gr; g2.shadowColor='#9fe7ff'; g2.shadowBlur=18*DPR; g2.beginPath(); g2.moveTo(x-w,y); g2.lineTo(x+sp.lean*h*.15,y-h); g2.lineTo(x+w,y); g2.closePath(); g2.fill();
    g2.strokeStyle='rgba(255,255,255,.7)'; g2.lineWidth=1.2*DPR; g2.beginPath(); g2.moveTo(x,y); g2.lineTo(x+sp.lean*h*.15,y-h); g2.stroke(); g2.shadowBlur=0; }
  if(vortex>0 && !frozen && Math.random()<vortex){ const a0=Math.random()*Math.PI*2, r0=(120+Math.random()*220)*DPR; parts.push({x:W/2+Math.cos(a0)*r0, y:H*.6+Math.sin(a0)*r0*.5, vx:-Math.sin(a0)*3*DPR, vy:Math.cos(a0)*1.5*DPR-.6*DPR, s:(2+Math.random()*3)*DPR, life:1, kind:'flake', col:'#e8f8ff', rot:Math.random()*6}); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
// every volume goes through setV so the sound button can scale it (el._v = intended level, before the master level)
const LEVELS=[{k:'on',m:1,label:'Sound on'},{k:'low',m:0.3,label:'Sound low'},{k:'off',m:0,label:'Muted'}];
let level=0; try{ const s=localStorage.getItem('lumara.revealSound'); if(s!==null) level=Math.min(2,Math.max(0,+s||0)); }catch(e){}
const ALL=[];
function setV(a,v){ a._v=Math.max(0,Math.min(1,v)); a.volume=a._v*LEVELS[level].m; }
function track(a,v){ ALL.push(a); setV(a,v); return a; }
const SFX={}; ['pull_fall_whoosh','tell_splusplus','pull_flash_swell','chrono_stasis'].forEach(n=>{ const a=new Audio(asset('sfx_'+n+'.mp3')); a.preload='auto'; SFX[n]=track(a,0.75); });
const THEME=track(new Audio(asset('theme.mp3')),0); THEME.loop=true;
const PULL=track(new Audio(asset('pull_music.mp3')),0.6); PULL.preload='auto';
['voReveal','voChrono','voAfter','voNifl'].forEach(id=>track($(id),1));
const voiceId=id=>voice($(id));
function playPull(){ PULL.currentTime=0; setV(PULL,0.6); PULL.play().catch(()=>{}); }
function fadePull(){ let v=PULL._v; const iv=setInterval(()=>{ v-=0.05; if(v<=0){ PULL.pause(); clearInterval(iv);} else setV(PULL,v); },80); }
let themeIv=null;
function rampTheme(to){ clearInterval(themeIv); themeIv=setInterval(()=>{ const v=THEME._v, d=to-v; if(Math.abs(d)<=0.03){ setV(THEME,to); clearInterval(themeIv); } else setV(THEME,v+Math.sign(d)*0.03); },80); }
function playTheme(){ THEME.currentTime=0; setV(THEME,0); life.playMusic(THEME); rampTheme(0.3); }
function stopSfx(){ Object.values(SFX).forEach(a=>{ const v0=a._v; let v=v0; const iv=setInterval(()=>{ v-=v0/8; if(v<=0){ a.pause(); setV(a,v0); clearInterval(iv);} else setV(a,v); },40); }); }
function renderSound(){ const L=LEVELS[level], b=$('sound'); b.dataset.level=L.k; b.setAttribute('aria-label',L.label+' (click to change)'); b.title=L.label; b.querySelector('span').textContent=L.k==='on'?'Sound':L.k==='low'?'Low':'Muted'; }
function cycleSound(){ level=(level+1)%LEVELS.length; ALL.forEach(a=>setV(a,a._v)); try{ localStorage.setItem('lumara.revealSound',level); }catch(e){} renderSound(); }
function sfx(n){ const a=SFX[n]; if(!a) return; a.currentTime=0; a.play().catch(()=>{}); }
function caption(txt){ const c=$('caption'); c.textContent=txt; c.style.opacity=txt?'.9':'0'; }
function makeCracks(){ cracks=[]; for(let k=0;k<7;k++){ let x=W*0.5,y=H*0.2,pts=[[x,y]]; const ang=Math.PI/2+(Math.random()-.5)*2.6; for(let i=0;i<9;i++){ x+=Math.cos(ang+(Math.random()-.5))*W*0.035; y+=Math.sin(ang+(Math.random()-.5))*H*0.03-H*0.02; pts.push([x,y]); } cracks.push({pts,a:1,h:Math.random()*360}); } }
function reset(){ life.pauseMusic(THEME); THEME.currentTime=0; PULL.pause(); ['splash','throne','timestop'].forEach(id=>{ const e=$(id); e.getAnimations().forEach(a=>a.cancel()); e.style.opacity=0; e.style.filter=''; });
  ['card','flash'].forEach(id=>$(id).getAnimations().forEach(a=>a.cancel())); $('card').style.opacity=0;
  $('bg').style.filter=''; $('bg').getAnimations().forEach(a=>a.cancel()); cz=null; star=null; cracks=[]; parts.length=0; host.querySelectorAll('.icecr').forEach(e=>e.classList.remove('up')); frost=0; mistWave=null; spires=[]; vortex=0; clearInterval(locals.snow); { const c=$('cathedral'); c.getAnimations().forEach(a=>a.cancel()); c.style.opacity=0; } clockA=0; clockOn=0; frozen=false; shake=0; caption(''); }
async function run(){ const id=runId; running=true; reset();
  // 1 · camera flight down through the clouds; crystal flies toward the camera
  await standardPull({state:{get cz(){return cz},set cz(v){cz=v},get shake(){return shake},set shake(v){shake=v},set cracks(v){cracks=v}}, $, tween, anim, animateRaw:(e,f,o)=>e.animate(f,o), wait:sleep, caption, sfx:n=>{const a=SFX[n];a.currentTime=0;a.play().catch(()=>{})},playPull:()=>{PULL.currentTime=0;setV(PULL,.6);PULL.play().catch(()=>{})},stopSfx:()=>{},spawn,makeCracks,W,H,DPR,check:()=>guard(id),background:'bg',stopBeforeSilhouette:true},'S++');
  // 5 · silhouette first → burst into full color
  cz.rays=1; stopSfx();
  const sil=$('timestop'); sil.style.opacity=1; sil.style.transform='translateX(-50%)';
  sil.animate([{filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #f4cf7a)',opacity:0,transform:'translateX(-50%) scale(.92)'},{filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #f4cf7a)',opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:900*SPEED,fill:'forwards'});
  await wait(1500);
  anim($('flash'),[{opacity:0},{opacity:.9,offset:.25},{opacity:0}],{duration:600});
  await anim(sil,[{filter:'brightness(3)',opacity:1},{filter:'brightness(1)',opacity:0}],{duration:700});
  cz=null;
  cracks=[]; parts.length=0;
  // 6 · splash push-in
  stopSfx(); fadePull(); playTheme(); spawn(90,()=>({col:Math.random()<.7?'#bfeeff':'#f4cf7a'})); snow(40);
  anim($('splash'),[{opacity:0,transform:'scale(1.02)',filter:'brightness(2) blur(6px)'},{opacity:1,transform:'scale(1)',filter:'brightness(1) blur(0)'}],{duration:1400});
  await wait(1900);
  await anim($('splash'),[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.02)'}],{duration:600});
  // 3 · signature move: yawn on the throne → TIME STOP
  $('bg').style.filter='brightness(.55) saturate(.9)';
  anim($('throne'),[{opacity:0,transform:'translateX(-50%) translateY(30px)'},{opacity:1,transform:'translateX(-50%) translateY(0)'}],{duration:700});
  for(let i=parts.length-1;i>=0;i--) if(parts[i].kind!=='flake') parts.splice(i,1); // pull sparkles don't belong in the cathedral
  locals.snow=setInterval(()=>snow(3),120);
  caption('“Yawn… So noisy. Was it you who woke me?”'); await voiceId('voReveal');
  // Niflheim: freezing mist rolls out from the throne, frost climbs the floor, ice spires erupt, snow swirls
  caption('“Freeze over — Niflheim.”'); const nv=voiceId('voNifl'); sfx('chrono_stasis');
  mistWave={t:0}; vortex=.6;
  const cat=$('cathedral');
  if(!cat.dataset.missing && cat.naturalWidth){ cat.style.opacity=1; cat.animate([{clipPath:'inset(100% 0 0 0)',filter:'brightness(2.2) saturate(.4)'},{clipPath:'inset(0 0 0 0)',filter:'brightness(1) saturate(1)'}],{duration:2200,fill:'forwards',easing:'cubic-bezier(.2,.7,.2,1)'}); }
  host.querySelectorAll('.icecr').forEach(e=>{ e.classList.remove('up'); void e.offsetWidth; e.classList.add('up'); });
  for(let i=0;i<=20;i++){ frost=i/20; await wait(40); }
  await nv; caption('');
  // let the frozen scene breathe before Chrono Stasis: snow keeps swirling, then settles
  await wait(1600);
  for(let i=10;i>=0;i--){ vortex=.6*i/10; await wait(80); }
  await wait(300);
  caption('');
  anim($('throne'),[{opacity:1},{opacity:0}],{duration:400});
  anim($('timestop'),[{opacity:0,transform:'translateX(-50%) scale(.96)'},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:500});
  clearInterval(locals.snow); vortex=0; caption('“Time, go to sleep — Chrono Stasis.”'); const chrono=voiceId('voChrono'); sfx('chrono_stasis');
  for(let i=0;i<=20;i++){ clockA=i/20; await wait(18); }
  spawn(60,()=>({col:'#f4cf7a',vy:-(1+Math.random()*2)*DPR})); snow(50); await chrono;
  // FREEZE
  frozen=true; life.pauseMusic(THEME); caption('Chrono Stasis'); $('stage').style.filter='saturate(.35) hue-rotate(-10deg)';
  await anim($('flash'),[{opacity:0},{opacity:.35,offset:.15},{opacity:0}],{duration:500});
  await wait(1800);
  // resume with a ripple
  $('stage').style.filter=''; frozen=false; life.playMusic(THEME); caption('“…There. Quieter now, isn’t it?”'); const after=voiceId('voAfter');
  await anim($('flash'),[{opacity:0},{opacity:.25,offset:.3},{opacity:0}],{duration:600});
  for(let i=20;i>=0;i--){ clockA=i/20*0.4; await wait(20); }
  await after; caption('');
  // 4 · name card
  anim($('timestop'),[{transform:'translateX(-50%)'},{transform:'translateX(-30%)'}],{duration:900});
  rampTheme(0.55);
  await anim($('card'),[{opacity:0,transform:'translateX(-40px)'},{opacity:1,transform:'translateX(0)'}],{duration:800});
  running=false; }
$('sound').onclick=cycleSound; renderSound();

function finalPose(){ reset(); host.querySelectorAll('canvas').forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height)); $('stage').style.filter=''; $('stage').style.transform=''; const p=$('timestop');p.style.opacity=1;p.style.transform='translateX(-30%)';$('card').style.opacity=1;$('card').style.transform='none'; }
life.primeMusic(THEME);
return { replay:()=>life.replay(run), skip:()=>{life.cancel();finalPose();onFinished()}, dispose:()=>{life.dispose();window.removeEventListener('resize',size)}, getLevel:()=>level };

}
