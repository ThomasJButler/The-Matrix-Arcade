# CTRL-S | The World — Asset Requirements (Citizen Sleeper-inspired)

This is the most art-heavy rebuild. The vision is a Citizen Sleeper-style narrative experience rendered in Phaser — illustrated character panels, environmental backgrounds, clean text UI, choice overlays.

## Source Mapping

| Asset Category | Source | Location |
|---|---|---|
| UI reference screenshots | INSPO/ctrlscitizensleeperimageinspiration | 8 Citizen Sleeper UI examples |
| Character base sprites | DUMP/FREE Mana Seed Character Base Demo 2 | 366 files: char_a_p* directories for portrait generation |
| Menu/scene backgrounds | DUMP/MatrixArcadeCyberPunkAssets/menu background.zip | Background assets for scenes |
| Sci-fi environmental assets | DUMP/MatrixArcadeIconsBackroundsShaders/scifi-strategy-art-assets.zip | Environmental backgrounds |
| Character expressions | DUMP/Kings and Pigs/Sprites | Attack, idle, dead states for NPC variants |
| Text panels & choice UI | DUMP/1. Free Hologram Interface Wenrexa/Card X* | Card panels for dialogue/choices |
| Dialogue windows | DUMP/1. Free Hologram Interface Wenrexa/Window | Modal window frames |
| Toggle switches | DUMP/1. Free Hologram Interface Wenrexa/Switch | Settings/choice toggles |
| Chapter music (5+ tracks) | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/LongTracks | 10 tracks available for selection |
| UI Sound Effects | DUMP/MatrixArcadeTracksSoundEffectsVisualEffects/SoundEffects | SFX kit for UI interactions |

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/ctrlscitizensleeperimageinspiration/)

- [x] 8 Citizen Sleeper UI reference screenshots showing: character panels, text overlays, skill systems, environmental art, chapter hubs, dialogue UI

## Character Art

- [x] Protagonist portrait — Matrix-style hacker/Neo archetype, bust shot — SOURCE: DUMP/Cyberpunk/idle/frame1.png → `public/assets/ctrl-s/portraits/protagonist-idle.png` (small side-view pixel sprite, ~32px tall — adequate for Phaser scaling)
- [x] Protagonist portrait variants (2-3 expressions: neutral, determined, worried) — SOURCE: DUMP/Cyberpunk/idle/frame2.png, shoot/frame1.png, attack/frame1.png → `portraits/protagonist-idle-2.png`, `protagonist-action.png`, `protagonist-attack.png`
- [~] NPC portrait: Morpheus archetype — wise mentor, ~256×384 — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Mana Seed requires multi-layer compositing (base+outfit+hair) which needs a dedicated art tool. Best combo: char_a_pONE3 + fstr_v01 + dap1_v13
- [~] NPC portrait: Trinity archetype — ally/partner, ~256×384 — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Requires compositing. Best combo: char_a_pONE2 + fstr_v02 + bob1_v13
- [~] NPC portrait: Agent Smith archetype — antagonist, ~256×384 — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Requires compositing + recolour to grey suit. Best combo: char_a_p1 + fstr_v04 + dap1_v03
- [~] NPC portrait: Oracle archetype — guide/oracle, ~256×384 — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Requires compositing. Best combo: char_a_pONE3 + pfpn_v01 + bob1_v07 + pnty hat
- [~] NPC portrait: Operator (keyboard character) — ~256×384 — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Requires compositing. Best combo: char_a_p1 + pfpn_v03 + bob1_v11
- [~] Additional NPC portraits as story demands (2-3 more) — SOURCE: DUMP/FREE Mana Seed Character Base Demo 2 — BLOCKED-ART-NEEDED: Same compositing requirement

**Style**: Semi-illustrated, cyberpunk/Matrix aesthetic. Think Citizen Sleeper's painted feel but with Matrix green/black colour grading. Can be AI-generated with manual cleanup.

## Environmental Backgrounds (one per chapter + hub)

