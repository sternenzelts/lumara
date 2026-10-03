# Voyage redesign — lobby, Sanctuary, vow island

Date: 2026-09-30 · Status: agreed in chat with Jay, awaiting review of this written version
Related: `2026-09-26-gacha-retro-design.md` (main spec), Sept 27 voyage decisions (memory), Blender scene `sanctuary/sanctuary_plaza.blend`

## 1. Goal

The retro should feel like playing a game, not filling in a web form. A voyage has a **lobby** before
you enter, then happens **inside the world**: the Sanctuary plaza, and a vow island reached through
the gate. No big panels over the world; things you do happen where your character is.

## 2. Places

| Place | What it is | Art |
|---|---|---|
| **Voyage lobby** | Game-style pre-map screen: party line-up, who joined, invite code, briefing of the voyage steps. Late joiners arrive here. The Warden presses **Enter the Sanctuary**; everyone enters together. | Uses Sanctuary art as a dimmed backdrop (no new render needed) |
| **Sanctuary** | Full-screen plaza (13 lamp-stage renders, transparent sky; game draws sky + drifting clouds). | `public/art/sanctuary/sanctuary_NN_{16x9,9x16}.webp` |
| **Vow island** | Small island with altar + vow tablet, reached through the plaza gate. | `sanctuary/stages_v3/vow_island_{16x9,9x16}.webp` (not yet in game) |

## 3. Flow

| # | Step | Where | What happens |
|---|---|---|---|
| 0 | Gather | Lobby | Join, see the party, read the briefing. Warden: **Enter the Sanctuary**. |
| 1 | Free wish + companion | Sanctuary | A star falls on the plaza per person (existing pull sequence). Everyone picks a companion from any owned character (default = just pulled); that is their character for the voyage. **No companion, no voyage:** the Warden can't continue until everyone has one; the Warden may remove an absent player. Late joiners pull + pick on arrival. |
| 2 | Vow review | Central beacon | Last voyage's vows pop up one at a time. **Warden** taps **Fulfilled** / **Not yet** after the party talks. Each fulfilled vow lights the next of the 12 lamps (fixed order), Seren reacts, everyone earns Starlight. |
| 3 | Write | 4 crystals | Walk to gold Radiance (Keep), red Fracture (Problem), teal Spark (Try), violet Wildcard (Wild) to write. Several crystals allowed. **Anonymity:** while writing you see only your own character. |
| 4 | Vote | Central beacon | Fragments float around the beacon as shards; tap to place your 3 votes (stackable). Everyone visible again. |
| 5 | Discuss | Central beacon | Warden pulls one shard at a time with the gacha reveal, highest votes first; shared card in the centre for all. |
| 6 | New vows | Vow island | Party goes through the gate; Warden adds new vows at the altar (optional owner). |
| 7 | Homecoming | Sanctuary | Summary + Starlight, then back to the hub. |

## 4. Sanctuary screen (HUD)

- Full screen; no page heading, stage track or big panel.
- Top-left: **Exit voyage**. Top-right: **pause motion** and **mute Seren** (two small icons only).
- Warden only: **Back / Next** stage controls (small, bottom-right).
- A small stage label shows where the party is (e.g. "Vow review · 2 of 7"), game-style, not a stepper.
- Seren's line at each stage change says where to go.
- Style: Wuthering Waves-like game HUD (ornate thin gold frames, dark translucent glass), never SaaS cards.

## 5. Interaction

