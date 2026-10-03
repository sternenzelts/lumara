---
name: Lumara
description: An illustrated sky world, original companions, and the light of shared promises.
colors:
  ink: "#263c4c"
  muted: "#566b79"
  antique-gold: "#85693d"
  canvas: "#f4f7f8"
  chapter-surface: "#f6f8fa"
  voyage-surface: "#e7eff5"
  showcase-surface: "#e5edf3"
  character-wash: "#edf3f8"
  primary-action: "#2c485c"
  primary-action-hover: "#375b75"
  icon-hover: "#dbe5ec"
  filter-hover: "#e6edf2"
  white: "#fff"
  focus: "#356c96"
  voyage-divider: "#b5c7d4"
  portrait-surface: "#d8e4ed"
  seren: "#795b30"
  mahesvara: "#436e97"
  keira: "#a04574"
  ayaka: "#476b86"
  azrenth: "#914f53"
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
    fontSize: "clamp(55px, 5.35vw, 78px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(36px, 4vw, 57px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  character-name:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(48px, 5vw, 70px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.85
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  action:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 700
  wordmark:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    letterSpacing: "0.15em"
rounded:
  square: "0px"
  stage-circle: "50%"
spacing:
  compact: "8px"
  control-gap: "12px"
  inset: "16px"
  group: "20px"
  control-inset: "24px"
  section-detail: "30px"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "15px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-action-hover}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "44px"
    width: "44px"
  icon-button-hover:
    backgroundColor: "{colors.icon-hover}"
  navigation-link:
    typography: "{typography.label}"
    padding: "14px 0px"
  grade-filter:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 14px"
  grade-filter-selected:
    textColor: "{colors.antique-gold}"
  portrait-choice:
    backgroundColor: "{colors.portrait-surface}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "0px"
    height: "143px"
    width: "103px"
  voyage-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "20px 0px"
  voyage-tab-selected:
    textColor: "{colors.antique-gold}"
  character-showcase:
    backgroundColor: "{colors.showcase-surface}"
    rounded: "{rounded.square}"
    height: "620px"
---

# Design System: Lumara

## Overview

**Creative North Star: "A Character Campaign Above the Clouds"**

Lumara pairs expansive illustrated skies and original anime characters with pale, quiet reading surfaces. Marcellus gives names and invitations a ceremonial voice; Manrope keeps navigation, descriptions, and interaction clear. The material character is icy blue, ivory, silver, and restrained antique gold.

Artwork carries the spectacle. Copy sits directly in open space or over a carefully placed pale wash, while fine rules and small controls guide exploration. Seren is the recurring mascot and guide. Camera drift, separated image planes, and light motes create gentle depth, with an explicit motion control and reduced-motion support.

**Key Characteristics:**
- Full-scale original artwork with protected reading areas.
- Unboxed copy, generous chapter spacing, and fine dividers.
- Ceremonial serif titles paired with compact sans-serif controls.
- Character-linked accent states and a navigable portrait filmstrip.
- Ambient motion that visitors can pause.

## Colors

The palette is cool and pale, with dark blue-gray reading tones and warm antique-gold emphasis. Frontmatter values are normative; the sidecar's tonal ramps are synthesized preview aids, not additional shipping colors.

### Primary

- **Deep Sky Action:** the primary-action pair gives discovery links a solid, readable anchor against illustrated backgrounds.
- **Antique Gold:** emphasized words, emblems, selected grade filters, voyage stages, and navigation underlines.

### Secondary

- **Companion Accents:** each of the thirteen characters owns the named accent in the frontmatter. It colors the title, grade and element metadata, faint watermark, and selected portrait outline. The three revised accents for Seren, Wren, and Kairo are the current source values.

### Neutral

- **Blue-gray Ink and Muted Ink:** main copy and supporting prose respectively.
- **Cool Canvas and Chapter Surface:** the page foundation and open world/character/footer chapters.
- **Voyage Surface and Showcase Surface:** distinguish interactive explanations and the character scene through tone rather than card chrome.
- **Character Wash:** protects copy over detailed art; its mobile version remains opaque through the upper reading area before fading toward the figure.
- **White:** primary-action text and captions over darkened artwork.
- **Voyage Divider:** quiet structural rules between stages and footnotes.

**The Protected Reading Rule.** Keep the pale artwork wash behind character copy, and keep grade and element metadata below the character name and title.

## Typography

