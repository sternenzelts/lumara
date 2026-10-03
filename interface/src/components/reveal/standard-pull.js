// Shared crystal pull, ported from the approved reveal demo.
export async function standardPull(ctx, grade) {
const {state, $, tween, anim, animateRaw, wait, caption, sfx, playPull, stopSfx, spawn, makeCracks, W, H, DPR} = ctx;
  animateRaw($(ctx.background || 'bg'),[{transform:'scale(1.6) translateY(-6%)',filter:'brightness(.3) blur(6px)'},{transform:'scale(1.05) translateY(0)',filter:'brightness(.4) blur(0)'}],{duration:3400,fill:'forwards',easing:'cubic-bezier(.3,.6,.2,1)'});
  state.cz={s:0.05,r:0,stage:0,alpha:1,show:true,flight:1,rays:0};
  caption('A Starlight crystal falls…'); sfx('pull_fall_whoosh'); playPull();
  await tween(1500,p=>{ state.cz.s=0.05+0.25*p*p; state.cz.r+=0.06; });
  ctx.check();
  // 2 · rarity upgrade: violet → GOLD
  if (grade !== 'A') {
  caption(''); state.cz.stage=1; state.cz.rays=0.6; state.shake=4;
  $('flash').style.background='#ffd98a'; anim($('flash'),[{opacity:0},{opacity:.55,offset:.2},{opacity:0}],{duration:500});
  await tween(900,p=>{ state.cz.s=0.3+0.12*p; state.cz.r+=0.05; }); state.shake=0;
  ctx.check();
  // 3 · …WAIT → RAINBOW (S++): state.shake, sky state.cracks, slow motion as it fills the screen
  }
  if (grade === 'S++') {
  state.cz.stage=2; state.cz.rays=1; sfx('tell_splusplus'); state.shake=10; makeCracks(); caption('!!');
  $('flash').style.background='#ffffff'; anim($('flash'),[{opacity:0},{opacity:.6,offset:.2},{opacity:0}],{duration:500});
  await tween(900,p=>{ state.cz.s=0.42+0.25*p; state.cz.r+=0.04; }); state.shake=4; state.cz.flight=0.2;
  ctx.check();
  await tween(1200,p=>{ state.cz.s=0.67+0.35*p; state.cz.r+=0.012*(1-p); });   // slow-mo spin-down
  ctx.check();
  }
  if (grade === 'S+' && ctx.premiumTell) {
    sfx('tell_splus'); state.cz.rays=.9; state.shake=6; caption('!');
    $('flash').style.background='#ffe7a8'; anim($('flash'),[{opacity:0},{opacity:.55,offset:.2},{opacity:0}],{duration:500});
    await tween(900,p=>{state.cz.s=.42+.25*p;state.cz.r+=.04}); ctx.check();
    state.shake=3;state.cz.flight=.2;
    await tween(1000,p=>{state.cz.s=.67+.3*p;state.cz.r+=.012*(1-p)});ctx.check();
  }
  state.shake=0; caption('');
  // 4 · shatter into light
  sfx('pull_flash_swell'); state.cz.show=false; state.cracks=[]; spawn(140,i=>({x:W/2,y:H*0.46,vx:(Math.random()-.5)*22*DPR,vy:(Math.random()-.5)*22*DPR,s:(2+Math.random()*4)*DPR,col:grade==='S++'?`hsl(${Math.random()*360},100%,80%)`:grade==='S+'?'#f4cf7a':'#b48cff'}));
  await anim($('flash'),[{opacity:0},{opacity:1,offset:.3},{opacity:0}],{duration:800});
  ctx.check();
  if (ctx.stopBeforeSilhouette) return;
  // 5 · silhouette first → burst into full color
  state.cz.rays=1; stopSfx();
  const sil=$('timestop'); sil.style.opacity=1; sil.style.transform='translateX(-50%)';
  animateRaw(sil,[{filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #f4cf7a)',opacity:0,transform:'translateX(-50%) scale(.92)'},{filter:'brightness(0) drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px #f4cf7a)',opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:900,fill:'forwards'});
  await wait(1500);
  ctx.check();
  anim($('flash'),[{opacity:0},{opacity:.9,offset:.25},{opacity:0}],{duration:600});
  await anim(sil,[{filter:'brightness(3)',opacity:1},{filter:'brightness(1)',opacity:0}],{duration:700});
  ctx.check();
  state.cz=null;

}
