# Codex — port the three S++ pull reveals into the game

**From:** Jay (written up by Claude) · **Date:** 2026-09-27 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`
**Supersedes:** `CODEX-AYAKA-REVEAL-FIX.md` (Ayaka changed a lot since — use this file).

The approved reveals are three single-file demos. Rebuild each in the game's React/TS **beat for beat**:
same order, same timings, same audio behaviour, same art. Open them to compare
(serve the folder: `python -m http.server 8765` inside `reveal-demos`, then `/ayaka/`, `/mahesvara/`, `/keira/`).

| Character | Demo | Length |
|---|---|---|
| Ayaka (S++) | `reveal-demos/ayaka/index.html` | ~40 s |
| Mahesvara (S++) | `reveal-demos/mahesvara/index.html` | ~50 s |
| Keira (S++) | `reveal-demos/keira/index.html` | ~50 s |

Each demo's `run()` / `play()` function is the script: every beat is a commented block (`// 6 · …`, `// 9a · …`).
Match those beats; don't redesign them.

## 1. Shared standard pull (all characters)
Build once, reuse for every pull: camera drop through clouds → crystal flies in → violet → gold → (S++ only)
rainbow tell with shake + 7 sky cracks + slow-mo spin → shatter into particles + flash → character silhouette
→ burst into colour. Grade decides where the tell stops (A = violet, S+ = gold, S++ = rainbow; `reveal-demos/seren/`
shows S+). Music: **"The Breath Before Arrival"** (`pull_music.mp3`, 10 s cut, hit timed to the shatter) plays
during the pull and fades out when the character appears. Clear the sky cracks and leftover pull sparkles at
the shatter / when the character scene starts.

## 2. Audio rules (every reveal)
- Pull music during the pull → **crossfade to the character's own theme the moment they appear** (theme starts ~0.3 volume).
- Every voice beat **waits for its clip to finish** (fallback timeout = clip length + 0.3 s). Never cut a line off.
- Sound is **on by default**. Icon-only sound button (top-right, round, speaker glyph): on → low (30 %) → muted,
  remembered locally. Scale every audio element through one master level (see `setV` in the demos).
- Replay must cancel the running sequence (see the `runId` / `guard` pattern in the Mahesvara and Keira demos) —
  no doubled audio.

| Character | Theme | Special rule |
|---|---|---|
| Ayaka | **STYX HELIX** (`characters/ayaka/audio/ayaka_theme_styx_helix.mp3`) | **Pauses during the Chrono Stasis freeze**, resumes after; its big hit lands on the gold clock |
| Mahesvara | "One Life Against A Million" (`characters/mahesvara/audio/mahesvara_theme_void_ascension.mp3`) | — |
| Keira | "TACTIC" (`characters/keira/audio/keira_theme_tactic.mp3`) | Has vocals from 0:06 → **ducks to 7 % under every Keira line**, back to 32 % between, 55 % at the name card |

## 3. The three character parts (summary — the demo is the authority)
**Ayaka:** time-stop splash push-in → ice throne rises with steady snowfall ("Yawn… So noisy") →
**Niflheim** ("Freeze over — Niflheim."): freezing mist wave from the throne, soft frost glow, snow vortex,
**4 ice-crystal clusters burst up** around the throne (staggered, overshoot), **ice cathedral rises from the
bottom up behind her** → **2.5 s calm hold** → Chrono Stasis (gold clock, freeze ~2 s, music paused) → "…There.
Quieter now" → name card.

**Mahesvara:** moon splash (anchored to the top so his head is never cropped) → base form on the ledge (2 lines)
→ **transformation**: base form breaks into blue mist (particles sampled from the cutout's own pixels) and the
same mist reassembles as the winged true form (no drawn halo) → "Destroy or restore…" → **nullify**: 4 runic
casting circles at the edges fire spell orbs that stop short of him on a hex barrier, drain from red/violet to
blue and are pulled into his hand while their circles crack; then one huge spell, screen briefly desaturates →
**destroy & restore** the pillar (mist out, 0.5 s hold, rewind in white light) → **heal** the wounded knight
(white light, crossfade to `knight_healed`) → name card over the mirror splash.

**Keira:** big centred silhouette with 2 heartbeat pulses → glitch-in (pink/cyan pixel blocks) + floating splash
→ she assembles from pink pixels and floats ("H-hiii!…", "I'm Keira!") → **mech summon**: mech (mirrored,
centred behind her, head visible) draws in as a hologram top-to-bottom ("Guardian, online!") → **mech blast**:
orb charges at the fist, then a radial blast **toward the camera** ("Go get 'em!") → **armour fusion**: the mech
breaks into its own image tiles that fly onto her → armoured Keira hovers with booster sparks → **finale**
("All systems unlocked! Guardian Protocol!"): she rockets up, **dives** sword-first (`keira_dive`), switches to
the **impact frame** (`keira_stab`) on contact → hit-stop + white flash → KABOOM from the sword tip (radial dome,
4 shockwaves, 14 floor cracks, flame, camera punch-in, heavy shake) → name card.

## 4. Name card + captions (all three)
Lower-left, **5 vh from the bottom** (9 vh on phones). Dark translucent panel with a gold left edge; gold
"S++ · LEGENDARY" badge on dark; name in white/tinted gradient with a dark outline + glow; subtitle white with
shadow. Voice captions at the top in a dark box with a thin gold border. Copy the "readability" CSS blocks from
the demos.

## 5. Assets — and the size budget (important)
The build is **54 MB of the 64 MB artifact limit**; the three demo folders total ~23 MB. You must not exceed 64 MB.
- **Copy only what the reveals use.** Not used any more: Mahesvara `splash_awakened.webp`, all `bg.webp`,
  Keira `mech_fist.webp` and `giant_sword.webp`. Voice/art already in `public/art/<id>/` — reuse, don't duplicate.
- **One copy** of the shared pull assets (`crystal.webp`, `pull_music.mp3`, `sfx_pull_*`, `sfx_tell_splusplus.mp3`).
- **Compress new art:** WebP quality ~80, longest side ≤ 1536 px (≤ 1280 px for full-screen backgrounds).
  **Audio:** 128 kbps MP3 for themes (they are already ≤ 60 s cuts).
- Run `npm run build` and report the final size.

## Done when
- Side by side with each demo, the order, timing, sound and look match.
- No voice line is cut off; Ayaka's theme pauses in the freeze; Keira's theme ducks under her lines.
- `npm test` passes (60+), `npm run build` passes and stays **under 64 MB**.
- Opening / nickname files untouched (`src/screens/Opening.tsx`, `src/logic/opening.ts`, `src/logic/names.ts`).
