# Codex — add Lucien Valmaire (S+) and put him on Mahesvara's banner

**From:** Jay (written up by Claude) · **Date:** 2026-09-28 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`
Do this after `CODEX-AZRENTH-REVEAL.md`, or alongside it; they touch the same banner files.

**Lucien Valmaire, "the Great Moon"** is a new **S+** character. Element: Moonlit Lightning. He's a calm noble mage
whose chants and hand signs turn tiny spells into lightning storms. Everything about him is in `characters/lucien/`,
starting with `source.md`. His approved reveal is `reveal-demos/lucien/index.html`. To view it, run
`python -m http.server 8765` inside `reveal-demos` and open `/lucien/`; `README.md` there lists the beats.

## 1. Character data
- `src/data/characters.ts`: `{ id: 'lucien', name: 'Lucien Valmaire', title: 'The Great Moon', grade: 'S+', element: 'Moonlit Lightning', accent: '#6f63b8', flavor: 'A weary young count everyone calls a mastermind. His chants bind a forgotten god's vow — and a hundred bolts of lightning answer.', art: ART.lucien }`
- `src/data/art.ts`: `lucien: { splash: path('lucien', 'lucien_splash_v1.webp'), cutout: path('lucien', 'lucien_cutout.webp') }`
- **Overview website** (`gacha-art/website/src/characters.ts`): add him with the same name, title, grade, element and accent.
  Use a matching `description`, plus `splash` and `cutout`. Copy his art into `website/public/art/lucien/`.

## 2. Banner: he replaces the temporary Ashvane
- `src/data/banners.ts`: Mahesvara's lineup becomes `{ featured: 'mahesvara', companions: ['lucien', 'sollene', 'calla'] }`.
  Remove the temporary Ashvane there. Ashvane stays on Keira's banner.
  - This matches Mahesvara's moon banner.
  - It leaves exactly one S+ per banner: Lucien, Ashvane, Seren and Suvara.
- `src/components/WishLineups.tsx`: add a `lucien` entry to `SUPPORT_PORTRAITS`, a viewBox on `lucien_cutout.webp`
  (1024 × 1536) framing his face and bust.
  - His face is around x 440–600, y 60–260, so a start is `'345 30 330 413'`.
  - Measure it the way you did the others.
- Update any tests that list banner companions (for example `bannerRates.test.ts`).

## 3. S+ reveal (port the demo beat for beat)
- Add `reveal/lucien-approved.js` and `reveal/lucien-markup.js` and register them in `SplusplusReveal.tsx`.
  Use the same pattern as Seren's S+ reveal and the Azrenth port: `createPlayback`, the `runId`/`guard` cancel,
  `asset()` mapping, the one-image-at-a-time rule, and the lightning helpers (`zap`, `drawZaps`, `crackle`).
- **Beats:**
  1. Standard pull, **gold S+ tell**.
  2. Silhouette with a silver-violet backlight and two heartbeats. The theme starts.
  3. Arrival on the terrace, with lines `vo_reveal` and `vo_reveal_2`.
  4. Chant push-in with violet arcs.
  5. **Three seals**: the three panels of `three_seals.webp` light up one at a time, on **black**, fitted with `object-fit: contain`, while `vo_vow_seal` plays.
  6. **Vow close-up**: four fingertip flares.
  7. **Lunge**: lightning builds through `vo_sig_full`.
  8. **Hundredfold Chain** storm, with heavy shake and the theme up.
  9. White flash, then `splash.webp` and the name card: "S+ · PREMIUM / LUCIEN VALMAIRE / Moonlit Lightning — The Great Moon".
- **Theme:** `theme.mp3`, "We're the Moonlight", a 60 s cut. Its vocals start at 6.5 s, so it **ducks to 7 % under every line**
  (the `ducked()` helper), like Keira's TACTIC.
- **Measured points are in image pixels** of the 1672 × 941 art. If you resize that art, scale these points by `naturalWidth / 1672`:
  - the rune orb in `chant.webp`: (905, 470);
  - the seal panel edges: x = 557 and 1117;
  - the four fingertips in `vow_closeup.webp`;
  - the hand in `release_lunge.webp`: (545, 200);
  - the hand in `hundredfold_chain.webp`: (880, 235).
- Don't port the demo's `visibilitychange` start-screen reset.

## 4. Assets
- **From `reveal-demos/lucien/`:**
  - Images: `background_terrace`, `chant`, `three_seals`, `vow_closeup`, `release_lunge`, `hundredfold_chain`, `splash`, `cutout`.
  - Voice and music: `vo_reveal`, `vo_reveal_2`, `vo_vow_seal`, `vo_sig_full`, `theme.mp3`.
  - Effects: `sfx_slash`, `sfx_shatter`.
  - Shared pull assets: reuse the existing single copy.
- **All 30 voice lines** are in `characters/lucien/voice/ja/lucien_vo_<id>.mp3` (ids in `voice-ids.txt`, captions in
  `voice-script.md`). Put them in `public/art/lucien/voice/ja/` if the Sanctuary plays character lines.
- `thunder_sovereign.webp` is not used in the reveal. Skip it for now.
- **Size:** convert images to WebP q80 and keep them 1672 wide, or scale the points above. Report the `npm run build` size.

## Done when
- Lucien appears on Mahesvara's banner as the S+ companion, with a correctly framed portrait. Ashvane is no longer there.
- His reveal matches the demo side by side on desktop and phone. There's never more than one full-screen image, and the three seals sit on black.
- The theme ducks under his lines, and no line is cut off. Replay and Skip cancel cleanly.
- He's listed on the overview website as S+.
- `npm test` and `npm run build` pass. The opening and nickname files are untouched.
