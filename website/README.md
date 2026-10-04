# Lumara overview website

Standalone promotional overview, separate from the preserved game interface at `../interface`.

Run `npm install`, then `npm run dev`. Build with `npm run build`; static output is `dist/` and uses relative paths. To preview the production build, use `npm run preview`. This site has no backend or account requirements.

The latest `../CODEX-BRIEF.md` supplies all thirteen characters and confirms Seren as mascot. Data is in `src/characters.ts`. Kairo uses his supplied splash and cutout. Original source artwork remains untouched in `../characters/`.

The site includes world artwork, a character showcase with grade filters, keyboard-accessible voyage steps and fullscreen artwork viewers. Ambient camera drift, mascot breathing, particles and pointer parallax run in the browser. Pause motion or use the system reduced-motion setting to disable them. This is not a generated video or an actual 3D environment.

The character overview at `#character-overview` presents all thirteen introductions with artwork, grade and element. Its profile links select a companion in the showcase, clear any grade filter, and move keyboard focus to that character's heading. The overview remains complete while the showcase is filtered.

The selected S++ companion cycles between two supplied cutouts every three seconds: Mahesvara's original/awakened forms, Ayaka's clean throne/time-stop poses, and Keira's standing/floating poses. The corresponding splash backgrounds crossfade with the cutouts over 500ms. Form buttons select a pose and pause rotation; the adjacent play button resumes it. Rotation waits for artwork to decode and stops offscreen, in hidden tabs, while an artwork dialog is open, or when ambient motion/reduced-motion settings disable it. Selecting another companion resets to their first form. Calla uses her new transparent cutout without autoplay.

The artwork viewer remains manually controlled and includes the selected companion's splash versions. Additional viewer artwork is configured through `extraArt`; showcase cutouts and paired backgrounds use `forms` in the roster data. Opening a viewer starts from the main splash.

## Entry trailer

On a fresh visit, **Tap to enter** opens **Watch the trailer?** with **Watch trailer** and **Skip trailer**. Watching starts the reviewed 90-second Lumara/ANIMA trailer with sound, inline native playback controls, and a visible skip action. Finishing, skipping, or pressing Escape continues into the website. Entry is remembered for the browser-tab session, so reloading after entry goes straight to Lumara.

The video is mounted without a source and uses `preload="none"`; its source is assigned only when Watch is pressed. Background Kenka stays paused throughout the welcome screen, invitation, and trailer, then follows the existing entry music behavior. If playback is blocked or fails, native controls, retry, and skip remain available. The native modal keeps the website behind it inert. Closing pauses the video, cancels pending playback, and restores page scrolling and focus. Reduced motion removes the exit delay.

`public/video/lumara-anima-trailer.mp4` is the full-quality reviewed master, byte-for-byte (`../trailer/output/lumara-anima-trailer-v4-reviewed.mp4`, 177 MB, 1920 x 1080, 30 fps, ~15.5 Mbps, H.264/AAC with faststart). It is stored in **Git LFS** (over GitHub's 100 MB file limit); the Pages workflow checks out with `lfs: true`, and `npm run build` exempts it from the size limits but fails if it is still an LFS pointer. Its poster and source notes are in the same folder.

Verification: the final production build passed TypeScript and static asset checks (232 files, 62.27 MiB). `node .impeccable/verify-trailer-entry.cjs` passed 108 browser checks across seven scenarios: real playback/completion, desktop and mobile skip, Escape, source-error recovery, blocked-play recovery, and session reload. Desktop 1440 x 900 and mobile 390 x 844 screenshots were reviewed. Results are in `.impeccable/review/trailer-entry-checks.json`; these are local Chrome checks with mobile/touch emulation.

Only optional Google Fonts load externally; all artwork and bundled JavaScript are local. All shipping rasters include provenance, and `npm run build` checks static output limits.

Background music uses the user-supplied Kenka MP3 in `public/audio/kenka.mp3`. The fixed lower-right control starts playback only after a click, loops at 25% volume, and mutes by pausing while preserving position for resume. Hidden tabs pause playback; returning requires pressing play. Load failures offer retry. Audio is independent of motion settings and is not preloaded. Source attribution is in `public/audio/SOURCE.md`.

## Current overview refresh (2026-09-27)

The world story now follows the Dimming, four nations around Aurelis, and twelve beacons restored through fulfilled vows. The interactive atlas reads `src/map-regions.json` (copied from `../world/map-regions.json`); its five region controls select scenery and companion links. Beacon lighting is labeled as an illustrated preview, not live player progress.

The S++ campaign at `#legends` presents the original 1672 x 941 Mahesvara, Keira, and Ayaka landscape PNGs. Selection is manual with keyboard-accessible controls. An interrupted selection cancels its previous voice. The short artwork reveal uses a light sweep and clipping; existing motion pause and reduced-motion controls apply. Landscape originals are also available in each character's artwork viewer.

`CharacterVoice.tsx` provides click-only Japanese voice playback with supplied English subtitles for Mahesvara, Keira, Ayaka, and Seren. Each click cycles to another recorded line; only one voice plays at a time. Stop, character changes, hidden tabs, and unmount cancel playback. Background Kenka ducks from 25% to 5% during speech and returns to 25% afterward. Missing recordings are explicitly disabled; no synthetic voices are invented. Add new clips through `src/voice-lines.json` and `public/audio/voices/<character>/`.

Seren's happy/thinking/proud portraits accompany the voyage steps; her chibi joins the follow-through explanation. No Seren video is used. Face-framed companion selectors and overview portraits are drawn from original cutouts using `CompanionPortrait.tsx`; all thirteen characters remain available with grade filters and region names.

Verification: `.impeccable/verify-refresh.cjs` checks desktop/mobile overflow, map navigation, real voice playback/cycling/cancellation, music ducking, unavailable voices, fullscreen artwork, reduced motion, and loaded images. Screenshots and results are under `.impeccable/review/refresh-*`.