- **Walking (Jay, 2026-09-30):** characters can walk in every Sanctuary step from Free wish to Homecoming (overrides main spec 5.3a's freeze during writing/voting/discussion). Anonymity while writing still holds: during Write you see only your own character.

- **Interaction points:** beacon, 4 crystals, gate. Only points used by the current step glow.
- Walking near an active point shows its action button; on phones, tapping the point walks you there.
- **Pop-ups:** game-style framed windows over the plaza (crystal writing box in that crystal's colour; vote counter; vow card; shard reveal; vow altar form).
- **Fallback (launch safety):** every pop-up can also be opened from a button at the bottom of the screen. If walk-to-interact isn't solid by the dry run, launch with the buttons.
- Warden controls the pace; moving to the next step moves everyone (existing session sync).
- Sync uses the existing room presence/cues; nothing new to host.

## 6. Build order (target dates)

1. **Lobby + Sanctuary HUD** (panel removed, Exit, pause/mute, Warden Back/Next, stage label) — Oct 3
2. **Pop-up system** with button fallback — Oct 4
3. **All stages in pop-ups** (wish + companion, vow review, write, vote, discuss, vow altar + vow island backdrop, homecoming) — Oct 8
4. **In-world triggers** (walk to crystals/beacon, gate → vow island, lamps light on fulfilled vows, anonymous writing) — Oct 11
5. **Shared-position fix** (normalise positions to the plaza shape so laptop and phone players line up), polish, dry-run fixes — Oct 14

Walking sprites run in parallel (Oct 9 decision point; fallback chibi glide). Builder: Claude (Codex keeps
non-voyage screens; Codex brief to note GameShell/RetroScreen/voyage.css are Claude-owned).

## 7. Out of scope for launch

More islands, extra crystal effects, sparkles/sun glow on the art, per-crystal music.

## 8. Testing

- Logic (stage gating, companion rule, lamp count, vote limits, plaza positions) in vitest.
- Each step checked in the browser at laptop and phone size, two tabs (`?player=ana`) for sync.
- Dry run Oct 14 with the real team.

## 9. Big Sanctuary map with a following camera (approved by Jay 2026-09-30, not yet planned)

- **Zoom 2×:** one large Sanctuary render (3840×2160 for laptops); you see about half the plaza at a time. Phones show a narrower slice of the same map.
- **Lamps as overlays:** one lamps-off render + per-lamp lit cut-outs placed by the game (replaces the 13 full stage renders; lamp lighting can animate).
- **Camera:** follows your character, eased, clamped at map edges.
- **Shared moments:** when the Warden starts a step, every camera glides to its place and every character walks there, then free follow resumes. Free wish/Homecoming → plaza centre; Vow review/Vote/Discuss → beacon; Write → no gathering (walk to a crystal); New vows → gate, then vow island.
- **Movement:** WASD / arrows / click-or-tap to walk; positions shared in **map coordinates** (fixes laptop/phone mismatch). Walkable: floor inside the gold ring minus pillars and crystal bases.
- **HUD:** add a small minimap (plaza, you, teammates, crystals, beacon); everything else unchanged.
- Out of scope: zoom in/out, extra map areas; vow island stays a separate scene.
- Characters: **2D chibi sprites** (ChatGPT-generated sheets, `characters/_tools/chibi_sheet.py`).

## 10. S++ character kits — Mahesvara first (agreed with Jay 2026-10-01)

Cosmetic only (main spec rule): skills never change votes, discussion or anything about the person.

- **Skill bar (left edge):** one icon per skill of *your* companion, key shown (1 / 2 / 3), hover (long-press on phones) shows name + one-line description + cooldown; cooldown greys the icon with a sweep; ultimate shows "Used" until next voyage.
- **Mahesvara:**
  | Key | Skill | Pose | Voice | Effect | Cooldown |
  |---|---|---|---|---|---|
  | 1 | Disassemble | Aim (pose 1) | 分解する。 | floor ahead cracks → bursts into blue mist + glitch squares → rewinds | 10 s |
  | 2 | Nullify | Arms spread (pose 2) | 術式、無効化。 | cracked-glass hex barrier flashes + rune ring shatters outward | 15 s |
  | 3 | Return to Dust (ultimate, **transformation**) | Power pose (pose 3) → true-form chibi | 見せてやろう。これが、俺の本当の姿だ。 / 壊すも、戻すも… | screen dims, crystal flash, he becomes his **true form** (floating, wings, halo, void particles) for ~30 s, then a "restore" flash back (戻れ。) | once per voyage |
- **Aura (always):** orbiting crystal shards, mist from the coat while walking, faint magic circle underfoot.
- **Idle:** after ~8 s still → idle pose (pose 4), sometimes the 「……静かだな。」 line.
- **Event reactions:** vow fulfilled → brief Restore flash + 約束を果たしたか line; vow not yet → 次は果たせ line; chosen as companion → select line.
- **Everyone sees** skills cast by anyone (synced cue + voice for the caster's teammates; respects mute).
- Assets: `public/art/mahesvara/mahesvara_skill_{disassemble,nullify,ultimate}.webp`, `mahesvara_chibi_poses.webp` (4 × 256×360 cells: aim, nullify, power, idle). True-form chibi done: `mahesvara_chibi_trueform.webp` (319×459, head-matched). **In true form he FLIES — no walk animation** (Jay 2026-10-01): hover bob, lean toward travel, void-particle trail, shadow far below.
