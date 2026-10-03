import { standardPull } from './standard-pull.js';
import { ayakaPart } from './ayaka-part.js';

// Canvas choreography preserves the approved demo. React owns its mounted surface and controls.
export function createAyakaRuntime(host, onComplete, options = {}) {
const $ = id => host.querySelector(`[data-reveal="${id}"]`);
const fx=$('fx'), g=fx.getContext('2d'), fx2=$('fx2'), g2=fx2.getContext('2d');
const DPR=Math.min(devicePixelRatio,2); let W,H,frame;
function size(){W=fx.width=fx2.width=host.clientWidth*DPR;H=fx.height=fx2.height=host.clientHeight*DPR;}
size();const observer=new ResizeObserver(size);observer.observe(host);
const crystalImg=new Image();crystalImg.src=$('crystal').src;
const SPEED=1;
const state={cz:null,clouds:Array.from({length:26},()=>({x:(Math.random()-.5)*2,y:(Math.random()-.5)*1.4,z:Math.random()})),frozen:false,clockA:0,clockOn:0,shake:0,star:null,cracks:[],parts:[]};
let abort=new AbortController(), disposed=false, level=0;
try{level=Math.min(2,Math.max(0,Number(localStorage.getItem('lumara.revealSound')||0)));}catch{}
const ALL=[],timers=new Set(),animations=new Set();
const LEVELS=[1,.3,0];
function setV(a,v){a._v=Math.max(0,Math.min(1,v));a.volume=a._v*LEVELS[level];}
function track(a,v){ALL.push(a);a.preload='auto';setV(a,v);return a;}
const base=$('bg').dataset.audioBase;const ayakaBase=$('bg').dataset.ayakaBase;
const SFX={};['pull_fall_whoosh','tell_splusplus','pull_flash_swell','chrono_stasis'].forEach(n=>SFX[n]=track(new Audio(n==='chrono_stasis'?ayakaBase+'reveal-stasis.mp3':base+'sfx_'+n+'.mp3'),.75));
const THEME=track(new Audio(options.theme || ayakaBase+'reveal-theme.mp3'),0);THEME.loop=true;
const PULL=track(new Audio($('bg').dataset.pullMusic),.6);
const voices={voReveal:track(new Audio(ayakaBase+'reveal-voice.mp3'),1),voChrono:track(new Audio(ayakaBase+'reveal-chrono.mp3'),1),voAfter:track(new Audio(ayakaBase+'reveal-after.mp3'),1)};
function canceled(){return new DOMException('Reveal canceled','AbortError');}
function wait(ms){const signal=abort.signal;return new Promise((resolve,reject)=>{if(signal.aborted)return reject(canceled());const id=setTimeout(()=>{timers.delete(id);signal.removeEventListener('abort',cancel);resolve();},ms);timers.add(id);function cancel(){clearTimeout(id);timers.delete(id);reject(canceled());}signal.addEventListener('abort',cancel,{once:true});});}
async function tween(ms,fn){const start=performance.now();while(true){if(abort.signal.aborted)throw canceled();const p=Math.min(1,(performance.now()-start)/ms);fn(p);if(p===1)return;await wait(16);}}
function animateRaw(el,frames,opts){const a=el.animate(frames,opts);animations.add(a);a.finished.catch(()=>{});return a;}
function anim(el,frames,opts={}){const a=animateRaw(el,frames,{fill:'forwards',easing:'cubic-bezier(.2,.8,.2,1)',duration:500,...opts});return a.finished.catch(()=>{});}
function caption(txt){$('caption').textContent=txt;$('caption').style.opacity=txt?'.9':'0';}
function sfx(n){const a=SFX[n];a.currentTime=0;a.play().catch(()=>{});}
function playPull(){PULL.currentTime=0;setV(PULL,.6);PULL.play().catch(()=>{});}
async function fadePull(){try{while(PULL._v>0){setV(PULL,PULL._v-.05);await wait(80);}PULL.pause();}catch{}}
let rampVersion=0;
async function rampTheme(to){const version=++rampVersion;try{while(version===rampVersion){const d=to-THEME._v;if(Math.abs(d)<=.03){setV(THEME,to);return;}setV(THEME,THEME._v+Math.sign(d)*.03);await wait(80);}}catch{}}
function playTheme(){THEME.currentTime=0;setV(THEME,0);THEME.play().catch(()=>{});rampTheme(.3);}
function stopSfx(){Object.values(SFX).forEach(async a=>{const v0=a._v;try{for(let i=7;i>=0;i--){setV(a,v0*i/8);await wait(40);}a.pause();setV(a,v0);}catch{}});}
async function voice(id){
const a=voices[id],signal=abort.signal;a.currentTime=0;
// Even blocked/muted audio holds the beat for the complete clip, never the next fixed timer.
const defaults={voReveal:6.3,voChrono:3.45,voAfter:3.82};
await new Promise((resolve,reject)=>{let timer,done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);a.removeEventListener('ended',finish);a.removeEventListener('loadedmetadata',metadata);signal.removeEventListener('abort',cancel);resolve();};const cancel=()=>{if(done)return;done=true;clearTimeout(timer);a.removeEventListener('ended',finish);a.removeEventListener('loadedmetadata',metadata);signal.removeEventListener('abort',cancel);reject(canceled());};const schedule=()=>{clearTimeout(timer);timer=setTimeout(finish,((Number.isFinite(a.duration)&&a.duration>0?a.duration:defaults[id])+.3)*1000);};const metadata=()=>schedule();a.addEventListener('ended',finish,{once:true});a.addEventListener('loadedmetadata',metadata,{once:true});signal.addEventListener('abort',cancel,{once:true});schedule();a.play().catch(()=>{});});
if(signal.aborted)throw canceled();
}
function makeCracks(){state.cracks=[];for(let k=0;k<7;k++){let x=W*.5,y=H*.2,pts=[[x,y]];const ang=Math.PI/2+(Math.random()-.5)*2.6;for(let i=0;i<9;i++){x+=Math.cos(ang+(Math.random()-.5))*W*.035;y+=Math.sin(ang+(Math.random()-.5))*H*.03-H*.02;pts.push([x,y]);}state.cracks.push({pts,a:1,h:Math.random()*360});}}
function spawn(n,opts){ for(let i=0;i<n;i++) state.parts.push(Object.assign({x:Math.random()*W,y:H+10,vx:(Math.random()-.5)*.6*DPR,vy:-(0.4+Math.random()*1.4)*DPR,s:(1+Math.random()*2.5)*DPR,life:1,col:'#bfeeff',kind:'dot'},opts?opts(i):{})); }
function snow(n){ spawn(n,()=>({y:-10,vy:(0.5+Math.random()*1.2)*DPR,vx:(Math.random()-.5)*.8*DPR,kind:'flake',col:'#e8f8ff',s:(2+Math.random()*3)*DPR,rot:Math.random()*6})); }
function drawFlake(ctx,p){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.strokeStyle=p.col; ctx.globalAlpha=Math.min(1,p.life); ctx.lineWidth=1*DPR;
  for(let k=0;k<3;k++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(-p.s,0); ctx.lineTo(p.s,0); ctx.stroke(); } ctx.restore(); }
