# Codex: Azrenth is S++. Port his reveal and give him his own banner

**From:** Jay (written up by Claude) · **Date:** 2026-09-28 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`

Azrenth moves from **S+ to S++**. His approved reveal is the single-file demo
`reveal-demos/azrenth/index.html`, which is your draft reworked by Claude and approved by Jay.
To view it, run `python -m http.server 8765` inside `reveal-demos`, then open `/azrenth/`.
Rebuild it in the game **beat for beat**: same order, same timings, same audio behaviour, same art.
Use the same pattern as the other approved reveals: `reveal/azrenth-approved.js` plus `reveal/azrenth-markup.js`,
registered in the `reveals` map in `SplusplusReveal.tsx`, using `createPlayback`, the `runId`/`guard` cancel,
`asset()` mapping and `__BASE__` paths. `run()` in the demo is the script, and each beat is a commented block.
The **"Claude's rework"** section of `reveal-demos/azrenth/README.md` explains why each part is built the way it is.

## 1. Beats (the demo is the authority)
1. **Standard pull** (shared) → S++ rainbow tell → shatter.
2. **Shadow:** a pure-black silhouette with a rim glow in front of a **crimson backlight** drawn on the canvas.
   The castle is dimmed to `brightness(.2)`. Two heartbeats, then it resolves into colour while the theme starts.
3. **Arrival:** two voice lines (`vo_reveal`, `vo_reveal_2`), with the theme ducked under each.
4. **Jirasd:**
   - The Jirasd pose fades in and a flame gathers in his hand.
   - While it gathers, **black-red lightning** (red glow, black body, thin red-hot seam) arcs from his hand
     (never toward his face) and crawls over his body. He trembles (`translate` jitter) and the screen shakes harder as it grows.
   - Voice: `vo_jirasd` 「黒き太陽よ、灰燼と化せ」, caption "Black sun — turn to ash.". The strike fires **when the line ends**.
   - The strike is 6 flickering lightning bolts, 55 ms apart, from his hand to the castle.
   - The castle then **burns away outward from the impact**. `#halfA` is an intact copy with a growing radial CSS mask,
     over `#scene`, which is set to charred. The fire front is drawn on the canvas, with embers, ash and lightning inside it.
   - No pixel mosaic, no drawn black sun.
5. **Venuzdonoa:**
   - The sword pose emerges from shadow and **slowly pushes in** (scale 1 → 1.1).
   - Four gold threads of order glow behind him. A glint runs from the hilt to the tip of the blade.
   - Voice: `vo_sig_full`.
6. **Sever:**
   - The theme **pauses** and the screen darkens to 45 % black while the world starts shaking.
   - Voice: 「断て。」 (`vo_sig_short`).
   - **One tapered blade of light** is drawn edge to edge in 130 ms, *behind* him. It lies on the rift painted in
     `sever-landscape.png`; see §3.
   - Impact flash. The threads snap where the cut crosses them. The charred castle **splits into two halves**
     (`clip-path` on each side of the line), which slide apart, showing a violet star-field void with glowing red edges.
   - Red cracks tear outward from both rift edges. Debris rises. A tremor holds until the flash.
7. **White flash → Sever painting.** Hard swap under the flash, so the live cut continues as the painted slash.
   The painting pushes in slowly (scale 1 → 1.035). The theme resumes. Hold for 2.8 s.
8. **Dip to black → throne painting → name card.**

## 2. Rules the demo enforces, and so must the game
- **One full-screen image at a time.** The castle (whole or split) must **never** show through a half-faded
  Sever or throne painting.
  - Painting changes happen under a full-white or full-black flash.
  - Codex's first draft cross-faded the paintings over the castle; that was Jay's "overlapping illustration" complaint.
  - `verify-demo.cjs` now checks for this. Keep an equivalent check in your tests or playback.
- Only one character cutout is visible at a time.
- Voice lines always finish before the next spoken beat. Replay and Skip cancel everything: audio, streams,
  animation frames, and the Jirasd tremble (`translate`).
- **Do not port** the demo's `visibilitychange` handler, which sends the page back to the start screen when the tab
  is hidden. The game's playback lifecycle handles that instead.
- **The lightning crackle is synthesized with WebAudio** (`crackle()` in the demo); there is no audio file.
  - Create or resume the `AudioContext` from the Wish click. It must follow the sound button (on / low / muted).

