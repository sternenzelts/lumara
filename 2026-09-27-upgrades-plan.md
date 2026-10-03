# Upgrades plan — tutorial pull, real Starlight, game-style UI

**Owner:** Jay Diaz · **Planned by:** Claude · **Built by:** Codex · **Date:** 2026-09-27 · **Project:** `Downloads\gacha-art\interface`
**Status:** PLAN ONLY — nothing below is built yet. Jay reviews this first.
**Builds on:** `2026-09-27-opening-nickname-design.md` (opening + nickname, already built, 60 tests passing).

## Handoff to Codex (Jay's choice: Codex builds this after the Banner work)
- Work only in `C:\Users\hp\Downloads\gacha-art\interface`; copy to `C:\Users\hp\gacha-retro` afterwards the
  usual way (backup + hash check). Never copy gacha-retro → interface.
- **Read the current code first** — this plan was written before your Banner / `GameShell.tsx` edits; where
  they differ, follow the code as it is now and keep the intent below.
- Already in the code (don't redo): opening + nickname (`src/screens/Opening.tsx`, `src/logic/opening.ts`,
  `src/logic/names.ts`, `NicknamePanel.tsx`), `Player.nickname` / `introSeen`, route `#welcome`.
  Names on screen come from `useUI().me.name` / `profiles` (already nicknames). Seren mute key: `lumara.serenMuted`
  (`src/logic/voice.ts`).
- Test-first for Tasks 1–2 (Vitest; see `src/App.test.tsx`, `src/screens/Opening.test.tsx` for the style).
  Finish with `npm test` (60+ passing) and `npm run build` (must stay under 64 MB; now 54 MB).
- **Codex builds all three tasks** (Jay, 2026-09-27), in order 1 → 2 → 3. Task 2 needs Task 1's 200-Starlight cost.
- **Ayaka reveal:** Codex is inserting the Ayaka reveal demo (`reveal-demos/ayaka/`) into the game first, without
  logic. Task 2's tutorial wish must play through that same reveal, following the audio rule already in the demo:
  "The Breath Before Arrival" (`sfx/pull_music_breath_before_arrival.mp3`) plays on every pull, then crossfades to
  the pulled character's own theme the moment they appear (Ayaka = `characters/ayaka/audio/ayaka_theme_waltz_frozen_glass.mp3`).
  Keep the demo's sound button (on / low / muted) and the Waltz pausing during Chrono Stasis.
- The reveal's pull result must come from Task 1's real `rollPull`, not a fixed character.

## Decisions this plan carries (Jay, 2026-09-27)
- Every new player gets the **full opening + story** — no "name only, straight into the retro" shortcut, even if a retro is running.
- After the story, Seren **sends them to the Banner** for their first wish; the pulled character becomes their companion.
- Players **start with 1,200 Starlight**; **a wish costs 200** (for now). The tutorial wish costs 200 like any other.
- **UI upgrade:** buttons, panels and menus become game UI. **Background stays as-is** until the Blender Sanctuary renders exist.
- Only already-recorded Seren lines.

## Found while planning (affects the decisions above)
The game-logic file `src/logic/index.ts` is still a **placeholder** ("TEMP stub — Claude replaces"):
- `starlightBalance` always returns 1,200 — spending never lowers it, earning never raises it.
- `rollPull` gives characters in a fixed rotation — no rates, no randomness, no pity. The tutorial wish would
  always give the same character.
- `stardustBalance` always returns 1,200; `pityProgress` always 0; `revealOrder` ignores votes.
So "wish costs 200" needs Task 1 before it means anything.

---

## Task 1 — Real Starlight + real pulls (game logic)
**Files:** `src/logic/index.ts`, new `src/logic/index.test.ts`, `src/backend/local.ts` (`DEFAULT_SETTINGS`).
- `DEFAULT_SETTINGS.starlight.pullCost` 100 → **200**; add `starlight.start = 1200`.
- `starlightBalance` = start + attend × retros attended + perVote × votes cast + perVow × fulfilled Vows
  − pullCost × paid wishes (`source: 'banner'`). The free in-voyage wish (`source: 'opening'`) costs nothing.
- `rollPull` uses the admin rates (S++ 0.5 %, S+ 3 %) with pity (S+ within 30, S++ within 100), a random-number
  source that tests can fix, duplicates → Stardust.
- `stardustBalance` = duplicate rewards − exchange costs; `pityProgress` = wishes since the last S+ / S++.
- The Banner blocks a wish when Starlight < 200 ("You need 200 Starlight for a wish").
- **Tests:** balance starts at 1,200; one paid wish → 1,000; free voyage wish → unchanged; six paid wishes →
  0 and the seventh is refused; fixed-seed rolls hit each grade; pity guarantees S+ on wish 30 and S++ on 100;
  duplicate gives Stardust.

