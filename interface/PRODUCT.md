# Gacha retrospective

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, Vite, TypeScript, GSAP, and Vitest, as required by the authoritative `CODEX-BRIEF.md`. The active application belongs in `C:/Users/hp/Downloads/gacha-art/interface`. Work and verification stay there; do not copy the older gacha-retro project over it or copy back to that folder. Build output uses relative paths and bundles dependencies.

## Users

Platform Pod: 4–8 teammates attending a remote sprint retrospective on individual laptops. A Warden facilitates. The owner administers the eventual published application.

## Product Purpose

Keep the familiar retrospective sequence—check in, write anonymous thoughts, vote, discuss, and commit to action items—while encouraging follow-through with cosmetic character pulls and a Sanctuary restored by fulfilled Vows.

## Operating Context

Biweekly retrospectives lasting 45–60 minutes. Gacha elements add at most approximately five minutes. Local development uses a single-browser demo. Company Claude artifact hosting and capabilities are planned, subject to the spec's feasibility check.

## Capabilities and Constraints

Fragments and votes have no author/voter field. Characters are cosmetic; they never change votes or discussion. No leaderboards or per-person activity statistics. Vows carry forward between retros. Starlight pays for extra pulls; pity and rates are visible. The local demo uses localStorage and BroadcastChannel: URL-selected players in two tabs act as teammates. Only jay is demo admin. The local backend implements currency, randomized pulls and shared pity; the production adapter remains separate. Preserve the existing TypeScript contract and saved player data. The final game name remains undecided. The implemented thirteen-character roster is governed by `src/data/characters.ts`; three S++ wish lineups feature Mahesvara, Keira and Ayaka with their supporting companions.

## Brand Commitments

Lumara is the world's name, not a newly chosen game title. Bright icy blue, white, silver, and thin gold lines; original anime painted characters, inspired by premium gacha key visuals. No copied franchise marks. Jay explicitly requested supplied Kenka audio on the title and welcome/story, with story music ducked under Seren, and supplied DARK ARIA audio in Sanctuary with volume controls. The draft's temporary launch and featured-character references disagree; use the implemented three S++ lineups for Wishes, and Seren as the Sanctuary's welcoming character.

## Evidence on Hand

The dated design spec and original character assets under `characters/`. Seven characters have supplied splash art, including the newly added Ayaka and Sollene. Ayaka cutouts have appeared but remain unassigned in the latest brief. Current asset availability is governed by the bundled public art. The shared pull and approved Ayaka choreography are implemented; other character music remains limited to supplied files. Sample names, fragments, dates, and vows in this prototype are illustrative and labeled as demo content.

## Product Principles

- Make the retrospective usable without understanding the fantasy terminology.
- Reward shared follow-through rather than individual activity.
- Keep rates, cost, pity, and cosmetic-only rewards clear.
- Preserve user-written content across navigation and refresh.

## Accessibility & Inclusion

Laptop and phone widths, keyboard access, readable contrast, plain labels paired with themed labels, and reduced-motion support.

## Current interface direction

Jay selected cinematic full-screen Sanctuary and menu scenes, large Seren and simple dialogue. Preserve the supplied map and original art, saved nickname names, `lumara.serenMuted`, and the full story → five free welcome wishes → Sanctuary flow. The selected companion remains in the HUD and collection; no roaming pulled companion is shown. Title and story layouts, three banners and approved Ayaka reveal remain intact. Visual review by Jay is pending.


## Hosting scope update (2026-09-27)

Jay authorized growth beyond the former 64 MB Claude artifact budget because the game has more content planned. The normal standalone web build no longer enforces artifact total-size, per-file-size or file-count caps; it still reports all sizes and checks relative resource paths. `npm run build:artifact` retains the former caps as an optional compatibility check. Hosting migration and production backend integration remain separate work; no deployment has been performed. Existing compressed assets remain in use.