## 3. Measured coordinates: keep them correct if you resize art
- `RIFT = [[200, 590], [1100, 40]]` is the slash's centreline in **`sever-landscape.png` pixels (1672 × 941)**.
  - `artPoint()` maps it through the element's `object-fit: cover` and computed `object-position`.
  - Desktop framing is 64 % 45 %; phone framing is 65 % 25%.
  - **If you resize or recompress that painting, scale RIFT by `naturalWidth / 1672`.** Otherwise the drawn cut
    will not line up with the painted one at the flash.
- The blade glint runs hilt (285, 355) → tip (960, 1040) in **`venuzdonoa.webp` pixels (1024 × 1536)**.
  Scale it the same way if that file is resized.
- Jirasd hand position: `center(jirasd, .26)` and `handX = x − width × .055`. These are relative, so they are safe.

## 4. Data, banner and overview site
- `src/data/characters.ts`: Azrenth `grade: 'S++'`, `title: 'Crowned in black flame'`.
- **New 4th banner:** `{ featured: 'azrenth', companions: ['suvara', 'rook', 'calla'] }`.
  - Suvara is S+ and is on no banner today.
  - Rook and Calla are Claude's picks; Rook's lightning suits Jirasd. **Ask Jay if he wants other A characters.**
  - Remove Azrenth from Mahesvara's companions. **Jay is adding a new S+ character for that slot: Lucien Valmaire (`lucien`, Moonlit Lightning, art in `characters/lucien/`)**.
    Until they exist, reuse Seren as a temporary stand-in on Mahesvara's banner, and mark it `// TEMP` so it's easy to swap later.
  - Update `bannerRates.test.ts` and any other test that assumes 3 banners or unique companions.
- **Banner art:** `banners/banner_azrenth.webp` (1280 × 720, made from `final-throne.png`). Copy it to
  `public/art/banners/`.
  - His face is around 56 % 18 %. Add an `azrenth` face `viewBox` entry in `WishLineups.tsx`, measured the way the others were.
  - Make sure the wish screen layout works with 4 banners.
- **Name card:** use the same standard as the other S++ reveals: "S++ · LEGENDARY" badge, "AZRENTH", and the
  subtitle "Destruction — Crowned in black flame". The demo's badge text "S++ / DESTRUCTION" is not the game standard.
- **Overview website** (`gacha-art/website/src/characters.ts`): Azrenth `grade: 'S++'`.
- Azrenth's plain S+ reveal (`index-splus-original.html`) is retired. Don't port it.

## 5. Assets and the size budget (important)
**The current `interface/dist` is 76 MB, over the 64 MB artifact limit** (last build 2026-09-27 21:04). Fix this
in the same pass:
- `art/reveal-landscapes/*.png` (about 3.3 MB each): convert to WebP q80.
- `art/seren/*.mp4` (12.8 MB): check whether anything still uses them. If not, drop them.
- Large cutouts (`dax`, `keira`, `suvara`, `seren_face_proud`, 1.7–2.1 MB): WebP q80, longest side ≤ 1536 px.

Azrenth files come from `reveal-demos/azrenth/`. Copy only what the reveal uses:
- **Images:**
  - `castle-background.png`, `sever-landscape.png`, `final-throne.png`: WebP q80. Keep them 1672 wide, or scale RIFT (§3).
  - `jirasd-cutout.png`, `venuzdonoa.webp`: WebP q80, ≤ 1536 tall. The cutout is already in `public/art/azrenth/`.
- **Audio:**
  - Voice: `vo_reveal`, `vo_reveal_2`, `vo_sig_full`, `vo_sig_short`, `vo_jirasd`.
  - Theme: `theme.mp3` (魔王, a 60 s cut, already about 128 kbps).
  - Effects: `sfx_slash`, `sfx_shatter`.
- **Shared pull assets:** reuse the existing single copy (`crystal`, `pull_music`, `sfx_pull_*`, `sfx_tell_splusplus`).
  Don't duplicate them.
- **Not used:** `scene.webp`, `splash.webp`, `cutout.webp` (a duplicate of the existing one), `sfx_tell_splus.mp3`.

Run `npm run build` and **report the final size**. It must be under 64 MB.

## Done when
- Side by side with the demo at desktop and phone sizes, the order, timing, sound and look match.
- The castle never shows through a half-faded painting, and there is never more than one cutout.
- The drawn cut and the painted rift line up at the white flash, on desktop and on phone.
- `vo_jirasd` plays and the strike fires on its last syllable. The theme pauses at the cut and resumes on the painting.
- Azrenth is S++ in the game and the overview site. His banner is live, and the wish screen works with 4 banners.
- `npm test` passes, and `npm run build` passes at **under 64 MB**.
- The opening and nickname files are untouched (`src/screens/Opening.tsx`, `src/logic/opening.ts`, `src/logic/names.ts`).
