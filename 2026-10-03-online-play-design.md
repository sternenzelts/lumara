# Lumara online: hosting, accounts and website pre-registration (Plan B)

**Date:** 2026-10-03 · **Owner:** Jay · **Launch:** 2026-10-16 · **Status:** approved by Jay on 2026-10-03 (public repo, 6,000 Starlight pre-registration reward, nickname-only sign-in)

## 1. Why
The game only runs on the **local demo backend**, which saves to one browser. A team can't play together yet.
This spec puts Lumara online so anyone with the link can register, play and join a retro together, and adds
**pre-registration** to the Lumara website before launch.

## 2. Decisions (from Jay)
- **Plan B:** a static site plus Supabase. The claude.ai artifact plan is dropped: the build has 653 files, over the 511 limit, and is 102 MB.
- **Hosting: GitHub Pages on Jay's GitHub account `sternenzelts`** (repo `lumara`). No Cloudflare.
- **Anyone can register.** There's no company-email restriction.
- **Players don't need an email.** Registration is just a **nickname** (Supabase anonymous sign-in). Linking an email or Google account to keep progress across devices is **optional**, later.
- **Pre-registration on the website**, near the bottom, with a reason to sign up now.

## 3. Shape
```
sternenzelts.github.io/lumara/        ← the website (gacha-art/website), with a pre-registration section
sternenzelts.github.io/lumara/play/   ← the game (gacha-art/interface)
        │  same origin, so one Supabase session works on both
        ▼
Supabase project "lumara": Auth (anonymous sign-in for players; email for Jay/admin) · Postgres (game data) · Realtime (live voyage)
```
- **One GitHub Pages site serves both**, deployed by a GitHub Actions workflow on every push to `main`. A build step copies the game's `dist` into `website/dist/play/`.
  - The limits are 100 MB per file and a 1 GB site. Today's build is 102 MB across 653 files, and the largest file is under 15 MB.
- Both builds use relative paths (`base: './'`), so they run under `/lumara/` and `/lumara/play/`.
- **The repo is public** (Jay, 2026-10-03), which is what free GitHub Pages needs. The code and art are visible.

## 4. Accounts (registration): nickname only, no email
- **Players:**
  1. Open the link.
  2. Press **Start**. Supabase **anonymous sign-in** creates a hidden account.
  3. Type a **nickname**.
  - There's no email, password or Google.
  - The game identity is `auth.uid()`, and the existing opening (intro, nickname, welcome wishes) runs unchanged.
- **The session lives in this browser.** Supabase keeps it signed in; there's no expiry to worry about.
  - Clearing site data or switching device or browser starts a **new** player.
  - The sign-in screen says so in one line: "Your Warden lives in this browser."
- **Optional "Save my account" (after launch, nice-to-have):** in settings, link an email (magic link) or Google to the same account.
  - Supabase `linkIdentity` / `updateUser` keeps the same user id, so nothing is lost.
  - After that, they can sign in on another device.
- **Admin (Jay):** signs in with a **real email login** on a hidden "Warden sign-in" link.
  - Jay's user id is stored in `app_admins`.
  - Admins can edit game settings, grant Starlight or Stardust, and create voyages (the current rule).
  - Anonymous accounts can never be admins.
- **Abuse guard:** anonymous sign-ins are rate-limited in Supabase (per IP).
  - Welcome wishes stay once per account. Anyone *could* farm new accounts, which is acceptable for an internal team game, and the Starlight rules are unchanged.
- **Sign out** isn't offered to anonymous players (it would lose the account). After they link an email, a sign-out appears.

## 5. Data (Postgres) and who can do what (row-level security)

The tables mirror `backend/types.ts` one to one, so the game code doesn't change.

| Table | Rows | Who can read | Who can write |
|---|---|---|---|
| `players` | userId, nickname, introSeen, displayCharacterId, owned, preregisteredAt | everyone signed in | only the player themselves |
| `pulls` | userId, characterId, grade, source, duplicate, sessionId, at | everyone signed in | only their owner (insert only) |
| `currency_grants` | userId, currency, amount, by, at | everyone signed in | admins only |
| `sessions` | id, sprintName, stage, status, wardenId, currentFragmentId, timerEndsAt | everyone signed in | create: admins; update: that session's Warden |
| `attendance` | sessionId, userId, joinedAt, votesCast, characterId | everyone signed in | only their own row |
| `fragments` | id, sessionId, text, category, createdAt, **no author** | everyone signed in | insert: anyone in the session during Write; no updates |
| `fragment_authors` | fragmentId, userId | **only that user** | only that user. This is how "my thoughts / edit / delete" works without exposing authors. |
| `votes` | id, sessionId, fragmentId, **no voter** | everyone signed in | insert during Vote |
| `vote_owners` | voteId, userId | only that user | only that user |
| `vows` | id, sessionId, text, ownerId, status, createdAt | everyone signed in | that session's Warden |
| `settings` | one row | everyone signed in | admins |

- **Anonymity:** thoughts and votes carry no author or voter. Only the writer can see their own link row.
  - Not even the Warden or an admin can see authors in the app.
  - The database owner (Jay) could in theory join the tables. Same caveat as the original spec.
