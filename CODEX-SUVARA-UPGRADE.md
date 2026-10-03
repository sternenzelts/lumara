# Codex: upgrade Suvara (new art, voice, S+ reveal)

**From:** Jay (written up by Claude) · **Date:** 2026-09-28 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`

**Suvara, Keeper of the Horizon** (S+, Radiant Light) is a young ruler of Lianzhou, bound to the light dragon **Yulan**
(inspired by Jinhsi from Wuthering Waves). She now has new art, 30 voice lines and her own S+ reveal.
- **Approved reveal:** `reveal-demos/suvara/index.html`. To view it, run `python -m http.server 8765` inside `reveal-demos`
  and open `/suvara/`. `README.md` there lists the beats.
- **Everything else:** `characters/suvara/`. See `source.md` for the file table, `voice-script.md` for the lines,
  and `audio/` for the theme and sound effects.

## 1. Illustrations
| New file (`characters/suvara/`) | Replaces | Used for |
|---|---|---|
| `suvara_splash_v3.webp` (16:9, seated on Yulan, sword across her lap) | `suvara_splash_v2.webp` | Collection card, character details, reveal name card |
| `suvara_cutout_v2.webp` (1024 × 1536, transparent) | `suvara_cutout.webp` | Sanctuary, party, lobby, portraits |

- `src/data/art.ts`: `suvara: { splash: path('suvara', 'suvara_splash_v3.webp'), cutout: path('suvara', 'suvara_cutout_v2.webp') }`.
- **Re-measure her portrait crops** for the new cutout: `SUPPORT_PORTRAITS.suvara` in `WishLineups.tsx` (Azrenth's banner
  companion), the party list and the collection. Her face is around x 380–560, y 180–380.
- `src/data/characters.ts`: title `'Keeper of the horizon'` stays, and the grade stays **S+**.
- **Overview website** (`gacha-art/website/src/characters.ts`): switch to the new splash and cutout, and copy them into `website/public/art/suvara/`.

## 2. S+ reveal (port the demo beat for beat)
- Add `reveal/suvara-approved.js` and `suvara-markup.js` and register them in `SplusplusReveal.tsx`.
  Use the same pattern as the Seren and Lucien ports: `createPlayback`, the `runId`/`guard` cancel, `asset()`,
  the one-image-at-a-time rule, and `say()` for optional voice clips.
- **Beats:**
  1. Standard pull, gold S+ tell.
  2. Her silhouette with Yulan against a **teal** backlight, two heartbeats. The theme starts.
  3. **Arrival:** `arrival.webp`, with `vo_reveal` then `vo_reveal_2`.
  4. **Bond:** `bond.webp` push-in, with light flowing into Yulan's brow, and `vo_bond`.
  5. **Awakening triptych:** `awakening_triptych.webp` on a pale background, `object-fit: contain`. One panel at a time,
     **each with its own sound**:
     - eye: `sfx_pull_flash_swell` at .55;
     - hilt: `sfx_slash` at .4;
     - blade: `sfx_slash` at .75.
     - **No chime** (Jay rejected the tell chime here).
  6. **Sentinel's Descent:** `sentinels_descent.webp`, with **`sfx_descent`**, a shake of 9 easing to 0 over 2.4 s, and `vo_sig_full`.
     **Do not use `sfx_dawn` here** (that's Seren's chime).
  7. Full white-out (3030 ms, 1 s of full white, `#flash` z-index above the vignette), then `splash.webp`, then the name card:
     "S+ · PREMIUM / SUVARA / Radiant Light — Keeper of the Horizon".
- **Theme:** `theme.mp3` = **"IVORY TOWER" (Dragon Raja)**, the 4–64 s cut, so its chorus lands around Sentinel's Descent.
  It ducks to 7 % under every line.
- **`sfx_descent.mp3`** is one layered sound (4.7 s): blade slash, impact boom at 0.12 s, dragon roar peaking about 2 s in.
  - Source: `characters/suvara/audio/suvara_sfx_descent.mp3`.
  - The three originals (`src_*.mp3`) are only there for re-mixing. Don't ship them.
- **Measured points** are in pixels of the 1672 × 941 art. Scale them by `naturalWidth / 1672` if you resize:
  - the bond focus point: (905, 420);
  - the triptych panel edges: x = 555 and 1115;
  - the triptych sparks: (300, 390), (840, 330), (1400, 420).

## 3. Voice and assets
- **All 30 lines:** `characters/suvara/voice/ja/suvara_vo_<id>.mp3` (ids in `voice-ids.txt`, captions in `voice-script.md`).
  - Put them in `public/art/suvara/voice/ja/` if the Sanctuary plays character lines.
  - Cut points are in `voice/voice-source.json`.
- **Reveal files from `reveal-demos/suvara/`:**
  - Images: `background_palace_dusk`, `arrival`, `bond`, `awakening_triptych`, `sentinels_descent`, `splash`, `cutout`.
  - Audio: `vo_reveal`, `vo_reveal_2`, `vo_bond`, `vo_sig_full`, `theme.mp3`, `sfx_descent`, `sfx_slash`.
  - Reuse the shared pull assets. Don't duplicate them.
- Convert images to WebP q80 and report the `npm run build` size.

## Done when
- The new cutout and splash appear everywhere Suvara is shown, with correctly framed portraits (including Azrenth's banner).
- Her reveal matches the demo side by side on desktop and phone:
  - there's never more than one full-screen image;
  - no chime plays in the triptych or at the Descent;
  - `sfx_descent` plays on the Descent.
- The theme ducks under her lines, and no line is cut off. Replay and Skip cancel cleanly.
- The website shows the new art.
- `npm test` and `npm run build` pass. The opening and nickname files are untouched.
