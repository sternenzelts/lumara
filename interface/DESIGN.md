---
name: Gacha Retro
description: A painted Lumara game world with cinematic Sanctuary scenes, edge navigation and readable task workspaces.
colors:
  ink: "#253c50"
  muted: "#586e7f"
  gold: "#987a3b"
  blue: "#40749a"
  line: "#dce5ec"
  paper: "#fff"
  canvas: "#f3f7fa"
  input: "#f8fafc"
  input-line: "#cbd8e2"
  focus: "#6998ba"
  secondary: "#edf3f7"
  primary-hover: "#3c5970"
  secondary-hover: "#dce9f2"
  radiance: "#3c7294"
  fracture: "#8c5b4e"
  spark: "#466950"
  wildcard: "#776188"
  game-cream: "#fff2d6"
  game-gold: "#e3c580"
  game-dark: "#203c50"
  game-primary: "#e3c580"
  game-primary-text: "#203448"
  game-secondary: "#102739"
  game-focus: "#ffe3a0"
  game-panel-focus: "#ffe3a0"
  scene-shadow: "#081827"
  scene-dialogue: "#0a1b2ded"
  scene-text: "#f5ecda"
  scene-separator: "#bca16b80"
  game-glass: "#102436e8"
  game-muted: "#c3d4df"
  game-field: "#112739"
  game-unowned: "#142b3d"
  game-caption: "#c8d7e2"
typography:
  display:
    fontFamily: "Marcellus, serif"
    fontSize: "clamp(64px, 7.8vw, 112px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Marcellus, serif"
    fontSize: "38px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Marcellus, serif"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 700
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.01em"
rounded:
  badge: "4px"
  control: "7px"
  field: "8px"
  card: "10px"
  hall: "12px"
  surface: "14px"
  dialog: "2px"
  game-frame: "2px"
spacing:
  compact: "8px"
  control-gap: "12px"
  row: "16px"
  section-gap: "20px"
  panel-gap: "26px"
  panel: "28px"
  panel-wide: "32px"
  game-panel-inline: "33px"
components:
  button-primary:
    backgroundColor: "linear-gradient(110deg,#c7a75e,#ffe8b0 48%,#d3b06a)"
    textColor: "{colors.game-primary-text}"
    typography: "{typography.button}"
    rounded: "{rounded.game-frame}"
    padding: "12px 22px"
    height: "45px"
  button-primary-hover:
    backgroundColor: "linear-gradient(110deg,#e0c17c,#fff0c3,#e0c17c)"
  button-secondary:
    backgroundColor: "{colors.game-secondary}"
    textColor: "#ffe4ae"
    typography: "{typography.button}"
    rounded: "{rounded.game-frame}"
    padding: "12px 22px"
    height: "45px"
  button-secondary-hover:
    backgroundColor: "#294557"
  button-link:
    textColor: "#426c8b"
    typography: "{typography.button}"
    padding: "6px 0"
    height: "34px"
  field:
    backgroundColor: "{colors.game-field}"
    textColor: "{colors.game-cream}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    width: "100%"
  game-dock:
    textColor: "#f4ead5"
    width: "225px"
  game-dock-active:
    backgroundColor: "#dec18820"
    textColor: "#ffe4a8"
  game-dialogue:
    backgroundColor: "{colors.scene-dialogue}"
    textColor: "{colors.scene-text}"
    padding: "22px 30px"
  button-enter:
    textColor: "#273f51"
    height: "61px"
  grade:
    backgroundColor: "#fbf4e4"
    textColor: "#775c27"
    rounded: "{rounded.badge}"
    padding: "2px 9px"
  category-picker:
    backgroundColor: "#f7fafc"
    textColor: "#5d7c93"
    rounded: "{rounded.control}"
    padding: "14px 5px 12px"
  character-card:
    backgroundColor: "#172e40"
    rounded: "{rounded.game-frame}"
    padding: "0"
  vote-fragment:
    backgroundColor: "#fafcfd"
    rounded: "{rounded.card}"
    padding: "22px"
  retro-surface:
    backgroundColor: "#172e40"
    rounded: "{rounded.game-frame}"
    padding: "28px 32px 34px"
