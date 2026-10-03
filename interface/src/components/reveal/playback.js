// One lifetime for timers, tweens, voice completion and Replay cancellation.
export function createPlayback(host, onFinished) {
  const CANCEL = Symbol('reveal canceled');
  let generation = 0, disposed = false;
  const timers = new Set(), intervals = new Set(), frames = new Set(), pending = new Set();
  const musicRequests = new Map();
  const priming = new Set();
  const later = (fn, ms) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const clearLater = id => {window.clearTimeout(id);timers.delete(id)};
  const every = (fn, ms) => {const id=window.setInterval(fn,ms);intervals.add(id);return id};
  const clearEvery = id => {window.clearInterval(id);intervals.delete(id)};
  // A theme starts several beats after the initiating tap. Warm its media element
  // during that tap, and retain failed requests until media readiness or a gesture.
  const primeMusic = audio => {
    audio.preload = 'auto';
    priming.add(audio);
    void audio.play().then(() => {
      if (priming.delete(audio) && !musicRequests.has(audio)) { audio.pause(); audio.currentTime = 0; }
    }).catch(() => { priming.delete(audio); });
  };
  const pauseMusic = audio => {
    musicRequests.get(audio)?.cleanup();
    priming.delete(audio);
    audio.pause();
  };
  const playMusic = audio => {
    musicRequests.get(audio)?.cleanup();
    priming.delete(audio);
    const id = generation;
    let attempts = 0, trying = false, retryTimer;
    const valid = () => !disposed && id === generation && musicRequests.get(audio) === request;
    const cleanup = () => {
      clearLater(retryTimer);
      audio.removeEventListener('canplay', retry);
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('keydown', retry);
      if (musicRequests.get(audio) === request) musicRequests.delete(audio);
    };
    const retry = () => {
      if (!valid() || trying) return;
      trying = true; attempts++;
      void audio.play().then(() => { trying = false; if (valid()) cleanup(); }).catch(error => {
        trying = false;
        if (!valid()) return;
        // Autoplay denial needs a gesture; an interrupted/cold media start can retry.
        if (error.name !== 'NotAllowedError' && attempts < 3) retryTimer = later(retry, 200);
      });
    };
    const request = { cleanup };
    musicRequests.set(audio, request);
    audio.addEventListener('canplay', retry);
    document.addEventListener('pointerdown', retry);
    document.addEventListener('keydown', retry);
    retry();
  };
  const raf = fn => {if(disposed)return 0;const id=window.requestAnimationFrame(t=>{frames.delete(id);if(!disposed)fn(t)});frames.add(id);return id};
  function task(start) {
    const promise = new Promise((resolve,reject)=>{
      let cleanup=()=>{};
      const stop=()=>{cleanup();pending.delete(stop);reject(CANCEL)};
      const done=()=>{cleanup();pending.delete(stop);resolve()};
      pending.add(stop);cleanup=start(done)||(()=>{});
    });
    promise.catch(()=>{}); // Concurrent voice beats may be awaited after an effect.
    return promise;
  }
  const sleep = ms => task(done=>{const id=later(done,ms);return()=>clearLater(id)});
  const tween = (ms,fn) => task(done=>{const start=performance.now();let id;const tick=()=>{const p=Math.min(1,(performance.now()-start)/ms);fn(p);if(p<1)id=raf(tick);else done()};tick();return()=>{window.cancelAnimationFrame(id);frames.delete(id)}});
  const anim = (el,frames,options={}) => {
    const a=el.animate(frames,{fill:'forwards',easing:'cubic-bezier(.2,.8,.2,1)',duration:500,...options});
    // Fire-and-forget flashes are safe to cancel; awaited steps check generation.
    return a.finished.catch(()=>new Promise(()=>{}));
  };
  const voice = audio => task(done=>{
    audio.currentTime=0;let timer;
    const ended=()=>done();
    audio.addEventListener('ended',ended);
    const schedule=()=>{clearLater(timer);timer=later(done,((Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:6)+.3)*1000)};
    audio.addEventListener('loadedmetadata',schedule);schedule();audio.play().catch(()=>{});
    return()=>{clearLater(timer);audio.removeEventListener('ended',ended);audio.removeEventListener('loadedmetadata',schedule)};
  });
  const life={CANCEL,sleep,tween,anim,voice,primeMusic,playMusic,pauseMusic,setTimeout:later,clearTimeout:clearLater,setInterval:every,clearInterval:clearEvery,requestAnimationFrame:raf,onCancel:()=>{},
    cancel(){generation++;for(const request of [...musicRequests.values()])request.cleanup();for(const audio of priming){audio.pause();}priming.clear();for(const stop of [...pending])stop();for(const id of [...timers])clearLater(id);for(const id of [...intervals])clearEvery(id);host.getAnimations({subtree:true}).forEach(a=>a.cancel());life.onCancel()},
    async replay(run){life.cancel();const id=generation;try{await run();if(id===generation&&!disposed)onFinished()}catch(e){if(e!==CANCEL)throw e}},
    dispose(){life.cancel();disposed=true;frames.forEach(window.cancelAnimationFrame);frames.clear();host.querySelectorAll('audio').forEach(a=>{a.removeAttribute('src');a.load()})}
  };
  return life;
}