**Display Font:** Marcellus, with Georgia and serif fallbacks.
**Body Font:** Manrope, with a sans-serif fallback.

The contrast comes from the serif's expressive proportions and the sans-serif's compact clarity. Titles stay at regular weight; control importance comes from weight and state rather than oversized labels.

### Hierarchy

- **Display:** the fluid hero invitation, with balanced wrapping and close tracking.
- **Headline:** section headings; the character chapter uses its own narrower fluid range. Mobile world and voyage headings resolve to 39px and the character heading to 36px.
- **Character Name:** the largest name in the showcase, resolving to 59px at the intermediate breakpoint and 48px on mobile.
- **Title:** character epithet and roster heading. The epithet is smaller on mobile, at 17px.
- **Body:** the base paragraph role. Source context varies from 11–15px; descriptions use comfortable line height and bounded widths, including 350px for desktop character copy and 420px for voyage detail.
- **Label and Action:** navigation and text links use semibold; filled discovery actions use bold. Small supporting captions remain subordinate.
- **Wordmark:** widely spaced Marcellus lettering, reduced in the mobile header and footer.

**The Name Before Metadata Rule.** Give the character name and epithet first reading priority; grade and element belong to the following metadata row.

## Layout

The page uses full-width illustrated scenes and centered editorial regions, not a persistent application shell. Desktop gutters are usually 5.4%, with the hero copy inset at 8.5%. Reused content widths range from 1210px to 1284px; the world panorama extends to 1440px. World introduction uses an emblem and two text columns. The voyage pairs a vertical stage list with detail. The portrait rail scrolls horizontally with proximity snapping and recenters the selected character.

Desktop sections have generous vertical spacing: world and character chapters begin around 108–110px from their preceding boundary. The character showcase is 620px tall with copy on the left and art on the right. The source uses local spacing values rather than a single mathematical scale; frontmatter records the repeated compact rhythm only.

Breakpoints are 1100px, 760px, and a wide-screen adjustment at 1600px. At 1100px, composition and type contract. At 760px, navigation becomes a disclosure menu, world copy stacks, voyage stages form a horizontal row, and the character scene becomes 740px tall with copy above the figure. Mobile chapters use 7% gutters. Portraits reduce from 103×143px to 88×125px; showcase arrow controls reduce to 38×38px. The hero becomes a tall scene with Seren beneath the copy and ambient controls along its base.

## Elevation & Depth

Depth comes primarily from layered artwork, pale veils, softened backgrounds, and small tonal differences. There are no recurring raised content cards. Shadows are soft and contextual: artwork separates gently from the sky, a primary action lifts on hover, and the open mobile navigation casts a small ambient shadow. The artwork dialog uses a dark translucent, blurred backdrop.

### Shadow Vocabulary

- **Action hover:** a diffuse blue-gray shadow under a filled discovery action.
- **Mascot and companion separation:** low-opacity drop shadows applied to transparent character images.
- **Mobile navigation:** a soft shadow below the opened menu.
- **Portrait selection:** an accent outline represented as a zero-offset box shadow; it indicates state rather than elevation.

Exact shadows, overlay gradients, and state transitions live in the sidecar.

## Shapes

Panels, primary actions, portrait frames, and the artwork dialog keep square corners. Fine one-pixel rules define navigation states, filter states, and voyage structure. The exception is the circular numbered voyage marker. The original angular star emblem recurs at several scales; icon controls use line-based SVGs.

## Components

### Buttons

Filled discovery actions are compact, square, and dark against pale imagery. They use a right-arrow icon, generous internal horizontal spacing, and a lighter blue hover state with a soft shadow. Text links remain transparent with a border appearing on hover. Icon controls use centered line icons and a pale hover fill; showcase arrows add a thin border and translucent pale background.

Interactive buttons, anchors, and focusable panels share a visible blue outline with an offset. Disabled buttons use reduced opacity. Mobile hero actions become a vertical group with a smaller filled action.

### Navigation

Desktop navigation is sparse and horizontal. A fine gold underline scales into view on hover or the current location. Mobile navigation opens beneath the header as a pale vertical menu; the disclosure control exposes its expanded state and closes when a destination is chosen.

### Grade Filters

Grade filters are transparent text buttons. Hover adds a pale blue fill; the pressed state adds gold text, bold weight, and a fine bottom rule. Changing the filter chooses the first matching character if the current character is outside the new grade.

### Portrait Filmstrip

