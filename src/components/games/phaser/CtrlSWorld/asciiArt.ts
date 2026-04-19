/**
 * CTRL-S World — ASCII Art Library
 *
 * R83.CTRLS.28: Pure Matrix vibes. Every piece designed for a 1999 phosphor
 * CRT terminal at 12-14px monospace. No emoji. No cute retro pixels.
 * Box-drawing (U+2500 range), half-block shades, sparse Katakana only.
 *
 * Colour is applied at render time via MATRIX_COLORS — nothing is baked here.
 *
 * Column-width note: Katakana glyphs (U+30A0–U+30FF) are East-Asian fullwidth
 * and render at 2 columns in any fixed-pitch context. `assertMonospace` uses
 * a visual-width helper that counts fullwidth codepoints as 2 so pieces that
 * mix Katakana with half-width ASCII still satisfy the constraint.
 */

// ─── Type IDs ────────────────────────────────────────────────────────────────

export type ChapterId =
  | 'prologue'
  | 'chapter1'
  | 'chapter2'
  | 'chapter3'
  | 'chapter4'
  | 'chapter5';

export type CharacterId =
  | 'averag'
  | 'senora'
  | 'elon'
  | 'steve'
  | 'billiam'
  | 'samuel'
  | 'protector';

// ─── Validation helper ────────────────────────────────────────────────────────

/**
 * Returns the visual column width of a string, counting East-Asian fullwidth
 * and wide codepoints (e.g. Katakana U+30A0–U+30FF, CJK, fullwidth Latin) as
 * 2 columns and everything else as 1.
 */