---

# Design System: Gacha Retro

## Overview

**Creative North Star: "A bright sky Sanctuary"**

Lumara is a painted game world with icy light, cream lettering, dark glass and fine gold frames. Original supplied artwork establishes the setting; Marcellus gives places and names a ceremonial voice while Manrope keeps actions and retrospective tasks clear. Lumara remains the world's name; this documentation does not settle the final game title.

The title opens on the supplied Lumara map with Seren and an entry action. For Sanctuary and menus, Jay selected cinematic full-screen scenes, large Seren and a simple dialogue box after rejecting the former floating-card composition. The implementation follows that direction; Jay's visual review remains pending. The title and opening/story composition retain their existing layout.

**Key Characteristics:**

- Supplied full-screen map painting and original Seren cutout.
- Cinematic scene shading, warm readable text and fine gold separators.
- Large Sanctuary character with quiet edge navigation.
- Marcellus names and headings with practical Manrope controls.
- Scene workspaces with readable dark task surfaces, optional voice and motion preferences.

Local currency, randomized pulls and pity are implemented. New players complete the full story, make a five free welcome wishes and enter Sanctuary; this visual redesign preserves that flow. The production adapter remains separate.

## Colors

### Primary

- **Slate ink** (`ink`) remains the task text foundation; **game primary** and **game primary text** describe the game task action treatment.
- **Quiet sky blue** (`blue`) remains available to native form accents and task links. **Game dark** anchors the painted HUD and scene framing.

### Secondary

- **Muted gold** (`gold`) continues to mark emblems and small accents. **Game gold** supplies the shell's fine frames and ceremonial edges; it is a contextual extension of the inherited light world.

### Tertiary

- **Radiance blue**, **Fracture clay**, **Spark green** and **Wildcard lilac** distinguish thought categories alongside their plain Keep, Problem, Try and Wildcard labels.
- Character accents remain roster-driven. The standalone map uses the five supplied nation colors from `src/data/map-regions.json`; those accents do not replace the global task palette.

### Neutral

- **Icy canvas**, **white paper** and **silver line** remain task foundations and fallbacks. The visible shell is the painting with cinematic scene shading and dark foreground controls; inherited light tokens remain available outside that context.
- **Game cream** supplies warm readable foregrounds over the painting. **Game secondary** is the dark alternate-action treatment inside game menus.
- **Muted slate**, **frosted field** and **field line** retain the readable form system. Use the documented final muted token rather than the earlier overwritten declaration.
- **Game focus** and **game panel focus** provide bright gold outlines against dark scene workspaces. The base **focus blue** remains available to shared controls outside the shell.

**The Thin Gold Rule.** Use gold for fine separators, emblems, focus and primary actions; preserve the supplied bright painting behind the dark foreground treatment.

- **Scene shadow**, **scene dialogue** and **scene text** define the cinematic foreground against the map. **Scene separator** provides its subtle gold edge.
- **Game glass**, **game muted** and **game field** retain readable task and dialog surfaces. **Game unowned** and **game caption** keep unavailable companion silhouettes and secondary captions readable.

## Typography

**Display Font:** Marcellus, with serif fallback.  
**Body Font:** Manrope, with sans-serif fallback.

Both families are requested through Google Fonts in `index.html`; bundled artwork and application dependencies remain separate from that font request. Marcellus uses regular weight. Manrope carries readable labels, instructions, forms and numbers.

The welcome wordmark retains the display token. Cinematic Sanctuary location names use Marcellus at (clamp(36px, 4vw, 58px)); scene workspace titles use (40px), reducing to (30px) on phones. Sanctuary speaker names use (26px), reducing to (23px), and dialogue uses Manrope at (15px/1.7), reducing to (13px/1.65). Desktop destination labels use (14px); compact phone labels use (9px) alongside visible icons. Controls retain the practical inherited type scale, and currency uses tabular figures. Hall thoughts retain their larger serif treatment and wrap user content.

**The Two Voices Rule.** Use Marcellus for headings and character identity; keep Manrope for controls, labels and task instructions.

## Layout

