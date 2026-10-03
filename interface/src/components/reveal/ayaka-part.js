// Ayaka signature sequence, ported from the approved reveal demo.
export async function ayakaPart(ctx) {
const {state, $, anim, wait, caption, stopSfx, fadePull, playTheme, spawn, snow, voice, sfx, THEME, rampTheme, DPR} = ctx;
  // 6 · splash push-in
  stopSfx(); fadePull(); playTheme(); spawn(90,()=>({col:Math.random()<.7?'#bfeeff':'#f4cf7a'})); snow(40);
  anim($('splash'),[{opacity:0,transform:'scale(1.25)',filter:'brightness(2) blur(6px)'},{opacity:1,transform:'scale(1.05)',filter:'brightness(1) blur(0)'}],{duration:1400});
  await wait(1900);
  ctx.check();
  await anim($('splash'),[{opacity:1,transform:'scale(1.05)'},{opacity:0,transform:'scale(1.12)'}],{duration:600});
  ctx.check();
  // 3 · signature move: yawn on the throne → TIME STOP
  $('bg').style.filter='brightness(.55) saturate(.9)';
  anim($('throne'),[{opacity:0,transform:'translateX(-50%) translateY(30px)'},{opacity:1,transform:'translateX(-50%) translateY(0)'}],{duration:700});
  caption('“Yawn… So noisy. Was it you who woke me?”'); snow(30); await voice('voReveal');
  ctx.check();
  caption('');
  anim($('throne'),[{opacity:1},{opacity:0}],{duration:400});
  anim($('timestop'),[{opacity:0,transform:'translateX(-50%) scale(.96)'},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:500});
  caption('“Time, go to sleep — Chrono Stasis.”'); const chrono=voice('voChrono'); chrono.catch(()=>{}); sfx('chrono_stasis');
  for(let i=0;i<=20;i++){ state.clockA=i/20; await wait(18); }
  ctx.check();
  spawn(60,()=>({col:'#f4cf7a',vy:-(1+Math.random()*2)*DPR})); snow(50); await chrono;
  ctx.check();
  // FREEZE
  state.frozen=true; THEME.pause(); caption('Chrono Stasis'); $('stage').style.filter='saturate(.35) hue-rotate(-10deg)';
  anim($('flash'),[{opacity:0},{opacity:.35,offset:.15},{opacity:0}],{duration:500});
  await wait(1800);
  ctx.check();
  // resume with a ripple
  $('stage').style.filter=''; state.frozen=false; THEME.play().catch(()=>{}); caption('“…There. Quieter now, isn’t it?”'); const after=voice('voAfter'); after.catch(()=>{});
  await anim($('flash'),[{opacity:0},{opacity:.25,offset:.3},{opacity:0}],{duration:600});
  ctx.check();
  for(let i=20;i>=0;i--){ state.clockA=0.4+0.6*i/20; await wait(20); }
  ctx.check();
  await after; caption('');
  ctx.check();
  // 4 · name card
  anim($('timestop'),[{transform:'translateX(-50%)'},{transform:'translateX(-30%)'}],{duration:900});
  rampTheme(0.55);
  await anim($('card'),[{opacity:0,transform:'translateX(-40px)'},{opacity:1,transform:'translateX(0)'}],{duration:800});
  ctx.check();

}