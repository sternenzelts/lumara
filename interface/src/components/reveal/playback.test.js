// @vitest-environment jsdom
import {describe,it,expect,vi,afterEach} from 'vitest';
import {createPlayback} from './playback.js';
afterEach(()=>vi.useRealTimers());
function setup(){const host=document.createElement('div');host.getAnimations=()=>[];const done=vi.fn();return {life:createPlayback(host,done),done}}
describe('reveal playback lifetime',()=>{
 it('retries a cold theme start and removes pending retries when paused',async()=>{
  vi.useFakeTimers();const {life}=setup();const audio=new EventTarget();audio.pause=vi.fn();audio.play=vi.fn().mockRejectedValueOnce(new DOMException('Interrupted','AbortError')).mockResolvedValue(undefined);
  life.playMusic(audio);await Promise.resolve();await vi.advanceTimersByTimeAsync(200);expect(audio.play).toHaveBeenCalledTimes(2);
  audio.play.mockRejectedValue(new DOMException('Blocked','NotAllowedError'));
  life.playMusic(audio);await Promise.resolve();life.pauseMusic(audio);
  document.dispatchEvent(new Event('pointerdown'));audio.dispatchEvent(new Event('canplay'));await vi.advanceTimersByTimeAsync(1000);
  expect(audio.play).toHaveBeenCalledTimes(3);expect(audio.pause).toHaveBeenCalledOnce();life.dispose();
 });
 it('retries an autoplay denial on the next gesture, but never after Replay cancellation',async()=>{
  const {life}=setup();const audio=new EventTarget();audio.play=vi.fn().mockRejectedValueOnce(new DOMException('Blocked','NotAllowedError')).mockResolvedValue(undefined);
  life.playMusic(audio);await Promise.resolve();await Promise.resolve();document.dispatchEvent(new Event('pointerdown'));await Promise.resolve();expect(audio.play).toHaveBeenCalledTimes(2);
  audio.play.mockRejectedValue(new DOMException('Blocked','NotAllowedError'));life.playMusic(audio);await Promise.resolve();life.cancel();document.dispatchEvent(new Event('keydown'));audio.dispatchEvent(new Event('canplay'));await Promise.resolve();expect(audio.play).toHaveBeenCalledTimes(3);life.dispose();
 });
 it('primes the theme silently and does not pause a newer music request',async()=>{
  const {life}=setup();let release;const audio=new EventTarget();audio.currentTime=0;audio.pause=vi.fn();audio.play=vi.fn().mockImplementationOnce(()=>new Promise(r=>release=r)).mockResolvedValue(undefined);
  life.primeMusic(audio);expect(audio.preload).toBe('auto');life.playMusic(audio);release();await Promise.resolve();await Promise.resolve();expect(audio.pause).not.toHaveBeenCalled();life.dispose();
 });
 it('Replay cancels pending waits and concurrent voice without completing the old run',async()=>{
  vi.useFakeTimers();const {life,done}=setup();const audio=new EventTarget();audio.play=vi.fn(async()=>{});audio.currentTime=0;audio.duration=3;
  const voice=life.voice(audio);const old=life.replay(async()=>life.sleep(1000));await expect(voice).rejects.toBe(life.CANCEL);
  const fresh=life.replay(async()=>life.sleep(50));await vi.advanceTimersByTimeAsync(50);await fresh;await old;expect(done).toHaveBeenCalledOnce();life.dispose();
 });
 it('waits for the entire voice clip, or its duration plus 300 ms fallback',async()=>{
  vi.useFakeTimers();const {life}=setup();const audio=new EventTarget();audio.play=vi.fn(async()=>{});audio.duration=8;audio.currentTime=0;
  const ended=vi.fn();const line=life.voice(audio).then(ended);await vi.advanceTimersByTimeAsync(6000);expect(ended).not.toHaveBeenCalled();audio.dispatchEvent(new Event('ended'));await line;expect(ended).toHaveBeenCalledOnce();
  const fallback=life.voice(audio).then(ended);await vi.advanceTimersByTimeAsync(8299);expect(ended).toHaveBeenCalledOnce();await vi.advanceTimersByTimeAsync(1);await fallback;expect(ended).toHaveBeenCalledTimes(2);life.dispose();
 });
 it('dispose clears delayed effects and intervals',async()=>{vi.useFakeTimers();const {life}=setup();const effect=vi.fn();life.setTimeout(effect,20);life.setInterval(effect,20);life.dispose();await vi.advanceTimersByTimeAsync(100);expect(effect).not.toHaveBeenCalled()});
});
