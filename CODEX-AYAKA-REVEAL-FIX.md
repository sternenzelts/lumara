# Codex — fix the Ayaka reveal (it must match the demo)

**From:** Jay (written up by Claude) · **Date:** 2026-09-27 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`

`src/components/AyakaReveal.tsx` is a simplified rewrite. Jay wants **the demo** —
`C:\Users\hp\Downloads\gacha-art\reveal-demos\ayaka\index.html` — rebuilt in the game **beat for beat**:
same order, same timings, same audio behaviour. Open the demo (serve the folder: `python -m http.server`,
then `/ayaka/`) and match it. Keep what you already did right: the voice and Waltz files in `public/art/ayaka/`.

## What is wrong now
1. **No pull.** It opens straight on Ayaka. The demo starts with the standard pull (crystal falls → violet →
   gold → rainbow S++ tell with shake and sky cracks → shatter).
2. **No pull music.** "The Breath Before Arrival" must play during the pull.
3. **Waltz plays from the first second at one low volume.** It must start only when Ayaka appears, stay quiet
   under her voice, pause during Chrono Stasis, resume after, and swell at the name card.
4. **Starts muted** (`useState(true)`). Sound must be **on by default** — the "Make a wish" click already
   unlocks browser audio.
5. **Fixed timers cut her lines off.** `reveal-voice.mp3` is 6.3 s but phase 2 starts after 2.4 s and the
   effect cleanup pauses it; `reveal-stasis.mp3` (5.9 s) is cut after 2 s. Each voice beat must **wait for
   its clip to end** (with a timeout fallback of clip length + 0.3 s if audio is blocked).
6. **No name card.** The demo ends on "S++ · LEGENDARY / AYAKA / Ice · Time — The Frozen Hour".
7. **Pale wash over everything** — the demo only desaturates during the freeze itself.
8. **Only mute on/off.** The demo has a 3-level sound button: Sound / Low (30 %) / Muted, remembered locally.

## Beats and timings (copy from the demo's `play()` function)
| # | Beat | Time | Audio |
|---|---|---|---|
| 1 | Camera drops through clouds; crystal flies toward camera; caption "A Starlight crystal falls…" | 1.5 s | `sfx_pull_fall_whoosh` + **pull music starts** |
| 2 | Rarity upgrade violet → **gold**; flash, light shake | 0.9 s | — |
| 3 | **Rainbow S++ tell**: heavy shake, 7 sky cracks, caption "!!", then 1.2 s slow-motion spin-down | 0.9 s + 1.2 s | `sfx_tell_splusplus` |
| 4 | **Shatter** into ~140 rainbow particles, white flash | 0.8 s | `sfx_pull_flash_swell` (the pull music's hit lands here) |
| 5 | **Silhouette** (time-stop cutout, black with gold outline glow), hold, then burst into colour | ~2.2 s | stop the SFX |
| 6 | **Splash push-in** (`ayaka_timestop_splash_v2`) with aqua/gold motes + snow | 1.4 s in, 1.9 s hold, 0.6 s out | **pull music fades out; Waltz starts at 30 %** |
| 7 | **Throne cutout** rises; caption "“Yawn… So noisy. Was it you who woke me?”" | until voice ends | `vo_reveal` |
| 8 | Throne → **time-stop cutout**; caption "“Time, go to sleep — Chrono Stasis.”"; **gold clock** fades in | until voice ends | `vo_chrono` + `chrono_stasis` SFX together |
| 9 | **FREEZE**: every particle stops, screen desaturates, caption "Chrono Stasis", soft flash | 1.8 s | **Waltz pauses** |
| 10 | **Resume ripple**; caption "“…There. Quieter now, isn't it?”"; clock fades to 40 % | until voice ends | **Waltz resumes**; `vo_after` |
| 11 | **Name card** slides in; cutout slides aside | — | Waltz ramps to 55 %, loops |

Controls: **Sound / Low / Muted** button (top right), **Replay**, **Skip** (jumps to the name card, like the demo).
Fix the demo's one bug while porting: pressing Replay mid-reveal must cancel the running sequence
(the demo starts a second run on top and sounds double up).

## Assets
- Pull music (10 s cut, hit timed to the shatter): `C:\Users\hp\Downloads\gacha-art\sfx\pull_music_breath_before_arrival.mp3`
  → copy to `public/audio/pull_music.mp3`.
- Pull SFX: `reveal-demos/ayaka/sfx_pull_fall_whoosh.mp3`, `sfx_tell_splusplus.mp3`, `sfx_pull_flash_swell.mp3`.
- Crystal: `reveal-crystal.webp` (already copied). Voice, Waltz, Chrono SFX: already in `public/art/ayaka/`.

## Structure (so Mahesvara and others can reuse it)
- Split into a **shared standard pull** (beats 1–5: crystal, tells, shatter, silhouette, pull music) and a
  **character part** (beats 6–11 for Ayaka). The pull is the same for everyone; only the tells differ by grade
  (A stops at violet, S+ at gold, S++ goes rainbow — see `reveal-demos/seren/` for S+).
- Audio rule for every character: pull music during the pull → crossfade to the character's own theme when
  they appear.

## Done when
- Side by side with the demo, the order, timing and sound match.
- Sound plays by default; no voice line is cut off; the Waltz pauses in the freeze.
- `npm test` passes (60+), `npm run build` stays under 64 MB.
- Don't touch the opening / nickname files (`src/screens/Opening.tsx`, `src/logic/opening.ts`, `src/logic/names.ts`).

## Update 2026-09-27 — new Ayaka theme
Ayaka's theme is now **"STYX HELIX"** (MYTH & ROID), not the Waltz. Use `characters/ayaka/audio/ayaka_theme_styx_helix.mp3` (58 s cut; quiet intro, full hit at 16 s (on the name card), vocals from ~28 s) as `public/art/ayaka/reveal-theme.mp3`. Same rules: start when she appears, pause during the freeze, swell at the name card.

> **Superseded 2026-09-27:** use `CODEX-REVEALS-BRIEF.md` (covers Ayaka, Mahesvara and Keira).
