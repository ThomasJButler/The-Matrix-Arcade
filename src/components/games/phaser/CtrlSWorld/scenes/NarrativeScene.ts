import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG, CHARACTERS, PORTRAIT_CONFIG, PARALLAX_CONFIG, CHARACTER_TICK_MAP, NARRATOR_TICK, STINGER_KEYS, type CharacterDef } from '../config';
import { TypewriterEngine } from '../engine/TypewriterEngine';
import { TerminalEntryState } from '../engine/TerminalEntryState';
import {
  getChapter,
  getPuzzleTriggersForParagraph,
  getAsciiPanelForParagraph,
  getChoiceTriggerForParagraph,
  getTerminalTriggerForParagraph,
  getSpeakerForParagraph,
  type Chapter,
  type ChoiceOption,
  type ParticleTheme,
  type TerminalTrigger,
} from '../../../../../data/ctrlsChapters';

export interface NarrativeSceneData {
  chapterIndex: number;
  startFromParagraph?: number;
}

const ASCII_FONT_SIZE = '7px';
const ASCII_LINE_HEIGHT = 9;
const CURSOR_GAP_Y = 6;
const INLINE_ASCII_GAP_Y = 16;
const CHOICE_FADE_DURATION = 400;
// R83.CTRLS.14 — crisp text resolution. Phaser's default Text resolution is 1,
// which renders strokes with the canvas's native DPI only. 2× multiplies the
// off-screen canvas Phaser uses for text layout then samples down to display
// size — strokes stay sharp on every monitor, and on DPR=1 displays the
// downsample acts as a cheap SSAA pass so small font sizes (7-12px) stop
// looking soft. Memory cost is negligible for CTRL-S's ~50 text objects.
const TEXT_RESOLUTION = 2;
// Inline terminal-prompt choice UI (R83.CTRLS.3). Choices render as
// `> [1] Label` lines below the active paragraph, mirroring a Matrix
// terminal. No buttons, no boxes — just text.
const CHOICE_PROMPT_GAP_Y = 18;
const CHOICE_LINE_GAP_Y = 4;
const CHOICE_LINE_FONT_SIZE = '12px';
const CHOICE_HINT_FONT_SIZE = '9px';
// Terminal-entry climax (R83.CTRLS.4). Rendered as a block below the final
// paragraph of a chapter: prompt, blinking `> _` input line, timer readout,
// attempts indicator. Player types `CTRL-S` or hits the Ctrl+S chord to save
// the world. Timeout/wrong → retry with shrinking timer; exhaust attempts →
// failure ending. Each ending line reveals on a fixed cadence then fades out
// to the chapter hub.
const TERMINAL_BLOCK_GAP_Y = 18;
const TERMINAL_LINE_GAP_Y = 4;
const TERMINAL_FONT_SIZE = '12px';
const TERMINAL_HINT_FONT_SIZE = '9px';
const TERMINAL_ENDING_LINE_DELAY_MS = 900;
const TERMINAL_ENDING_HOLD_MS = 1400;

// R83.CTRLS.16 — terminal atmosphere upgrade. These settings make the narrative
// scene feel like an authentic phosphor CRT terminal (not a web typewriter).
// Authored from Tom's brief: "Make it look like an actual matrix terminal.
// Better typing. Flicker like we're inside the matrix or something."
// R83.CTRLS.17 — phosphor bloom colour drops from bright #00ff00 to the dim
// body green so the halo doesn't contradict the darker palette. The climax
// (terminal-entry success lines) explicitly re-applies bloom with
// PRIMARY_HEX for the hope-breaking moment.
const PHOSPHOR_BLOOM_COLOR = MATRIX_COLORS.DIM_GREEN_HEX;
const PHOSPHOR_BLOOM_BLUR = 6;        // soft halo on terminal/cursor lines
const PHOSPHOR_BLOOM_BLUR_BODY = 4;   // subtler halo on long paragraph text
// R83.CTRLS.17 — typewriter pacing drops to ~55 ms/char mean (range 45-70 ms)
// from the previous 20-45 ms range. Slower reading cadence is the foundation
// of the "game lost in time" feel — the player has to wait on the terminal,
// not the other way around. Burst-flush chance halved from 6% to 3% so the
// slow-burn reads as deliberate rather than glitchy.
const TYPEWRITER_MIN_MS = 45;
const TYPEWRITER_MAX_MS = 70;
const TYPEWRITER_BURST_CHANCE = 0.03;
// R83.CTRLS.17 — paragraph-boundary beat. After the user presses SPACE/ENTER
// at a WAITING paragraph, wait 900-1400 ms (randomised per beat) before the
// next paragraph starts typing. Previously ~0 ms — the next paragraph started
// the same frame as the keypress, which felt rushed and undermined the dread
// pacing. The randomised range stops the rhythm from feeling metronomic.
const PARAGRAPH_BEAT_MIN_MS = 900;
const PARAGRAPH_BEAT_MAX_MS = 1400;
// R83.CTRLS.17 — choice prompts wait a full 2 s after the final paragraph char
// before the choice lines appear. Previously 300 ms (felt like a UI, not a
// choice). 2 s forces the player to sit with the question.
const CHOICE_PROMPT_APPEAR_DELAY_MS = 2000;
// Scanline overlay jitters 1 px vertically at ~3 Hz — the ~333 ms cadence
// matches a CRT frame lock wobble. Alpha stays low so it's a suggestion, not
// a wall of noise.
const SCANLINE_TILE_SIZE = 4;
const SCANLINE_ALPHA_HEX = 'rgba(0, 255, 0, 0.06)';
const SCANLINE_NUDGE_INTERVAL_MS = 333;
const SCANLINE_DEPTH = 1000;
// Idle glyph flicker: every ~5-7 s while typing/waiting, swap 1-2 random chars
// in the revealed paragraph to a random Matrix glyph for 80 ms then revert.
// Preserves engine state — only the rendered string is mutated.
const FLICKER_HOLD_MS = 80;
const FLICKER_MIN_INTERVAL_MS = 5000;
const FLICKER_MAX_INTERVAL_MS = 7000;
// R83.CTRLS.17 — dread vignette. Radial gradient from transparent centre to
// 35% black at the edge. Depth sits BELOW the scanline overlay (which is at
// SCANLINE_DEPTH = 1000) so scanlines render over the vignette darkness
// and still read across the frame.
const VIGNETTE_DEPTH = 990;
const VIGNETTE_EDGE_ALPHA = 0.35;
// R83.CTRLS.17 — portrait glitch bands. 2-3 per second (so 500-333 ms cadence),
// 2-4 px tall, 20-40% opacity, one-band-at-a-time flicker-then-clear.
const PORTRAIT_GLITCH_INTERVAL_MIN_MS = 333;
const PORTRAIT_GLITCH_INTERVAL_MAX_MS = 500;
const PORTRAIT_GLITCH_HOLD_MS = 70;
const PORTRAIT_RGB_SPLIT_OFFSET_PX = 1;

const MATRIX_FLICKER_GLYPHS = [
  'ﾊ', 'ﾐ', 'ﾋ', 'ｰ', 'ｳ', 'ｼ', 'ﾅ', 'ﾓ', 'ﾆ', 'ｻ', 'ﾜ', 'ﾂ', 'ｵ', 'ﾘ',
  'ｱ', 'ﾎ', 'ﾃ', 'ﾏ', 'ｹ', 'ﾑ', 'ｴ', 'ｶ', 'ｷ', 'ﾁ', 'ｲ',
  '0', '1', '2', '3', '4', '5', '7', '8', '9', 'Z', ':', '<', '>', '=', '+',
];