Portraits use supplied artwork, a dark lower gradient, a small grade badge, and a white name caption. Resting portraits are slightly desaturated. Hover and selection restore saturation and gently scale the image; selection adds the character's accent outline. Selection is exposed through a pressed state.

### Character Showcase

The scene layers a faded splash background, pale copy wash, supplied character cutout, and a faint emblem watermark. Name and title precede metadata and description. Pagination cycles through the filtered roster. Splash-only art receives a narrower centered presentation; Kairo's existing standing cutout substitutes where a splash is absent. Ayaka starts seated on her ice throne, and Calla uses her supplied transparent cutout. Artwork opens in the shared viewer.

S++ characters with multiple configured forms cycle every 3000ms, synchronizing cutout and matching faded backdrop through a 500ms opacity crossfade with `cubic-bezier(.16,1,.3,1)`. The current pairs are Mahesvara's original/awakened forms, Keira's standing/floating poses, and Ayaka's ice throne/time-stop forms. The pale reading wash remains in place. Other grades keep one image; fullscreen artwork galleries remain manual. Selecting a different character resets the scene to its first form.

Form labels use transparent Manrope controls, muted text at rest, and a gold bottom rule and semibold text when pressed. Hover uses the existing ink tone, and keyboard focus retains the shared outline. Manual form selection pauses autoplay; a local pause/play control resumes or pauses it when motion is enabled. Rotation waits for all cutout and background images to decode, and stops while offscreen, in a hidden tab, behind an open viewer, under reduced motion, or when ambient motion is paused. Unready alternate choices and pause controls are disabled; loading or failed-decode status explains their state. Paused and reduced-motion modes remove the crossfade while retaining manual selection. Mobile controls wrap below the figure, reserving space above pagination.

### Background Music

The persistent background-music control sits at the lower-right viewport edge with a 44px minimum target, existing paper/ink/gold colors, Manrope label, and Lucide speaker icon. It starts silent and plays the user-supplied Kenka track on explicit activation at 25% volume, looping continuously. Mute pauses while preserving position; hidden tabs pause too. Loading and retry states remain accessible. Audio is independent of motion preferences.

### Voyage Stages

Stages are numbered tabs with a serif label and fine dividers. Selection turns the label gold and fills the circular number marker. A shared detail panel changes to the selected stage. Arrow keys, Home, and End move tab selection and focus; mobile tabs sit in one row.

### Artwork Viewer and Fallback

The native modal dialog contains art, a compact caption, and a pale close control. It uses viewport-limited sizing and a dark blurred backdrop. Escape, the close control, or clicking the backdrop dismisses it. A failed image becomes a pale surface with the emblem and the message “Artwork is unavailable.”

**The Motion Choice Rule.** Keep ambient motion optional, honor reduced-motion preferences, and preserve clear navigation and character selection when animation is paused.

## Do's and Don'ts

### Do:

- **Do** use supplied artwork as the visual focus and protect copy with pale washes.
- **Do** pair regular Marcellus headings with compact Manrope controls and supporting text.
- **Do** keep character names and titles above grade and element metadata.
- **Do** preserve character-linked accents, pressed and selected states, and visible keyboard focus.
- **Do** carry the pause control and reduced-motion behavior into animated surfaces.

### Don't:

- **Don't** replace the open editorial regions with a sidebar or dashboard card grid.
- **Don't** turn fine gold emphasis into a large saturated background treatment.
- **Don't** add rounded panel or button styling to the square component vocabulary.
- **Don't** let detailed artwork replace the pale reading area behind character copy.
- **Don't** invent an input, account action, download control, or launch promise for this overview.


## Current campaign extension

The existing icy blue, ivory, silver, and antique-gold world is preserved. A dark S++ artwork stage creates a deliberate contrast between quiet reading chapters and the original illustrations. Text stays on the shaded left side on desktop and below the character's face on phones. New landscapes remain uncompressed originals; fullscreen art remains manually browsed.

The focal motion is a short light sweep across the chosen S++ scene, accompanied by a bounded image reveal. Manual selection interrupts the previous scene and voice; no slideshow changes a character while the visitor is reading. Existing cutout form rotation remains local, pausable, and visibility-aware. Voice buttons provide immediate playback state and subtitles; reduced motion removes spatial effects without affecting sound controls.

The atlas pairs a current painted map with a selected region painting and face portraits. On phones the map controls become named accessible icon buttons and the region panel sits underneath. All map coordinates come from the supplied region data. Beacon lighting is an explicitly illustrative preview.
