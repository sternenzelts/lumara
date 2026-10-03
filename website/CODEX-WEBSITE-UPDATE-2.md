# Codex: Lumara website update 2 — what's out of date, and how to make it better

**Project:** `C:\Users\hp\Downloads\gacha-art\website`, the promo overview site. It is **not** the game.
**Date:** 2026-10-03 · **Owner:** Jay · **Launch:** 2026-10-16
**Run it:** `npm run dev` (port 4174). **Keep everything that works:** the hero, world atlas, S++ legends, companion showcase and overview, voyage steps, artwork viewer, music, motion pause and reduced-motion support.

Claude reviewed the live site on desktop and at 375 px. It has no broken images, no horizontal overflow, a meta description, and a clean heading order. The problems are that **it's behind the game**, and that **a few images are very heavy**.

---

## A. Out of date: fix first

1. **The voyage section describes the old flow.** "Gather" still says *"share an opening character pull"*. The free wish **moved to Homecoming** at the end of the voyage. Replace the 3 steps with the real **6 stages**, keeping the plain-language line under each:
   1. **Vow review**: at the beacon, look back at last voyage's vows; each one kept relights a lamp.
   2. **Write**: leave anonymous thoughts at the crystals (Keep, Problem, Try, Wild).
   3. **Vote**: give your 3 Starlight votes to what matters most.
   4. **Discuss**: the Warden draws the most-voted thoughts from the beacon.
   5. **New vows**: cross to the vow island and make promises for next sprint.
   6. **Homecoming**: the summary, your Starlight and your **free wish**.
   - Keep the "Your thoughts stay anonymous" and "Follow-through becomes visible" lines.
2. **Mahesvara's text says "twin crystal daggers".** His weapon is **twin crystal guns**. Fix it in `src/characters.ts`, and anywhere else it appears.
3. **Voices: all 14 characters are voiced now, but the site has only 8.**
   - `src/voice-lines.json` covers Mahesvara, Keira, Ayaka, Azrenth, Lucien, Ashvane, Suvara and Seren. Seren has only 4 lines.
   - **Add Wren, Rook, Calla, Kairo, Dax and Sollene, with 8 lines each.** Add more Seren lines too, including her new skill lines.
   - **Clips:** copy from the game, `../interface/public/art/<id>/voice/<lineId>.mp3`, into `public/audio/voices/<id>/`.
   - **Text:** the English subtitles are in `../interface/src/data/voiceLines.ts` (the `text` field per line). Pick the greet, tap, idle and laugh lines; they work best out of context.
   - Remove any "voice unavailable" state for these characters.

## B. Show the game as it is now (the best upgrade)

The site sells the art but not the game. Since the last update the game gained a lot of visible, fun systems. Add a section **"Inside the Sanctuary"** between the companions and the voyage, using real game assets. No mock-ups.

1. **Walking chibis.**
   - Every character has a 4-direction walk sheet: `../interface/public/art/<id>/<id>_chibi_walk*.webp`.
     - Layout: 4 rows × 4 frames, 256 px cells. Rows are down, right, up, left.
     - Suvara's is `suvara_chibi_walk_v4.webp`.
     - Keira floats and has no sheet; use her pose sheet.
   - Show a strip of chibis walking across a slice of the plaza map (`../interface/public/art/sanctuary/sanctuary_map.webp`), using CSS `steps(4)` sprite animation.
   - Clicking a chibi plays one of their voice lines, with a speech bubble, like in the game.
2. **Skill showcase.** For each S++ and S+ character, list the skill names and one-line descriptions from `../interface/src/data/kits.ts`:
   - **S++:** 4 skills, ultimate last.
   - **S+:** 3 skills.
   - Use the skill icons in `../interface/public/art/<id>/*skill*.webp`.
   - In the profile panel, add a small "Skills" row of icons with hover or tap tooltips.
   - Highlight the signature ultimates in a line each:
     - Ayaka's **Chrono Stasis** stops time for everyone.
     - Azrenth's **Sever** cuts through it.
     - Seren's **Dawnbreak** blinds the world white.
     - Lucien's **Rampart** blocks the path.
   - **Optional:** a looping effect preview using the game's effect strips (`*_vfx_*.webp`, 7 frames each, CSS `steps(7)`).
3. **"A promise kept" moment.** In the vow and beacon copy, show the lamp-lighting idea visually:
   - a short CSS animation of a spark flying to a lamp, and the orb igniting gold;
   - the line *"Confirm the promises you kept — every one relights a lamp."*
4. **Characters talk.** One line in the companions section: *"Companions chatter, react to your retro, and answer when you click them, in Japanese voice with English subtitles."*

## C. Performance (big images)

These download on a normal visit:

| File | Size |
|---|---|
| `mahesvara.png` | 3.3 MB |
| `lumara-world-v1.png` | 2.9 MB |
| `seren_face_happy.webp` | 1.7 MB |
| `lumara_map_v2.webp` | 0.5 MB |
| `aurelis_center.webp` | 0.4 MB |

- **Convert the PNGs to WebP** (quality around 85) and cap each at about 2× its largest displayed size. `seren_face_happy` is shown small, so resize it to about 600 px.
- **Add `loading="lazy"` and `decoding="async"`** to everything below the hero.
- **Keep the hero image eager**, with `fetchpriority="high"`.
- **Goal:** first view under about 1.5 MB.
- `npm run build` already checks static output limits; keep it passing.

## D. Sharing and polish

1. **Link previews:** add Open Graph and Twitter tags (`og:title`, `og:description`, `og:image` and `twitter:card=summary_large_image`), so the link previews well when the team shares it. Use a 1200×630 crop of the hero (Seren and the plaza) with the title.
2. **Favicon:** use the Lumara compass mark, if one isn't set already.
3. **Mobile end of page:** at 375 px, check the area below the final "The next dawn starts with you" section. It looked like empty space past the footer in Claude's run (that may have been the emulator). There should be no blank band.
4. **Hero background:** still the older floating-islands image. Leave the single `HERO_BACKGROUND` constant; Jay may swap the art later.

## Rules (from Jay)
- **Game look, not SaaS:** gold-framed, painterly, Marcellus headings, consistent with the game.
- **No licence or legal warnings anywhere.** It's not a company release.
- **Keep reduced-motion and Pause motion working** for every new animation.
- **Verify before reporting:** desktop plus 375 px screenshots of each new section, voices actually play (including an A character), images load, no overflow, and `npm run build` passes.