export class CtrlSNarrativeScene extends BaseScene {
  private chapterIndex = 0;
  private chapter?: Chapter;
  private chapterTitle?: Phaser.GameObjects.Text;
  private chapterAscii?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private asciiPanels: Phaser.GameObjects.Text[] = [];
  private cursorBlink?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private rainGroup?: Phaser.GameObjects.Group;
  private engine: TypewriterEngine;
  private cursorTween?: Phaser.Tweens.Tween;
  private waitingForPuzzle = false;
  private waitingForChoice = false;
  private waitingForInventory = false;
  private waitingForTerminal = false;
  private terminalResolved = false;
  private terminalState?: TerminalEntryState;
  private terminalTrigger?: TerminalTrigger;
  private terminalContainer?: Phaser.GameObjects.Container;
  private terminalPromptLabel?: Phaser.GameObjects.Text;
  private terminalInputLine?: Phaser.GameObjects.Text;
  private terminalStatusLine?: Phaser.GameObjects.Text;
  private terminalHintLabel?: Phaser.GameObjects.Text;
  private terminalEndingLines: Phaser.GameObjects.Text[] = [];
  private terminalCaretTween?: Phaser.Tweens.Tween;
  private terminalKeyHandler?: (event: KeyboardEvent) => void;
  private terminalCaretTimer = 0;
  private terminalCaretVisible = true;
  private choiceContainer?: Phaser.GameObjects.Container;
  private choiceLines: Phaser.GameObjects.Text[] = [];
  private choicePromptLabel?: Phaser.GameObjects.Text;
  private choiceHintLabel?: Phaser.GameObjects.Text;
  private activeChoices: ChoiceOption[] = [];
  private selectedChoiceIndex = 0;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];
  private startFromParagraph = 0;
  private portraitContainer?: Phaser.GameObjects.Container;
  private portraitImage?: Phaser.GameObjects.Image;
  private portraitMonogram?: Phaser.GameObjects.Text;
  private portraitBorder?: Phaser.GameObjects.Graphics;
  private portraitName?: Phaser.GameObjects.Text;
  private currentSpeakerId?: string;
  private bgImage?: Phaser.GameObjects.Image;
  private bgBaseX = 0;
  private bgElapsed = 0;
  private themeParticles: Phaser.GameObjects.Text[] = [];
  private tickCounter = 0;
  // Cursor ping tween kept on a ref so rapid advances can stop the previous
  // scale ping before kicking off a new one (R83.CTRLS.13). Without this,
  // spacebar-mash stacks N concurrent scaleX tweens on the same target and
  // the cursor visibly twitches.
  private cursorScaleTween?: Phaser.Tweens.Tween;
  // Portrait-indent tween ref so rapid portrait swaps can stop the in-flight
  // x-tween instead of chaining concurrent ones (R83.CTRLS.13).
  private indentTween?: Phaser.Tweens.Tween;
  // Flag to ensure the chapter-ASCII banner fades out exactly once when the
  // narrative transitions from paragraph 0 → 1 (R83.CTRLS.13 dead-code fix).
  private chapterAsciiFadedOut = false;
  // R83.CTRLS.16 terminal atmosphere state. Scanline overlay is a repeating
  // 1-line-per-2-rows pattern drawn into a TileSprite; we jitter tilePositionY
  // by ±1 px at SCANLINE_NUDGE_INTERVAL_MS to simulate a CRT vertical-hold
  // wobble. Glyph flicker tracks an index → replacement-char map applied at
  // render time so the engine's revealedText stays authoritative.
  private scanlineOverlay?: Phaser.GameObjects.TileSprite;
  private scanlineNudgeTimer = 0;
  private flickerMap: Map<number, string> = new Map();
  private flickerUntilMs = 0;
  private nextFlickerAtMs = 0;
  private sceneElapsedMs = 0;
  // R83.CTRLS.17 — dread vignette + portrait distortion overlays. Vignette is
  // a radial black gradient baked into a canvas texture once per scene, held
  // as an Image at depth just below the scanline overlay. Portrait distortion
  // layers two offset colour-tinted image copies + a glitch-band graphics
  // object that redraws on a timer.
  private dreadVignette?: Phaser.GameObjects.Image;
  private portraitRedSplit?: Phaser.GameObjects.Image;
  private portraitBlueSplit?: Phaser.GameObjects.Image;
  private portraitGlitchGraphics?: Phaser.GameObjects.Graphics;
  private portraitGlitchTimer = 0;

  constructor() {
    super(CTRLS_SCENE_KEYS.NARRATIVE);
    this.engine = new TypewriterEngine();
  }

  init(data: NarrativeSceneData): void {
    this.chapterIndex = data.chapterIndex ?? 0;
    this.startFromParagraph = data.startFromParagraph ?? 0;
    this.chapter = getChapter(this.chapterIndex);
    this.waitingForPuzzle = false;
    this.waitingForInventory = false;
    this.waitingForTerminal = false;
    this.terminalResolved = false;
    this.chapterAsciiFadedOut = false;

    // R83.CTRLS.16 — variable-speed typewriter replaces the fixed 15 ms/char
    // cadence. Recipe (from the task body): 20-45 ms/char with occasional
    // 2-3 char buffer-flush bursts. Without this the terminal reads like a
    // web typewriter; with it, the cadence mimics someone actually typing a
    // mix of familiar and unfamiliar words.
    this.engine.setVariableSpeed(TYPEWRITER_MIN_MS, TYPEWRITER_MAX_MS, TYPEWRITER_BURST_CHANCE);
    this.tickCounter = 0;
    this.flickerMap.clear();
    this.flickerUntilMs = 0;
    this.nextFlickerAtMs = 0;
    this.sceneElapsedMs = 0;
    this.scanlineNudgeTimer = 0;
    this.engine.setCallbacks({
      onCharRevealed: () => this.onCharTick(),
      onParagraphStart: () => this.onParagraphStart(),
      onParagraphComplete: (idx: number) => this.onParagraphComplete(idx),
      onAllComplete: () => this.onAllComplete(),
    });

    const paragraphs = this.chapter?.paragraphs ?? [
      'Story content will render here.',
      'The typewriter engine reveals text character by character with user-controlled pacing.',
      'Press SPACE, ENTER, or click to advance.',
    ];
    this.engine.load(paragraphs);
  }

  create(): void {
    this.createMatrixBackground();
    this.createParallaxBackground();
    this.createThemeParticles();
    this.rainGroup = this.addMatrixRain(15);

    if (this.chapter?.musicTrack) {
      this.playBackgroundMusic(this.chapter.musicTrack);
    }
    if (this.startFromParagraph === 0) {
      this.playSound(STINGER_KEYS.CHAPTER_START);
    }

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const margin = GAME_CONFIG.TEXT.MARGIN_X;

    const title = this.chapter?.title ?? `Chapter ${this.chapterIndex}`;
    // R83.CTRLS.17 — chapter title drops from bright #00ff00 to dim body green
    // so the whole frame reads as "a terminal left on in a derelict lab"
    // rather than a lit-up UI. Bloom colour also dims (via
    // PHOSPHOR_BLOOM_COLOR) so the halo matches the text.
    this.chapterTitle = this.add.text(margin, 20, title, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.chapterTitle.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.chapterTitle, PHOSPHOR_BLOOM_BLUR);

    let contentStartY = GAME_CONFIG.TEXT.MARGIN_Y;

    if (this.chapter?.ascii && this.startFromParagraph === 0) {
      const asciiText = this.chapter.ascii.join('\n');
      this.chapterAscii = this.add.text(margin, 45, asciiText, {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: ASCII_FONT_SIZE,
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        lineSpacing: 1,
      });
      this.chapterAscii.setResolution(TEXT_RESOLUTION);
      this.chapterAscii.setAlpha(0.7);

      const asciiHeight = this.chapter.ascii.length * ASCII_LINE_HEIGHT;
      contentStartY = 45 + asciiHeight + 15;

      this.tweens.add({
        targets: this.chapterAscii,
        alpha: { from: 0, to: 0.7 },
        duration: 1500,
        ease: 'Power2',
      });
    }

    this.bodyText = this.add.text(margin, contentStartY, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: width - margin * 2 },
      lineSpacing: 8,
    });
    this.bodyText.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.bodyText, PHOSPHOR_BLOOM_BLUR_BODY);

    // R83.CTRLS.17 — cursor tracks the body text palette (dim). Keeping the
    // cursor bright while the paragraph is dim made the cursor feel like a
    // different system — pulling the eye off the text. Matching colours keeps
    // the eye on the text and saves #00ff00 for hope-breaking moments.
    this.cursorBlink = this.add.text(margin, contentStartY, '█', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.cursorBlink.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.cursorBlink, PHOSPHOR_BLOOM_BLUR);
    this.cursorTween = this.tweens.add({
      targets: this.cursorBlink,
      alpha: { from: 1, to: 0 },
      duration: 530,
      yoyo: true,
      repeat: -1,
    });

    this.promptText = this.add.text(width / 2, height - 40, 'Press SPACE or ENTER to advance', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setResolution(TEXT_RESOLUTION);
    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 1, to: 0.3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.createScanlineOverlay();
    this.createDreadVignette();
    this.playAmbientDrone();
    this.setupNarrativeInput();
    this.setupCommonInputs();

    // When a modal Phaser scene (PuzzleScene, InventoryScene) stops and
    // resumes us, clear the blocking flag so advance/input resumes.
    this.events.on(Phaser.Scenes.Events.RESUME, this.onSceneResume, this);

    if (this.startFromParagraph > 0) {
      this.engine.startFromParagraph(this.startFromParagraph);
      this.updatePortraitForParagraph(this.startFromParagraph);
    } else {
      this.engine.start();
      this.updatePortraitForParagraph(0);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) {
      this.exposeTestState(this.buildTestState());
      return;
    }

    this.sceneElapsedMs += delta;
    this.updateParallaxBackground(delta);
    this.updateThemeParticles(delta);
    this.updateScanlineOverlay(delta);
    this.updatePortraitGlitch(delta);
    this.updateGlyphFlicker(this.sceneElapsedMs);

    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }

    if (
      !this.waitingForPuzzle &&
      !this.waitingForChoice &&
      !this.waitingForInventory &&
      !this.waitingForTerminal
    ) {
      this.engine.update(delta);
    }
    this.renderCurrentText();
    this.tickTerminalEntry(delta);
    this.exposeTestState(this.buildTestState());
  }

  private renderCurrentText(): void {
    if (!this.bodyText || !this.cursorBlink) return;

    const revealed = this.engine.revealedText;
    // R83.CTRLS.16: the flicker transform only touches the rendered string —
    // engine state (revealedText, charIndex, state) is unchanged, so tests and
    // advance-logic behave exactly as before.
    this.bodyText.setText(this.applyFlickerMap(revealed));

    // R83.CTRLS.17 — during the paragraph-boundary beat the engine state is
    // still WAITING (the beat gates engine.advance()), so the default cursor
    // visibility would light back up on the next frame. Hiding it mid-beat
    // gives the reader the "terminal is thinking" cue.
    const showCursor = !this.advancingBeat &&
      (this.engine.state === 'TYPING' || this.engine.state === 'WAITING');
    this.cursorBlink.setVisible(showCursor);
    if (!showCursor) return;

    // Cursor lives on its own line below the paragraph. When an inline ASCII
    // panel has been drawn below the paragraph (WAITING state), drop the
    // cursor below it so it does not overlap the art.
    let cursorY = this.bodyText.y + this.bodyText.height + CURSOR_GAP_Y;
    for (const ascii of this.asciiPanels) {
      if (!ascii.active) continue;
      const asciiBottom = ascii.y + ascii.height + CURSOR_GAP_Y;
      if (asciiBottom > cursorY) cursorY = asciiBottom;
    }
    this.cursorBlink.setPosition(this.bodyText.x, cursorY);
  }

  private computeContentStartY(): number {
    if (this.chapterAscii && this.chapterAscii.active) {
      return 45 + this.chapterAscii.height + 15;
    }
    return GAME_CONFIG.TEXT.MARGIN_Y;
  }

  // Single source of truth for word-wrap width. Honours the current bodyText
  // indent (the portrait push) so inline panels, choice prompts and terminal
  // lines all wrap at the same right edge as the narrative. Falls back to the
  // unindented margin when bodyText isn't created yet or is still at the
  // left edge. R83.CTRLS.13: pre-existing duplicated `width - margin * 2` calls
  // ignored the portrait indent and overflowed past the viewport.
  private computeTextWrapWidth(): number {
    const width = Number(this.game.config.width);
    const leftX = this.bodyText?.x ?? GAME_CONFIG.TEXT.MARGIN_X;
    return width - leftX - GAME_CONFIG.TEXT.MARGIN_X;
  }

  private onCharTick(): void {
    this.tickCounter++;
    if (this.tickCounter % 3 !== 0) return;

    const tickKey = this.currentSpeakerId
      ? (CHARACTER_TICK_MAP[this.currentSpeakerId] ?? NARRATOR_TICK)
      : NARRATOR_TICK;
    this.playSound(tickKey);
  }

  private onParagraphStart(): void {
    // First genuine story beat (paragraph 1) → fade the chapter banner so the
    // reader has a clean column. Previous code tried to gate this off the
    // first advance press via `engine.state === 'IDLE'`, but engine.start()
    // runs synchronously in create() so state is never IDLE at advance time
    // — the banner stayed on screen for the entire chapter, competing with
    // the single-paragraph region below it. R83.CTRLS.13 fix: fire on the
    // 0 → 1 paragraph boundary, exactly once per chapter, and let the
    // fadeout's onComplete reclaim the vertical space.
    if (this.engine.paragraphIndex >= 1 && this.chapterAscii && !this.chapterAsciiFadedOut) {
      this.fadeOutChapterAscii();
    }

    // Single-paragraph region: every new paragraph starts from a clean slate.
    // Destroy any inline ASCII left over from the previous paragraph and snap
    // bodyText back to the baseline Y so the paragraph always appears in the
    // same place rather than scrolling downward.
    for (const ascii of this.asciiPanels) {
      ascii.destroy();
    }
    this.asciiPanels = [];

    if (this.bodyText) {
      this.bodyText.setY(this.computeContentStartY());
    }
    this.syncPortraitY();
  }

  private fadeOutChapterAscii(): void {
    if (!this.chapterAscii || this.chapterAsciiFadedOut) return;
    this.chapterAsciiFadedOut = true;
    const target = this.chapterAscii;
    this.chapterAscii = undefined;
    this.tweens.killTweensOf(target);
    this.tweens.add({
      targets: target,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        target.destroy();
        this.bodyText?.setY(this.computeContentStartY());
        this.syncPortraitY();
      },
    });
  }

  private onParagraphComplete(paragraphIndex: number): void {
    this.tickCounter = 0;

    if (!this.chapter) return;

    const nextIndex = paragraphIndex + 1;
    if (nextIndex < this.chapter.paragraphs.length) {
      this.updatePortraitForParagraph(nextIndex);
    }

    const asciiPanel = getAsciiPanelForParagraph(this.chapter, paragraphIndex);
    if (asciiPanel) {
      this.showInlineAscii(asciiPanel.art);
    }

    const puzzleTrigger = getPuzzleTriggersForParagraph(this.chapter, paragraphIndex);
    if (puzzleTrigger) {
      this.waitingForPuzzle = true;
      this.promptText?.setText('Puzzle incoming...');
      this.playSound(STINGER_KEYS.PUZZLE_APPEAR);

      this.time.delayedCall(800, () => {
        // Still emit the event so React can record which puzzle is active
        // (used by the puzzleComplete handler for item rewards + gameState).
        this.emitGameEvent({
          type: 'pause',
          data: {
            action: 'openPuzzle',
            puzzleId: puzzleTrigger.puzzleId,
            chapterIndex: this.chapterIndex,
            paragraphIndex,
          },
        });
        this.scene.pause();
        this.scene.launch(CTRLS_SCENE_KEYS.PUZZLE, {
          puzzleId: puzzleTrigger.puzzleId,
          chapterIndex: this.chapterIndex,
          paragraphIndex,
        });
      });
      return;
    }

    const choiceTrigger = getChoiceTriggerForParagraph(this.chapter, paragraphIndex);
    if (choiceTrigger) {
      this.waitingForChoice = true;
      this.promptText?.setText('Use ↑↓ and ENTER to choose');
      this.playSound(STINGER_KEYS.REVEAL);
      // R83.CTRLS.17 — 2 s beat before the `>` choice lines surface so the
      // player has to sit with the question before the answer options appear.
      this.time.delayedCall(CHOICE_PROMPT_APPEAR_DELAY_MS, () => {
        this.showChoiceUI(choiceTrigger.choices, choiceTrigger.prompt);
      });
      return;
    }

    const terminalTrigger = getTerminalTriggerForParagraph(this.chapter, paragraphIndex);
    if (terminalTrigger) {
      this.waitingForTerminal = true;
      this.promptText?.setText('Incoming: terminal entry');
      this.playSound(STINGER_KEYS.DRAMATIC_STING);
      this.time.delayedCall(400, () => {
        this.startTerminalEntry(terminalTrigger);
      });
    }
  }

  private showInlineAscii(art: string[]): void {
    if (!this.bodyText) return;

    // Anchor the panel to the same X as the active paragraph so it never
    // drifts under the portrait column when one is visible (R83.CTRLS.13).
    // Previously hardcoded to GAME_CONFIG.TEXT.MARGIN_X which collided with
    // the 196px portrait indent.
    const asciiY = this.bodyText.y + this.bodyText.height + INLINE_ASCII_GAP_Y;

    const asciiText = this.add.text(this.bodyText.x, asciiY, art.join('\n'), {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: ASCII_FONT_SIZE,
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
      lineSpacing: 1,
    });
    asciiText.setResolution(TEXT_RESOLUTION);
    asciiText.setAlpha(0);
    this.asciiPanels.push(asciiText);

    this.tweens.add({
      targets: asciiText,
      alpha: { from: 0, to: 0.8 },
      duration: 800,
      ease: 'Power2',
    });
  }

  resumeAfterPuzzle(): void {
    this.waitingForPuzzle = false;
    this.promptText?.setText('Press SPACE or ENTER to advance');
    this.playSound(STINGER_KEYS.REVEAL);

    if (this.bodyText) {
      this.bodyText.setAlpha(0);
      this.tweens.add({
        targets: this.bodyText,
        alpha: 1,
        duration: 300,
        ease: 'Power2',
      });
    }
  }

  private onSceneResume(): void {
    if (this.waitingForPuzzle) {
      this.resumeAfterPuzzle();
    }
    if (this.waitingForInventory) {
      this.resumeAfterInventory();
    }
  }

  private onAllComplete(): void {
    // Terminal-entry chapters own their own transition — the ending lines
    // and hub fade fire after the player resolves the Ctrl+S payoff, not
    // when the final paragraph finishes typing.
    if (this.waitingForTerminal || this.terminalResolved) return;

    this.playSound(STINGER_KEYS.CHAPTER_COMPLETE);
    this.promptText?.setText('Chapter complete');

    this.emitGameEvent({
      type: 'pause',
      data: { action: 'chapterComplete', chapterIndex: this.chapterIndex },
    });

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
      });
    });
  }

  private setupNarrativeInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.handleAdvance());

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => {
        if (this.waitingForTerminal && this.terminalState?.phase === 'awaiting') {
          this.submitTerminalInput();
        } else if (this.waitingForChoice && this.activeChoices.length > 0) {
          this.confirmChoice(this.selectedChoiceIndex);
        } else {
          this.handleAdvance();
        }
      });

      const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      iKey.on('down', () => this.toggleInventory());

      this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.upKey.on('down', () => this.navigateChoice(-1));

      this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.downKey.on('down', () => this.navigateChoice(1));

      // Number keys 1-9 for direct terminal-style choice selection
      // (R83.CTRLS.3). Mirrors the `> [1] ...` inline prompt — typing the
      // digit confirms that choice. Capped at 9 because the prompt only
      // displays single-digit indices.
      const numberKeyCodes = [
        Phaser.Input.Keyboard.KeyCodes.ONE,
        Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE,
        Phaser.Input.Keyboard.KeyCodes.FOUR,
        Phaser.Input.Keyboard.KeyCodes.FIVE,
        Phaser.Input.Keyboard.KeyCodes.SIX,
        Phaser.Input.Keyboard.KeyCodes.SEVEN,
        Phaser.Input.Keyboard.KeyCodes.EIGHT,
        Phaser.Input.Keyboard.KeyCodes.NINE,
      ];
      this.numberKeys = numberKeyCodes.map((code, index) => {
        const key = this.input.keyboard!.addKey(code);
        key.on('down', () => this.handleNumberKey(index));
        return key;
      });
    });

    this.input.on('pointerdown', () => this.handleAdvance());
  }

  private handleNumberKey(index: number): void {
    if (!this.waitingForChoice || index >= this.activeChoices.length) return;
    this.selectedChoiceIndex = index;
    this.confirmChoice(index);
  }

  private handleAdvance(): void {
    if (
      this.isPaused ||
      this.waitingForPuzzle ||
      this.waitingForChoice ||
      this.waitingForInventory ||
      this.waitingForTerminal
    ) return;

    this.playSound('menu');
    if (this.cursorBlink && this.cursorBlink.visible) {
      this.cursorScaleTween?.stop();
      this.cursorBlink.setScale(1);
      this.cursorScaleTween = this.tweens.add({
        targets: this.cursorBlink,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 60,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    // R83.CTRLS.17 — paragraph-boundary beat. If the player is advancing OUT
    // of a WAITING paragraph (i.e. about to start typing the next one), gate
    // the engine.advance() behind a 900-1400 ms delay so the terminal holds
    // for a breath before the next paragraph arrives. Skipping a still-typing
    // paragraph (TYPING → WAITING) stays instant so the skip feels responsive.
    if (this.engine.state === 'WAITING' && !this.engine.isLastParagraph) {
      this.applyParagraphBeat();
      return;
    }

    this.engine.advance();
  }

  /**
   * R83.CTRLS.17 — insert a paragraph-boundary beat. Hides the blinking cursor
   * for the beat's duration (so the player can tell the terminal is "thinking"
   * rather than waiting for input), then kicks off the next paragraph. Guards
   * against double-beats by flagging `advancingBeat` — a second SPACE press
   * during the beat is a no-op.
   */
  private advancingBeat = false;
  private applyParagraphBeat(): void {
    if (this.advancingBeat) return;
    this.advancingBeat = true;
    this.cursorBlink?.setVisible(false);
    const beatMs = Phaser.Math.Between(PARAGRAPH_BEAT_MIN_MS, PARAGRAPH_BEAT_MAX_MS);
    this.time.delayedCall(beatMs, () => {
      this.advancingBeat = false;
      if (this.isPaused) return;
      // State may have changed while beating (e.g. puzzle/choice launched);
      // only advance if we're still in WAITING.
      if (this.engine.state === 'WAITING') {
        this.engine.advance();
      }
    });
  }

  private startTerminalEntry(trigger: TerminalTrigger): void {
    if (!this.bodyText) return;

    this.terminalTrigger = trigger;
    this.terminalState = new TerminalEntryState({
      expected: trigger.expected,
      maxAttempts: trigger.maxAttempts,
      initialTimeoutMs: trigger.initialTimeoutMs,
      retryTimeoutMs: trigger.retryTimeoutMs,
    });
    this.terminalState.begin();

    this.cursorBlink?.setVisible(false);
    this.promptText?.setText('> awaiting keystroke');
    this.playSound(STINGER_KEYS.TRANSITION);

    const wrapWidth = this.computeTextWrapWidth();
    const startY = this.bodyText.y + this.bodyText.height + TERMINAL_BLOCK_GAP_Y;

    this.terminalContainer = this.add.container(0, 0);
    let cursorY = startY;

    // R83.CTRLS.17 — terminal prompt/input lines use the dim palette so the
    // player's bright #00ff00 reward only lands on the success-line flash.
    // Pre-resolve, the terminal reads as "yet another dim terminal prompt";
    // post-resolve (renderTerminalEnding, outcome === 'success') it bursts
    // into the climax green. The contrast is the beat.
    this.terminalPromptLabel = this.add.text(this.bodyText.x, cursorY, `> ${trigger.prompt}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_FONT_SIZE,
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: wrapWidth },
    });
    this.terminalPromptLabel.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.terminalPromptLabel, PHOSPHOR_BLOOM_BLUR);
    this.terminalContainer.add(this.terminalPromptLabel);
    cursorY += this.terminalPromptLabel.height + TERMINAL_LINE_GAP_Y;

    this.terminalInputLine = this.add.text(this.bodyText.x, cursorY, this.renderTerminalInputLine(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_FONT_SIZE,
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    this.terminalInputLine.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.terminalInputLine, PHOSPHOR_BLOOM_BLUR);
    this.terminalContainer.add(this.terminalInputLine);
    cursorY += this.terminalInputLine.height + TERMINAL_LINE_GAP_Y;

    this.terminalStatusLine = this.add.text(this.bodyText.x, cursorY, this.renderTerminalStatusLine(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_HINT_FONT_SIZE,
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
    });
    this.terminalStatusLine.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.terminalStatusLine, PHOSPHOR_BLOOM_BLUR_BODY);
    this.terminalContainer.add(this.terminalStatusLine);
    cursorY += this.terminalStatusLine.height + TERMINAL_LINE_GAP_Y;

    this.terminalHintLabel = this.add.text(this.bodyText.x, cursorY, trigger.hint, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: TERMINAL_HINT_FONT_SIZE,
      color: MATRIX_COLORS.DIM_GREEN_HEX,
      wordWrap: { width: wrapWidth },
    });
    this.terminalHintLabel.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(this.terminalHintLabel, PHOSPHOR_BLOOM_BLUR_BODY);
    this.terminalHintLabel.setAlpha(0.85);
    this.terminalContainer.add(this.terminalHintLabel);

    this.terminalCaretTimer = 0;
    this.terminalCaretVisible = true;
    this.attachTerminalKeyListener();
  }

  private attachTerminalKeyListener(): void {
    if (typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => this.onTerminalKeyDown(event);
    this.terminalKeyHandler = handler;
    window.addEventListener('keydown', handler, true);
  }

  private detachTerminalKeyListener(): void {
    if (typeof window === 'undefined' || !this.terminalKeyHandler) return;
    window.removeEventListener('keydown', this.terminalKeyHandler, true);
    this.terminalKeyHandler = undefined;
  }

  private onTerminalKeyDown(event: KeyboardEvent): void {
    if (!this.waitingForTerminal || !this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;

    // Ctrl+S / Cmd+S chord short-circuits to instant success and prevents
    // the browser's "Save Page As..." dialog hijacking the keystroke.
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      this.resolveTerminalSuccess('chord');
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.terminalState.backspace();
      this.refreshTerminalInput();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.terminalState.clearInput();
      this.refreshTerminalInput();
      return;
    }

    if (event.key === 'Enter') {
      // ENTER is also handled via Phaser keyboard; guard by stopping propagation
      // only when the terminal is actually accepting input so we don't double-fire.
      event.preventDefault();
      this.submitTerminalInput();
      return;
    }

    if (event.key.length === 1) {
      const allowed = /^[A-Za-z0-9+\-_]$/;
      if (!allowed.test(event.key)) return;
      event.preventDefault();
      this.terminalState.appendChar(event.key);
      this.refreshTerminalInput();
      this.playSound(NARRATOR_TICK);
    }
  }

  private submitTerminalInput(): void {
    if (!this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;
    const buffered = this.terminalState.input;
    const result = this.terminalState.submit(buffered);
    if (result.outcome === 'success') {
      this.resolveTerminalSuccess('typed');
    } else if (result.outcome === 'failure') {
      this.resolveTerminalFailure();
    } else {
      this.onTerminalRetry();
    }
  }

  private tickTerminalEntry(delta: number): void {
    if (!this.terminalInputLine) return;

    this.terminalCaretTimer += delta;
    if (this.terminalCaretTimer >= 530) {
      this.terminalCaretTimer = 0;
      this.terminalCaretVisible = !this.terminalCaretVisible;
      this.terminalInputLine.setText(this.renderTerminalInputLine());
    }

    if (!this.waitingForTerminal || !this.terminalState) return;
    if (this.terminalState.phase !== 'awaiting') return;

    const tickResult = this.terminalState.tick(delta);
    this.terminalStatusLine?.setText(this.renderTerminalStatusLine());
    if (tickResult === 'timeout') {
      const res = this.terminalState.timeout();
      if (res.outcome === 'failure') {
        this.resolveTerminalFailure();
      } else {
        this.onTerminalRetry();
      }
    }
  }

  private onTerminalRetry(): void {
    this.playSound(STINGER_KEYS.PUZZLE_FAILED);
    this.cameras.main.shake(180, 0.005);
    this.refreshTerminalInput();
    this.terminalStatusLine?.setText(this.renderTerminalStatusLine());
  }

  private refreshTerminalInput(): void {
    this.terminalInputLine?.setText(this.renderTerminalInputLine());
  }

  private renderTerminalInputLine(): string {
    const buffered = this.terminalState?.input ?? '';
    const caret = this.terminalCaretVisible ? '_' : ' ';
    return `> ${buffered}${caret}`;
  }

  private renderTerminalStatusLine(): string {
    if (!this.terminalState || !this.terminalTrigger) return '';
    const remaining = Math.ceil(this.terminalState.timeRemainingMs / 1000);
    const attempts = this.terminalState.attemptsRemaining;
    const total = this.terminalTrigger.maxAttempts;
    return `[ ${remaining.toString().padStart(2, '0')}s ]  attempts: ${attempts}/${total}`;
  }

  private resolveTerminalSuccess(via: 'chord' | 'typed'): void {
    if (!this.terminalState || !this.terminalTrigger) return;
    if (via === 'chord') {
      this.terminalState.phase = 'resolved';
      this.terminalState.outcome = 'success';
    }
    this.playSound('score');
    this.playSound(STINGER_KEYS.CHAPTER_COMPLETE);
    this.cameras.main.flash(250, 0, 255, 0);
    this.renderTerminalEnding(this.terminalTrigger.successLines, 'success');
  }

  private resolveTerminalFailure(): void {
    if (!this.terminalTrigger) return;
    this.playSound('gameOver');
    this.cameras.main.shake(420, 0.012);
    this.renderTerminalEnding(this.terminalTrigger.failureLines, 'failure');
  }

  private renderTerminalEnding(lines: string[], outcome: 'success' | 'failure'): void {
    if (!this.terminalContainer) return;

    this.terminalResolved = true;
    this.detachTerminalKeyListener();
    this.terminalInputLine?.setText('> ');
    this.terminalStatusLine?.setText(outcome === 'success' ? '[ committed ]' : '[ flushed ]');
    this.terminalStatusLine?.setColor(outcome === 'success' ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DARK_GREEN_HEX);
    this.terminalHintLabel?.setVisible(false);

    const wrapWidth = this.computeTextWrapWidth();
    let cursorY = (this.terminalStatusLine?.y ?? 0) + (this.terminalStatusLine?.height ?? 0) + TERMINAL_BLOCK_GAP_Y;

    lines.forEach((text, i) => {
      const line = this.add.text(this.bodyText!.x, cursorY, text, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: TERMINAL_FONT_SIZE,
        color: outcome === 'success' ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: wrapWidth },
      });
      line.setResolution(TEXT_RESOLUTION);
      this.applyPhosphorBloom(
        line,
        PHOSPHOR_BLOOM_BLUR,
        outcome === 'success' ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.DIM_GREEN_HEX,
      );
      line.setAlpha(0);
      this.terminalEndingLines.push(line);
      this.terminalContainer!.add(line);

      this.tweens.add({
        targets: line,
        alpha: 1,
        duration: 350,
        delay: i * TERMINAL_ENDING_LINE_DELAY_MS,
        ease: 'Power2',
      });

      cursorY += line.height + TERMINAL_LINE_GAP_Y;
    });

    const holdDelay = lines.length * TERMINAL_ENDING_LINE_DELAY_MS + TERMINAL_ENDING_HOLD_MS;
    this.time.delayedCall(holdDelay, () => {
      this.emitGameEvent({
        type: 'pause',
        data: {
          action: 'chapterComplete',
          chapterIndex: this.chapterIndex,
          terminalOutcome: outcome,
        },
      });
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
      });
    });
  }

  private destroyTerminalUI(): void {
    this.detachTerminalKeyListener();
    this.terminalCaretTween?.stop();
    this.terminalCaretTween = undefined;
    this.terminalContainer?.destroy(true);
    this.terminalContainer = undefined;
    this.terminalPromptLabel = undefined;
    this.terminalInputLine = undefined;
    this.terminalStatusLine = undefined;
    this.terminalHintLabel = undefined;
    this.terminalEndingLines = [];
    this.terminalState = undefined;
    this.terminalTrigger = undefined;
  }

  private toggleInventory(): void {
    if (this.waitingForInventory) return;
    this.waitingForInventory = true;
    this.scene.pause();
    this.scene.launch(CTRLS_SCENE_KEYS.INVENTORY);
  }

  resumeAfterInventory(): void {
    this.waitingForInventory = false;
  }

  private showChoiceUI(choices: ChoiceOption[], prompt?: string): void {
    if (!this.bodyText) return;

    const wrapWidth = this.computeTextWrapWidth();

    this.activeChoices = choices;
    this.selectedChoiceIndex = 0;
    this.choiceLines = [];

    // Cursor lives below the choices once they render — hide it under the
    // active paragraph so it doesn't sit between body and the prompt list.
    this.cursorBlink?.setVisible(false);

    this.choiceContainer = this.add.container(0, 0);

    // Anchor the prompt block to the same X as the body text so it reads
    // as a continuation of the same terminal stream — not a centred modal.
    const startY = this.bodyText.y + this.bodyText.height + CHOICE_PROMPT_GAP_Y;
    let cursorY = startY;

    if (prompt) {
      // Render the optional decision prompt as a `> Choose:` style line.
      const promptLine = `> ${prompt}`;
      this.choicePromptLabel = this.add.text(this.bodyText.x, cursorY, promptLine, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: CHOICE_LINE_FONT_SIZE,
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        wordWrap: { width: wrapWidth },
      });
      this.choicePromptLabel.setResolution(TEXT_RESOLUTION);
      this.applyPhosphorBloom(this.choicePromptLabel, PHOSPHOR_BLOOM_BLUR_BODY);
      this.choicePromptLabel.setAlpha(0);
      this.choiceContainer.add(this.choicePromptLabel);
      this.tweens.add({
        targets: this.choicePromptLabel,
        alpha: 1,
        duration: CHOICE_FADE_DURATION,
        ease: 'Power2',
      });
      cursorY += this.choicePromptLabel.height + CHOICE_LINE_GAP_Y;
    }

    const STAGGER_MS = 60;

    choices.forEach((choice, i) => {
      const line = this.createChoiceLine(choice, i, this.bodyText!.x, cursorY, wrapWidth);
      line.setAlpha(0);
      const targetY = line.y;
      line.y = targetY + 6;
      this.choiceLines.push(line);
      this.choiceContainer!.add(line);

      this.tweens.add({
        targets: line,
        alpha: 1,
        y: targetY,
        duration: CHOICE_FADE_DURATION,
        delay: i * STAGGER_MS,
        ease: 'Power2',
      });

      cursorY += line.height + CHOICE_LINE_GAP_Y;
    });

    // Trailing hint anchored below the last choice — small, always visible.
    this.choiceHintLabel = this.add.text(
      this.bodyText.x,
      cursorY + 4,
      '> _ press 1-' + choices.length + ', or use \u2191\u2193 + ENTER',
      {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: CHOICE_HINT_FONT_SIZE,
        color: MATRIX_COLORS.DARK_GREEN_HEX,
      },
    );
    this.choiceHintLabel.setResolution(TEXT_RESOLUTION);
    this.choiceHintLabel.setAlpha(0);
    this.choiceContainer.add(this.choiceHintLabel);
    this.tweens.add({
      targets: this.choiceHintLabel,
      alpha: 0.85,
      duration: CHOICE_FADE_DURATION,
      delay: choices.length * STAGGER_MS,
      ease: 'Power2',
    });

    this.highlightChoice(0);
  }

  private createChoiceLine(
    choice: ChoiceOption,
    index: number,
    x: number,
    y: number,
    wrapWidth: number,
  ): Phaser.GameObjects.Text {
    // `> [1] Wake Up` — single line of text, terminal-flavoured.
    // Pointer events live on the Text bounds, no container/graphics needed.
    // R83.CTRLS.17 — unselected choice starts at dread-green so the selected
    // choice (dim green) feels like a genuine shift, not just bolder chrome.
    const text = this.add.text(x, y, this.formatChoiceLine(choice, index, false), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: CHOICE_LINE_FONT_SIZE,
      color: MATRIX_COLORS.DREAD_GREEN_HEX,
      wordWrap: { width: wrapWidth },
    });
    text.setResolution(TEXT_RESOLUTION);
    this.applyPhosphorBloom(text, PHOSPHOR_BLOOM_BLUR_BODY);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerover', () => {
      this.selectedChoiceIndex = index;
      this.highlightChoice(index);
    });
    text.on('pointerdown', () => {
      // Scene-level pointerdown also fires, but handleAdvance() guards on
      // waitingForChoice so it no-ops while the prompt is up.
      this.confirmChoice(index);
    });
    return text;
  }

  private formatChoiceLine(choice: ChoiceOption, index: number, selected: boolean): string {
    const marker = selected ? '>' : ' ';
    return `${marker} [${index + 1}] ${choice.label}`;
  }

  private highlightChoice(index: number): void {
    this.choiceLines.forEach((line, i) => {
      const choice = this.activeChoices[i];
      if (!choice) return;
      const selected = i === index;
      line.setText(this.formatChoiceLine(choice, i, selected));
      // R83.CTRLS.17 — selected → dim green (body palette), unselected →
      // dread green (#007700). Two-step dim-on-dim contrast is enough to
      // read at a glance and leaves #00ff00 reserved for the climax.
      line.setColor(selected ? MATRIX_COLORS.DIM_GREEN_HEX : MATRIX_COLORS.DREAD_GREEN_HEX);
    });

    this.playSound('menu');
  }

  private navigateChoice(direction: number): void {
    if (!this.waitingForChoice || this.activeChoices.length === 0) return;

    const newIndex = this.selectedChoiceIndex + direction;
    if (newIndex < 0 || newIndex >= this.activeChoices.length) return;

    this.selectedChoiceIndex = newIndex;
    this.highlightChoice(newIndex);
  }

  private confirmChoice(index: number): void {
    if (!this.waitingForChoice || index >= this.activeChoices.length) return;

    const choice = this.activeChoices[index];
    this.playSound('score');

    const targetLine = this.choiceLines[index];
    if (targetLine) {
      this.spawnChoiceParticles(targetLine);
    }

    this.emitGameEvent({
      type: 'pause',
      data: {
        action: 'choice',
        choiceId: choice.choiceId,
        label: choice.label,
        chapterIndex: this.chapterIndex,
      },
    });

    this.tweens.add({
      targets: this.choiceContainer,
      alpha: 0,
      duration: CHOICE_FADE_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.destroyChoiceUI();
        this.waitingForChoice = false;
        this.promptText?.setText('Press SPACE or ENTER to advance');

        if (choice.nextParagraphIndex !== undefined) {
          this.engine.startFromParagraph(choice.nextParagraphIndex);
        }
      },
    });
  }

  private spawnChoiceParticles(target: Phaser.GameObjects.Text): void {
    const bounds = target.getBounds();
    const cx = bounds.centerX;
    const cy = bounds.centerY;
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 200);
      const particle = this.add.text(cx, cy, '█', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      particle.setOrigin(0.5);

      this.tweens.add({
        targets: particle,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed,
        alpha: 0,
        scale: { from: 1.5, to: 0 },
        duration: Phaser.Math.Between(400, 700),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private destroyChoiceUI(): void {
    this.choiceContainer?.destroy(true);
    this.choiceContainer = undefined;
    this.choiceLines = [];
    this.choicePromptLabel = undefined;
    this.choiceHintLabel = undefined;
    this.activeChoices = [];
    this.selectedChoiceIndex = 0;
  }

  private updatePortraitForParagraph(paragraphIndex: number): void {
    if (!this.chapter) return;

    const speakerId = getSpeakerForParagraph(this.chapter, paragraphIndex);
    if (speakerId === this.currentSpeakerId) return;

    const character = speakerId ? CHARACTERS[speakerId] : undefined;

    if (!character) {
      this.hidePortrait();
      this.currentSpeakerId = undefined;
      return;
    }

    this.currentSpeakerId = speakerId;
    this.showPortrait(character);
  }

  private showPortrait(character: CharacterDef): void {
    const margin = GAME_CONFIG.TEXT.MARGIN_X;
    const size = PORTRAIT_CONFIG.SIZE;
    const panelX = margin;
    const panelY = this.bodyText?.y ?? GAME_CONFIG.TEXT.MARGIN_Y;

    if (!this.portraitContainer) {
      this.portraitContainer = this.add.container(panelX, panelY);
      this.portraitContainer.setAlpha(0);
    }

    this.portraitContainer.removeAll(true);
    this.portraitImage = undefined;
    this.portraitMonogram = undefined;
    this.portraitBorder = undefined;
    this.portraitName = undefined;
    // R83.CTRLS.17 — distortion layer refs must clear alongside the base
    // portrait so a swap doesn't leave glitch bands painting the old
    // character's frame.
    this.portraitRedSplit = undefined;
    this.portraitBlueSplit = undefined;
    this.portraitGlitchGraphics = undefined;
    this.portraitGlitchTimer = 0;

    this.portraitBorder = this.add.graphics();
    this.portraitBorder.lineStyle(2, character.colour, 0.8);
    this.portraitBorder.fillStyle(MATRIX_COLORS.BACKGROUND, 0.9);
    this.portraitBorder.fillRect(0, 0, size, size);
    this.portraitBorder.strokeRect(0, 0, size, size);
    this.portraitContainer.add(this.portraitBorder);

    if (character.portraitKey && this.textures.exists(character.portraitKey)) {
      // R83.CTRLS.14 — explicit origin(0.5) documents intent (Phaser's default
      // for images is 0.5 so behaviour is unchanged, but an explicit call
      // protects against future refactors that bulk-reset origins). NEAREST
      // filter is applied once at texture-load time in BootScene, so the
      // 24px source sprite scales crisply up to the panel's 66px display size
      // instead of the bilinear blur the pre-.14 build shipped.
      //
      // R83.CTRLS.17 — RGB channel split distortion. Two tinted copies of the
      // portrait are stacked behind the base image, offset ±1px on the X
      // axis, with red/blue tint and ADD blend mode. The eye reconstructs
      // them as a single image with chromatic aberration — the "cursed VHS"
      // look. Blend mode ADD is a cheap approximation of proper channel
      // extraction; on CTRL-S's small (66px) portraits the fringe reads
      // correctly without needing a custom shader. Placed BEFORE the base
      // image in the container so the base reads on top with the splits
      // bleeding out the sides.
      const cx = Math.round(size / 2);
      const cy = Math.round(size / 2);

      this.portraitRedSplit = this.add.image(
        cx + PORTRAIT_RGB_SPLIT_OFFSET_PX,
        cy,
        character.portraitKey,
      );
      this.portraitRedSplit.setOrigin(0.5);
      this.portraitRedSplit.setDisplaySize(size - 4, size - 4);
      this.portraitRedSplit.setTint(0xff4040);
      this.portraitRedSplit.setBlendMode(Phaser.BlendModes.ADD);
      this.portraitRedSplit.setAlpha(0.45);
      this.portraitContainer.add(this.portraitRedSplit);

      this.portraitBlueSplit = this.add.image(
        cx - PORTRAIT_RGB_SPLIT_OFFSET_PX,
        cy,
        character.portraitKey,
      );
      this.portraitBlueSplit.setOrigin(0.5);
      this.portraitBlueSplit.setDisplaySize(size - 4, size - 4);
      this.portraitBlueSplit.setTint(0x4080ff);
      this.portraitBlueSplit.setBlendMode(Phaser.BlendModes.ADD);
      this.portraitBlueSplit.setAlpha(0.45);
      this.portraitContainer.add(this.portraitBlueSplit);

      this.portraitImage = this.add.image(cx, cy, character.portraitKey);
      this.portraitImage.setOrigin(0.5);
      this.portraitImage.setDisplaySize(size - 4, size - 4);
      this.portraitContainer.add(this.portraitImage);

      // Glitch-band layer sits on top of the portrait image, bounded to the
      // portrait frame so bands never bleed into the narrative column. A
      // Graphics object redraws itself on a timer in update().
      this.portraitGlitchGraphics = this.add.graphics();
      this.portraitContainer.add(this.portraitGlitchGraphics);
      this.portraitGlitchTimer = 0;
    } else {
      this.portraitMonogram = this.add.text(
        Math.round(size / 2),
        Math.round(size / 2),
        character.initial,
        {
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '28px',
          color: character.colourHex,
        },
      );
      this.portraitMonogram.setOrigin(0.5);
      this.portraitMonogram.setResolution(TEXT_RESOLUTION);
      this.portraitContainer.add(this.portraitMonogram);
    }

    this.portraitName = this.add.text(
      Math.round(size / 2),
      size + PORTRAIT_CONFIG.NAME_OFFSET_Y,
      character.name,
      {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '7px',
        color: character.colourHex,
      },
    );
    this.portraitName.setOrigin(0.5, 0);
    this.portraitName.setResolution(TEXT_RESOLUTION);
    this.portraitContainer.add(this.portraitName);

    this.portraitContainer.setPosition(Math.round(panelX), Math.round(panelY));

    this.tweens.add({
      targets: this.portraitContainer,
      alpha: 1,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
    });

    this.indentTextForPortrait(true);
  }

  private hidePortrait(): void {
    if (!this.portraitContainer) return;

    this.tweens.add({
      targets: this.portraitContainer,
      alpha: 0,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
    });

    this.indentTextForPortrait(false);
  }

  private indentTextForPortrait(indented: boolean): void {
    if (!this.bodyText) return;

    const width = Number(this.game.config.width);
    const targetX = indented ? PORTRAIT_CONFIG.TEXT_INDENT : GAME_CONFIG.TEXT.MARGIN_X;
    const targetWidth = width - targetX - GAME_CONFIG.TEXT.MARGIN_X;

    // Set wrap width once up front so Phaser only re-lays-out the text a
    // single time, not on every tween frame. Stop any prior indent tween via
    // ref so rapid portrait swaps don't chain concurrent x-tweens (and we
    // avoid killing unrelated bodyText tweens like puzzle-resume alpha).
    this.bodyText.setWordWrapWidth(targetWidth);
    this.indentTween?.stop();
    this.indentTween = this.tweens.add({
      targets: this.bodyText,
      x: targetX,
      duration: PORTRAIT_CONFIG.FADE_DURATION,
      ease: 'Power2',
    });
  }

  private syncPortraitY(): void {
    if (!this.portraitContainer || !this.bodyText) return;
    if (this.portraitContainer.alpha <= 0) return;

    this.portraitContainer.setY(this.bodyText.y);
  }

  private createParallaxBackground(): void {
    if (!this.chapter?.backgroundKey) return;
    if (!this.textures.exists(this.chapter.backgroundKey)) return;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    this.bgImage = this.add.image(
      Math.round(width / 2),
      Math.round(height / 2),
      this.chapter.backgroundKey,
    );
    this.bgImage.setOrigin(0.5);
    this.bgImage.setDisplaySize(width + PARALLAX_CONFIG.BG_DRIFT_AMPLITUDE * 2, height + 10);
    this.bgImage.setAlpha(PARALLAX_CONFIG.BG_ALPHA);

    if (this.chapter.backgroundTint) {
      this.bgImage.setTint(this.chapter.backgroundTint);
    }

    this.bgBaseX = width / 2;
    this.bgElapsed = 0;
  }

  private updateParallaxBackground(delta: number): void {
    if (!this.bgImage) return;

    this.bgElapsed += delta;
    const drift = Math.sin(this.bgElapsed / 1000 * PARALLAX_CONFIG.BG_DRIFT_SPEED * 0.1) * PARALLAX_CONFIG.BG_DRIFT_AMPLITUDE;
    // R83.CTRLS.14 — integer-snap the parallax drift position so the 800×620
    // display-sized bg doesn't sub-pixel-wobble frame-to-frame and blur its
    // own edges under bilinear filtering. The drift arc is still smooth
    // because sin() remains continuous; we just quantise the sample.
    this.bgImage.setX(Math.round(this.bgBaseX + drift));
  }

  private createThemeParticles(): void {
    const theme = this.chapter?.particleTheme;
    if (!theme) return;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const count = PARALLAX_CONFIG.PARTICLE_COUNT;
    const chars = this.getParticleChars(theme);

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const char = chars[Phaser.Math.Between(0, chars.length - 1)];

      const particle = this.add.text(x, y, char, {
        fontFamily: 'monospace',
        fontSize: this.getParticleFontSize(theme),
        color: this.getParticleColour(theme),
      });
      particle.setAlpha(Phaser.Math.FloatBetween(PARALLAX_CONFIG.PARTICLE_MIN_ALPHA, PARALLAX_CONFIG.PARTICLE_MAX_ALPHA));
      particle.setData('speedX', this.getParticleSpeedX(theme));
      particle.setData('speedY', this.getParticleSpeedY(theme));
      particle.setData('theme', theme);

      this.themeParticles.push(particle);
    }
  }

  private updateThemeParticles(delta: number): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const dt = delta / 1000;

    for (const p of this.themeParticles) {
      const speedX = p.getData('speedX') as number;
      const speedY = p.getData('speedY') as number;
      const theme = p.getData('theme') as ParticleTheme;

      p.x += speedX * dt;
      p.y += speedY * dt;

      if (theme === 'temporal') {
        p.setAlpha(0.15 + Math.sin(p.x * 0.05 + p.y * 0.03) * 0.15);
      }

      if (p.y > height + 10) {
        p.y = -10;
        p.x = Phaser.Math.Between(0, width);
      } else if (p.y < -10) {
        p.y = height + 10;
        p.x = Phaser.Math.Between(0, width);
      }
      if (p.x > width + 10) {
        p.x = -10;
      } else if (p.x < -10) {
        p.x = width + 10;
      }
    }
  }

  private getParticleChars(theme: ParticleTheme): string[] {
    switch (theme) {
      case 'binary': return ['0', '1', '0', '1', '0', '1'];
      case 'scanlines': return ['─', '═', '─', '━'];
      case 'datastreams': return ['>', '>>', '→', '▶', '»'];
      case 'temporal': return ['◊', '✦', '·', '○', '◈'];
      case 'organic': return ['✿', '❋', '·', '°', '○'];
      case 'rising-light': return ['✧', '·', '°', '☀', '✦'];
    }
  }

  private getParticleColour(theme: ParticleTheme): string {
    switch (theme) {
      case 'binary': return MATRIX_COLORS.DIM_GREEN_HEX;
      case 'scanlines': return MATRIX_COLORS.DARK_GREEN_HEX;
      case 'datastreams': return MATRIX_COLORS.MEDIUM_GREEN_HEX;
      case 'temporal': return MATRIX_COLORS.CYAN_HEX;
      case 'organic': return MATRIX_COLORS.FOREST_GREEN_HEX;
      case 'rising-light': return MATRIX_COLORS.YELLOW_HEX;
    }
  }

  private getParticleFontSize(theme: ParticleTheme): string {
    switch (theme) {
      case 'scanlines': return '4px';
      case 'datastreams': return '8px';
      default: return '6px';
    }
  }

  private getParticleSpeedX(theme: ParticleTheme): number {
    switch (theme) {
      case 'datastreams': return Phaser.Math.FloatBetween(30, 80);
      case 'temporal': return Phaser.Math.FloatBetween(-15, 15);
      case 'scanlines': return Phaser.Math.FloatBetween(-2, 2);
      default: return Phaser.Math.FloatBetween(-5, 5);
    }
  }

  private getParticleSpeedY(theme: ParticleTheme): number {
    switch (theme) {
      case 'binary': return Phaser.Math.FloatBetween(10, 25);
      case 'scanlines': return Phaser.Math.FloatBetween(3, 8);
      case 'datastreams': return Phaser.Math.FloatBetween(-3, 3);
      case 'temporal': return Phaser.Math.FloatBetween(-10, 10);
      case 'organic': return Phaser.Math.FloatBetween(-8, -2);
      case 'rising-light': return Phaser.Math.FloatBetween(-20, -8);
    }
  }

  /**
   * R83.CTRLS.16 — phosphor CRT glow. Phaser's built-in setShadow renders the
   * text with a blurred coloured drop-shadow; passing 0 offsets and
   * shadowStroke=true + shadowFill=true turns it into a symmetric halo that
   * reads as CRT bloom on green monochrome text. Cheap (text atlas only
   * rebuilds once) and works without a post-fx pipeline, so runs on the jsdom
   * mock in tests without extra setup.
   */
  private applyPhosphorBloom(
    target: Phaser.GameObjects.Text,
    blur: number,
    colour: string = PHOSPHOR_BLOOM_COLOR,
  ): void {
    target.setShadow(0, 0, colour, blur, true, true);
  }

  /**
   * R83.CTRLS.16 — jittering CRT scanline overlay. Generates a 4×4 pixel
   * texture with a single low-alpha green row, then wraps it as a full-screen
   * TileSprite at depth 1000. The overlay doesn't intercept pointer events
   * (no setInteractive) so clicks on choice lines pass through. Gets nudged
   * ±1 px vertically every ~333 ms in update() to mimic a CRT vertical-hold
   * wobble.
   */
  private createScanlineOverlay(): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const key = 'ctrls-scanline-pattern';

    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, SCANLINE_TILE_SIZE, SCANLINE_TILE_SIZE);
      if (tex) {
        const ctx = tex.getContext();
        if (ctx) {
          ctx.clearRect(0, 0, SCANLINE_TILE_SIZE, SCANLINE_TILE_SIZE);
          ctx.fillStyle = SCANLINE_ALPHA_HEX;
          ctx.fillRect(0, 1, SCANLINE_TILE_SIZE, 1);
        }
        tex.refresh();
      }
    }

    this.scanlineOverlay = this.add.tileSprite(0, 0, width, height, key);
    this.scanlineOverlay.setOrigin(0, 0);
    this.scanlineOverlay.setDepth(SCANLINE_DEPTH);
    this.scanlineOverlay.setScrollFactor(0);
  }

  private updateScanlineOverlay(delta: number): void {
    if (!this.scanlineOverlay) return;
    this.scanlineNudgeTimer += delta;
    if (this.scanlineNudgeTimer < SCANLINE_NUDGE_INTERVAL_MS) return;
    this.scanlineNudgeTimer = 0;
    const nudge = Phaser.Math.Between(-1, 1);
    this.scanlineOverlay.setTilePosition(0, nudge);
  }

  /**
   * R83.CTRLS.17 — dread vignette. Radial gradient baked once into a Phaser
   * canvas texture so the GPU doesn't redraw the gradient every frame. A
   * transparent centre lets the portrait + narrative text remain fully
   * readable while the 35% black edge pulls focus inward — reads as "the
   * terminal is the only thing lit in the room." Depth 990 puts it under the
   * scanline overlay (1000) so scanlines still wrap the frame.
   */
  private createDreadVignette(): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const key = 'ctrls-dread-vignette';

    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, width, height);
      if (tex) {
        const ctx = tex.getContext();
        if (ctx) {
          const cx = width / 2;
          const cy = height / 2;
          const maxR = Math.hypot(cx, cy);
          // Start the darkening ~45% out from centre so paragraph text in the
          // middle stays fully legible; the edge-darkening is enough to kill
          // the "bright rectangle" feel without crushing readability.
          const innerR = maxR * 0.45;
          const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, maxR);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(1, `rgba(0, 0, 0, ${VIGNETTE_EDGE_ALPHA})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        tex.refresh();
      }
    }

    this.dreadVignette = this.add.image(0, 0, key);
    this.dreadVignette.setOrigin(0, 0);
    this.dreadVignette.setDepth(VIGNETTE_DEPTH);
    this.dreadVignette.setScrollFactor(0);
  }

  /**
   * R83.CTRLS.17 — portrait glitch bands. Every 333-500 ms a horizontal band
   * flickers onto the portrait (2-4 px tall, 20-40% opacity, 70 ms hold) then
   * clears. Only one band is lit at a time to keep the read as "signal
   * instability" rather than constant noise. The graphics live inside the
   * portrait container so they inherit the container's fade + indent tweens
   * automatically; there's no absolute-position math to sync.
   */
  private updatePortraitGlitch(delta: number): void {
    if (!this.portraitGlitchGraphics || !this.portraitContainer) return;
    if (this.portraitContainer.alpha <= 0) return;

    this.portraitGlitchTimer -= delta;
    if (this.portraitGlitchTimer > 0) return;

    const size = PORTRAIT_CONFIG.SIZE;
    this.portraitGlitchGraphics.clear();
    // 60% of ticks draw a band, 40% leave the portrait clean — gives the
    // eye quiet moments so the next glitch reads as "something flickered"
    // rather than "it's always like this."
    if (Math.random() < 0.6) {
      const bandHeight = Phaser.Math.Between(2, 4);
      const bandY = Phaser.Math.Between(2, size - bandHeight - 2);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.4);
      // Green band with a slight magenta sibling underneath — the paired
      // offset fringe sells the "CRT desync" feel better than a single
      // green bar, which reads as overlay art.
      this.portraitGlitchGraphics.fillStyle(MATRIX_COLORS.PRIMARY, alpha);
      this.portraitGlitchGraphics.fillRect(2, bandY, size - 4, bandHeight);
      this.portraitGlitchGraphics.fillStyle(MATRIX_COLORS.MAGENTA, alpha * 0.5);
      this.portraitGlitchGraphics.fillRect(2, bandY + 1, size - 4, 1);
    }

    // Queue the next glitch tick. The random window keeps bands feeling
    // irregular rather than metronomic.
    this.portraitGlitchTimer = Phaser.Math.Between(
      PORTRAIT_GLITCH_INTERVAL_MIN_MS,
      PORTRAIT_GLITCH_INTERVAL_MAX_MS,
    );
    // Schedule a clear at PORTRAIT_GLITCH_HOLD_MS so the band flickers then
    // fades — without this the band would sit lit until the next tick.
    this.time.delayedCall(PORTRAIT_GLITCH_HOLD_MS, () => {
      this.portraitGlitchGraphics?.clear();
    });
  }

  /**
   * R83.CTRLS.16 — idle glyph flicker. Every ~5-7 s while the typewriter is
   * active, replace 1-2 random characters in the revealed paragraph with a
   * random Matrix glyph for 80 ms, then revert. Writes into `flickerMap`
   * (index → replacement-char) which is applied in renderCurrentText() as a
   * display transform — the engine's revealedText stays authoritative and
   * tests never see the mutation. Skipped in modal states (puzzle/choice/
   * terminal) so the flicker isn't overlaid on frozen text.
   */
  private updateGlyphFlicker(nowMs: number): void {
    if (this.flickerMap.size > 0 && nowMs >= this.flickerUntilMs) {
      this.flickerMap.clear();
    }
    if (this.waitingForPuzzle || this.waitingForChoice || this.waitingForInventory || this.waitingForTerminal) {
      return;
    }
    if (this.engine.state !== 'TYPING' && this.engine.state !== 'WAITING') return;
    if (nowMs < this.nextFlickerAtMs) return;

    const revealed = this.engine.revealedText;
    if (revealed.length > 4) {
      const count = Phaser.Math.Between(1, 2);
      for (let i = 0; i < count; i++) {
        const idx = Phaser.Math.Between(0, revealed.length - 1);
        if (/\s/.test(revealed[idx])) continue;
        const glyph = MATRIX_FLICKER_GLYPHS[Phaser.Math.Between(0, MATRIX_FLICKER_GLYPHS.length - 1)];
        this.flickerMap.set(idx, glyph);
      }
      this.flickerUntilMs = nowMs + FLICKER_HOLD_MS;
    }
    this.nextFlickerAtMs = nowMs + Phaser.Math.Between(FLICKER_MIN_INTERVAL_MS, FLICKER_MAX_INTERVAL_MS);
  }

  private applyFlickerMap(source: string): string {
    if (this.flickerMap.size === 0) return source;
    const chars = source.split('');
    this.flickerMap.forEach((g, i) => {
      if (i < chars.length) chars[i] = g;
    });
    return chars.join('');
  }

  protected handleExit(): void {
    this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  private buildTestState(): Record<string, unknown> {
    const snapshot = this.engine.getSnapshot();
    return {
      chapterIndex: this.chapterIndex,
      chapterId: this.chapter?.id,
      phase: 'narrative',
      waitingForPuzzle: this.waitingForPuzzle,
      waitingForChoice: this.waitingForChoice,
      waitingForInventory: this.waitingForInventory,
      waitingForTerminal: this.waitingForTerminal,
      terminalPhase: this.terminalState?.phase ?? null,
      terminalOutcome: this.terminalState?.outcome ?? null,
      terminalInput: this.terminalState?.input ?? '',
      terminalAttemptsRemaining: this.terminalState?.attemptsRemaining ?? null,
      terminalTimeRemainingMs: this.terminalState?.timeRemainingMs ?? null,
      activeChoices: this.activeChoices.map((c) => c.label),
      selectedChoiceIndex: this.selectedChoiceIndex,
      currentSpeaker: this.currentSpeakerId ?? null,
      portraitVisible: (this.portraitContainer?.alpha ?? 0) > 0,
      typewriter: snapshot,
    };
  }

  shutdown(): void {
    this.events.off(Phaser.Scenes.Events.RESUME, this.onSceneResume, this);
    this.stopBackgroundMusic();
    // R83.CTRLS.17 — drone fade-out is handled inside useSoundSystem (1 s
    // linearRamp to 0 then oscillator.stop), so calling this during shutdown
    // doesn't produce a DC click. Skipping this leaks the drone into the
    // next scene, which sounds like a bug.
    this.stopAmbientDrone();
    this.bgImage?.destroy();
    this.bgImage = undefined;
    for (const p of this.themeParticles) {
      p.destroy();
    }
    this.themeParticles = [];
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.scanlineOverlay?.destroy();
    this.scanlineOverlay = undefined;
    this.dreadVignette?.destroy();
    this.dreadVignette = undefined;
    this.portraitRedSplit = undefined;
    this.portraitBlueSplit = undefined;
    this.portraitGlitchGraphics = undefined;
    this.portraitGlitchTimer = 0;
    this.advancingBeat = false;
    this.flickerMap.clear();
    this.flickerUntilMs = 0;
    this.nextFlickerAtMs = 0;
    this.sceneElapsedMs = 0;
    this.scanlineNudgeTimer = 0;
    this.chapterTitle?.destroy();
    this.chapterAscii?.destroy();
    this.chapterAscii = undefined;
    this.bodyText?.destroy();
    this.cursorBlink?.destroy();
    this.cursorTween?.destroy();
    this.cursorScaleTween?.stop();
    this.cursorScaleTween = undefined;
    this.indentTween?.stop();
    this.indentTween = undefined;
    this.chapterAsciiFadedOut = false;
    this.promptText?.destroy();
    for (const ascii of this.asciiPanels) {
      ascii.destroy();
    }
    this.asciiPanels = [];
    this.destroyChoiceUI();
    this.destroyTerminalUI();
    this.portraitContainer?.destroy(true);
    this.portraitContainer = undefined;
    this.portraitImage = undefined;
    this.portraitMonogram = undefined;
    this.portraitBorder = undefined;
    this.portraitName = undefined;
    this.currentSpeakerId = undefined;
    this.waitingForPuzzle = false;
    this.waitingForChoice = false;
    this.waitingForInventory = false;
    this.waitingForTerminal = false;
    this.terminalResolved = false;
    this.upKey?.destroy();
    this.downKey?.destroy();
    this.upKey = undefined;
    this.downKey = undefined;
    for (const key of this.numberKeys) {
      key.destroy();
    }
    this.numberKeys = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
    super.shutdown();
  }
}