## Task 2 — Tutorial pull after the story
**Files:** `src/logic/opening.ts` (+ tests), `src/screens/Opening.tsx` (+ tests), `src/App.tsx` (+ `App.test.tsx`),
`src/screens.tsx` (BannerScreen), `src/components/PullReveal.tsx`, `public/art/seren/voice/ja/`.
- **Remove the `short` opening.** `openingKind` returns only `full` or `story`. Update the tests that expect `short`.
- **New last beat `call`:** Seren says her recorded line *"First, let's see who answers your call today!"*
  (`stage_pull`); button **Go to the Banner**. Skipping the story jumps to this beat, not past it.
- **Tutorial gate:** a player with a nickname, story seen, and **no characters owned** is sent to `#banner` from
  any game screen (title and opening excepted).
- **Banner in tutorial mode:** only **Make a wish** is active; everything else is dimmed and a soft glow points at
  the button; Seren's bubble repeats the instruction. Shows "1,200 Starlight · a wish costs 200".
- **After the reveal:** Seren reacts with her recorded grade line (`pull_a`, `pull_splus`, `pull_splusplus`, or
  `pull_seren` if they pull her); the character becomes their companion (`setMyDisplayCharacter`); they land in
  the Sanctuary. If a retro is running, the Voyage button glows with "Your party is waiting".
- Seren's `arrive_sanctuary` line ("Your companion will find you at the next voyage") no longer fits — the first
  arrival uses a `welcome_back` line instead.
- Copy the 5 recorded clips (`stage_pull`, `pull_a`, `pull_splus`, `pull_splusplus`, `pull_seren`) into the game.
- **Tests:** a new player who arrives while a retro runs gets the full opening (not the short one); Skip lands on
  `call`; `call` → Banner; the tutorial gate sends a companion-less player to the Banner and never a player who
  owns a character; only Make a wish is clickable in tutorial mode; after the pull the companion is set and the
  player is in the Sanctuary with 1,000 Starlight.

## Task 3 — Game-style buttons, panels and menus
**Files:** `src/components/game-shell.css`, `src/components/GameShell.tsx`, `src/components/ui.tsx` (shared
`Button`), `src/styles.css` (menu panels), `src/screens/opening.css`.
One shared look, applied everywhere the game uses these pieces:

| Piece | Upgrade |
|---|---|
| Panels (Voyage box, Seren box, menu panels, dialogs) | Dark translucent glass, thin gold edge, small gold corner ornaments |
| Main button | Gold bar with angled ends, inner glow, light sweep on hover, press feedback; pulses while a retro is live |
| Secondary button | Dark glass with gold outline |
| Voyage box | One large **Voyage** emblem button — compass crest, sprint name, "3 in the party" |
| Bottom menu | Gold-framed diamond emblems that glow on hover; current screen lit gold |
| Round icons | Dark glass circles with a gold ring, glow on hover |
| Starlight / Stardust | Two capsules with icon, amount and a **+** (→ Wishes / Exchange) |
| Beacons | Row of 12 lamp pips (lit / dark) + "0 / 12" (fixes the "O / 12" misread) |
| Seren's line | Speech bubble pointing at Seren with a gold name tab |
| Your name | Portrait in a gold ring, nickname, account name beneath |

- Hover, press and keyboard-focus states on every control; reduced motion respected; phone layout checked.
- Also fixes these leftover minors from the opening review that live in these files: rename box off-centre on phones, focus moved
  into dialogs, opening honours the in-game motion pause.
- **Tests:** existing suite stays green; add checks that the lamp pips show the right lit count and that the
  wallet **+** buttons navigate. Visual check at 1440 px and 375 px — **Jay reviews the look** (the browser pane
  here can't show animation reliably).

## Order and coordination
1. Task 1 → 2 → 3 (2 depends on 1's pull cost; 3 restyles the screens 2 touches).
2. **Codex** was mid-way through the Banner when its credits ran out. Task 2 edits the Banner too — either Codex
   finishes first and I build on top, or I do Task 2 and Codex continues from there. Not both at once.
3. When done, copy changed files `interface` → `C:\Users\hp\gacha-retro` the way Codex does (backup + hash check).
4. Clear my browser-test data (fake "Sprint 9 · browser check" retro, test players) before Jay's run-through.

## Waiting / separate
- **Blender Sanctuary background** — swaps in later with a one-line change.
- **Voyage redesign** (5 decisions saved: game-style Vow review, walk-to-station writing with private walking,
  no companion no voyage, free wish + pick any owned companion, demo button) — its own spec + plan.

## Rough size
Task 1 ≈ half a session · Task 2 ≈ one session · Task 3 ≈ one session. Each ends with tests + build green.