The active shell fills the viewport at (100dvh) with the supplied map covering the background. Sanctuary gives the central scene to large Seren, location and twelve beacon pips at upper left, and a wide dialogue surface along the bottom. The desktop navigation rail sits (38px) from the right at (225px) wide. Voyage precedes the six destinations in normal rail flow, so long session names push navigation down rather than covering it.

Task menus occupy the scene with a large title and one return action, subdued Seren behind content and the same destination navigation. Their outer workspace is transparent and unframed; native task cards remain dark and readable. Desktop content runs from (38px) on the left to (302px) from the right, from (115px) at the top to (35px) above the bottom. The content scrolls within the workspace; navigation remains available. The standalone map retains its own full-screen controls.

| CSS query | Implemented response |
| --- | --- |
| `max-width: 1100px` and `min-width: 681px` | Navigation rail narrows to 185px at a 28px right inset. Dialogue and task content reserve 245px on the right. Wish banners stack into one column. |
| `max-width: 680px` | Large Seren remains central. Six destinations form one compact bottom strip, Voyage sits above dialogue, and wallet controls remain at the top. Task workspace uses 20px side insets, 118px top and 98px bottom reservations. |
| `max-height: 720px` on desktop | Location, rail and dialogue compact vertically. |
| `max-height: 700px` on phones | Smaller location type, dialogue padding and character proportions preserve available space. |

Existing task grids continue to adapt independently. Target phone width is (375px). Shared dialogs remain constrained to the viewport. Title and opening/story layout are unchanged by the cinematic Sanctuary override.

## Elevation & Depth

Depth comes from the supplied painting, dark scene shading and overlapping character art. Sanctuary dialogue uses a flat dark surface with one fine top separator; Voyage and desktop destination navigation have no card background. Menus subdue the painting and Seren instead of placing content in a heavy outer panel. Inner task cards, fields, system controls and dialogs retain dark surfaces for readability.

### Shadow Vocabulary

- **Seren:** (`drop-shadow(0 12px 24px #142b426e)`) separates the supplied cutout from the painting.
- **Title dialogue:** (`0 14px 35px #142d4540`) remains part of the unchanged title treatment.
- **Toast:** (`0 8px 26px #243b532e`) and **dialog:** (`0 18px 55px #253f5b26`) retain shared foreground depth.

**The Surface Depth Rule.** Let scene shading and character overlap carry Sanctuary and menu depth; retain dark inner surfaces where tasks need legibility.

## Shapes

Title retains fine rectangular frames and diamond ornaments. Cinematic Sanctuary and menu navigation uses unframed Lucide icons and restrained separators; circular system controls remain. Game-menu buttons, task surfaces and shared dialogs use the tighter game-frame radius; cinematic collection and exchange cards use square corners. Existing rounded native fields and rarity badges retain their individual roles; the base radius primitives do not mandate rounding every surface.

Character portraits crop toward the face. Seren's supplied cutout uses contained proportions and bottom alignment; scene-specific sizing must retain precedence over generic character-image CSS. The welcome and Sanctuary reuse the same original art at different scales.

## Components

### Buttons and entry

Enter Lumara is a pale gold gradient action with a thin border and offset outline, Marcellus label and arrow. Its desktop height is (61px), reducing to (49px) on phones. Shared task buttons retain native submit and disabled behavior, with angled gold primary and dark glass secondary treatments and a tight radius inside panels. Circular system buttons are (40px), or (32px) on phones. The shell focus outline is (3px) with (5px) offset; dark task panels use the same gold focus token.

### Forms and task controls

Fields retain visible labels, dark game backgrounds, readable pale placeholders and native behavior. The inherited frosted field tokens remain available outside the game context. Textareas resize vertically; settings retain two-column layouts that stack on phones. Category choices combine color, a selected border and pressed state with both themed and plain labels. Anonymous thoughts and votes do not expose authors or voters. Busy and empty states remain explicit.

The Vow journal shows carried action items, owner or shared-team text, status and a fulfilled toggle. It permits the current admin or active Warden to call the existing Backend update method, disabling the control for other users or while busy. Retrospective review retains its existing status controls. This presentation does not transfer authorization or game logic into the design layer.

