// IDs match the approved Ashvane choreography; the host scopes them to this reveal.
export const markup = `<div id="stage">
  <img id="scene" class="layer" src="__BASE__art/ashvane/background_battlefield_dusk.webp" alt="">
  <img id="halfA" class="half" src="__BASE__art/ashvane/background_battlefield_dusk.webp" alt="">
  <img id="halfB" class="half" src="__BASE__art/ashvane/background_battlefield_dusk.webp" alt="">
  <canvas id="fx"></canvas>
  <img id="arrival" class="layer art" src="__BASE__art/ashvane/arrival.webp" alt="">
  <img id="prayer" class="layer art" src="__BASE__art/ashvane/serious.webp" alt="">
  <img id="blade1" class="layer art" src="__BASE__art/ashvane/combo_triptych.webp" alt="">
  <img id="blade2" class="layer art" src="__BASE__art/ashvane/combo_triptych.webp" alt="">
  <img id="blade3" class="layer art" src="__BASE__art/ashvane/combo_triptych.webp" alt="">
  <img id="dawnbreak" class="layer art" src="__BASE__art/ashvane/autumns_end.webp" alt="">
  <img id="finalArt" class="layer" src="__BASE__art/ashvane/ashvane_splash_v2.webp" alt="">
  <img id="severArt" class="layer" alt="">
  <img id="ashvane" class="cut" src="__BASE__art/ashvane/ashvane_cutout_v2.webp" alt="">
  <canvas id="fx2"></canvas>
  <div id="flash"></div>
  <div id="vignette"></div>
  <div id="caption" role="status"></div><div id="audioStatus" role="status"></div>
  <div id="card"><span class="grade">S+ · PREMIUM</span><h1>ASHVANE</h1><div class="sub">Earth / Battle — The Quiet Vanguard</div><div class="line"></div></div>
  <button id="sound" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="var(--gold)" stroke="none"/><path class="w1" d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path class="w2" d="M18 7a7 7 0 0 1 0 10"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg><span>Sound</span></button>
  <div id="ui"><button id="replay">Replay</button><button id="skip">Skip</button><button id="continue" hidden>Continue</button></div>
</div>`;
export const assets = {
  'crystal.webp':'art/ayaka/reveal-crystal.webp',
  'pull_music.mp3':'audio/pull_music.mp3',
  'sfx_pull_fall_whoosh.mp3':'audio/ayaka-reveal/sfx_pull_fall_whoosh.mp3',
  'sfx_tell_splus.mp3':'art/seren/sfx_tell_splus.mp3',
  'sfx_pull_flash_swell.mp3':'audio/ayaka-reveal/sfx_pull_flash_swell.mp3',
  'sfx_descent.mp3':'art/ashvane/sfx_descent.mp3',
  'sfx_slash.mp3':'art/ashvane/sfx_slash.mp3',
  'vo_reveal.mp3':'art/ashvane/vo_reveal.mp3',
  'vo_reveal_2.mp3':'art/ashvane/vo_reveal_2.mp3',
  'vo_sig_short.mp3':'art/ashvane/vo_sig_short.mp3',
  'vo_sig_full.mp3':'art/ashvane/vo_sig_full.mp3',
  'theme.mp3':'art/ashvane/theme.mp3'
};
