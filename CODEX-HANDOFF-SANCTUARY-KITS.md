# Codex: handoff for Sanctuary skills, walking chibis and voices, plus the plan from here

**From:** Jay (written up by Claude) · **Date:** 2026-10-03 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`
**State:** typecheck clean (`npx tsc --noEmit -p .`), **227 tests passing** (`npx vitest run`). Launch is **2026-10-16**.

Since the last handoff Claude built the **in-world Sanctuary layer**:
- every character walks as a chibi sprite;
- all S++ and S+ characters have skill kits;
- characters talk in Japanese voice with English speech bubbles.

This doc covers what exists, how it's wired, the rules Jay set, and **the plan for what's next**.

---

## 1. What exists now

### 1.1 Walking chibis: every character
- Each character has a walk sheet at `public/art/<id>/<id>_chibi_walk*.webp`.
  - Layout: 4 rows × 4 frames, 256 px cells. Rows are down, right, up, left.
  - It's registered in `src/data/art.ts` as `walk:` with `walkFrames: 4`.
- **Exception: Keira floats** (`kit.floats`) and has no walk sheet.
- Suvara's file is `suvara_chibi_walk_v4.webp`. It was renamed to bust the browser cache.
- **Pause motion** stills the scenery only. Walking keeps animating (`world.css`).

### 1.2 Skill kits (`src/data/kits.ts`)

**S++ characters: 4 skills each.** Every ultimate is deliberately unique.

| Character | Skill 1 | Skill 2 | Skill 3 | Skill 4 (ultimate) |
|---|---|---|---|---|
| **Mahesvara** | Disassemble | Nullify | Change Form | Return to Dust, true form only |
| **Keira** | Pixel Blink | Blaze Code | Combine | Guardian Protocol, dive |
| **Azrenth** | Eyes of Ruin | Black Sun | Summon Venuzdonoa | Sever cinematic |
| **Ayaka** | Deceleration Zone | Frost Cadenza | Niflheim | Chrono Stasis |

- **Ayaka's kit:**
  - Deceleration Zone slows other players.
  - Frost Cadenza stuns its target for 1 s.
  - Chrono Stasis freezes everyone else for 3 s.
  - Her idle pose shows her on her throne.
- **Azrenth's counter:** with Venuzdonoa summoned, his Sever can be cast while time is stopped, and it **cuts Chrono Stasis for everyone**.

**S+ characters: 3 skills each.** The ultimate is on key 3, is local rather than full-screen, has a 60 s cooldown, and there's no body aura.

| Character | Skill 1 | Skill 2 | Skill 3 (ultimate) |
|---|---|---|---|
| **Suvara** | Crescent Horizon | Lantern Ascent: nearby players glow | Yulan, Soar: rides her dragon to the cursor |
| **Ashvane** | Dragon Fang: dash | Falling Blossom: leaf ring | Skyfall: leap and slam |
| **Lucien** | Rampart of Stone: a wall that **blocks walking** for 4 s | Lunar Aegis: those inside are **immune** to Ayaka's slow and ice stun | Thunder Sovereign: lightning teleport |
| **Seren** | Dawn Slash | Guiding Light: **+30% speed** and cancels slows | Dawnbreak: **blinds the whole screen white**, portalled to `document.body` |

**A characters (Wren, Rook, Calla, Kairo, Dax, Sollene)** have **no skills**, by Jay's decision: they walk and talk only.

### 1.3 How skills work
- **`components/useSkills.tsx`:**
  - Every cast becomes a `'skill'` cue that **every tab applies**, the caster's own tab included.
  - It handles cooldowns, screen shake and `navigator.vibrate`.
  - Map effects are kept in a separate **`field`** list (`FieldFx[]`) so a second cast doesn't overwrite the first.
- **`logic/fieldEffects.ts`** holds the pure, tested rules:
  - `slowFactor`, `isHeld`, `canCastWhileHeld`, `cutStasis`;
  - `pickCadenzaTarget`, `soarTarget` (generic "toward cursor, capped to range");
  - `wallBlocks`, `inAegis`, `inLantern`;
  - the per-skill constants (`DECEL`, `CADENZA`, `STASIS`, `SOAR`, `SKYFALL`, `WALL`, `AEGIS`, `THUNDER`, `GUIDE`, `DAWN`).
- **`components/FieldLayer.tsx`** draws map-anchored effects.
  - `SkyLayer` is a second camera-following layer **above the haze**, used for Yulan.
  - `StasisOverlay` draws the time stop.
- **`components/Scene.tsx`** does the aiming. `aim(skill)` adds the caster position, the target and the landing spot.
  - The movement loop respects `isHeld`, `slowFactor` and `wallBlocks`.
  - A held player keeps their gather target.
- **Kit fields to know:**
  - `poseCell {aspect, width, frames}` must match the pose sheet. A 3-pose sheet needs `frames: 3`, or poses render as half of one plus half of the next.
  - `field {kind, ms}`.
  - `poseAtMs`.
  - `syncMs`: the effect waits so it lands on the spoken skill name.
  - `counters: 'stasis'`.
  - `ultCinematic.kind`.
- **CSS:** all effects are in `components/skills.css`.
  - Every animation **must** have a `.game-still … {animation-play-state:running!important}` exemption, or Pause motion freezes it.
  - `.skill-fx` has `height:0`, so effect elements need an explicit height.

### 1.4 Talking
- **`data/voiceLines.ts`** is **generated**; don't hand-edit it.
  - It's built by `characters/_tools/build_voice_lines.py` from each `characters/<id>/voice-script.md`.
  - Clips are copied to `public/art/<id>/voice/<lineId>.mp3`.
- **`logic/chatter.ts`** (tested) holds the rules:
  - the random pool is greet, tap lines, idle and quirk lines, plus `see_<name>` when that character is present;
  - pacing is party size × 30–60 s, so the plaza hears roughly one line per 30–60 s;
  - `eventSpeaker` picks one party member per retro moment.
- **`components/useChatter.tsx`:**
  - lines go out as a `'say'` cue; **everyone sees and hears every character**;
  - clicking a character makes them talk instead of walking you there;
  - skill casts show their English bubble.
- **Voiced so far:** 7 S/S++/S+ characters with 30 lines each, Seren with 44, and the 6 A characters with 8 each.
  - The A characters share one voice (ElevenLabs "Rose"), split from `characters/A_voices_take.mp3`.
  - Every clip was checked by transcription.

### 1.5 Pull reveal fix
- `components/reveal/ayaka-runtime.js` is the generic reveal for characters without their own animation.
- **Bug fixed:** the standard pull's silhouette fade-out was held at its end state and hid the character at the end. It's now cancelled before the final show.
- **Skip** no longer adds Ayaka's clock and snow to other characters.

### 1.6 Asset pipeline (`characters/_tools/`)
- **`chibi_sheet.py <id> <source> [pocket]`** cuts walk sheets in 3-row or 4-row layouts.
  - It uses strict white cut-out and follows each figure's outline, so long hair and hat brims aren't clipped.
  - A large `pocket` value (600–6000) keeps white clothing.
- **`defringe.py [--no-white|--pockets]`** removes the white rim and background trapped in hair loops.
- **Per-character asset scripts:** `<id>_process.py` (Ayaka, Suvara, Ashvane, Lucien, Seren, Azrenth).
  - They produce poses, icons and effects.
  - Effect strips get blended in-between frames: 4 painted frames play as 7.
- **Voice tools:**
  - `split_voice_take.py` splits one ElevenLabs take into per-line clips.
  - When lines run together, verify with `faster-whisper` word timestamps. That's how Wren had to be re-cut.

---

## 2. Rules from Jay
- It must look like a **game UI, not SaaS**.
- **No licence warnings.** It isn't a company release.
- **Each S++ ultimate is unique.** Use a distinct palette per character.
- **Clean animation matters.** Verify visually, never just in the DOM. Jay has caught:
  - transparent or oversized effects;
  - half-sliced poses;
  - non-alternating walks;
  - a cached old file.
- **Rename** an asset when replacing it, to bust the cache.
- **Keep replies short.** Don't ask Jay to test something you can check yourself.

## 3. Known gaps and risks
1. **Suvara's side walk** barely alternates in the painted frames. Jay disputes this, so don't relitigate it. Only redo it if he asks.
2. **Size:** about 16 MB of voice clips. The build was already over the 64 MB artifact limit, which is fine for GitHub Pages, but don't plan on an artifact.
3. **Idle poses** only show on your own screen, because presence doesn't sync `idle`.
4. **Glacial Finale** (Ayaka) is intentionally unused.

---

## 4. The plan (in priority order, to the 2026-10-16 launch)

### P1: Voyage flow completion (spec `2026-09-30-voyage-redesign-design.md`)
1. **Stage pop-ups (steps 2–3 of `2026-09-30-voyage-lobby-hud-plan.md`).** Give each stage a game-style pop-up window: lobby, free wish, vow review at the beacon, write at the crystals, vote at the beacon, Warden pulls, homecoming. Keep the pause and mute icons at top right.
2. **In-world triggers.** Walking to a crystal or the beacon opens that stage's window, with the button fallback kept. Positions are in `data/sanctuaryMap.ts`.
3. **Vow island.** Wire the painted map `sanctuary/painted/vow_island_source.webp` as the backdrop for writing new vows, reached through the gate.
4. **Anonymity while writing:** not built yet.

### P2: Hardening for a real session (5–8 people)
1. **Multiplayer pass:**
   - two or more real browsers on the company backend (not the local demo);
   - skill cues, field effects, the Chrono Stasis freeze and Sever cut, Lucien's wall, and chatter timing must stay in sync;
   - nothing should play twice.
2. **Performance with 8 characters:** auras, effect strips and voice. Watch for rAF stalls.
3. **Mobile/touch:**
   - with no mouse, aimed skills fall back to the facing direction (already coded);
   - check the skill bar and bubbles at phone width.

### P3: Mahesvara kit leftovers (`2026-10-01-mahesvara-kit-plan.md`)
- **Task 6:** event reactions (vow fulfilled or not yet).
- **Task 7:** fresh review.
- **Ultimate icon** still a placeholder.

### P4: Only if Jay asks
- One emote per A character (decided against for now).
- Syncing idle poses to other players.
- Redoing Suvara's side walk.

### Working agreement
- **One task per change.** Run `tsc` and `vitest` and check in the browser preview (launch config `gacha-interface`, port 5177) before reporting.
- **Faking a voyage for tests:** write `sessions` and `attendance` into localStorage `lumara.demo.v1` and open `/?player=<name>#retro`.
  - **Clear it afterwards**: an active fake session blocks starting a real retro.