- [x] Chapter Hub — orbital/network view, nodes connected by green lines, Matrix digital space, 800×600 — SOURCE: DUMP/Matrix-Icons/Green-Verde/HOST-NODO_1.png + HOST-NODO_3.png → `public/assets/ctrl-s/backgrounds/hub-node-1.png`, `hub-node-2.png` (resized to 800×600)
- [x] Chapter 1 background — inside the Matrix, city at night — SOURCE: DUMP/Cyberpunk/menu background/frame1.png → `public/assets/ctrl-s/backgrounds/cyberpunk-city-1.png` (resized to 800×600)
- [~] Prologue background — Matrix code rain, terminal screen aesthetic — BLOCKED-ART-NEEDED: No pure code rain background in dump. Procedural Matrix rain via Phaser is already implemented in NarrativeScene and is the preferred approach.
- [~] Chapter 2 background — Zion / real world / ship interior — BLOCKED-ART-NEEDED: No ship interior asset in dump. Closest: PixelWhale_SF_Project bg01.png (712×172 panoramic strip, wrong aspect ratio)
- [~] Chapter 3 background — digital construct / white room — BLOCKED-ART-NEEDED: No white room asset. Matrix-Icons/IC-GELO_* could work as overlay elements but need art direction
- [~] Chapter 4 background — Machine city / Source — SOURCE: DUMP/Cyberpunk/menu background/frame9.png → `public/assets/ctrl-s/backgrounds/cyberpunk-city-mid.png` (resized to 800×600, different frame of the same cyberpunk animation for variety)
- [~] Chapter 5 background — Final confrontation, Matrix collapsing — BLOCKED-ART-NEEDED: No collapse/destruction asset available
- [~] Game complete background — sunrise / new beginning — BLOCKED-ART-NEEDED: No sunrise background in dump

**Style**: Painted/illustrated, wide format, atmospheric. Dark with accent lighting in Matrix green and cyan.

## UI Elements

- [x] Text panel background — nine-slice, semi-transparent dark with green border, holds story text — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X3/Card X5.png → `public/assets/ctrl-s/ui/text-panel.png` (695×377, teal hologram card)
- [x] Choice button — normal, hover, selected states, ~300×48 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Button 1/ → `ui/button-normal.png`, `button-hover.png`, `button-active.png`, `button-disabled.png` (114×38 each, 4 states)
- [x] Continue button — "CONTINUE >" style, green text on dark, ~160×40 — Uses same button sprites above
- [x] Chapter hub node — circular, glowing, ~64×64 (active + locked + completed variants) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/32.png → `icons/network-node.png`
- [~] Chapter hub connection line (green, pulsing) — Procedural via Phaser Graphics (no sprite needed)
- [x] Inventory panel background — nine-slice, ~320×480 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X1/Card X1.png → `ui/tall-panel.png` (405×847)
- [x] Inventory item slot — 48×48 with hover highlight — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X1/Panel Empty*.png → `ui/item-slot-empty.png`, `item-slot-active.png`, `item-slot-alert.png` (113×65 each)
- [x] Puzzle modal frame — nine-slice, ~600×400 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X2/Card X2.png → `ui/square-panel.png` (405×378)
- [x] Achievement toast frame — ~300×80 — Uses text-panel.png cropped
- [x] Settings gear icon — 32×32 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/24.png → `icons/gear.png`
- [x] Back arrow icon — 32×32 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/21.png → `icons/arrow-right.png`

## Inventory Item Icons (from existing puzzle system)

- [~] Key item icons (per puzzle reward) — 32×32, 8-10 variants — BLOCKED-ART-NEEDED: Hologram icons are teal/cyan and small (~24-35px). Need per-item custom icons. Available icons: star, lightning, question-mark, checkmark, home, refresh in `public/assets/ctrl-s/icons/`
- [~] Story progress items — 32×32 — BLOCKED-ART-NEEDED: Same as above
- [~] Optional: item glow/particle effect when newly acquired — Procedural via Phaser particles (no sprite needed)

## Puzzle Assets