function drawClock(ctx,a){ if(a<=0) return; const cx=W/2, cy=H*0.42, R=Math.min(W,H)*0.36; ctx.save(); ctx.globalAlpha=a; ctx.translate(cx,cy);
  ctx.strokeStyle='rgba(244,207,122,.9)'; ctx.shadowColor='#f4cf7a'; ctx.shadowBlur=18*DPR;
  for(const [r,w] of [[R,2],[R*0.86,1],[R*0.55,1.5],[R*0.2,1]]){ ctx.lineWidth=w*DPR; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle='rgba(244,207,122,.95)'; ctx.font=`${22*DPR}px Marcellus`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const nums=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  nums.forEach((n,i)=>{ const t=i/12*Math.PI*2-Math.PI/2; ctx.fillText(n,Math.cos(t)*R*0.93,Math.sin(t)*R*0.93); ctx.beginPath(); ctx.moveTo(Math.cos(t)*R*0.8,Math.sin(t)*R*0.8); ctx.lineTo(Math.cos(t)*R*0.86,Math.sin(t)*R*0.86); ctx.stroke(); });
  const spin = state.frozen ? 0 : state.clockOn;
  ctx.rotate(spin*0.0006); for(let i=0;i<6;i++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-R*0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-R*0.32); ctx.lineTo(-R*0.06,-R*0.4); ctx.moveTo(0,-R*0.32); ctx.lineTo(R*0.06,-R*0.4); ctx.stroke(); }
  ctx.lineWidth=4*DPR; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-R*0.62); ctx.stroke(); ctx.lineWidth=5*DPR; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R*0.4,0); ctx.stroke();
  ctx.restore(); }
