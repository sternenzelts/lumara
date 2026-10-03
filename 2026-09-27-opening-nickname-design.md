# First-time opening + nickname — design

**Owner:** Jay Diaz · **Built by:** Claude · **Date:** 2026-09-27 · **Project:** `gacha-art\interface`
**Status:** flow approved in chat (part 1); this spec adds part 2 (data, names, tests).

## Goal
A new player gets a Wuthering Waves-style opening: Seren welcomes them, they choose a nickname, and a short
story shows what beacons are. Returning players never see it again. Done when:
- a new player cannot reach the Sanctuary without a nickname;
- Seren's voice plays from the first tap (voice is on by default; the mute button still works);
- the nickname appears everywhere a player's name appears, with the account name beneath where there is room;
- it all works in the local demo (`?player=ana` = a second new player).

**Constraints:** only already-recorded Seren lines · no Seren intro video · Kenka stays title-only and is not
touched · game UI, not website UI · no new artwork.

## 1. Flow (approved)

**Title (`#title`, everyone):** logo, Seren, bubble "Whenever you're ready." Button: **Begin** (no nickname)
or **Enter Lumara** (has one). The tap is the browser's audio unlock. Top-left seal loses "Welcome, Warden".

**New player → `#welcome`** (full-screen map, Seren cutout right, dialogue box with face portrait, typed text,
tap/Next to advance):

| # | Beat | Voice (existing file) | Face |
|---|---|---|---|
| 1 | Seren glows in | `welcome_first` | happy |
| 2 | Nickname panel — pre-filled with account first name, "Signed in as {account name}" beneath | — | — |
| 3 | Confirm → "Nice to meet you, {nickname}!" | `nickname_set` | excited |
| 4 | Scene 1 — camera pans the map; the 12 beacons go dark one by one | `intro_1` | thinking |
| 5 | Scene 2 — glide to Aurelis, warm glow | `intro_2` | happy |
| 6 | Scene 3 — one beacon relights with rays | `intro_3` | proud |
| 7 | → Sanctuary | `arrive_sanctuary` | happy |

Skip appears from beat 4 only. Skipping counts as having seen the story.

**Late joiner** (new player who opened a `#retro` link, or who arrives while a retro is in progress): beats 1–3
only, then on to the retro (joining it). Beats 4–6 play the first time they later reach the Sanctuary.

**Returning player:** Enter Lumara → Sanctuary, Seren says `welcome_back_1|2|3` (random) instead of
`arrive_sanctuary`.

## 2. Data

`Player` gains two fields (existing records without them read as `null` / `false`):
- `nickname: string | null`
- `introSeen: boolean`

`Backend` gains two methods (caller's own record only):
- `setMyNickname(nickname)` — trims, collapses inner whitespace, strips control characters; must be 1–16
  characters after cleaning, else throws "Choose a name between 1 and 16 characters." Duplicate names are
  allowed (4–8 teammates; account name disambiguates).
- `markIntroSeen()`

`Me` is unchanged (it stays the account identity). The local demo implements both; the future artifact adapter
must too (noted in `types.ts`).

**Gate:** once `me` and `player` have loaded, if `player?.nickname` is empty and the route is not `title` or
`welcome`, the app redirects to `#welcome` (remembering where the player was headed). Nothing redirects before
the player record has loaded, so returning players never flash the opening.

## 3. Names on screen

One helper in the UI context: `displayName(userId)` → that player's nickname, else the account name from
`profiles`, else "Teammate". Nicknames come from the live `players` watch, so a rename shows for everyone at once.
Replace the ~12 direct uses of `me.name` / `profiles[id]?.name` (HUD, Seren's bubbles, party list, Warden
label, Vow owners, Scene labels, help text). The HUD shows the account name beneath the nickname.

**Rename later:** tapping your name in the Sanctuary HUD opens the same nickname panel (no story).

**Label fix:** "Warden settings" → "Admin settings". "Warden" under the HUD name only shows during a retro,
for that retro's Warden.

## 4. Audio

- Voice defaults **on** (only an explicit mute is remembered).
- Copy the needed existing clips into `public/art/seren/voice/ja/`: `welcome_first`, `nickname_set`,
  `intro_1–3`, `welcome_back_1–3` (+ the 4 already there). Copy face portraits `happy`, `excited`, `thinking`
  (+ `proud` already there). About +1 MB; build is 53 MB of the 64 MB artifact limit.
- One clip at a time; a new beat stops the previous clip. Hidden tab pauses. Missing/blocked audio never
  blocks the flow — text always shows.

## 5. Files

- **New:** `src/screens/Opening.tsx`, `src/screens/opening.css`, `src/screens/Opening.test.tsx`,
  `src/components/NicknamePanel.tsx`.
- **Changed:** `backend/types.ts`, `backend/local.ts` (+ tests), `App.tsx` (route `welcome`, gate,
  `displayName`), `GameShell.tsx` (title button, labels, welcome-back voice, voice default, rename),
  `screens.tsx` (use `displayName`, "Admin settings"), `Scene.tsx`.

## 6. Tests

- Backend: nickname cleaning and 1–16 rule; stored per player; `markIntroSeen`; old records without the fields.
- Opening: beat order; cannot pass beat 2 without a valid name; Skip hidden before beat 4; late-joiner path
  stops after beat 3 and returns to the retro; story plays later in the Sanctuary for a late joiner.
- Gate: new player redirected to `#welcome`; returning player never redirected; no redirect before load.
- `displayName`: nickname beats account name; falls back correctly.
- Browser check at 1440 and 375 px: full new-player run, late-joiner run, returning run, voice on first tap,
  rename from the HUD.

## Out of scope
New Seren lines (text or voice) · the intro video · per-teammate name clips · artifact adapter itself.