### HUD, navigation and panels

The HUD shows player identity, cosmetic companion portrait, Starlight and Stardust, motion, voice and help. Admin settings are shown only to the admin. The Sanctuary's beacon counter opens the map. Its voyage gate offers Start a Retro to the admin, Join Retro to players, or Join Voyage for an active session, or Continue Voyage after the player has joined.

The dock provides World Map, Companions, Wishes, Exchange, Vows and Archives. Thin Lucide icons and labels form a vertical desktop rail and six-column phone strip. Hover adds a dark backing; the active route uses a subtle gold backing and bright gold foreground, with `aria-current` on the current destination. Task screens receive focus when opened and expose one native Back to Sanctuary control. They are route workspaces, not modal dialogs, so the dock remains usable. Shared create/join/help dialogs retain their focus trap, Escape behavior and focus restoration.

The retrospective stage track keeps numbered progress, themed and plain labels and current/completed states. The game treatment adds a dark stage strip and gold current underline. Warden controls remain grouped after the task with the existing back, next, pause and skip actions.

### Cards, badges and imagery

Collection cards retain portraits, serif names, element labels, rarity badges and hover lift. S++ remains cool blue, S+ gold and A lilac. The shared Art component supplies a readable silhouette fallback for unavailable images. Companions stay cosmetic.

The supplied `lumara_map_v2.webp` is the welcome, Sanctuary and menu background, with original Seren cutout art layered above it. The former title video is not part of the active welcome. Images are copied unchanged; provenance accompanies `public/art/world/` and character folders. Map-region JSON and current roster data govern companion assignments; older product roster descriptions are not an implementation authority. No new painting or franchise mark is introduced.

### Scene and reveal choreography

The shell uses four CSS clouds and sixteen motes, a (1.6s) map entrance, a (7s) Seren breathing loop and a (.4s) cinematic menu entrance. Pause motion and reduced motion retain content with static presentation; hidden tabs pause ambient animation and audio. Shared local preferences are `lumara.motionPaused` and `lumara.serenMuted`. Voice follows the remembered Seren mute setting, requires a player gesture, and uses supplied Japanese welcome lines. It stops on mute, route change, hidden tabs and unmount; written dialogue remains available.

The Sanctuary displays fulfilled-Vow progress capped at twelve; the map supplies the ordered beacon locations and celebrations. Seren is the only full-size character in Sanctuary. The selected companion remains in the HUD and collection; no roaming pulled character is shown. Player names come from `useUI().me.name` and profiles, preserving saved nicknames.

Kenka plays on the title and, by Jay's explicit choice, during the welcome/story with separate story mute and volume preferences; it ducks under Seren's voice and stops before the banner. Sanctuary retains its independently controlled background music. These audio changes do not change the title or story layout.

Pull reveals retain the shared standard pull and approved Ayaka sequence, rarity treatment, skip controls and reduced-motion presentation. This shell change does not alter pull outcomes, currency, votes, discussion order or permissions. App dialogs and pull overlays continue to use their existing focus and close behavior.

## Do's and Don'ts

### Do:

- **Do** preserve supplied map and character art, Marcellus and Manrope, dark glass, cream text and fine gold frames.
- **Do** keep the painted world visible behind the HUD and scene workspaces.
- **Do** pair fantasy terminology with plain task labels and preserve existing retrospective behavior.
- **Do** retain visible keyboard focus, native controls, readable text, remembered voice preferences and reduced-motion alternatives.
- **Do** keep task content scrolling inside the scene workspace and reserve space for edge navigation.
- **Do** distinguish implemented local economy behavior from the pending production adapter.

### Don't:

- **Don't** restore the rejected website sidebar, dashboard shell, marketing title composition or website footer.
- **Don't** replace the approved map welcome with the old title video.
- **Don't** introduce dark neon, terminal styling, copied franchise assets or invented final asset availability.
- **Don't** turn cosmetic characters, currency or decorations into task permissions or per-person rankings.
- **Don't** expose authors or voters in anonymous thought and vote components.
- **Don't** present local demo rooms or local currency calculations as authenticated production behavior.