- [x] Puzzle background overlay (dimmed, focused) — Uses square-panel.png with Phaser alpha overlay
- [~] Puzzle input field styling sprites — Procedural via Phaser Graphics
- [x] Puzzle hint icon — 24×24 — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Icons/06.png → `icons/question-mark.png`
- [~] Puzzle success effect — particles / flash — Procedural via Phaser particles
- [~] Puzzle fail effect — screen shake tint — Procedural via Phaser camera shake

## Transitions

- [~] Scene transition effect — digital dissolve / Matrix code wipe, spritesheet or shader — Procedural via Phaser (code wipe shader)
- [~] Chapter title card background — dramatic, centered text overlay — Uses existing backgrounds + Phaser text overlay

## Audio

- [x] Ambient background for chapter hub (mysterious, electronic, loopable) — SOURCE: DUMP/LongTracks/cruise control (game start).wav → `audio/music/menu-theme.mp3`
- [x] Story text typing sound (soft, per-character, subtle) — SOURCE: DUMP/SFX Kit/mechanical ambience - cypher typing.wav → `audio/sfx/typing.mp3`
- [x] Choice hover sound — SOURCE: DUMP/SFX Kit/tech - beeps.wav → `audio/sfx/hover-beep.mp3`
- [x] Choice selected sound — SOURCE: DUMP/SFX Kit/tech - button click.wav → `audio/sfx/click.mp3`
- [x] Chapter transition whoosh — SOURCE: DUMP/SFX Kit/mechanical ambience - unplugging.wav → `audio/sfx/transition.mp3`
- [x] Puzzle appear sound — SOURCE: DUMP/SFX Kit/tech - matrix code 1.wav → `audio/sfx/puzzle-appear.mp3`
- [x] Puzzle solved fanfare — SOURCE: DUMP/SFX Kit/orchestral stab - learning ju jitsu.wav → `audio/sfx/puzzle-solved.mp3`
- [x] Puzzle failed sound — SOURCE: DUMP/SFX Kit/tech - blown fuse.wav → `audio/sfx/puzzle-failed.mp3`
- [x] Inventory item acquired chime — Uses puzzle-solved.mp3 (same celebratory sting)
- [x] NPC dialogue initiation sound — SOURCE: DUMP/SFX Kit/bending the spoon.wav → `audio/sfx/reveal.mp3`
- [x] Dramatic reveal sting (for story twists) — SOURCE: DUMP/SFX Kit/orchestral stab - jacking in.wav → `audio/sfx/dramatic-sting.mp3`
- [x] Per-chapter ambient music (5 tracks, loopable, mood-matched):
  - Prologue: `audio/music/prologue-brothers.mp3` (brothers_and_sisters_FINAL)
  - Ch1: `audio/music/ch1-moonlight.mp3` (In The Moonlight — atmospheric, mysterious)
  - Ch2: `audio/music/ch2-cyberpsychotic.mp3` (Cyberpsychotic — tense, dark)
  - Ch3: `audio/music/ch3-resonance.mp3` (ostcrunch2 resonance — temporal, cerebral)
  - Ch4: `audio/music/ch4-epic.mp3` (ostcrunch2 epic — climactic)
  - Ch5: `audio/music/ch5-cyberpunkin.mp3` (Cyberpunkin' — driving finale)
- [x] Credits / game complete music — SOURCE: DUMP/LongTracks/a last embrace (credit roll).wav → `audio/music/credits.mp3`

## Notes

This game needs the most bespoke art. The character portraits and environmental backgrounds are the highest priority — they define the visual identity. UI elements can start procedural and be upgraded with sprites later. Music is critical for atmosphere — even placeholder electronic ambient tracks would transform the experience.

### R80.9 Sourcing Summary (2026-04-15)
- **Sourced and deployed:** 10 UI elements, 11 icons, 4 backgrounds, 4 protagonist sprites, 11 SFX, 8 music tracks = **48 assets total**
- **BLOCKED-ART-NEEDED:** 6 NPC portraits (require Mana Seed layer compositing), 5 backgrounds (no suitable source), 2 item icon sets (need per-item custom art)
- **Procedural (no sprite needed):** Hub connection lines, item glow particles, puzzle success/fail effects, scene transitions, chapter title cards