function loop(t){
  g.clearRect(0,0,W,H); g2.clearRect(0,0,W,H);
  const sx=state.shake?(Math.random()-.5)*state.shake*DPR:0, sy=state.shake?(Math.random()-.5)*state.shake*DPR:0; $('stage').style.transform=`translate(${sx/DPR}px,${sy/DPR}px)`;
  if(state.star){ const s=state.star; if(!state.frozen){ s.p=Math.min(1,s.p+0.012/SPEED); }
    const x0=W*0.85,y0=-H*0.1,x1=W*0.5,y1=H*0.62, e=1-Math.pow(1-s.p,3), x=x0+(x1-x0)*e, y=y0+(y1-y0)*e;
    s.trail.push([x,y]); if(s.trail.length>40) s.trail.shift();
    for(let i=1;i<s.trail.length;i++){ const [ax,ay]=s.trail[i-1],[bx,by]=s.trail[i]; const k=i/s.trail.length;
      g.strokeStyle= s.prism ? `hsla(${(t/4+i*9)%360},100%,75%,${k})` : `rgba(191,238,255,${k})`; g.lineWidth=(2+k*8)*DPR; g.lineCap='round'; g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); }
    const d=110*DPR; g.save(); g.translate(x,y); g.rotate(s.p*8 + (s.prism? t/300 : 0));
    g.shadowColor= s.prism?`hsl(${t/3%360},100%,70%)`:'#bfeeff'; g.shadowBlur=50*DPR;
    if(s.prism) g.filter=`hue-rotate(${(t/4)%360}deg) saturate(2.2) brightness(1.15)`;
    if(crystalImg.complete) g.drawImage(crystalImg,-d/2,-d/2,d,d);
    g.filter='none'; g.shadowBlur=0; g.restore(); }
  for(const c of state.cracks){ g.strokeStyle=`hsla(${c.h},100%,80%,${c.a})`; g.lineWidth=2*DPR; g.shadowColor='#fff'; g.shadowBlur=12*DPR; g.beginPath(); c.pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.shadowBlur=0; if(!state.frozen) c.a=Math.max(0,c.a-0.004); }
  if(state.cz){ const cx=W/2, cy=H*0.46;
    for(const c of state.clouds){ if(!state.frozen){ c.z-=0.012*state.cz.flight; if(c.z<0.05){ c.z=1; c.x=(Math.random()-.5)*2; c.y=(Math.random()-.5)*1.4; } }
      const k=1/c.z, px=cx+c.x*W*0.35*k, py=cy+c.y*H*0.35*k, r=60*DPR*k; const a=Math.min(.5,(1-c.z))*state.cz.flight;
      const gr=g.createRadialGradient(px,py,0,px,py,r); gr.addColorStop(0,`rgba(255,255,255,${a})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(px,py,r,0,Math.PI*2); g.fill(); }
    if(state.cz.rays>0){ g.save(); g.translate(cx,cy); g.rotate(t/2500); for(let i=0;i<18;i++){ g.rotate(Math.PI/9); g.fillStyle= state.cz.stage>=2?`hsla(${(t/5+i*20)%360},100%,70%,${0.14*state.cz.rays})`:`rgba(255,215,120,${0.14*state.cz.rays})`; g.beginPath(); g.moveTo(0,0); g.lineTo(-W*0.05,-H*1.3); g.lineTo(W*0.05,-H*1.3); g.fill(); } g.restore(); }
    if(state.cz.show){ const d=Math.min(W,H)*state.cz.s; g.save(); g.translate(cx,cy); g.rotate(state.cz.r); g.globalAlpha=state.cz.alpha;
      const glow = state.cz.stage===0?'#b48cff': state.cz.stage===1?'#f4cf7a':`hsl(${t/3%360},100%,70%)`; g.shadowColor=glow; g.shadowBlur=60*DPR;
      g.filter = state.cz.stage===0?'hue-rotate(25deg) saturate(1.8)': state.cz.stage===1?'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08)':`hue-rotate(${(t/4)%360}deg) saturate(2.3) brightness(1.15)`;
      if(crystalImg.complete) g.drawImage(crystalImg,-d/2,-d/2,d,d); g.filter='none'; g.restore(); }
  }
  drawClock(g,state.clockA); if(state.clockA>0 && !state.frozen) state.clockOn+=16;
  for(let i=state.parts.length-1;i>=0;i--){ const p=state.parts[i];
    if(!state.frozen){ p.x+=p.vx; p.y+=p.vy; if(p.rot!==undefined) p.rot+=0.01; p.life-=0.0035; }
    if(p.life<=0||p.y<-40||p.y>H+40){ state.parts.splice(i,1); continue; }
    if(p.kind==='flake') drawFlake(g2,p); else { g2.globalAlpha=Math.min(1,p.life); g2.fillStyle=p.col; g2.shadowColor=p.col; g2.shadowBlur=8*DPR; g2.beginPath(); g2.arc(p.x,p.y,p.s,0,Math.PI*2); g2.fill(); g2.shadowBlur=0; g2.globalAlpha=1; } }
  if(state.frozen){ g2.fillStyle='rgba(159,231,255,.06)'; g2.fillRect(0,0,W,H); }
  frame = requestAnimationFrame(loop);
}

function reset(){abort.abort();abort=new AbortController();rampVersion++;timers.forEach(clearTimeout);timers.clear();animations.forEach(a=>a.cancel());animations.clear();ALL.forEach(a=>{a.pause();a.currentTime=0;});Object.values(SFX).forEach(a=>setV(a,.75));Object.values(voices).forEach(a=>setV(a,1));setV(PULL,.6);setV(THEME,0);['splash','throne','timestop','card','flash'].forEach(id=>{$(id).style.opacity=0;$(id).style.filter='';});$('stage').style.filter='';$('stage').style.transform='';$('bg').style.filter='brightness(.35) saturate(.8)';state.cz=null;state.star=null;state.cracks=[];state.parts.length=0;state.clockA=0;state.clockOn=0;state.frozen=false;state.shake=0;caption('');}
function context(){const signal=abort.signal;return {check(){if(signal.aborted)throw canceled();},state,$,tween,anim,animateRaw,wait,caption,sfx,playPull,stopSfx,spawn,makeCracks,W,H,DPR,fadePull,playTheme,snow,voice,THEME,rampTheme};}
async function replay(){reset();host.dataset.finished='false';try{await standardPull(context(),options.grade || 'S++');if(options.ayaka !== false) await ayakaPart(context()); else { const ctx=context(); fadePull(); if(options.theme)playTheme(); spawn(90); anim($('splash'),[{opacity:0,transform:'scale(1.25)',filter:'brightness(2) blur(6px)'},{opacity:1,transform:'scale(1.05)',filter:'brightness(1) blur(0)'}],{duration:1400});await wait(1900);ctx.check();await anim($('splash'),[{opacity:1},{opacity:0}],{duration:600});ctx.check();{const ts=$('timestop');ts.getAnimations().forEach(x=>x.cancel());ts.style.filter='';ts.style.transform='translateX(-50%)';ts.style.opacity=1;anim(ts,[{opacity:0,transform:'translateX(-50%) scale(1.06)',filter:'brightness(2.2) blur(4px)'},{opacity:1,transform:'translateX(-50%) scale(1)',filter:'brightness(1) blur(0)'}],{duration:700});}await anim($('card'),[{opacity:0,transform:'translateX(-40px)'},{opacity:1,transform:'translateX(0)'}],{duration:800});ctx.check();if(options.theme)rampTheme(.55); }if(!disposed){host.dataset.finished='true';onComplete();}}catch(e){if(e.name!=='AbortError')console.error(e);}}
function skip(){reset();$('timestop').getAnimations().forEach(x=>x.cancel());$('timestop').style.opacity=1;$('timestop').style.transform=options.ayaka !== false?'translateX(-30%)':'translateX(-50%)';$('card').style.opacity=1;$('card').style.transform='none';if(options.ayaka !== false){state.clockA=.4;snow(40);}if(options.ayaka !== false || options.theme){playTheme();rampTheme(.55);}host.dataset.finished='true';onComplete();}
function cycleSound(){level=(level+1)%3;ALL.forEach(a=>setV(a,a._v));try{localStorage.setItem('lumara.revealSound',String(level));}catch{}return level;}
frame=requestAnimationFrame(loop);
return {replay,skip,cycleSound,getLevel:()=>level,dispose(){disposed=true;reset();abort.abort();cancelAnimationFrame(frame);observer.disconnect();ALL.forEach(a=>{a.removeAttribute('src');a.load();});}};
}