export function visualWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    // Katakana block, Katakana Phonetic Extensions, CJK Unified Ideographs,
    // CJK Compatibility Ideographs, Fullwidth Latin/ASCII, fullwidth punctuation.
    if (
      (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana + Katakana
      (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs
      (cp >= 0xff01 && cp <= 0xff60) || // Fullwidth ASCII variants
      (cp >= 0xffe0 && cp <= 0xffe6)    // Fullwidth signs
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

/**
 * Throws if any non-empty line in `piece` differs in visual column width from
 * the first non-empty line. Call this in tests to catch misaligned art before
 * it ships to the renderer.
 */
export function assertMonospace(piece: string): void {
  const lines = piece.split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return;
  const expected = visualWidth(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const w = visualWidth(lines[i]);
    if (w !== expected) {
      throw new Error(
        `assertMonospace: line ${i} has visual width ${w}, expected ${expected}.\n` +
          `  line 0 (${expected}): "${lines[0]}"\n` +
          `  line ${i} (${w}):    "${lines[i]}"`,
      );
    }
  }
}

// ─── Chapter Sigils ───────────────────────────────────────────────────────────
//
// Rendered in the LEFT pane at ASCII_FONT_SIZE = 7px.
// Canvas left-pane width = 240px.
// Each sigil targets 24 cols so it centres with breathing room.
//
// Visual identity per chapter:
//   prologue  — digital rain cascade descending onto a globe wireframe
//   chapter1  — bunker cross-section: walls + terminal rows
//   chapter2  — hostile agent silhouette: sparse, menacing negative space
//   chapter3  — vertical code cascade: falling glyphs, pure vertical rhythm
//   chapter4  — bifurcation: two pills on diverging paths
//   chapter5  — keyboard close-up: CTRL+S chord lit at maximum weight

export const CHAPTER_SIGILS: Record<ChapterId, string> = {
  // Prologue: digital rain + globe wireframe. 24 cols, 14 lines.
  prologue: [
    '|0 |1 |0 |1 |0 |1 |0 |1 ',
    '|| || || || || || || || ',
    '|1 |0 |1 |0 |1 |0 |1 |0 ',
    '|| || || || || || || || ',
    '|0 |1 |0 |1 |0 |1 |0 |1 ',
    '+------ORBIT-----------+',
    '/  .---=========---.   \\',
    '|  PROTECTOR  RISING   |',
    '| /  DIGITAL RAIN  \\   |',
    '| \\  GRID WARPS  /   \\ |',
    '\\  `---=========---`   /',
    '+------GROUND----------+',
    '|0 |1 |0 |1 |0 |1 |0 |1 ',
    'PROLOGUE: DIGITAL DAWN  ',
  ].join('\n'),

  // Chapter 1: bunker cross-section — heavy walls, rectilinear, dense.
  // 24 cols, 13 lines.
  chapter1: [
    '========================',
    '| SECURE BUNKER - SV01 |',
    '|=======+==============|',
    '| VAULT | TERMINAL     |',
    '| ##### | > AUTH OK    |',
    '| ##### | >_           |',
    '|=======+==============|',
    '| .................... |',
    '|   ASSEMBLY  POINT    |',
    '| .................... |',
    '|======================|',
    '| CH.1  HEROES ASSEMBLE|',
    '========================',
  ].join('\n'),

  // Chapter 2: agent silhouette — hostile, antagonist-coded.
  // Sparse negative space with a looming figure and threat indicators.
  // 24 cols, 14 lines.
  chapter2: [
    '                        ',
    '       .-------.        ',
    '       | ##### |        ',
    '       `---+---`        ',
    '       .---+-------.    ',
    '       | ######### |    ',
    '       | # AGENT # |    ',
    '       | ######### |    ',
    '       `---+---+---`    ',
    '           |   |        ',
    '===========+===+========',
    '|THREAT LEVEL: EXTREME |',
    '========================',
    ' CH.2 - SILICON VALLEY  ',
  ].join('\n'),

  // Chapter 3: vertical code cascade — pure terminal rain.
  // Six falling columns of alternating binary + shade chars.
  // 24 cols, 14 lines.
  chapter3: [
    ' 01  10  11  00  01  10 ',
    ' ||  ||  ||  ||  ||  || ',
    ' ##  %%  ##  %%  ##  %% ',
    ' ||  ||  ||  ||  ||  || ',
    ' ::  ::  ::  ::  ::  :: ',
    ' ||  ||  ||  ||  ||  || ',
    ' 10  01  00  11  10  01 ',
    ' ||  ||  ||  ||  ||  || ',
    ' %%  ##  %%  ##  %%  ## ',
    '+----------------------+',
    '| CODE CASCADE v3.0    |',
    '| BREACH: IN PROGRESS  |',
    '+----------------------+',
    ' CH.3 - COUNTERMEASURES ',
  ].join('\n'),

  // Chapter 4: red-pill vs blue-pill binary fork — bifurcation motif.
  // 24 cols, 14 lines.
  chapter4: [
    '      .---------.       ',
    '      |  CHOOSE |       ',
    '      `----+----`       ',
    '    .------+-------.    ',
    '    |               |   ',
    ' .--+--.        .--+--. ',
    ' | RED |        | BLUE| ',
    ' | ### |        | %%% | ',
    ' |TRUTH|        | LIE | ',
    ' `-----`        `-----` ',
    '    |               |   ',
    ' REALITY       ILLUSION ',
    '========================',
    ' CH.4 - THE FINAL CHOICE',
  ].join('\n'),

  // Chapter 5: keyboard close-up with CTRL+S chord highlighted.
  // CTRL and S rendered as heavy blocks — the climax.
  // 24 cols, 15 lines.
  chapter5: [
    '+----------------------+',
    '|   K E Y B O A R D    |',
    '+----------------------+',
    '| [Q][W][E][R][T][Y][U]|',
    '| [A][S][D][F][G][H][J]|',
    '| [Z][X][C][V][B][N][M]|',
    '+----------------------+',
    '| [###]         [###]  |',
    '| [###]         [ S ]  |',
    '| [CTL]         [###]  |',
    '+----------------------+',
    '| ## CTRL+S = SAVE ##  |',
    '| ##   PRESS  NOW  ##  |',
    '+----------------------+',
    '  CH.5 - SAVE THE WORLD ',
  ].join('\n'),
};

// ─── Character Portraits ──────────────────────────────────────────────────────
//
// Rendered inside the 70×70 px portrait container at 7px font.
// All portraits are exactly 10 cols wide, 12 lines.
//
// Design intent:
//   averag    — protagonist: human, uncertain, capable
//   senora    — mentor/authority: sharp, architectural
//   elon      — comic-relief tech-bro: spiky, erratic
//   steve     — skeptic: blunt, blocky
//   billiam   — corporate: smooth, dense
//   samuel    — moral anchor: stable, vertical symmetry
//   protector — antagonist AI: hostile, surveillance-coded, mechanical
//               Kills the red-letter "P" placeholder — red tint at render time.

export const CHARACTER_PORTRAITS: Record<CharacterId, string> = {
  // Aver-Ag: protagonist. Humanoid framing, uncertain posture.
  averag: [
    '+--------+',
    '| .----. |',
    '| | /\\ | |',
    '| |/  \\| |',
    '| +----+ |',
    '+--------+',
    '|  /||\\  |',
    '| / || \\ |',
    '|   ||   |',
    '+--------+',
    '| AVER-AG|',
    '+--------+',
  ].join('\n'),

  // Senora: mentor. Upright, sharp — authority without warmth.
  senora: [
    '+--------+',
    '| .----. |',
    '| |####| |',
    '| |####| |',
    '| `----` |',
    '+--------+',
    '| .----. |',
    '| | || | |',
    '| `----` |',
    '+--------+',
    '| SENORA |',
    '+--------+',
  ].join('\n'),

  // Elon-gated: erratic tech-bro. Deliberately asymmetric.
  elon: [
    '+--------+',
    '|/\\ /\\   |',
    '| ####   |',
    '| ####   |',
    '| %%%%   |',
    '+--------+',
    '|/\\ /\\   |',
    '|  ||    |',
    '|   \\    |',
    '+--------+',
    '|  ELON  |',
    '+--------+',
  ].join('\n'),

  // Steve: skeptic. Blocky, no-nonsense.
  steve: [
    '+--------+',
    '| ###### |',
    '| ##  ## |',
    '| ###### |',
    '| ##  ## |',
    '+--------+',
    '|  ####  |',
    '|  #  #  |',
    '|  ####  |',
    '+--------+',
    '| STEVE  |',
    '+--------+',
  ].join('\n'),

  // Billiam: corporate. Dense, smooth.
  billiam: [
    '+--------+',
    '| %%%%%% |',
    '| %####% |',
    '| %####% |',
    '| %%%%%% |',
    '+--------+',
    '| :::::: |',
    '| : __ : |',
    '| :::::: |',
    '+--------+',
    '|BILLIAM |',
    '+--------+',
  ].join('\n'),

  // Samuel: moral anchor. Vertical symmetry, grounded.
  samuel: [
    '+--------+',
    '| |####| |',
    '| |####| |',
    '| |    | |',
    '| |####| |',
    '+--------+',
    '| |    | |',
    '| |    | |',
    '| |    | |',
    '+--------+',
    '| SAMUEL |',
    '+--------+',
  ].join('\n'),

  // Protector: antagonist AI — hostile, surveillance-coded, mechanical.
  // Replaces the raw red-letter "P" placeholder.
  // An eye-like aperture inside a circuit frame — machine watching.
  // Red tint applied at render time via character.colourHex (#ff0000).
  protector: [
    '+--------+',
    '|########|',
    '|#.----.#|',
    '|#| ## |#|',
    '|#|####|#|',
    '|#| ## |#|',
    '|#`----`#|',
    '|########|',
    '+--------+',
    '|PROTECTR|',
    '+--------+',
  ].join('\n'),
};

// ─── Transition Beats ─────────────────────────────────────────────────────────
//
// Short 3-5 line interstitials between paragraphs or chapter breaks.
// 12 entries — varied enough that the player sees different beats each play.

export const TRANSITION_BEATS: readonly string[] = [
  // 1 — signal fragmenting. 24 cols.
  [
    '::::::::::::::::::::::::',
    ':: SIGNAL FRAGMENTING ::',
    '::::::::::::::::::::::::',
  ].join('\n'),

  // 2 — data stream loading bar. 24 cols.
  [
    '+----------------------+',
    '| ########.......      |',
    '|   LOADING  63%...    |',
    '+----------------------+',
  ].join('\n'),

  // 3 — matrix rain column burst. 24 cols.
  [
    '+- MATRIX RAIN BURST --+',
    '|  01 10 11 00 01 10   |',
    '|  ## %% ## %% ## %%   |',
    '+----------------------+',
  ].join('\n'),

  // 4 — transmission received. 24 cols.
  [
    '+----------------------+',
    '| TRANSMISSION RECEIVED|',
    '| SOURCE: [REDACTED]   |',
    '+----------------------+',
  ].join('\n'),

  // 5 — clock tick / temporal marker. 24 cols.
  [
    '------------------------',
    '  T+00:00:00  ELAPSED   ',
    '  SYSTEM CLOCK: RUNNING ',
    '------------------------',
  ].join('\n'),

  // 6 — hostile scan sweep. 24 cols.
  [
    '########################',
    '## PROTECTOR SCAN: ON ##',
    '## THREAT LEVEL: HIGH ##',
    '########################',
  ].join('\n'),

  // 7 — memory access flicker. 23 cols.
  [
    '::READ  mem[0xFF3A] ::',
    '::WRITE mem[0x0042] ::',
    '::EXEC  seg[0xDEAD] ::',
  ].join('\n'),

  // 8 — chapter boundary pulse. 24 cols.
  [
    '========================',
    '  ### CHAPTER BREAK ### ',
    '========================',
  ].join('\n'),

  // 9 — network node hop. 24 cols.
  [
    '  [NODE:A]--[NODE:B]    ',
    '      |         |       ',
    '  [NODE:C]--[NODE:D]    ',
    '  ROUTING: ESTABLISHED  ',
  ].join('\n'),

  // 10 — binary static. 23 cols.
  [
    ' 01001000 01100101 0110',
    ' 01110000 00100000 0110',
    ' ........ STANDBY .....',
  ].join('\n'),

  // 11 — countdown sequence. 24 cols.
  [
    '+----------------------+',
    '|  INITIATING  IN  3.. |',
    '|  INITIATING  IN  2.. |',
    '|  INITIATING  IN  1.. |',
    '+----------------------+',
  ].join('\n'),

  // 12 — carrier wave lost. 23 cols.
  [
    ' .  :  .  .  :  .  .  .',
    ' :  .  :  .  :  .  :  .',
    ' CARRIER WAVE LOST  ...',
    ' :  .  :  .  :  .  :  .',
  ].join('\n'),
];

// ─── Decorative Glyphs ────────────────────────────────────────────────────────
//
// Small atmospheric elements for layout backgrounds, tile decoration, and
// ambient terminal chrome. Exported as a record for direct lookup by key.
// 28 entries — all single-string values.

export const DECORATIVE_GLYPHS: Record<string, string> = {
  // Corner mounts
  lBracket_topLeft:     '+-',
  lBracket_topRight:    '-+',
  lBracket_bottomLeft:  '+-',
  lBracket_bottomRight: '-+',

  // Status LEDs
  statusLED_on:   '[*]',
  statusLED_off:  '[ ]',
  statusLED_warn: '[!]',
  statusLED_err:  '[X]',

  // Prompt arrows
  promptArrowThin:   '> ',
  promptArrowDouble: '>>',
  promptArrowBold:   '=>',
  promptArrowFat:    '==>',

  // Connector lines
  connectorLine_short:  '----------',
  connectorLine_long:   '--------------------------',
  connectorLine_vert:   '|\n|\n|',

  // Circuit traces
  circuitTrace_horizontal: '-+-+-+-+-+-+-+-+-',
  circuitTrace_node:       '-[o]-',
  circuitTrace_corner:     '`--+',

  // Terminal chrome
  cursorBlock: '#',
  cursorBlink: '_',

  // Matrix rain columns (decorative — no strict alignment constraint)
  matrixRain_short:  ['|', '#', ':'].join('\n'),
  matrixRain_medium: ['|', '#', '%', ':', '.'].join('\n'),

  // Katakana decorative line (standalone — not embedded in aligned pieces)
  katakanaBurst: 'ア イ ウ エ オ カ キ',

  // Terminal frames
  terminalFrame_mini: [
    '+---------+',
    '|  > _    |',
    '+---------+',
  ].join('\n'),

  terminalFrame_wide: [
    '+==================+',
    '| TERMINAL ACTIVE  |',
    '| > _              |',
    '+==================+',
  ].join('\n'),

  // Dividers
  scanline_divider:    '- - - - - - - - - - - -',
  sectionBreak_double: '========================',
  sectionBreak_single: '------------------------',

  // Shade gradients
  shadeGradient:         '..::##@@',
  shadeGradient_reverse: '@@##::..',

  // Binary row
  binaryRow: '01101000 01100101',

  // Crosshair
  crosshair: '+',

  // Signal lost indicator
  signalLost: '[~~NO SIGNAL~~]',
};
