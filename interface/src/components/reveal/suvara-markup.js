// IDs match the approved Suvara choreography; the host scopes them to this reveal.
export const markup = `<div id="stage">
  <img id="scene" class="layer" src="__BASE__art/suvara/background_palace_dusk.webp" alt="">
  <img id="halfA" class="half" src="__BASE__art/suvara/background_palace_dusk.webp" alt="">
  <img id="halfB" class="half" src="__BASE__art/suvara/background_palace_dusk.webp" alt="">
  <canvas id="fx"></canvas>
  <img id="arrival" class="layer art" src="__BASE__art/suvara/arrival.webp" alt="">
  <img id="prayer" class="layer art" src="__BASE__art/suvara/bond.webp" alt="">
  <img id="blade1" class="layer art" src="__BASE__art/suvara/awakening_triptych.webp" alt="">
  <img id="blade2" class="layer art" src="__BASE__art/suvara/awakening_triptych.webp" alt="">
  <img id="blade3" class="layer art" src="__BASE__art/suvara/awakening_triptych.webp" alt="">
  <img id="dawnbreak" class="layer art" src="__BASE__art/suvara/sentinels_descent.webp" alt="">
  <img id="finalArt" class="layer" src="__BASE__art/suvara/suvara_splash_v3.webp" alt="">
  <img id="severArt" class="layer" alt="">
  <img id="suvara" class="cut" src="__BASE__art/suvara/suvara_cutout_v2.webp" alt="">
  <canvas id="fx2"></canvas>
  <div id="flash"></div>
  <div id="vignette"></div>
  <div id="caption" role="status"></div><div id="audioStatus" role="status"></div>
  <div id="card"><span class="grade">S+ · PREMIUM</span><h1>SUVARA</h1><div class="sub">Radiant Light — Keeper of the Horizon</div><div class="line"></div></div>
  <button id="sound" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="var(--gold)" stroke="none"/><path class="w1" d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path class="w2" d="M18 7a7 7 0 0 1 0 10"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg><span>Sound</span></button>
  <div id="ui"><button id="replay">Replay</button><button id="skip">Skip</button><button id="continue" hidden>Continue</button></div>
</div>`;
export const assets = {
  'crystal.webp':'art/ayaka/reveal-crystal.webp',
  'pull_music.mp3':'audio/pull_music.mp3',
  'sfx_pull_fall_whoosh.mp3':'audio/ayaka-reveal/sfx_pull_fall_whoosh.mp3',
  'sfx_tell_splus.mp3':'art/seren/sfx_tell_splus.mp3',
  'sfx_pull_flash_swell.mp3':'audio/ayaka-reveal/sfx_pull_flash_swell.mp3',
  'sfx_descent.mp3':'art/suvara/sfx_descent.mp3',
  'sfx_slash.mp3':'art/suvara/sfx_slash.mp3',
  'vo_reveal.mp3':'art/suvara/vo_reveal.mp3',
  'vo_reveal_2.mp3':'art/suvara/vo_reveal_2.mp3',
  'vo_bond.mp3':'art/suvara/vo_bond.mp3',
  'vo_sig_full.mp3':'art/suvara/vo_sig_full.mp3',
  'theme.mp3':'art/suvara/theme.mp3'
};
