# Codex: Write stage at the four crystals (no pop-up window)

**From:** Jay (written up by Claude) · **Date:** 2026-10-03 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`
**State:** typecheck clean (`npx tsc --noEmit -p .`), **265 tests passing** (`npx vitest run`). Launch is **2026-10-16**.
**Online:** the game now runs on Supabase (`src/backend/supabase.ts`). Don't change the backend for this task; `backend.addFragment(sessionId, text, category)` already does everything server-side.

## What Jay wants

At the **Write** stage (`session.stage === 'fragment_drop'`), the big "What stayed with you this sprint?" window must **not** pop up any more.

Instead, players **walk to one of the four crystals on the plaza and interact with it** to write a thought. The crystal decides the category:

| Crystal | Category | Plain label | Map point (`MAP.crystals`) |
|---|---|---|---|
| `radiance` | Radiance | Keep | `at([482, 484])` |
| `fracture` | Fracture | Problem | `at([835, 655])` |
| `spark` | Spark | Try | `at([690, 268])` |
| `wildcard` | Wildcard | Anything else | `at([1025, 392])` |

The points already exist in `src/data/sanctuaryMap.ts`, and each crystal already has a solid footprint in `MAP.obstacles`. The category labels and icons are `CATEGORIES` in `src/screens.tsx:21`. Move them to a small shared module so `Scene` can use them too.

## How it works today (read these first)

- `src/screens.tsx` → `RetroScreen()`:
  - `windowOpen` starts `true` and is reset to `true` on every stage change (`useEffect(..., [session?.id, session?.stage])`). That's the pop-up.
  - The `fragment_drop` block inside `<VoyageWindow>` holds the form: category picker, textarea, submit, and the "your thoughts" list with edit/delete (`ownIds`, `editId`, `backend.deleteMyFragment`).
  - `VoyageHud` has a bottom action button (`actionLabel={brief.title}`, `onOpen={() => setWindowOpen(true)}`): the gold "Write" button.
- `src/components/Scene.tsx`:
  - **The pattern to copy** is the central beacon. `nearBeacon` (line ~60) is a distance check against `MAP.beacon` (radius `0.065`, y scaled by `MAP.aspect`). When it's true, a `<nav className="crystal-options">` panel appears with a button (line ~285). Styles: `.crystal-options` in `src/components/world.css:38`.
  - `Scene` already receives `stage` and `sessionId`.
  - Click-to-walk and WASD movement already exist; `settings.movement` can be off.

## The change

### 1. No pop-up at Write
- In `RetroScreen`, don't auto-open the window when the stage is `fragment_drop`: `setWindowOpen(session.stage !== 'fragment_drop')`. Other stages keep their current behaviour.
- Remove the category picker and textarea from the `fragment_drop` block of `VoyageWindow`.
- The HUD's bottom button becomes **"My thoughts"** at this stage. It opens the window showing only the player's own thoughts (from `ownIds`), each with Edit and Delete as today, plus one line: *"Walk to a crystal to write a thought."*

### 2. Crystal interaction (in `Scene`)
- Add `nearCrystal`: the nearest crystal within radius **0.07**, using the same distance maths as `nearBeacon`. It's only active when `stage === 'fragment_drop'` and the player has a character.
- **While the player is in range:**
  - the crystal glows (an aura `<i>` drawn at the crystal point, tinted per category; z-index just above the crystal's occluder, like `.lamp-glow`);
  - a small prompt floats above it: **"E · Write a Radiance thought"** (category name changes per crystal).
- **Opening the writer:** press **E** or **Enter**, click/tap the crystal, or click the prompt. Ignore the key while typing (same guard as the skill keys in `useSkills.tsx`).
- **The writer panel** is anchored beside the crystal and styled like `.crystal-options`, not the big window. It contains:
  - the crystal's name, label and icon as the header (e.g. "Spark · Try");
  - the textarea (same `maxLength` as today) and a **Drop it into the crystal** button;
  - a one-line note: *"Anonymous to the party."*
  - Esc or walking away closes it. Keep the draft text if they come back to the same crystal.
- **Submit** calls the existing `backend.addFragment(sessionId, text, category)`. On success:
  - a small light orb flies from the player into the crystal (about 600 ms, CSS only);
  - the crystal pulses once;
  - the toast "Your Fragment is in the constellation." shows as today.
- **Editing:** Edit in "My thoughts" opens the writer at that thought's crystal with the text filled in. It keeps the current edit flow: add the new thought, then delete the old one.
- **Live feedback for everyone:** each crystal shows a soft count glow that grows with the number of thoughts in its category (`fragments.filter(f => f.category === id).length`). It's anonymous: a count only, never who wrote what.

### 3. When walking isn't possible
- **Movement off** (`settings.movement === false`) or the player has no character: clicking or tapping a crystal opens its writer directly, with no walking needed.
- **Touch screens:** tapping a crystal walks the player to it (click-to-walk already exists), then the writer opens on arrival.
- **Keyboard only:** the four crystals are focusable buttons on the map layer (`aria-label="Write a Spark thought (Try)"`) and open the writer with Enter.

### 4. Out of scope
- Voting, the Hall, vows and the lobby stay as they are.
- No backend or SQL changes.
- Don't change the crystal art or map.

## Tests to add (write them first)
- `RetroScreen`, `fragment_drop`: the window is **not** open after the stage change, and the HUD button reads "My thoughts".
- `Scene`, `fragment_drop`: standing next to the `spark` crystal shows the prompt; pressing E opens the writer labelled "Spark"; submitting calls `addFragment(sessionId, text, 'spark')`.
- Walking more than 0.07 away closes the writer, and the draft is kept when they return.
- With `movement: false`, clicking the `fracture` crystal opens its writer directly.
- E while typing in the textarea does **not** reopen or close anything.
- At any stage other than `fragment_drop`: no crystal prompt, and E does nothing.
- The count glow uses only `fragment.category`; there's no user data in the DOM (anonymity).

Use the local backend in tests (`createLocalBackend`), as `Scene.test.tsx` and `App.test.tsx` already do.

## Done when
- `npx tsc --noEmit -p .` is clean and `npx vitest run` is green.
- Checked by hand in the dev server (`npm run dev`, port 5177):
  - Write stage: no pop-up;
  - walk to each of the four crystals, write a thought at each, and check the category in "My thoughts";
  - edit and delete one;
  - Settings → Voyage → Character movement off, then click a crystal.
- Screenshots of the crystal prompt and the writer panel, at desktop width and at phone width (375 px).