- **Stage rules:** Postgres functions enforce them, so a thought can only be added in Write and a vote only in Vote.
  - This mirrors the local backend's `requireStage`.
  - The 3-vote limit is enforced server-side too (count of `vote_owners` per user per session ≤ 3).
- **Wishes:** pulls are rolled client-side, as today, then inserted.
  - Starlight is computed from data (`logic/index.ts`), so a player can't just add currency.
  - A pull spending Starlight they don't have is rejected by a check function.

## 6. Live play (Realtime)
- **Doc updates:** `watch*` calls become Supabase `postgres_changes` subscriptions, plus an initial fetch.
  - Keep the opening contract: `watchPlayer` never emits a provisional null.
- **Cues and presence:** each voyage gets a Realtime channel `voyage:<sessionId>` (the hub uses `sanctuary`).
  - `emit` and `on` use **broadcast**: skills, `say`, pull reveals, stage cues.
  - `setPresence` and `onPeers` use **presence** for map position, direction and character.
  - Positions are already throttled to about 8 per second while moving.
- **The lamp moment** needs no cue. Every client sees the vows update and celebrates the same lamps (`logic/lamps.ts`).
- **The sender gets its own cues back.** The game expects that (`useSkills` and `useChatter` apply their own cues), so broadcast uses `self: true`.

## 7. Website pre-registration (the "expecting something" section)
A new section near the bottom of the website, just above the final "The next dawn starts with you":
- **Heading:** "Pre-register for the first voyage."
- **Countdown** to **16 Oct 2026**, with days, hours and minutes.
- **The reward, the reason to sign up now:** pre-registered Wardens get **6,000 Starlight** (30 wishes) when they first enter the game. No title.
  - It's granted automatically on first game sign-in when `players.preregisteredAt` is set.
- **A community milestone strip:** "**N** Wardens waiting".
  - Milestone tiers unlock extra Starlight for everyone at 10, 25 and 50 pre-registrations, shown as lamps lighting up. It's the same lamp language as the game.
  - The count comes from a public, read-only Postgres function. It returns only the number.
- **The flow:**
  1. Click **Pre-register**.
  2. Type a **nickname**. Anonymous sign-in happens under the hood.
  3. "You're registered, see you on 16 Oct, {nickname}".
  - It's the same browser session the game uses (same origin), so opening `/play/` on launch day picks up the same Warden and the reward.
- **After launch** the section switches to **"Play now →"** (link to `/play/`), and the countdown hides. This is driven by the date.
- **Style:** the game look (gold frame, lamps, Marcellus). Reduced motion is respected.

## 8. Keeping the free project awake
- Free Supabase projects pause after 7 days without activity.
- A **GitHub Actions cron** in the same repo calls a tiny read function every 3 days.
- The risk is also documented in the README: if it ever pauses, restore it in the Supabase dashboard before a retro.

## 9. What stays the same
- **The local demo backend** is kept for development and tests. The backend is chosen by environment: Supabase when `VITE_SUPABASE_URL` is set, otherwise local.
- **No game screen changes**, apart from:
  - the "Start" (anonymous sign-in) step before the opening;
  - the hidden admin sign-in;
  - the website section.

## 10. Testing
- **Unit tests** for the new adapter's mapping functions (row ↔ type).
- **Contract tests** that run the same scenario suite against both backends where it's practical. The existing `local.test.ts` scenarios are reused.
- **Security tests** on a Supabase branch database:
  - a non-author can't read `fragment_authors`;
  - a non-Warden can't change the stage;
  - a 4th vote is rejected;
  - a thought can't be added outside Write.
- **A two-browser manual pass**, with different accounts, on the deployed site:
  - register, intro, Join Retro, all stages;
  - skills and chatter in sync, the lamp moment on both, the free wish at Homecoming.
- **A dry run with 2–3 teammates** before 16 Oct.

## 11. What Jay must do (Claude can't create accounts)
1. **Create a free Supabase account.** Claude then creates the project, applies the database and turns on **anonymous sign-ins** through the connected Supabase tool, with Jay's OK at each step.
2. **GitHub:** nothing new to create. The `sternenzelts` account is already signed in here. The repo is **public**. Claude creates `sternenzelts/lumara` and the deploy workflow.
3. **No Google console setup needed.** Players don't use Google. Jay's admin login is email.

## 12. Timeline (13 days to launch)
| Days | Work |
|---|---|
| 1 | Supabase project, schema, row-level security and functions, plus the security tests |
| 2–3 | The Supabase backend adapter, the sign-in screen, Realtime cues and presence |
| 4 | GitHub Pages deploy via Actions (website + `/play/`), keep-alive cron |
| 5 | The website pre-registration section and the reward grant |
| 6 | Two-browser pass, fixes |
| By 14 Oct | Team dry run. 16 Oct launch. |

## 13. Open points (defaults chosen; Jay can change them)
- **The reward amount (decided):** 6,000 Starlight for pre-registering. The milestone tiers stay at +200 Starlight each at 10, 25 and 50 (default; Jay can change them).
- **Who can start a voyage:** admins only, which is today's rule.
- **The domain:** `sternenzelts.github.io/lumara` until a custom domain is chosen.
- **"Save my account":** after launch unless there's time.
