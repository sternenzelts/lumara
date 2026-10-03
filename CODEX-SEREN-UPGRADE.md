# Codex: upgrade Seren's reveal and illustrations

**From:** Jay (written up by Claude) · **Date:** 2026-09-28 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`

Seren (S+, Light, the game's mascot) gets new art at the same level as Lucien and Azrenth, plus a new S+ reveal.
- **Approved reveal:** `reveal-demos/seren3/index.html`. To view it, run `python -m http.server 8765` inside `reveal-demos`
  and open `/seren3/`. `README.md` there lists the beats. It **replaces** the current Seren reveal, which was ported from `seren2`.
- **New art:** in `characters/seren/`. The table at the bottom of `source.md` lists each file and its use.

## 1. Update her illustrations
| New file (in `characters/seren/`) | Replaces | Used for |
|---|---|---|
| `seren_splash_v3.webp` (16:9, sword on her shoulder) | `seren_splash_v2.webp` | Collection card, character details, reveal name card |
| `seren_cutout_v2.webp` (1024 × 1536, transparent) | `seren_cutout.webp` | Sanctuary, party, lobby, companion portraits |

- `src/data/art.ts`: `seren: { splash: path('seren', 'seren_splash_v3.webp'), cutout: path('seren', 'seren_cutout_v2.webp') }`.
  Copy both files to `public/art/seren/`.
- **Important: keep the title screen and Sanctuary backgrounds unchanged.**
  - `SANCTUARY_BACKGROUND` is currently `ART.seren.splash`, and `Scene.tsx` and `screens.tsx` (the title) use it.
  - Point it explicitly at the **old** file, `path('seren', 'seren_splash_v2.webp')`, so those screens don't switch to the new splash.
  - Keep `seren_splash_v2.webp` in `public/`. The Sanctuary background is being redesigned separately (Blender).
- **Wherever Seren's portrait is cropped from her cutout** (companion slot on Ayaka's banner, party list, collection), re-measure
  the crop for `seren_cutout_v2.webp`, since her pose changed. Add a `seren` entry to `SUPPORT_PORTRAITS` in `WishLineups.tsx` if there isn't one.
- **Leave the guide portraits alone:** `seren_face_*.webp`, `seren_chibi.webp` and `seren_intro.mp4` (title / opening) stay as they are.
- **Overview website** (`gacha-art/website/src/characters.ts`): use `seren_splash_v3` and `seren_cutout_v2`. Copy them into `website/public/art/seren/`.
- **Optional:** `characters/seren/reveal/background_aurelis_dawn.webp` (Aurelis at sunrise, no character) is a good candidate
  for a future title or Sanctuary background. Don't swap it in yet; ask Jay.

## 2. Replace her S+ reveal (port `seren3` beat for beat)
- Rewrite `reveal/seren-approved.js` and `seren-markup.js` from `reveal-demos/seren3/index.html`.
  Use the same pattern as the Lucien and Azrenth ports: `createPlayback`, the `runId`/`guard` cancel, `asset()`,
  the one-image-at-a-time rule, and `say()` for optional voice clips.
- **Beats:**
  1. Standard pull, gold S+ tell.
  2. Silhouette with a warm gold backlight and two heartbeats. The theme starts.
  3. **Arrival:** `arrival.webp`, with `vo_reveal`, her recorded `pull_seren` line.
  4. **Prayer:** push-in, with dawn motes streaming into the blade.
  5. **Blade triptych:** `sword_triptych.webp` on a pale background, `object-fit: contain`. One panel lights at a time with a gold spark.
  6. **Dawnbreak:** `dawnbreak.webp`, with sfx_dawn and a burst of light.
  7. **Full white-out:** 3030 ms. Rises in 0.43 s, **1 s of full white**, then clears.
     - **`#flash` must sit above the vignette** (`z-index:3`) so the whole screen goes white.
     - Swap to `splash.webp` while the screen is fully white.
  8. Name card: "S+ · PREMIUM / SEREN / Light — Dawnlight".
- **Theme:** keep her current theme ("NewGame", the 27.8–87.8 s cut). It ducks under her line.
- **Dawnbreak voice line** 「夜明けよ、来て――ドーンブレイク！」: not recorded yet. Load `vo_sig_dawnbreak.mp3` if it exists,
  and otherwise hold the caption for 2.6 s, as the demo does. Jay will add the file to `characters/seren/voice/ja/`
  as `seren_vo_sig_dawnbreak.mp3`.
- **Measured points** are in pixels of the 1672 × 941 art. Scale them by `naturalWidth / 1672` if you resize:
  - the prayer blade: (985, 330);
  - the triptych panel edges: x = 555 and 1115;
  - the triptych sparks: (300, 560), (840, 470), (1390, 690).

## 3. Assets and size
- **From `reveal-demos/seren3/`:** `background_aurelis_dawn`, `arrival`, `prayer`, `sword_triptych`, `dawnbreak`, `splash`, `cutout`,
  and `sfx_dawn`. Reuse the existing theme, `vo_reveal` and the shared pull assets. Don't duplicate them.
- Delete the files that only the old Seren reveal used, if nothing else uses them.
- Convert images to WebP q80. Report the `npm run build` size.

## Done when
- The new cutout and splash appear everywhere Seren is shown, with correctly framed portraits.
  The title screen and Sanctuary backgrounds are **unchanged**.
- Her reveal matches `seren3` side by side on desktop and phone. There's never more than one full-screen image,
  and the white-out covers the entire screen.
- The website shows the new art.
- `npm test` and `npm run build` pass. The opening and nickname files are untouched (`Opening.tsx`, `opening.ts`, `names.ts`).