- **Hidden preview pane** freezes rAF and CSS animations. Sample with `getAnimations()`, or keep the pane visible for screenshots.

---

## 5. Change on 2026-10-03: the free wish moved to Homecoming
- **The `opening_pull` stage is removed from the voyage** (`nextStage` in `logic/index.ts`). Voyages now go:
  Gather → Vow review (only if there are vows to review) → Write → Vote → Discuss → New vows → Homecoming.
- **The free wish** is a "Claim your free wish" button in the **Homecoming** window.
  - It's one claim per player per voyage. `PullRecord.sessionId` records which voyage it was claimed in.
  - The guard lives in `App.tsx`, in `pull('opening')`.
- **A player's voyage companion** is now their display character. Pulling no longer sets it.
- `opening_pull` stays in the `Stage` type so old sessions still load.

## 6. Change on 2026-10-03: vow confirmation, lamp moment and window layout (done by Claude; don't redo)
- **Vow review.** Marking a vow "Fulfilled" (the check circle or the dropdown) now asks **Confirm / Cancel** first. The code is `VowRow` in `screens.tsx`.
- **The lamp moment.** When the lit count rises (`logic/lamps.ts`, `lampToCelebrate`), every screen plays it for 2.6 s:
  - the camera eases to the next lamp;
  - a spark flies from the beacon and the lamp ignites;
  - a banner reads "A promise kept — light N of 12 restored";
  - the stage window hides meanwhile (`body.lamp-moment`).
  - Code is in `Scene.tsx` and `world.css`.
- **Layout.**
  - The skill bar always draws above stage windows (`z-index 30`).
  - On narrow or phone screens the stage window is a bottom sheet capped at 45vh, so the plaza and your character stay visible.
