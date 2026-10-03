# Wish banners

Wishes shows one full-scene selected banner with three portrait tabs for Mahesvara, Keira and Ayaka, following the user's pinned Genshin/Wuthering Waves banner convention. The compact identity panel shows grade, name, title and element. Its ArrowUpRight icon, labeled `View <Name> details`, opens a dark, gold-edged popup with character art, flavor text and the ability kit from `src/data/characterKits.ts`. The latest clarification places description and abilities in this popup. It focuses Close, traps Tab/Shift+Tab, closes with Escape or a scrim click and restores focus to the opener. Tabs support arrow keys, Home and End; reduced motion suppresses scene/panel entrance and portrait lift.

Mahesvara's supporting lineup is Azrenth (S+), Sollene and Calla (A); Keira's is Ashvane (S+), Rook and Dax (A); Ayaka's is Seren and Suvara (S+), Wren and Kairo (A). All 13 characters appear across these cosmetic groupings. Pool entries and history entries open collection details with the selected banner encoded in the hash. Supporting portraits are display-only. Back to Wishes, the shell's top-left arrow and Escape return to that same banner. Existing collection/map return controls remain available.

Circular icon controls expose real shared rates/pity/full-pool information, the player's latest twelve wishes and a reward-free S++ preview. All banners share the full thirteen-character pool and one pity history; featured/supporting characters are not rate boosted or exclusive. Cost comes from current settings: at 200 Starlight per wish, ×1 costs 200 and ×10 costs 2,000. Paid controls enforce busy/balance guards and preserve duplicate-to-Stardust behavior. Preview spends nothing and awards nothing. See [Approved S++ reveals](GAME-INTERFACE.md#approved-s-reveals-2026-09-27) for current reveal choreography and audio. Multi-wish results use a fully dark scene, dark translucent panel, cream copy, gold framing/Continue, violet A trim, gold S+ trim and a multicolor S++ edge; the close control remains readable.

The supplied parent banners are bundled in `public/art/banners/` at 1280 × 720, quality-80 WebP. [Provenance](../public/art/banners/source.md) records the 1672 × 941 originals and focus points: Mahesvara 62% 18%, Keira 70% 30%, Ayaka 60% 25%. Phone Mahesvara uses 70% 18% with a lower, shorter art region to keep his face clear of the tabs. Phone tabs run across the top, controls sit above the dock, and the short-phone identity panel retains at least 135px. The unused superseded bundled Mahesvara PNG was removed; original parent character/banner files remain intact. Opening, nickname, saved names and voice behavior remain unchanged. This local extension stays in `interface` and preserves `DESIGN.md` and `.impeccable/design.json`.

Implementation is in `WishLineups.tsx`/`wish-lineups.css`, `CharacterDetailsPopup.tsx`/`character-details-popup.css`, `characterKits.ts`, `bannerNavigation.ts`, `GameShell.tsx`, `src/screens.tsx` and the existing `PullReveal.tsx` flow. Final validation: 94 tests passed; build passed at 63.64 MB across 162 files, under 64 MB. Browser checks at 1440 × 900, 1024 × 768, 375 × 812 and 375 × 667 covered all three popups/kits, keyboard focus/close/restore, same-banner returns, previews, shared pool/history and paid ×1/×10 guards without errors or overflow. Captures/detector output are in `.impeccable/review/banners/`. Final review resolved its two recorded issues (fully dark results/close contrast and short-phone identity fit); this is not a claim of user visual approval.

## Face portrait selectors

The three selector tabs show close-ups of each character's face, cropped from the existing wide banner artwork with SVG viewports. They carry no overlaid element symbols; keyboard selection and accessible character names remain intact. This adds no raster assets.

The details popup now scrolls through the selected banner's entire displayed lineup: featured S++ first, followed by its S+ and A supporting characters. Each entry includes its own artwork, grade, name, element and supplied description; existing authored kits remain shown where available. One scroll area covers the whole lineup, with the Close button fixed and keyboard focus protected.


The supplied supporting portrait references now frame Azrenth, Dax, Kairo, Rook, Wren and Suvara using their matching existing cutouts. Seren uses her already-bundled proud face portrait. This changes the supporting banner icons only. Original wide banner files were restored without additional compression; the standalone build no longer has the former 64 MB cap.


The main selector portraits are circular close-up views for Mahesvara, Keira and Ayaka. Ashvane now has a supporting face portrait as well. Framing follows the pasted reference images using existing local character artwork; the exact chat attachment binaries were not exposed to the workspace. Full original banner backgrounds remain unchanged. Desktop, tablet and both phone sizes passed navigation and popup checks; 94 tests and the production build passed.


The supporting portrait row now sits directly beneath the featured identity panel in one layout group, with a 16px desktop / 12px phone gap. These portraits are display-only: no links, buttons, hover lift or redirects. Supporting character details remain in the scrollable details popup. Browser checks verify row placement and unchanged route after clicking a portrait on all four viewport sizes.


Sollene and Calla now also use portrait crops framed from their existing cutout artwork to follow the supplied close-up references. All supporting icons remain display-only below the featured panel.
