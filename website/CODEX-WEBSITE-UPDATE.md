# Codex follow-up brief — Lumara overview website (update 1)

**Project:** `C:\Users\hp\Downloads\gacha-art\website` (the standalone overview site, not the game).
**Date:** 2026-09-26 · **Owner:** Jay Diaz
**Keep:** everything that works today — structure, character gallery with grade filters, 3-step voyage
section, fullscreen artwork viewer, motion + "Pause motion", reduced-motion support, static build checks.
**Change:** the world story is out of date, and some new art now exists. Details below.

---

## 1. The world changed — rewrite the world copy

The site still describes the old concept ("a world above the clouds", "islands", "lamps"). The world is now:

- **Lumara** is a vast fantasy world in the spirit of Wuthering Waves' Solaris-3: open plains, cliffs, seas
  and mountains, dotted with colossal ruins of a lost advanced civilization overgrown by nature.
- A cataclysm called **the Dimming** put out the great **beacons** across the land.
- The team are **Wardens** based in the **Sanctuary** (in Aurelis, the sky city at the center of the map).
  After every voyage (sprint) they return to share what they saw and swear new vows.
- **Each fulfilled vow relights one beacon.** Over months, the world comes back to life.

Copy rules:
- Replace every "lamp" with **"beacon"**; replace "islands / above the clouds / sea of clouds" framing with
  the open-world framing above. (Aurelis itself is still a sky city on cliffs above the clouds — that's fine
  when talking about the Sanctuary specifically.)
- Page title and hero subtitle: drop "A world above the clouds". Suggested hero:
  - Headline (keep): **"Where every vow becomes light."**
  - Sub: **"A world dimmed by the Dimming. A promise to bring it back, one beacon at a time."**
- "Twelve lamps. A shared promise." → **"Twelve beacons. A shared promise."**
- Keep the plain-language lines about anonymity and follow-through.

## 2. New section: the world map

Add a **"The world of Lumara"** map section between the world story and the characters.

- Image: `../world/lumara_map_v1.webp` (1672×941, no text on it). Copy into `public/art/world/`.
- Region data: `../world/map-regions.json` — each region has `name`, optional `subtitle`, `x`/`y` in
  **percent** of the image, and `characters`. Render each region as a small label pinned at (x%, y%)
  over the map (absolutely positioned inside a relative wrapper so it scales with the image).
- Hover / focus / tap on a region → a small card with the region name and its characters' portraits
  (use each character's cutout, cropped to the face). Clicking a portrait jumps to that character in the gallery.
- Show **beacons** as small glowing markers near each label. For the overview site, show a few lit and
  most dim, to illustrate the idea ("each fulfilled vow relights one").
- Aurelis is marked as **the Sanctuary** (`isSanctuary: true`) — give it a slightly larger, gold label.
- Mobile (375 px): the map stays full width; labels shrink to dots, and tapping a dot opens the card.
- Positions are approximate — make them easy to tweak in the JSON, don't hardcode in components.

## 3. Hero background

- Now: the floating-islands sanctuary image.
- Target: a **Lumara title background** (Seren at a cliff edge overlooking the open world) — **not generated
  yet.** Build the hero so the background image path is one constant (e.g. `HERO_BACKGROUND`) and keep the
  current image until the new one lands. Keep the still-image fallback and motion setting.

## 4. Seren's videos — do NOT use on the website

Seren's videos (`seren_intro.mp4`) are reserved for the **game** title screen. Do not add any Seren video to the website. The Seren section keeps using her still art.

## 5. Seren's mascot art (new)

In `../characters/seren/`:
- `seren_chibi.webp` — use as a small friendly guide in a corner of the page (e.g. next to the voyage
  steps, with a short speech bubble).
- `seren_face_happy / excited / proud / thinking / surprised / calm.webp` (1254×1254, transparent) —
  use 2–3 of them in the voyage steps, one per step (e.g. Gather = happy, Reflect = thinking,
  Make a vow = proud).

## 6. Character cards show their region

Add the region under each character name, from `map-regions.json` (`characters` arrays):
e.g. **"Ayaka · The Frozen Reach"**, **"Rook · The Gaslight City"**.

## 7. Art updates

- **Kairo now has a splash:** `../characters/kairo/kairo_splash_v1.webp` — use it instead of his cutout.
- **Calla's cutout** is still pending — keep her splash.
- Mahesvara's main splash is `mahesvara_mirror_splash_v2.webp`; Ayaka's is `ayaka_timestop_splash_v2.webp`;
  Keira's is `keira_splash_v3.webp`; Azrenth's is `azrenth_splash_v2.webp` — confirm the site uses these.
- Each `../characters/<name>/source.md` lists which file is used for what.

## 8. Style reminder

It's a showcase site, so a clean editorial layout is fine here — but keep it feeling like a **premium gacha
game's official site** (painted art, gold line work, glowing accents), not a generic SaaS landing page.

## 9. Done when

- [ ] No "lamp", "islands of Lumara" or "world above the clouds" wording remains (except Aurelis/Sanctuary context).
- [ ] Map section renders with all 9 region labels in the right places at 1440 px and 375 px.
- [ ] Region cards show the right characters; portraits link to the gallery.
- [ ] Every character card shows its region.
- [ ] No Seren video is used anywhere on the website.
- [ ] Kairo uses his splash.
- [ ] `npm run build` passes its static checks.
