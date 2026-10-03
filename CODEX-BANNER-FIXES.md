# Codex — banner (Wishes) fixes

**From:** Jay (written up by Claude) · **Date:** 2026-09-27 · **Project:** `C:\Users\hp\Downloads\gacha-art\interface`
Do these after (or alongside, without clashing) `CODEX-REVEALS-BRIEF.md`.

## 1. Back to Wishes (bug — dead end)
Clicking a character card on the banner (`components/WishLineups.tsx`, `href="#collection/<id>"`) opens the
character page, which only offers **"Back to collection"** and **"Return to world map"** (`screens.tsx`,
CollectionScreen). There is no way back to the banner.
- Remember where the player came from (e.g. `#collection/<id>?from=banner`, or a `returnTo` in UI state).
- When opened from the banner, the first back button reads **"Back to Wishes"** and returns to the same
  banner tab (Mahesvara / Keira / Ayaka) the player was on. Keep the other buttons as they are.
- Esc and the top-left back arrow do the same.

## 2. Featured character description on the banner
The banner shows the art and the wish buttons but nothing about who you are wishing for. Add a **featured
character panel** on the banner's calm left side (the new wide banner art leaves that area free):
- Grade badge (S++ / S+), **name**, **title** (e.g. "The Frozen Hour"), **element**, and the character's
  **flavour text** (already in the character data — the character page shows it).
- The **ability kit** where it exists (skill / ultimate / signature names with one-line descriptions), e.g.
  Ayaka: Deceleration Zone, Niflheim, Frost Cadenza, Glacial Finale, **Chrono Stasis**; Mahesvara: nullify
  magic, destroy & restore; Keira: mech blast, **Guardian Protocol** armour fusion + giant-sword finale.
- A **"View details"** link to the character page (which then shows "Back to Wishes", see 1).
- Game style: dark translucent panel, gold edge, same look as the reveal name cards — not a white web card.
- Switching banner tabs swaps the panel with a short fade.

## 3. Banner art sizing
Right now each banner uses the character's **portrait 2:3 splash** as a full-screen `cover` background, so on a
wide screen it is zoomed in to just the face and hand (Ayaka's throne, clock and body are cut off).
- Jay is generating **wide 16:9 banner key visuals** (character on the right half, calm left third, simple
  bottom 20%). When they arrive: use them for the banner background, `object-fit: cover`, and give each a
  focus point (`object-position`) so the face is never cropped at any screen size.
- Until then: show the portrait splash **uncropped on the right side** (e.g. `object-fit: contain`, anchored
  right) over a blurred, darkened copy of itself — so the whole character is visible.

## 4. Pull results screen looks like a website
"Your new companions" (white cards on a pale background) should match the game: dark translucent panel,
gold-trimmed character cards, grade glow per card (A violet, S+ gold, S++ rainbow), game-style Continue button.

## Done when
- From any banner character card → character page → "Back to Wishes" → same banner tab. No dead ends.
- The featured character's name, title, element, description (and kit where it exists) show on every banner.
- No banner crops a character's face; results screen matches the game UI.
- `npm test` passes, `npm run build` passes and stays under 64 MB.

## Update — wide banner art is ready
All three 16:9 banner key visuals are in `C:\Users\hp\Downloads\gacha-art\banners\`:
`banner_mahesvara.webp`, `banner_keira.webp`, `banner_ayaka.webp` (1672×941). Focus points for `object-position`
are in `banners/README.md` (Mahesvara 62% 18%, Keira 70% 30%, Ayaka 60% 25%). Use these for the banner
backgrounds instead of the portrait splashes (item 3). Put the featured-character panel (item 2) on the calm left third.
