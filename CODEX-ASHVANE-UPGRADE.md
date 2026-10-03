# Codex: upgrade Ashvane (new art, voice, S+ reveal)

**From:** Jay (written up by Claude) · **Date:** 2026-09-28 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`

**Ashvane, the Quiet Vanguard** (S+, Earth / Battle) has Ye Xiu's personality (the lazy, sarcastic, retired legend)
and One Autumn Leaf's Battle Mage fighting style, both from *The King's Avatar*. He now has new art, 30 voice lines
and his own S+ reveal.
- **Approved reveal:** `reveal-demos/ashvane/index.html`. To view it, run `python -m http.server 8765` inside `reveal-demos`
  and open `/ashvane/`. `README.md` there lists the beats.
- **Everything else:** `characters/ashvane/`. See `source.md`, `voice-script.md` and `audio/`.

## 1. Illustrations
| New file (`characters/ashvane/`) | Replaces | Used for |
|---|---|---|
| `ashvane_splash_v2.webp` (16:9, spear on his shoulder at sunset) | `ashvane_splash_v1.webp` | Collection card, details, reveal name card |
| `ashvane_cutout_v2.webp` (1024 × 1536, transparent) | `ashvane_cutout.webp` | Sanctuary, party, lobby, portraits |

- `src/data/art.ts`: `ashvane: { splash: path('ashvane', 'ashvane_splash_v2.webp'), cutout: path('ashvane', 'ashvane_cutout_v2.webp') }`.
- **Re-measure his portrait crops:** `SUPPORT_PORTRAITS.ashvane` in `WishLineups.tsx` (Keira's banner companion), the party and the collection.
  His face is around x 400–560, y 80–260.
- **Overview website** (`gacha-art/website/src/characters.ts`): switch to the new art and copy it into `website/public/art/ashvane/`.
  You can also update his description to mention the lazy-legend personality.

## 2. S+ reveal (port the demo beat for beat)
- Add `reveal/ashvane-approved.js` and `ashvane-markup.js` and register them in `SplusplusReveal.tsx`.
  Use the same pattern as the Suvara and Seren ports.
- **Beats:**
  1. Standard pull, gold S+ tell.
  2. Silhouette with the spear, against an **amber** backlight, two heartbeats. The theme starts **from its own intro**.
  3. **Arrival:** `arrival.webp` (yawning against a pillar), with `vo_reveal` then `vo_reveal_2`.
  4. **Getting serious:** `serious.webp` push-in with amber motes, and `vo_sig_short`.
  5. **Combo triptych:** `combo_triptych.webp` on a pale background, `object-fit: contain`. One panel at a time, each with its own sound and a shake of 5:
     - thrust: `sfx_slash` at .6;
     - palm: `sfx_pull_flash_swell` at .6;
     - launch: `sfx_slash` at .8.
  6. **Autumn's End:** `autumns_end.webp`, with `sfx_descent` (slash, boom and roar, for the leaf dragon), shake, and `vo_sig_full`.
  7. Full white-out (3030 ms, 1 s of full white, `#flash` above the vignette), then `splash.webp`, then the name card:
     "S+ · PREMIUM / ASHVANE / Earth / Battle — The Quiet Vanguard".
- **Theme and the drum drop (Jay tuned this, keep it exact):**
  - `theme.mp3` = **"Tetsu no Ori" (GRANRODEO, Bungo Stray Dogs S5 OP)**, the first 75 s, starting at 0:00.
  - It ducks under his lines.
  - **When the combo triptych starts:**
    1. Ramp the theme down to 0 over about 450 ms.
    2. Under the white flash, seek to `DROP_AT - 1.2` s, where `DROP_AT = 37.8`.
    3. Ramp back up to .55 over about 0.7 s, so the song rises into the big drum hit as the first panel lights.
  - **No abrupt cut.**
- **Measured points** are in pixels of the 1672 × 941 art. Scale them by `naturalWidth / 1672` if you resize:
  - the "serious" focus point: (1180, 720);
  - the triptych panel edges: x = 555 and 1115;
  - the triptych sparks: (240, 480), (840, 330), (1490, 150).

## 3. Voice and assets
- **All 30 lines:** `characters/ashvane/voice/ja/ashvane_vo_<id>.mp3` (ids in `voice-ids.txt`, captions in `voice-script.md`).
  Put them in `public/art/ashvane/voice/ja/` if the Sanctuary plays character lines.
- **Reveal files from `reveal-demos/ashvane/`:**
  - Images: `background_battlefield_dusk`, `arrival`, `serious`, `combo_triptych`, `autumns_end`, `splash`, `cutout`.
  - Audio: `vo_reveal`, `vo_reveal_2`, `vo_sig_short`, `vo_sig_full`, `theme.mp3`, `sfx_descent`, `sfx_slash`.
  - Reuse the shared pull assets.
- **Don't ship the rejected themes** in `characters/ashvane/audio/`: grayscale dominator, Light from the Dust, Hollow Hunger.
- Convert images to WebP q80 and report the `npm run build` size.

## Done when
- The new art appears everywhere Ashvane is shown, with correctly framed portraits (including Keira's banner).
- His reveal matches the demo side by side on desktop and phone. There's never more than one full-screen image.
- The theme plays from the intro, then **fades smoothly** into the drum drop at the combo.
- No line is cut off. Replay and Skip cancel cleanly.
- The website shows the new art.
- `npm test` and `npm run build` pass. The opening and nickname files are untouched.
