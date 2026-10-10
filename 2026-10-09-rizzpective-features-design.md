# Rizzpective features for Lumara (1–9)

**Status:** draft for Jay's review. Nothing is built yet.
**Source:** the live Rizzpective artifact (checked 2026-10-09) and the team's Sprint 3 (Official) retro data from Oct 5.
**Goal:** Lumara gets every Rizzpective feature it is missing, in Lumara's own world and gacha-game look (not SaaS).

## Where each feature goes in the voyage

| # | Feature | Voyage stage |
|---|---|---|
| 1 | Self Check-In | Gather (lobby): every member picks a voyage companion and checks in before the voyage can start |
| 2 | Peer Feedback | Vow Altar (players' task while the Warden writes vows); still open at Homecoming |
| 3 | Speaker turns (chosen player picks a thought, discuss, Vow) | Resonance Hall |
| 4 | Full Homecoming report (+ Archives) | Homecoming, and Archives afterwards |
| 5 | Download the report as an image | Homecoming and Archives |
| 6 | Party Portrait | Homecoming (top of the report) |
| 7 | Personal recognition card | Homecoming (each player's own) |
| 8 | Lobby controls (lock party, remove player) | Gather (lobby); removing a player also works during the voyage |
| 9 | Make a Vow from a thought | Resonance Hall (a Vow box after each turn); Vow Altar review |
| 10 | Vote as picks | Starlight Vote |

Today, players have nothing to do at the Vow Altar ("Your Warden is capturing the team's action items"). In Rizzpective, feedback happens in the Guild Hall at the same moment, so feature 2 fills that gap. Self Check-In moves to the lobby: the voyage starts only when every member has chosen a companion and checked in.

---

## 1. Self Check-In

**What:** two questions, each rated 1–5. They are the same as Rizzpective's, because the team already used them.

| Question | Icon | 1 → 5 labels |
|---|---|---|
| **Sprint Satisfaction**: How satisfied are you with your overall experience this sprint? | ♥ | Rough sprint · A bit bumpy · Okay · Good run · Legendary |
| **Self Growth**: How much do you feel you learned, improved, or grew during this sprint? | ◆ | Same level · A little XP · Leveled up · Big level-up · Class evolved |

**How it works:**
- **In the lobby:**
  - Every member, the Warden included, picks a voyage companion from their collection and rates both questions 1–5.
  - Whole numbers only.
  - **Finalize** saves both and puts a ✓ by their name in the party line.
  - While the party is in the lobby, they can change their companion and their answers.
- **Start:**
  - "Enter the Sanctuary" stays disabled until every member has a ✓.
  - The server also refuses to leave the lobby until then.
  - If someone is away, the Warden removes them from the party.
- **Lock:** when the voyage starts:
  - check-ins and companions lock;
  - nobody new can join;
  - members who get disconnected can still reconnect;
  - a player removed during the voyage can't rejoin it.
  - "Return to lobby" unlocks editing and joining again.

**Who sees what:**
- **The player:** only their own answers.
- **Warden + admins:**
  - ✓ status in the lobby;
  - each player's answers, from Homecoming on.
- **Everyone:** the team averages, as % of 5 (e.g. "Satisfaction 90%"), plus "N of M checked in", from Homecoming on.

**Data:**
- New table `checkins`: `sessionId, userId, sat, growth`. One row per player per voyage.
- **Write:**
  - only your own row;
  - only in the lobby (stage `register`), while the voyage isn't ended;
  - only after you've picked a companion.
- **Read raw rows:**
  - your own row;
  - the Warden of that voyage and admins, once the voyage reaches Homecoming.
- **Read averages:** through `checkin_summary(sessionId)`. It returns `null` before Homecoming.
- **Server rules:**
  - `set_session` refuses to move out of `register` while any member hasn't checked in.
  - `set_my_character` refuses outside `register`.
  - `join_session` refuses newcomers outside `register`. Members already in the party may always reconnect.
- **`types.ts`:**
  - Type: `CheckIn`.
  - Backend calls: `saveMyCheckIn`, `myCheckIn`, `checkInSummary`, `watchCheckIns` (Warden/admin, from Homecoming).
- **Attendance:** gets `checkinDone`, which shows the ✓.

**Done when:**
- In the lobby, a member can pick a companion, check in, and change both. After the start, they can't.
- The voyage can't start, through the app or the API, until everyone has checked in.
- The averages are correct.
- Players never see anyone else's answers. The Warden and admins see them only from Homecoming.
- After the start:
  - newcomers and removed players are refused;
  - reconnects work;
  - "Return to lobby" reopens both.

## 2. Peer Feedback

**What:** each player rates every other party member 1–5 stars on five traits (the same as Rizzpective's). No comments. Nobody rates themselves.

| Trait | Measures | Hint |
|---|---|---|
| 🤝 Party Spirit | Collaboration & camaraderie | Great to team up with |
| 🛡 Dependable | Ownership & reliability | Owns it and follows through |
| 💬 Clear Comms | Communication & constructive candor | Shares openly, kindly and honestly |
| ⚔️ Impact | Contribution & excellence | Brings quality work to the quest |
| 🌱 Levels Up | Growth & forward thinking | Learns, improves and looks ahead |

**How it works:**
- The panel shows party members as character chips (their companion art).
- Pick one, rate all 5, then "Save & next ally". Rated chips get a ✓.
- Ratings can be changed until the voyage ends.

**Who sees what:**
- **A player:** only their own results, as % of 5 per trait plus the number of raters.
- **Warden + admins:** everyone's results.
- **Nobody:** who gave which rating. The app never stores the rater next to the rating.

**Data** (same pattern as `fragments` / `fragment_authors`):
- **`peer_ratings`:** `id, sessionId, targetId, scores { collab, owner, comm, impact, growth }`.
  - No rater is stored.
  - Nobody reads the rows directly. Results come only through `peer_summary(sessionId)`, which returns per-target averages filtered by who is asking.
- **`peer_rating_owners`:** `ratingId, userId, sessionId, targetId`.
  - Readable only by that user, so they can see and edit their own ratings.
  - Unique `(userId, sessionId, targetId)`: one rating per teammate.
- **Server checks:**
  - The target is in that voyage's attendance.
  - The target is not yourself.
  - Every score is a whole number 1–5.
  - The stage is Vow Altar or Homecoming.
- **Attendance:** gets `peerDone`.
- **Finish warning:** when the Warden finishes the voyage, a warning says how many players haven't finished peer feedback. They can still finish.

**Done when:**
- Ratings save and can be edited.
- Self-rating is impossible.
- Averages are correct.
- A player can't see another player's results, and nobody can link a rating to its rater through the app or the API.

## 3. Speaker turns (Resonance Hall)

*Revised 2026-10-10.* Discuss is a loop of turns. In each turn, a chosen player brings one of the thoughts they picked, the party discusses it, and the Warden turns it into a Vow.

**One turn:**
1. **Spin:**
   - The Warden spins. The same roulette reel of companion portraits plays on every screen at the same moment.
   - It lands on a party member who hasn't had a turn yet. Skipped players are never picked.
   - The chosen player's companion walks to the beacon and gets a spotlight. Their own screen shows "Your turn".
2. **Choose:**
   - The chosen player sees **their own picks** from the Vote stage that haven't been discussed yet, with **no pick counts and no ranking**, and chooses one.
   - If none of their picks are left, or they picked nothing, they choose from any thought not yet discussed.
   - Everyone else sees "Ana is choosing a thought…", then the chosen thought appears for everyone.
3. **Discuss:** the party talks. The Warden's 3-minute timer is still available. The Warden presses **Done discussing**.
4. **Vow:**
   - A Vow box opens automatically for the Warden, pre-filled with the thought.
   - The Warden edits it, picks an owner, then **Make Vow** or **Skip**.
   - Players see "The Warden is writing a Vow…", then the Vow.
5. **Next turn:** the player counts as spoken, the thought counts as discussed, and the Warden can spin again.

**Tracker and Warden controls:**
- "Spoken N · Remaining M", with each player's mark (speaking, spoken, waiting, skipped).
- **Spin again** re-rolls while a player is still choosing.
- **Skip** takes an absent player out of the pool, and **Add back** returns them.
- When everyone has spoken, or whenever the Warden decides, **Next stage** goes to the Vow Altar.
- **One turn each:** everyone gets one turn per voyage (open point D).
- This replaces the Hall's old "Reveal next thought" controls.

**Privacy:**
- Choosing reveals that the chosen player picked that thought. The Vote board says so up front (feature 10).
- Thought authors stay anonymous, as always.

**Data:**
- `Session.speaker` becomes `{ currentId, spoken[], skipped[], thoughtId, phase: 'choosing' | 'discussing' | 'vow' | null, discussed[] }`.
- **The Warden** writes it through `set_session`, as before: spin, Done discussing, Make Vow/Skip.
- **The chosen player** sets only their thought, through a new server function `choose_turn_thought(sessionId, fragmentId)`. It checks that:
  - it's that player's turn;
  - the phase is "choosing";
  - the thought belongs to this voyage and hasn't been discussed;
  - it's one of the caller's picks, unless none of their picks are left.
- A cue topic `speaker` carries the spin, so every screen plays the same reel.

**Done when:**
- Everyone sees the same speaker and the same chosen thought.
- Nobody is picked twice, and skipped players are never picked.
- A player can only choose from their own undiscussed picks, with the fallback when none are left.
- Every turn ends at the Vow box.

## 4. Full Homecoming report (+ Archives)

**What:** Homecoming becomes a real mission report, not just three counts. It also removes the unfinished line "Reward totals will be connected with the game logic."

**Sections, in order:**
1. **Party Portrait** (feature 6).
2. **Numbers:**
   - Thoughts shared, votes cast and Vows made.
   - Vows fulfilled at the Sanctuary Gate ("N promises kept").
   - Each player's **real Starlight earned this voyage**, computed by `logic/index.ts`.
3. **Team check-in:** Satisfaction % and Growth %, plus N/M checked in.
4. **Your peer feedback:** private, per trait, as %. The Warden and admins see every player's.
5. **All thoughts by category** (Radiance / Fracture / Spark / Wildcard), with their vote counts and the most-voted first. Still anonymous.
6. **Vows to carry:** owner (or "Shared by the team").

**Archives:** a past voyage shows sections 2–6 too, not only its vows. Each player still sees only their own peer result.

**Done when:** Homecoming and Archives show the same content, with the same privacy rules as features 1 and 2.

## 5. Download the report as an image

**What:**
- A "Save voyage record" button on Homecoming and in Archives.
- It draws the report onto a canvas and downloads a PNG named `Lumara-<sprint>-<date>.png`.

**Rules:**
- The image shows exactly what that viewer can see on screen. A player's image has only their own peer result.
- It's a normal browser download (GitHub Pages), so no artifact download feature is needed.

**Done when:** the downloaded image matches the screen for both a player and the Warden.

## 6. Party Portrait

**What:**
- A group picture of everyone in the voyage.
- Each player's companion for this voyage (`attendance.characterId`) stands together on the Sanctuary plaza, with nicknames under them. It uses the existing cutouts and chibis.
- The Warden is included.
- The layout adapts to party size: 1–5 in one row, 6–10 in two rows, more in a smaller grid.

**Where:** top of Homecoming, in Archives, and in the downloaded image.

**Done when:** it looks right with 1, 4 and 8 players on desktop and on a phone.

## 7. Personal recognition card

**What:** each player gets their own end card:
- their companion's art;
- their nickname;
- the sprint name;
- a recognition line spoken by that companion;
- the Starlight they earned.

The card can be saved as an image (same mechanism as feature 5).

**Anonymity:** it never shows how many thoughts or votes that player gave. Those stay anonymous.

**Content needed:**
- One recognition line per character, in that character's voice.
- Claude drafts the lines and Jay approves them.
- Where a character already has a fitting voiced line, it plays when the card opens.

**Done when:** every pullable character has a line, and the card opens for each player at Homecoming.

## 8. Lobby controls

**What the Warden can do:**
- **Lock party / Unlock party:**
  - While locked, nobody new can join. This overrides the "late joiners pull on arrival" rule.
  - It's used in Gather. Once the voyage starts, joining closes for everyone anyway (feature 1).
- **Remove a player:**
  - Takes them out of the party: attendance, speaker pool and peer feedback targets.
  - Their thoughts and votes stay, because they are anonymous.
  - They can rejoin unless the party is locked.

**Data:**
- New `Session` field `partyLocked`. The `join()` server function rejects joins while it is on.
- The Warden of that voyage may delete attendance rows.

**Invite code:** Lumara's "invite code" is only the first 8 characters of the session id, and nothing checks it. Any signed-in player can join the active voyage. So Rizzpective's "new invite / revoke invite" has nothing to replace, and is left out unless codes become required (open point E).

**Done when:**
- A locked party refuses new joins, both through the app and through the API.
- A removed player disappears from every list and pool.

## 9. Make a Vow from a thought

*Revised 2026-10-10.*

**What:**
- **During Discuss:** every turn ends in a Vow box pre-filled with the discussed thought (feature 3).
- **At the Vow Altar (now a review):**
  - The Warden sees every Vow made this voyage and can edit it, re-assign it, or add one.
  - The thoughts nobody chose to discuss are listed, each with a **Make a Vow** button that fills the Vow box. They're not ranked by votes.
  - Typing a Vow from scratch still works.
- Players do peer feedback here (feature 2).

**Data:** none; this is UI only.

**Done when:**
- Each turn's Vow box is pre-filled.
- The Vow Altar lists the Vows made this voyage and only the undiscussed thoughts.

---

## 10. Vote as picks

*Added 2026-10-10.*

**What:** voting becomes picking the thoughts you want to discuss.
- One pick per thought; there's no upper limit and no stacking.
- Each player should pick **at least 3** (or every thought, if fewer than 3 were written).

**How it works:**
- Each card has a **Pick / Picked ✓** toggle. The header shows "You picked N · pick at least 3", with three pips that fill.
- Copy: "Pick the thoughts you want to talk about. Your picks stay private until you're chosen to speak. Then you choose one to discuss."
- **Next stage** with anyone under the minimum warns the Warden, e.g. "2 players picked fewer than 3 thoughts", with **Keep voting** / **Continue anyway**.
- **Starlight:** each pick pays the "per vote" amount (50 by default), with no cap. The admin setting is renamed "Each thought picked".
- Companion and Seren lines that mention "three votes" no longer play at the Vote stage.
- Lobby briefing: "Pick at least 3 thoughts you want to discuss."

**Data:**
- `cast_vote` loses the 3-vote limit and refuses a second pick of the same thought.
- Picks stay anonymous rows, as today (`votes` / `vote_owners`).
- `votes_cast` counts picks.

**Done when:**
- A player can pick any number of thoughts, once each, and un-pick them.
- The Warden is warned about anyone under the minimum.
- Starlight counts every pick.

---

## Open points (a default is chosen for each; Jay can change it)

- **A. Individual check-ins:** the Warden and admins see each player's answers, from Homecoming on. The alternative is averages only, for everyone.
- **B. Starlight for feedback:** default is no extra Starlight for check-in or peer feedback. A small reward would get more people to finish.
- **C. Small parties:** with 2–3 raters, a player can sometimes guess who rated what. Default: show results anyway, as Rizzpective does.
- **D. Speaker pool:** one turn per player per voyage; each turn covers one thought the player picked (feature 3).
- **E. Invite codes:** default is to keep today's open join, plus the lock (feature 8). Real codes would add "new code / revoke".

## Build order and launch risk

1. Fit the new tables (`checkins`, `peer_ratings`, `peer_rating_owners`) and the session fields (`speaker`, `partyLocked`) into the online-play schema (`2026-10-03-online-play-plan.md` Task 2), so the database is set up once.
2. Build features **9, then 8**: small, UI and rules only.
3. Build features **1, then 2**: data, privacy rules, panels.
4. Build feature **3**: speaker turns.
5. Build features **4 and 6**: Homecoming report and Party Portrait.
6. Build features **5 and 7**: image download and recognition card. These can slip past launch if time runs out.

**Status (2026-10-10):**
- Features 9, 8 and 1 are live.
- Next: feature 10 together with the revised features 3 and 9 (they share the Vote → Discuss → Vow flow).
- Then features 2, 4 + 6, and 5 + 7.

**Risk:** launch is 2026-10-16 with the dry run on Oct 14, and online play itself is the top launch risk. If time is short, features 1, 2, 3, 4, 8 and 9 come first, because they are what the team uses during a retro.
