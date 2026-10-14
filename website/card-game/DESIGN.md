---
name: Lumara · Last Light
description: A quiet Lumara card table with original chibi fantasy comic scenes.
colors:
  ink: "#263c4c"
  muted: "#566b79"
  antique-gold: "#85693d"
  canvas: "#e7eff5"
  paper: "#f4f7f8"
  character-wash: "#edf3f8"
  portrait-surface: "#d8e4ed"
  secondary-hover: "#c8d9e6"
  primary-action: "#2c485c"
  primary-action-hover: "#375b75"
  white: "#fff"
  divider: "#b5c7d4"
  field-border: "#a3b7c5"
  focus: "#356c96"
  illustration-ivory: "#fffaf0"
  deck-gold: "#e9d5a9"
  collapse-surface: "#743b42"
  collapse-label: "#f4e2d0"
  error-surface: "#f6e7e6"
  error-ink: "#743835"
  selection: "#436e97"
  scrollbar-thumb: "#9cabb6"
  scrollbar-track: "#e5ebef"
  seren: "#795b30"
  mahesvara: "#436e97"
  keira: "#a04574"
  ayaka: "#476b86"
  azrenth: "#914f53"
  lucien: "#6f63b8"
  ashvane: "#896140"
  suvara: "#327373"
  sollene: "#5c5e86"
  wren: "#316956"
  rook: "#846432"
  calla: "#46715c"
  kairo: "#316b68"
  dax: "#9a542f"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(44px, 4.3vw, 66px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(25px, 2.6vw, 37px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  card-title:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.14
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  card-body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 700
  action:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  card-rule:
    fontFamily: "Manrope, sans-serif"
    fontSize: "9px"
    fontWeight: 800
  wordmark:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "25px"
    fontWeight: 400
    letterSpacing: "0.12em"
  lesson-headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    letterSpacing: "-0.025em"
rounded:
  square: "0px"
  playing-card: "12px"
  selection-mark: "50%"
spacing:
  compact: "8px"
  control-gap: "12px"
  action-gap: "13px"
  group: "20px"
  control-inset: "22px"
  arena-inset: "24px"
  lesson-inset: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "12px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-action-hover}"
  button-secondary:
    backgroundColor: "{colors.portrait-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "12px 22px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  text-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    padding: "0px"
    height: "44px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "44px"
    width: "44px"
  icon-button-hover:
    backgroundColor: "{colors.portrait-surface}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px 13px"
    height: "46px"
    width: "100%"
  portrait-choice:
    backgroundColor: "{colors.portrait-surface}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "0px"
    width: "66px"
    height: "84px"
  playing-card:
    backgroundColor: "{colors.character-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.playing-card}"
    width: "162px"
  card-caption:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "12px 12px 11px"
  card-back:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.deck-gold}"
    rounded: "{rounded.playing-card}"
    width: "162px"
  table-arena:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "27px 24px 25px"
  response-bar:
    backgroundColor: "{colors.portrait-surface}"
    padding: "14px 18px"
  rules-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0px"
    width: "min(980px, calc(100vw - 32px))"
  playing-arena:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "12px 28px"
  lesson-card:
    backgroundColor: "{colors.illustration-ivory}"
    textColor: "{colors.ink}"
    rounded: "{rounded.playing-card}"
    width: "140px"
---

# Design System: Lumara · Last Light

## Overview

**Creative North Star: "A Character Campaign Above the Clouds"**

Last Light extends the visual authority in `../DESIGN.md` into a card game. It preserves Lumara's icy blue, ivory, antique gold, regular Marcellus names, and compact Manrope controls. This document describes the implemented app only; it does not replace the parent website's design or product authority.

The approved illustration extension uses original cute chibi fantasy comic scenes: big heads, tiny bodies, warm ink outlines, expressive faces, and small character gags on ivory fields. Complete scenes sit above card captions. Square room controls and pale table regions keep play legible; rounded playing cards supply the physical silhouette. Motion is a short deal and interaction lift, with reduced-motion support.

**Key Characteristics:**

- Original chibi scenes carry character identity and card effects.
- Icy blue canvas, pale reading surfaces, and restrained antique-gold states.
- Regular Marcellus names paired with compact Manrope controls.
- Square interface surfaces and rounded physical playing cards.
- Contained horizontal portrait and private-hand rails.

## Colors

The inherited cool palette frames warm illustration fields. Frontmatter values are normative; synthesized sidecar ramps are preview aids, not additional shipping colors.

### Primary

- **Deep Sky Action:** primary actions and their lighter hover state.
- **Antique Gold:** emblems, emphasized words, active-turn and selected-card outlines, and the input caret.

### Secondary

- **Companion Accents:** the named companion tokens map directly to `catalog.ts`. Seren colors Protection; Mahesvara colors Nullify; Keira colors Shuffle and Digital Mimic; Ayaka colors Skip; Azrenth colors Collapse; Lucien colors both future effects; Wren colors the bottom draw; Calla colors Favor; Dax colors Attack; Suvara colors Targeted Attack and her Companion card. Ashvane, Sollene, Rook, and Kairo color their Companion cards.
- **Ready Green:** the Wren token also colors connection and ready feedback.
- **Collapse and Error:** Collapse has its own dark caption and pale rule label; error surfaces and error ink communicate connection or room failures.

### Neutral

- **Blue-gray Ink and Muted Ink:** main text and supporting instructions.
- **Icy Canvas and Paper:** page and reading/table regions.
- **Character Wash and Portrait Surface:** base card and grouped opponent/control surfaces.
- **Illustration Ivory:** the full-scene illustration field.
- **Divider and Field Border:** fine structural rules and native form strokes.
- **Deck Gold:** lettering and the translucent inset outline on the dark card back.
- **White:** text on filled primary actions and dark portrait captions.

**The Protected Reading Rule.** Keep card captions on their pale reading surface, with the Collapse caption as the explicit dark exception.

Text selection uses the selection token with white text. Scrollbars use the thumb and track tokens and thin width. Keyboard focus uses the focus token; state outlines remain gold so focus and selection retain separate meanings.

## Typography

**Display Font:** Marcellus, with Georgia and serif fallbacks.
**Body Font:** Manrope, with a sans-serif fallback.

The inherited pairing gives invitations and card names ceremony while keeping actions compact. Headings use regular weight and balanced wrapping; supporting copy uses comfortable line height.

### Hierarchy

- **Display:** the frontmatter's entry invitation; at the intermediate breakpoint it is 49px, and on phones 43px with a 330px maximum width.
- **Headline:** the base table heading. During play, the compact turn heading uses 30px, then 27px at the intermediate breakpoint and 25px on phones. Special-action headings use 25px, reducing to 23px; the gift heading uses 26px, reducing to 23px.
- **Card Title:** the default card-name role. Hand cards use 17px, small cards and phone hand cards use 16px; active piles use 13px and phone future previews use 12px.
- **Body:** entry invitation copy, constrained by the entry column; on phones it becomes 13px. Supporting table copy varies from 10–14px.
- **Card Body and Rule:** compact card text and colored effect metadata. Hand copy remains 10px on phones; active-pile explanatory copy is hidden. Rules remain text, never color alone.
- **Label and Action:** bold native form labels and controls.
- **Wordmark:** inherited spaced serif lettering, reducing to 21px in the phone header.

Selection summaries use a regular serif title (21px) with supporting text (11px, line-height 1.6, maximum width 380px). The illustrated dialog title is 30px, reducing to 24px on phones. Its lesson headline uses the lesson-headline role, reducing to 27px on phones; supporting lesson copy is 13px, reducing to 12px.

## Layout

The entry region is centered (maximum 1600px, minimum height 810px). Desktop header/footer gutters are 5.5%; the header is 76px tall. Entry copy is 500px wide with a 46% cap, an 8% left inset, and padding 58px 0 55px. The form is capped at 440px. The illustration occupies the right side from 46%, with pale edge washes. The display card is 205px wide, rotated 10 degrees, at 8% from the right and 85px from the bottom.

The table is centered (maximum 1600px, 3% horizontal gutters, 25px bottom padding). Its in-game header is 56px tall. Opponents wrap above the pale arena. During play, the arena has no minimum height and uses three columns: turn identity, centered piles, and latest log with survivor/Protection counts. The side columns are `minmax(190px, 1fr)`; row/column gaps are 18px/30px. The turn companion is 80px square and the piles are 100px wide with a 30px gap. Lobby framing retains the earlier tall arena; do not apply its minimum height to active play. The private hand follows after 8px, then a wrapping action strip and native disclosure log. The action strip sticks to the viewport bottom on the icy canvas, keeping Draw/Play and target controls available. Room codes and player names wrap when long.

Portrait and hand rails scroll horizontally with proximity snapping; individual items do not shrink. Portrait rail gap/padding are 7px and 3px 3px 8px. Hand rail gap/padding are 12px and 8px 5px 13px (9px gap on phones). Left/right hand buttons scroll 70% of the visible rail width and disable at boundaries. This contained overflow preserves page width and card legibility.

| Context | Card width | Shape |
| --- | --- | --- |
| Base card face | 162px | 2:3 aspect ratio |
| Active draw/discard, desktop and phone | 100px | 2:3 aspect ratio |
| Private hand, desktop and phone | 142px | 2:3 aspect ratio |
| Small future preview | 132px | 2:3 aspect ratio |
| Desktop entry display | 205px | 2:3 aspect ratio |
| Entry at 1000px and below | 175px | 2:3 aspect ratio |
| Phone future preview | 90px | 2:3 aspect ratio |

Responsive rules apply at 1000px, 650px, and a wide adjustment at 1600px; the illustrated guide has a further narrow adjustment at 360px. At 1000px and below, entry copy contracts to 430px with a 49% cap and 6% inset, the art begins at 45%, and table metadata wraps. Active play uses two columns with 16px gaps and 17px 22px padding; the situation region is hidden at this intermediate width. At 1600px and above, entry copy moves to 9% and art begins at 45%.

At 650px and below, the header is 64px tall with 6% gutters. Entry copy uses 7% gutters and padding 37px 0 36px; the illustration becomes a 265px-tall, 22%-opacity backdrop starting at 38%, and the display card is hidden. Portrait choices become 61×80px. Room options retain two columns with a 95px seat selector.

Phone table gutters are 4%, pile gap is 32px, and playing-arena padding is 16px 14px with a 16px vertical gap. Turn identity becomes a 48px portrait beside heading/instruction, followed by piles, then a compact row of survivor and Protection counts. Opponents wrap with a one-third minimum width and 180px maximum. Connection feedback gains a full row. Response controls stack; selection summaries gain a full row; special-action controls span the available width. The hand hint hides, while both hand-scroll buttons remain visible. Three future previews remain visible with compact captions. Small pile and future-preview paragraphs hide; full hand descriptions remain visible. Footer content wraps.

The illustrated guide is a flex column bounded by 90svh on desktop and 92svh on phones. Its heading, horizontally scrollable six-step navigation, and footer remain outside the contained scrolling lesson region. Desktop width follows the rules-dialog token; phone width is `calc(100vw - 20px)`. Lesson content uses 26px 28px 16px padding, reducing to 22px 16px 13px on phones. The card catalog uses four columns, then two on phones. Three-card turn sequences shrink within the phone width; matching-card examples overlap as a fan on phones. At 360px and below, the starting-hand fan and matching cards contract further.

## Elevation & Depth

Tonal separation does most of the work. Form controls, opponents, action strips, and dialogs are flat. Physical cards receive contextual soft depth rather than raised dashboard containers.

- **Deck separation:** `box-shadow: 5px 7px 20px #263c4c1f`.
- **Entry display card:** `filter: drop-shadow(0 18px 23px #263c4c35)`.
- **Rules backdrop:** `background: #1024369e`; no blur is applied.

Hand cards deal in over 0.4s with `cubic-bezier(.16,1,.3,1)`, from an 18px downward offset, 2-degree rotation, and brightness 0.9. Hover lifts playable hand cards by 4px; selection lifts them by 5px. The enabled draw deck lifts by 5px. Buttons transition background/transform over 0.18s, hand cards over 0.16s. Reduced motion removes all animation and transition and restores automatic scroll behavior.

## Shapes

Interface controls, fields, opponent groups, arena, and rules dialog keep square corners. One-pixel rules structure the page. Playing cards, the draw control, and the empty discard slot use the playing-card radius. The selected-card check badge is circular (25×25px). Lucide line SVGs provide icons.

**The Physical Card Rule.** Rounded corners belong to playing cards; keep the surrounding room and table interface square.

## Components

### Buttons

Primary and secondary buttons use the frontmatter dimensions as minimum heights, not fixed heights. They center text and line icons with a 13px gap. Primary hover lightens to the primary-action-hover token; secondary hover uses secondary-hover. The create-room action fills its form width and separates its leading icon, label, and arrow. The join button uses 17px horizontal padding, reducing to 12px on phones.

Text links stay transparent, with a 10px icon gap and gold hover text. Icon controls center their glyph in a 44px square and use portrait-surface on hover. Disabled buttons use opacity 0.48 and a default cursor; disabled deck and hand controls retain full opacity so cards remain inspectable. Phone hand icon controls reduce to 38px; room copy reduces to 32px.

All buttons, links, inputs, selects, and native summaries use `3px solid var(--focus)` with a 4px offset on keyboard focus. Selected portrait/hand outlines also exist, so focus and selection can coexist.

### Inputs / Fields

Square native fields use the field-border token at 1px and the paper surface. Label-to-field gap is 8px. Inputs and selects use 13px type; placeholders use fully opaque muted ink, and input caret uses antique gold. Compact target/request selectors use a 42px minimum height, 9px padding, and 12px type. The room code field has a hidden accessible label.

Entry controls are name, companion, deck edition, seats, room code, create, join, resume when available, and offline practice. Empty names and connection work disable dependent actions. Errors appear as a padded alert (12px 15px, 13px type) and keep the form available for retry.

### Navigation

The compact header pairs the Lumara wordmark/emblem with How to play. Rooms returns from the table; room information, invitation copy, edition, and connection state remain nearby. The wordmark also returns from the table. This app has no parent overview navigation menu.

### Portrait Rail and Opponents

Portrait choices have dark translucent name captions (`#263c4ced`) in 9px type. Selection uses a 2px antique-gold outline with a 2px offset and a Seren-colored caption; it exposes a pressed state. Portraits fill their frame with cover fitting, centered on the chibi scene.

Opponent groups use portrait-surface and compact square framing. The active turn uses a 2px gold outline with a 2px offset and illustration-ivory surface; eliminated players use opacity 0.55. Text reports ready, card count, or elimination. Desktop opponent portraits are 50px square with contain fitting; phone portraits are 36×40px. The private player portrait is 40px square. The arena companion identifies the stage actor, pending-action actor, or current player in that order.

### Playing Cards and Private Hand

Cards are flex columns with clipped rounded silhouettes. The illustration flexes into remaining height (`flex: 1; min-height: 0; height: 0`) with contain fitting, centered on illustration-ivory. Captions follow in normal flow and do not shrink; the final implementation overrides the earlier absolute caption placement.

Default captions use the frontmatter padding. Small and hand captions use 10px padding; active pile and phone future captions use 7px. Active piles retain the rule and serif title with hidden explanatory paragraphs; the hand carries full readable descriptions. The rule is colored by the card's companion accent, followed by its regular serif title and explanatory copy. Collapse replaces the caption surface, text, and rule color with its explicit semantic tokens.

**The Complete Scene Rule.** Show the full original chibi scene above the caption; preserve the silhouette, prop, and gag with contain fitting.

Card backs use ink and deck-gold, centered serif lettering (22px, tracking 0.05em), a 38px emblem, and a 1px translucent gold inset outline (`#e9d5a980`, offset -12px). The empty discard slot uses the same proportions with a 1px divider border and muted instruction.

Hand cards expose pressed selection, a 2px outline with a 3px offset, and a Seren-colored white check badge. The action strip shows a selection summary, target/request controls when required, Play, Clear, or Draw. Deck activation also has a 2px gold outline with a 4px offset; disabled state retains card contrast.

### Response and Special Actions

A pale blue response strip (maximum 700px) places a 15px bold action name and 11px explanatory countdown beside Let it happen. Its secondary button gains a field-border stroke. The remaining Nullify time is explicit text; state never relies on hue alone.

Secret reinsertion uses a native position select and Return the Collapse. Future cards are private previews; reorder arrows have accessible earlier/later labels and disable at boundaries. Local future and alteration stages align the main heading, instruction, hand hint, and Return to my turn/Set this order control with the required action. Favor asks the user to choose a card from their hand. Winner states keep the turn heading and offer Back to rooms. Empty-hand and loading states provide explanatory text and relevant navigation. The arena situation shows the latest log, survivor count, and the local player's Protection count with explicit text and icons. A native disclosure reveals the full table log; new log text also has a polite live status.

### Rules Dialog

The square native modal uses the frontmatter width and zero outer padding. Six illustrated lessons cover the starting hand, play-then-draw sequence, Protection, matching-card stealing, Attack/Skip, and Nullify. Each uses incumbent chibi artwork, pale captions, and line SVG arrows. Lesson cards have 140px-square illustrations; phone examples use 95px-wide cards with 105px-tall illustration fields. The current lesson has an ink-filled navigation button, textual numbering, and `aria-current="step"`.

Protection switches between survival and elimination; pair/trio switches between random stealing and requesting a specific card; the Nullify control alternates cancellation/restoration. Pressed state and live result text accompany each interaction. The edition-specific illustrated catalog remains a native disclosure, followed by the publisher's rules link. No new raster assets are required.

The footer pins Previous, step count, and Next/Ready to play outside lesson scrolling. Changing steps returns content to its top and brings the active navigation button into view. Standard keyboard focus remains visible on all controls. The native modal traps focus; its close button receives initial focus. Close, Escape, and Ready to play dismiss it, and unmount restores focus to the opening trigger.

## Do's and Don'ts

### Do:

- **Do** preserve inherited icy blue, ivory, antique gold, Marcellus, and Manrope.
- **Do** show full original chibi scenes above their captions with contain fitting.
- **Do** use each card's catalog accent for its effect metadata.
- **Do** preserve pressed selection, visible keyboard focus, and textual state feedback.
- **Do** keep portrait and private-hand overflow inside horizontal rails.
- **Do** honor reduced motion while retaining every game control.

### Don't:

- **Don't** crop away the chibi silhouette, prop, or comic gag on playing cards.
- **Don't** apply playing-card rounding to square room controls or table surfaces.
- **Don't** turn restrained gold emphasis into a large saturated interface background.
- **Don't** use copied publisher artwork or logos for original Lumara cards.
- **Don't** let illustration replace the protected reading surface of a card caption.
