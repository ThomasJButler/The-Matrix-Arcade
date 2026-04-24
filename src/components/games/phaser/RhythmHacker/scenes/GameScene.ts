/**
 * Rhythm Hacker - Game Scene
 *
 * Guitar Hero-style rhythm game:
 * - 4 lanes with falling notes
 * - Normal, Hold, and Double note types
 * - Timing grades: Perfect, Great, Good, Miss
 * - Combo system with multiplier
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, REGISTRY_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, NOTE_PROBABILITIES, ACHIEVEMENTS } from '../config';
import { ChartNote, getTrackCharts } from '../charts';
import { TRACK_COMPLETE_REASON } from './GameOverScene';

/** Note types */
type NoteType = 'normal' | 'hold' | 'double';

/** Note object */
interface Note extends Phaser.GameObjects.Container {
  lane: number;
  noteType: NoteType;
  holdDuration?: number;
  holdProgress?: number;
  isHeld?: boolean;
  pairedNote?: Note;
  hitTime: number;
  isHit: boolean;
}

/** Timing result */
type TimingGrade = 'perfect' | 'great' | 'good' | 'miss';

export class RhythmHackerGameScene extends BaseScene {
  // Track data
  private trackIndex = 0;
  private trackDuration = 0;
  private trackBpm = 120;
  private difficulty: 'easy' | 'normal' | 'hard' | 'insane' = 'normal';
  private audioUrl = '';

  // Music playback
  private trackAudio: HTMLAudioElement | null = null;

  // Game state
  private score = 0;
  private highScore = 0;
  private combo = 0;
  private maxCombo = 0;
  private health = GAME_CONFIG.HEALTH.MAX;
  private missCount = 0;
  private perfectCount = 0;
  private greatCount = 0;
  private goodCount = 0;
  private totalNotes = 0;

  // Timing
  private gameTime = 0;
  private nextNoteTime = 0;
  private beatInterval = 500; // ms between beats

  // Chart-based spawning (audio-synced)
  private chart: ChartNote[] = [];
  private chartIndex = 0;
  private noteTravelTime = 0;

  // Notes
  private notes!: Phaser.GameObjects.Group;
  private activeNotes: Note[] = [];

  // UI elements
  private laneBackgrounds: Phaser.GameObjects.Image[] = [];
  private keyIndicators: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private gradeText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;

  // Visual enhancements
  private laneFlashes: Phaser.GameObjects.Image[] = [];
  private useParticleSprites = false;
  private useUiSprites = false;
  private hitLineImage!: Phaser.GameObjects.Image;
  private hitLineGlow!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private comboGlow!: Phaser.GameObjects.Graphics;
  private matrixRainChars: Phaser.GameObjects.Text[] = [];
  private laneCyanTinted = false;

  // Input
  private laneKeys: Phaser.Input.Keyboard.Key[] = [];
  private keyHeld: boolean[] = [false, false, false, false];

  // Lane positions
  private laneX: number[] = [];

  // Track recent lanes to prevent 3+ consecutive same-lane notes
  private recentLanes: number[] = [];

  // Countdown
  private isCountdown = true;
  private countdownTime = 0;
  private countdownText!: Phaser.GameObjects.Text;

  /**
   * R87.RH1 — re-entry guard for `trackComplete()`.
   *
   * Before RH1, the `update()` check at L229 (`gameTime >= trackDuration &&
   * activeNotes.length === 0`) held true for every frame after the last note
   * cleared. `trackComplete()` fires `gameOver()` which eventually starts a
   * different scene, but the current scene keeps running `update()` until
   * Phaser drains the scene transition queue — so without a latch the guard
   * condition re-matched each frame and stacked `gameOver()` calls (the real
   * regression risk surfaced during RH1 audit: duplicate `reportScore` writes
   * and a race with the banner tween where the second call starts the
   * GameOverScene before the tween's `onComplete` fires).
   */
  private isTrackComplete = false;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  /**
   * R86.R1 — `P` is QWOP lane 4. Returning `null` skips BaseScene's default
   * P→togglePause binding so a lane-4 hit does not pause the song mid-play.
   * Pause stays reachable through the iPod dashbar's pause button (which
   * dispatches `PAUSE_REQUEST_EVENT` and is handled by BaseScene independently
   * of any keyboard binding).
   */
  protected getPauseKeyCode(): number | null {
    return null;
  }

  init(data: { trackIndex?: number }): void {
    this.trackIndex = data.trackIndex ?? 0;
    const track = GAME_CONFIG.TRACKS[this.trackIndex];
    this.trackDuration = track.duration;
    this.trackBpm = track.bpm;
    this.difficulty = track.difficulty as 'easy' | 'normal' | 'hard' | 'insane';
    this.beatInterval = 60000 / this.trackBpm;
    this.audioUrl = track.audioUrl;

    const { NOTES } = GAME_CONFIG;
    this.noteTravelTime = (NOTES.HIT_LINE_Y - NOTES.SPAWN_HEIGHT) / NOTES.SPEED * 1000;
    this.chart = getTrackCharts()[this.trackIndex] ?? [];
  }

  create(): void {
    this.createMatrixBackground();
    this.gameStartTime = Date.now();

    // Reset state
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.health = GAME_CONFIG.HEALTH.MAX;
    this.missCount = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.totalNotes = 0;
    this.gameTime = 0;
    this.nextNoteTime = GAME_CONFIG.COUNTDOWN.NOTES_START;
    this.activeNotes = [];
    this.chartIndex = 0;
    this.keyHeld = [false, false, false, false];
    this.isCountdown = true;
    this.countdownTime = 0;
    this.isTrackComplete = false;
    this.laneBackgrounds = [];

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.rhythmHacker?.highScore ?? 0;
    }
    this.keyIndicators = [];
    this.laneFlashes = [];
    this.recentLanes = [];
    this.useParticleSprites = !!this.registry?.get('particleSpriteMode');
    this.useUiSprites = !!this.registry?.get('uiSpriteMode');

    // Calculate lane positions
    const { LANES, WIDTH } = GAME_CONFIG;
    const totalWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const startX = (WIDTH - totalWidth) / 2 + LANES.WIDTH / 2;

    this.laneX = [];
    for (let i = 0; i < LANES.COUNT; i++) {
      this.laneX.push(startX + i * (LANES.WIDTH + LANES.SPACING));
    }

    // Create notes group
    this.notes = this.add.group();

    // Create lanes
    this.createLanes();

    // Create UI
    this.createUI();

    // Create countdown
    this.createCountdown();

    // Setup input
    this.setupInput();
    this.setupCommonInputs();

    // Prepare music track
    this.initTrackAudio();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Only increment gameTime after countdown finishes so track duration
    // measures actual gameplay, not countdown + gameplay combined
    if (!this.isCountdown) {
      this.gameTime += delta;
    }

    // Update countdown
    if (this.isCountdown) {
      this.updateCountdown(delta);
    }

    // Spawn notes (only after countdown)
    if (!this.isCountdown) {
      this.spawnNotes();
    }

    // Update notes
    this.updateNotes(delta);

    // Visual effects — scrolling grid, note approach scaling, combo glow
    this.updateScrollingGrid();
    this.updateNoteApproachEffects();
    this.updateComboGlow();

    // Check for track end. R87.RH1 adds the `!isTrackComplete` guard so the
    // banner tween + delayedCall chain is never interrupted by a second
    // trackComplete() kicked off on a later update() tick.
    if (
      !this.isTrackComplete &&
      this.gameTime >= this.trackDuration * 1000 &&
      this.activeNotes.length === 0
    ) {
      this.trackComplete();
    }

    // Sync mute state to track audio
    if (this.trackAudio) {
      this.trackAudio.muted = this.getIsMuted();
    }

    // Update UI
    this.updateUI();

    // Expose state for E2E tests
    this.exposeTestState({
      score: this.score,
      combo: this.combo,
      health: this.health,
      missCount: this.missCount,
      countdownValue: this.countdownValue,
    });
  }

  /**
   * Create countdown display
   */
  private createCountdown(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    this.countdownText = this.add.text(WIDTH / 2, HEIGHT / 2 - 50, Math.ceil(GAME_CONFIG.COUNTDOWN.DURATION / 1000).toString(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '120px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(200);
    this.countdownText.setShadow(0, 0, MATRIX_COLORS.PRIMARY_HEX, 2);
  }

  /**
   * Update countdown using real frame delta for frame-rate independence
   */
  private updateCountdown(delta: number): void {
    this.countdownTime += delta;

    const { DURATION, GO_DISPLAY_END } = GAME_CONFIG.COUNTDOWN;
    const countdownSeconds = Math.floor((DURATION - this.countdownTime) / 1000);

    if (countdownSeconds > 0) {
      this.countdownText.setText(countdownSeconds.toString());
    } else if (countdownSeconds <= 0 && this.countdownTime < GO_DISPLAY_END) {
      this.countdownText.setText('GO!');
      this.countdownText.setColor(MATRIX_COLORS.CYAN_HEX);
    } else {
      // Countdown finished — reset note spawn timing since gameTime
      // now starts at 0 after countdown (not during)
      this.isCountdown = false;
      this.nextNoteTime = 0;
      this.countdownText.setVisible(false);
      this.startTrackAudio();
    }
  }

  /**
   * Create lane backgrounds, dividers, beat-pulse overlays, scrolling grid,
   * hit line with glow, combo glow overlay, and key indicators.
   */
  private createLanes(): void {
    const { LANES, HEIGHT, NOTES, WIDTH } = GAME_CONFIG;
    const totalWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const areaStartX = (WIDTH - totalWidth) / 2;

    // Scrolling grid overlay — redrawn each frame for highway motion
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(0.5);

    this.laneX.forEach((x, _i) => {
      // Lane background
      const bg = this.add.image(x, HEIGHT / 2, 'lane_bg');
      bg.setAlpha(0.3);
      this.laneBackgrounds.push(bg);

      // Beat flash overlay — invisible by default, pulsed on beat
      const flash = this.add.image(x, HEIGHT / 2, 'lane_flash');
      flash.setAlpha(0);
      flash.setDepth(1);
      this.laneFlashes.push(flash);
    });

    // Lane dividers between lanes
    for (let i = 0; i < LANES.COUNT - 1; i++) {
      const divX = (this.laneX[i] + this.laneX[i + 1]) / 2;
      const divider = this.add.image(divX, HEIGHT / 2, 'lane_divider');
      divider.setDepth(1.5);
    }

    // Combo glow — drawn behind hit line, intensity scales with combo
    this.comboGlow = this.add.graphics();
    this.comboGlow.setDepth(3);

    // Hit line glow — wider ambient glow behind the hit line
    this.hitLineGlow = this.add.graphics();
    this.hitLineGlow.fillStyle(MATRIX_COLORS.PRIMARY, 0.15);
    this.hitLineGlow.fillRect(areaStartX - 5, NOTES.HIT_LINE_Y - 20, totalWidth + 10, 40);
    this.hitLineGlow.setDepth(4);

    // Hit line
    this.hitLineImage = this.add.image(WIDTH / 2, NOTES.HIT_LINE_Y, 'hit_line');
    this.hitLineImage.setDepth(5);

    // Key indicators
    this.laneX.forEach((x, i) => {
      const key = this.add.image(x, NOTES.HIT_LINE_Y + 35, `key_${i}`);
      key.setDepth(10);
      this.keyIndicators.push(key);

      const label = this.add.text(x, NOTES.HIT_LINE_Y + 35, LANES.KEYS[i], {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '20px',
        color: MATRIX_COLORS.WHITE_HEX,
      });
      label.setOrigin(0.5);
      label.setDepth(11);
    });
  }

  /**
   * Create UI elements with hologram panel backdrops.
   * Left gutter: score, time, track. Right gutter: health, combo, multiplier.
   * Grade floats above the hit line in the lane area.
   */
  private createUI(): void {
    const { WIDTH, LANES } = GAME_CONFIG;

    const totalLaneWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const leftGutterRight = (WIDTH - totalLaneWidth) / 2 - 15;
    const rightGutterLeft = WIDTH - leftGutterRight + 15;

    // --- LEFT GUTTER ---

    // Score panel backdrop
    const scorePanel = this.add.image(20 + 56, 45, 'ui_panel_green');
    scorePanel.setOrigin(0.5);
    scorePanel.setDisplaySize(leftGutterRight - 10, 55);
    scorePanel.setAlpha(0.4);
    scorePanel.setDepth(99);

    this.scoreText = this.add.text(20, 25, 'SCORE\n0', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      lineSpacing: 8,
    });
    this.scoreText.setDepth(100);

    // Time panel backdrop
    const timePanel = this.add.image(20 + 56, 112, 'ui_panel_empty');
    timePanel.setOrigin(0.5);
    timePanel.setDisplaySize(leftGutterRight - 10, 45);
    timePanel.setAlpha(0.35);
    timePanel.setDepth(99);

    this.timeText = this.add.text(20, 96, `TIME\n${this.trackDuration}s`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
      lineSpacing: 6,
    });
    this.timeText.setDepth(100);

    // Track name
    const track = GAME_CONFIG.TRACKS[this.trackIndex];
    const trackName = this.add.text(20, 160, track.name, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '9px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      wordWrap: { width: leftGutterRight - 20 },
    });
    trackName.setDepth(100);

    // Difficulty badge
    const diffColors: Record<string, string> = {
      easy: MATRIX_COLORS.PRIMARY_HEX,
      normal: MATRIX_COLORS.CYAN_HEX,
      hard: MATRIX_COLORS.YELLOW_HEX,
      insane: MATRIX_COLORS.RED_HEX,
    };
    const diffText = this.add.text(20, 195, this.difficulty.toUpperCase(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: diffColors[this.difficulty] ?? MATRIX_COLORS.PRIMARY_HEX,
    });
    diffText.setDepth(100);

    // --- RIGHT GUTTER ---

    // Health panel backdrop — switches to red panel at low health
    const healthPanelKey = 'ui_panel_green';
    const healthPanel = this.add.image(rightGutterLeft + 56, 45, healthPanelKey);
    healthPanel.setOrigin(0.5);
    healthPanel.setDisplaySize(Math.min(WIDTH - rightGutterLeft - 10, 150), 55);
    healthPanel.setAlpha(0.4);
    healthPanel.setDepth(99);
    healthPanel.setData('panelRef', true);

    const healthLabel = this.add.text(rightGutterLeft, 25, 'HEALTH', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '9px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    healthLabel.setDepth(100);

    const healthBarWidth = Math.min(WIDTH - rightGutterLeft - 20, 140);
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x222222, 1);
    healthBg.fillRoundedRect(rightGutterLeft, 45, healthBarWidth, 16, 3);
    healthBg.setDepth(100);

    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(101);

    // Combo
    this.comboText = this.add.text(rightGutterLeft, 90, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '16px',
      color: MATRIX_COLORS.CYAN_HEX,
      wordWrap: { width: WIDTH - rightGutterLeft - 10 },
    });
    this.comboText.setDepth(100);

    // Multiplier display
    this.multiplierText = this.add.text(rightGutterLeft, 145, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.YELLOW_HEX,
    });
    this.multiplierText.setDepth(100);

    // Grade display
    this.gradeText = this.add.text(WIDTH / 2, 40, '', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '18px',
      color: MATRIX_COLORS.WHITE_HEX,
    });
    this.gradeText.setOrigin(0.5);
    this.gradeText.setDepth(100);
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const keyCodes = [
        Phaser.Input.Keyboard.KeyCodes.Q,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.O,
        Phaser.Input.Keyboard.KeyCodes.P,
      ];

      keyCodes.forEach((code, lane) => {
        const key = this.input.keyboard!.addKey(code);
        this.laneKeys.push(key);

        key.on('down', () => this.onKeyDown(lane));
        key.on('up', () => this.onKeyUp(lane));
      });
    });
  }

  /**
   * Handle key press — ignored during countdown to prevent health drain before notes spawn
   */
  private onKeyDown(lane: number): void {
    this.keyHeld[lane] = true;
    this.keyIndicators[lane].setTexture(`key_pressed_${lane}`);

    // Ignore note-matching during countdown — no notes exist yet
    if (this.isCountdown) return;

    // Find nearest note in this lane
    const note = this.findNearestNote(lane);
    if (note) {
      this.hitNote(note);

      // If this is a double note, also mark its pair as hit
      if (note.noteType === 'double' && note.pairedNote && !note.pairedNote.isHit) {
        // Check if the paired lane key is also held
        if (this.keyHeld[note.pairedNote.lane]) {
          this.hitNote(note.pairedNote);
        }
      }
    } else {
      // Empty hit penalty - small health deduction to discourage key spam
      this.health = Math.max(0, this.health - GAME_CONFIG.HEALTH.EMPTY_HIT_PENALTY);
      this.playSound('rhythmMiss');

      if (this.health <= 0) {
        this.stopTrackAudio();
        this.cameras.main.flash(150, 255, 0, 0, false, undefined, undefined, 0.2);
        if (this.score > this.highScore) this.highScore = this.score;
        this.reportScore(this.score, this.highScore);
        this.gameOver(this.score, 'Health depleted', this.highScore, this.buildEndStats(), this.trackIndex + 1, this.getGameDuration());
      }
    }
  }

  /**
   * Handle key release
   */
  private onKeyUp(lane: number): void {
    this.keyHeld[lane] = false;
    this.keyIndicators[lane].setTexture(`key_${lane}`);

    // Check for held notes
    this.activeNotes.forEach((note) => {
      if (note.lane === lane && note.noteType === 'hold' && note.isHeld) {
        this.releaseHoldNote(note);
      }
    });
  }

  /**
   * Find nearest hittable note in lane
   */
  private findNearestNote(lane: number): Note | null {
    const { NOTES, TIMING } = GAME_CONFIG;
    let nearest: Note | null = null;
    let nearestDist = Infinity;

    this.activeNotes.forEach((note) => {
      if (note.lane !== lane || note.isHit) return;

      const dist = Math.abs(note.y - NOTES.HIT_LINE_Y);
      if (dist < nearestDist && dist < TIMING.GOOD + 50) {
        nearestDist = dist;
        nearest = note;
      }
    });

    return nearest;
  }

  /**
   * Hit a note
   */
  private hitNote(note: Note): void {
    if (note.isHit) return;

    const { NOTES, TIMING } = GAME_CONFIG;
    const distance = Math.abs(note.y - NOTES.HIT_LINE_Y);

    // Calculate timing in ms
    const timingMs = (distance / GAME_CONFIG.NOTES.SPEED) * 1000;

    let grade: TimingGrade;
    if (timingMs <= TIMING.PERFECT) {
      grade = 'perfect';
    } else if (timingMs <= TIMING.GREAT) {
      grade = 'great';
    } else if (timingMs <= TIMING.GOOD) {
      grade = 'good';
    } else {
      grade = 'miss';
    }

    // Handle hold notes
    if (note.noteType === 'hold' && grade !== 'miss') {
      note.isHeld = true;
      note.holdProgress = 0;
    }

    this.processHit(note, grade);
  }

  /**
   * Process hit result
   */
  private processHit(note: Note, grade: TimingGrade): void {
    note.isHit = true;

    // Update stats
    switch (grade) {
      case 'perfect':
        this.perfectCount++;
        this.score += this.calculateScore(GAME_CONFIG.SCORING.PERFECT);
        this.health = Math.min(GAME_CONFIG.HEALTH.MAX, this.health + GAME_CONFIG.HEALTH.PERFECT_HEAL);
        this.combo++;
        this.playSound('rhythmPerfect');
        this.unlockAchievement(ACHIEVEMENTS.FIRST_PERFECT);
        break;
      case 'great':
        this.greatCount++;
        this.score += this.calculateScore(GAME_CONFIG.SCORING.GREAT);
        this.health = Math.min(GAME_CONFIG.HEALTH.MAX, this.health + GAME_CONFIG.HEALTH.GREAT_HEAL);
        this.combo++;
        this.playSound('rhythmGood');
        break;
      case 'good':
        this.goodCount++;
        this.score += this.calculateScore(GAME_CONFIG.SCORING.GOOD);
        this.health = Math.min(GAME_CONFIG.HEALTH.MAX, this.health + GAME_CONFIG.HEALTH.GOOD_HEAL);
        this.combo++;
        this.playSound('rhythmGood');
        break;
      case 'miss':
        this.missCount++;
        this.health = Math.max(0, this.health - GAME_CONFIG.HEALTH.MISS_DAMAGE);
        this.combo = 0;
        this.playSound('rhythmMiss');
        // Reset cyan tint on combo break
        if (this.laneCyanTinted) {
          this.laneCyanTinted = false;
          this.laneBackgrounds.forEach(bg => bg.clearTint());
        }
        break;
    }

    // Update max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Combo milestone effects — screen shake, matrix rain, colour shift
    if (this.combo === 10 || this.combo === 25 || this.combo === 50 ||
        (this.combo > 50 && this.combo % 25 === 0)) {
      this.showComboMilestone(this.combo);
      this.triggerComboEffects(this.combo);
    }

    // Combo achievements
    if (this.combo >= 50) {
      this.unlockAchievement(ACHIEVEMENTS.COMBO_50);
      this.playSound('rhythmCombo');
    }
    if (this.combo >= 100) {
      this.unlockAchievement(ACHIEVEMENTS.COMBO_100);
    }

    // Show grade
    this.showGrade(grade, note.x, GAME_CONFIG.NOTES.HIT_LINE_Y - 50);

    // Create hit effect
    this.createHitEffect(note.x, GAME_CONFIG.NOTES.HIT_LINE_Y, grade);

    // Remove note if not hold
    if (note.noteType !== 'hold' || grade === 'miss') {
      this.removeNote(note);
    }

    // Check health
    //
    // R86.R4 — this is the hitNote→miss→health-depleted path. Previously it
    // reported `(score, score)` and passed `undefined` as highScore to
    // `gameOver`, which lied to the scoreboard about the session result. The
    // two other game-over paths (onKeyDown empty-hit at L530 and trackComplete
    // at L1147) promote highScore before reporting — this one now matches so
    // all three routes obey the same (score, highScore) contract.
    if (this.health <= 0) {
      this.stopTrackAudio();
      this.cameras.main.flash(150, 255, 0, 0, false, undefined, undefined, 0.2);
      if (this.score > this.highScore) this.highScore = this.score;
      this.reportScore(this.score, this.highScore);
      this.gameOver(this.score, 'Health depleted', this.highScore, this.buildEndStats(), this.trackIndex + 1, this.getGameDuration());
    }
  }

  /**
   * Release hold note
   */
  private releaseHoldNote(note: Note): void {
    if (!note.isHeld) return;

    const holdComplete = (note.holdProgress ?? 0) >= 0.8;

    if (holdComplete) {
      this.score += this.calculateScore(50);
      this.showGrade('great', note.x, GAME_CONFIG.NOTES.HIT_LINE_Y - 50);
    } else {
      this.combo = 0;
      this.showGrade('miss', note.x, GAME_CONFIG.NOTES.HIT_LINE_Y - 50);
    }

    this.removeNote(note);
  }

  /**
   * Calculate score with combo multiplier
   */
  private calculateScore(baseScore: number): number {
    const comboBonus = Math.floor(this.combo / 10) * GAME_CONFIG.SCORING.COMBO_MULTIPLIER;
    return Math.floor(baseScore * (1 + comboBonus));
  }

  /**
   * Show a combo milestone burst at the centre of the lane area.
   */
  private showComboMilestone(combo: number): void {
    const { WIDTH } = GAME_CONFIG;
    const milestoneText = this.add.text(WIDTH / 2, 300, `${combo} COMBO!`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '24px',
      color: MATRIX_COLORS.YELLOW_HEX,
    });
    milestoneText.setOrigin(0.5);
    milestoneText.setDepth(200);
    milestoneText.setShadow(0, 0, MATRIX_COLORS.YELLOW_HEX, 10);

    this.tweens.add({
      targets: milestoneText,
      scale: { from: 0.5, to: 1.4 },
      alpha: { from: 1, to: 0 },
      y: 250,
      duration: 800,
      ease: 'Power2',
      onComplete: () => milestoneText.destroy(),
    });
  }

  /**
   * Trigger screen-shake, matrix-rain burst, and colour shift on combo milestones.
   */
  private triggerComboEffects(combo: number): void {
    // Screen shake — intensity scales with milestone
    const shakeIntensity = combo >= 50 ? 0.012 : combo >= 25 ? 0.008 : 0.005;
    const shakeDuration = combo >= 50 ? 300 : combo >= 25 ? 200 : 150;
    this.cameras.main.shake(shakeDuration, shakeIntensity);

    // Matrix rain burst — spawn falling characters across the lane area
    this.spawnMatrixRainBurst(combo);

    // Colour shift — tint lane backgrounds cyan at 25+ combo
    if (combo >= 25 && !this.laneCyanTinted) {
      this.laneCyanTinted = true;
      this.laneBackgrounds.forEach(bg => bg.setTint(MATRIX_COLORS.CYAN));
    }
  }

  /**
   * Spawn a burst of falling Matrix-style characters across the lane area.
   * Count and speed scale with the combo milestone.
   */
  private spawnMatrixRainBurst(combo: number): void {
    const { WIDTH, HEIGHT, LANES } = GAME_CONFIG;
    const totalWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const startX = (WIDTH - totalWidth) / 2;
    const count = combo >= 50 ? 30 : combo >= 25 ? 20 : 12;
    const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

    for (let i = 0; i < count; i++) {
      const x = startX + Math.random() * totalWidth;
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const rainText = this.add.text(x, -20 - Math.random() * 100, char, {
        fontFamily: 'monospace',
        fontSize: `${12 + Math.random() * 10}px`,
        color: combo >= 50 ? MATRIX_COLORS.CYAN_HEX : MATRIX_COLORS.PRIMARY_HEX,
      });
      rainText.setAlpha(0.4 + Math.random() * 0.5);
      rainText.setDepth(45);
      this.matrixRainChars.push(rainText);

      const speed = 200 + Math.random() * 300;
      const duration = (HEIGHT + 120) / speed * 1000;

      this.tweens.add({
        targets: rainText,
        y: HEIGHT + 20,
        alpha: 0,
        duration,
        delay: Math.random() * 300,
        onComplete: () => {
          const idx = this.matrixRainChars.indexOf(rainText);
          if (idx !== -1) this.matrixRainChars.splice(idx, 1);
          rainText.destroy();
        },
      });
    }
  }

  /**
   * Show grade text with glow shadow and scale pop for higher grades.
   */
  private showGrade(grade: TimingGrade, x: number, y: number): void {
    const colors: Record<TimingGrade, string> = {
      perfect: MATRIX_COLORS.CYAN_HEX,
      great: MATRIX_COLORS.PRIMARY_HEX,
      good: MATRIX_COLORS.DIM_GREEN_HEX,
      miss: '#660000',
    };
    const sizes: Record<TimingGrade, string> = {
      perfect: '20px',
      great: '16px',
      good: '14px',
      miss: '12px',
    };

    const gradeText = this.add.text(x, y, grade.toUpperCase(), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: sizes[grade],
      color: colors[grade],
    });
    gradeText.setOrigin(0.5);
    gradeText.setDepth(50);
    gradeText.setShadow(0, 0, colors[grade], grade === 'perfect' ? 8 : 4);

    const startScale = grade === 'perfect' ? 1.3 : 1.0;
    gradeText.setScale(startScale);

    this.tweens.add({
      targets: gradeText,
      y: y - 40,
      alpha: 0,
      scale: 0.6,
      duration: 600,
      ease: 'Power2',
      onComplete: () => gradeText.destroy(),
    });
  }

  /**
   * Create hit effect — firework particle sprites when available,
   * procedural fallback circles otherwise.
   */
  private createHitEffect(x: number, y: number, grade: TimingGrade): void {
    const gradeTints: Record<TimingGrade, number> = {
      perfect: MATRIX_COLORS.CYAN,
      great: MATRIX_COLORS.PRIMARY,
      good: MATRIX_COLORS.DIM_GREEN,
      miss: 0x660000,
    };
    const tint = gradeTints[grade];

    const particleKeys = this.useParticleSprites
      ? ['particle_pink_1', 'particle_pink_2', 'particle_purple_1', 'particle_purple_2', 'particle_yellow_1']
      : null;

    const count = grade === 'perfect' ? 8 : grade === 'miss' ? 3 : 5;

    for (let i = 0; i < count; i++) {
      const textureKey = particleKeys
        ? particleKeys[i % particleKeys.length]
        : `effect_${grade}`;

      const particle = this.add.image(x, y, textureKey);

      if (particleKeys) {
        particle.setDisplaySize(20, 20);
        particle.setTint(tint);
      } else {
        particle.setScale(0.5);
      }
      particle.setDepth(40);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 60;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        rotation: Math.random() * Math.PI,
        duration: grade === 'perfect' ? 500 : 350,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Audio-synced track time — authoritative when the backing track is
   * playing, falls back to the frame-delta accumulator otherwise.
   */
  private getTrackTime(): number {
    if (this.trackAudio && this.trackAudio.currentTime > 0) {
      return this.trackAudio.currentTime * 1000;
    }
    return this.gameTime;
  }

  /**
   * Spawn notes — chart-driven when a beat-map exists, procedural fallback otherwise.
   */
  private spawnNotes(): void {
    const trackTime = this.getTrackTime();
    if (trackTime >= this.trackDuration * 1000) return;

    if (this.chart.length > 0) {
      while (this.chartIndex < this.chart.length) {
        const chartNote = this.chart[this.chartIndex];
        const spawnTime = chartNote.time - this.noteTravelTime;
        if (trackTime < spawnTime) break;
        this.spawnChartNote(chartNote);
        this.chartIndex++;
      }
    } else {
      while (this.gameTime >= this.nextNoteTime) {
        this.spawnNote();
        const variation = this.beatInterval * 0.3 * (Math.random() - 0.5);
        this.nextNoteTime += this.beatInterval + variation;
        if (this.difficulty === 'hard') {
          this.nextNoteTime -= this.beatInterval * 0.2;
        } else if (this.difficulty === 'insane') {
          this.nextNoteTime -= this.beatInterval * 0.4;
        }
      }
    }
  }

  /**
   * Spawn a note from chart data — lane and type are pre-determined.
   */
  private spawnChartNote(chartNote: ChartNote): void {
    const { NOTES } = GAME_CONFIG;
    const x = this.laneX[chartNote.lane];

    const note = this.createNote(x, NOTES.SPAWN_HEIGHT, chartNote.lane, chartNote.type, chartNote.holdDuration);
    this.activeNotes.push(note);
    this.totalNotes++;

    if (chartNote.type === 'double' && chartNote.pairedLane !== undefined) {
      const x2 = this.laneX[chartNote.pairedLane];
      const note2 = this.createNote(x2, NOTES.SPAWN_HEIGHT, chartNote.pairedLane, 'double');
      note.pairedNote = note2;
      note2.pairedNote = note;
      this.activeNotes.push(note2);
      this.totalNotes++;
    }
  }

  /**
   * Spawn a single note
   */
  private spawnNote(): void {
    const { LANES, NOTES } = GAME_CONFIG;
    const probs = NOTE_PROBABILITIES[this.difficulty];

    // Determine note type
    const rand = Math.random();
    let noteType: NoteType = 'normal';
    if (rand < probs.double) {
      noteType = 'double';
    } else if (rand < probs.double + probs.hold) {
      noteType = 'hold';
    }

    // Pick lane — avoid 3+ consecutive notes in the same lane
    let lane = Phaser.Math.Between(0, LANES.COUNT - 1);
    if (
      this.recentLanes.length >= 2 &&
      this.recentLanes[this.recentLanes.length - 1] === lane &&
      this.recentLanes[this.recentLanes.length - 2] === lane
    ) {
      // Force a different lane
      lane = (lane + Phaser.Math.Between(1, LANES.COUNT - 1)) % LANES.COUNT;
    }
    this.recentLanes.push(lane);
    if (this.recentLanes.length > 4) this.recentLanes.shift();
    const x = this.laneX[lane];

    // Create note
    const note = this.createNote(x, NOTES.SPAWN_HEIGHT, lane, noteType);
    this.activeNotes.push(note);
    this.totalNotes++;

    // For double notes, create paired note
    if (noteType === 'double') {
      let lane2 = lane;
      while (lane2 === lane) {
        lane2 = Phaser.Math.Between(0, LANES.COUNT - 1);
      }
      const x2 = this.laneX[lane2];
      const note2 = this.createNote(x2, NOTES.SPAWN_HEIGHT, lane2, 'double');
      note.pairedNote = note2;
      note2.pairedNote = note;
      this.activeNotes.push(note2);
      this.totalNotes++;
    }
  }

  /**
   * Create note visual
   */
  private createNote(x: number, y: number, lane: number, noteType: NoteType, chartHoldDuration?: number): Note {
    const { NOTES } = GAME_CONFIG;

    const container = this.add.container(x, y) as Note;
    container.lane = lane;
    container.noteType = noteType;
    container.hitTime = this.gameTime + (NOTES.HIT_LINE_Y - y) / NOTES.SPEED * 1000;
    container.isHit = false;
    container.setDepth(20);

    // Note graphic
    const noteSprite = this.add.image(0, 0, `note_${lane}`);
    container.add(noteSprite);

    // Double note indicator
    if (noteType === 'double') {
      const indicator = this.add.image(0, 0, 'double_indicator');
      container.add(indicator);
    }

    // Hold note tail
    if (noteType === 'hold') {
      const holdDuration = chartHoldDuration ?? Phaser.Math.Between(500, 1500);
      const holdLength = (holdDuration / 1000) * NOTES.SPEED;

      container.holdDuration = holdDuration;
      container.holdProgress = 0;
      container.isHeld = false;

      // Hold body
      const holdBody = this.add.graphics();
      holdBody.fillStyle(GAME_CONFIG.LANES.COLORS[lane], 0.5);
      holdBody.fillRect(-NOTES.HOLD_WIDTH / 2, -holdLength - NOTES.HEIGHT / 2, NOTES.HOLD_WIDTH, holdLength);
      container.add(holdBody);

      // Hold tail
      const tail = this.add.image(0, -holdLength - NOTES.HEIGHT / 2, `hold_tail_${lane}`);
      container.add(tail);
    }

    this.notes.add(container);
    return container;
  }

  /**
   * Update notes
   */
  private updateNotes(delta: number): void {
    const { NOTES } = GAME_CONFIG;
    const speed = NOTES.SPEED * (delta / 1000);

    const toRemove: Note[] = [];

    this.activeNotes.forEach((note) => {
      // Move note down
      if (!note.isHeld) {
        note.y += speed;
      }

      // Update hold progress
      if (note.noteType === 'hold' && note.isHeld && note.holdDuration) {
        note.holdProgress = (note.holdProgress ?? 0) + delta / note.holdDuration;
        if (note.holdProgress >= 1) {
          this.releaseHoldNote(note);
        }
      }

      // Check for miss (note passed hit line)
      if (!note.isHit && note.y > NOTES.HIT_LINE_Y + 100) {
        this.processHit(note, 'miss');
      }

      // Remove off-screen notes
      if (note.y > GAME_CONFIG.HEIGHT + 50) {
        toRemove.push(note);
      }
    });

    toRemove.forEach((note) => this.removeNote(note));
  }

  /**
   * Remove note from game
   */
  private removeNote(note: Note): void {
    const index = this.activeNotes.indexOf(note);
    if (index !== -1) {
      this.activeNotes.splice(index, 1);
    }

    // Clean up paired double note to prevent orphaned references.
    // Both notes in a pair track each other via pairedNote. When one is removed,
    // sever the back-reference so the surviving note won't try to clean up
    // an already-destroyed object. If both are hit/missed, remove the pair too.
    if (note.noteType === 'double' && note.pairedNote) {
      const pair = note.pairedNote;
      // Sever bidirectional link first to prevent recursive cleanup
      note.pairedNote = undefined;
      pair.pairedNote = undefined;

      // If the pair has also been processed (hit or missed), clean it up now
      if (pair.isHit) {
        const pairedIndex = this.activeNotes.indexOf(pair);
        if (pairedIndex !== -1) {
          this.activeNotes.splice(pairedIndex, 1);
          pair.destroy();
        }
      }
    }

    note.destroy();
  }

  /**
   * Track complete — the natural-end win path.
   *
   * R87.RH1 changes the user-facing shape of this path:
   *   1. Re-entry guard (`isTrackComplete`) so the update-tick condition at
   *      L229 cannot fire this twice.
   *   2. Paint a "TRACK COMPLETE" banner so the player gets explicit win
   *      feedback instead of a silent cut to the scoreboard (Tom's 2026-04-23
   *      complaint).
   *   3. Defer `gameOver()` until after `BANNER_HOLD_MS` so the banner is
   *      perceivable.
   *   4. Pass `reason = 'TRACK COMPLETE'` through gameOver so the Rhythm
   *      Hacker GameOverScene variant paints the green win title instead of
   *      the red "GAME OVER" default. Max-combo info moves into the stats
   *      grid (already present via buildEndStats()) so the reason slot can
   *      carry the celebratory copy instead of duplicating a stat.
   */
  private trackComplete(): void {
    if (this.isTrackComplete) return;
    this.isTrackComplete = true;

    this.stopTrackAudio();
    this.playSound('levelUp');

    // Check for full combo
    if (this.missCount === 0) {
      this.unlockAchievement(ACHIEVEMENTS.FULL_COMBO);
      this.unlockAchievement(ACHIEVEMENTS.NO_MISS);
    }

    // Difficulty achievements
    switch (this.difficulty) {
      case 'easy':
        this.unlockAchievement(ACHIEVEMENTS.COMPLETE_EASY);
        break;
      case 'normal':
        this.unlockAchievement(ACHIEVEMENTS.COMPLETE_NORMAL);
        break;
      case 'hard':
        this.unlockAchievement(ACHIEVEMENTS.COMPLETE_HARD);
        break;
      case 'insane':
        this.unlockAchievement(ACHIEVEMENTS.COMPLETE_INSANE);
        break;
    }

    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);

    // Capture the end-of-track snapshot BEFORE the delayed call so a post-
    // transition render tick cannot mutate score / stats under our feet.
    const finalScore = this.score;
    const finalHighScore = this.highScore;
    const finalStats = this.buildEndStats();
    const finalLevel = this.trackIndex + 1;
    const finalDuration = this.getGameDuration();

    this.showTrackCompleteBanner();

    this.time.delayedCall(GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS, () => {
      this.gameOver(finalScore, TRACK_COMPLETE_REASON, finalHighScore, finalStats, finalLevel, finalDuration);
    });
  }

  /**
   * R87.RH1 — "TRACK COMPLETE" celebratory banner rendered in the middle of
   * the canvas during the BANNER_HOLD_MS window. Scale + fade tween mirrors
   * Agent Chase's LEVEL CLEAR banner so the two games feel consistent at
   * their transition moments.
   */
  private showTrackCompleteBanner(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const banner = this.add.text(WIDTH / 2, HEIGHT / 2, 'TRACK COMPLETE', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '36px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    banner.setOrigin(0.5);
    banner.setDepth(300);
    banner.setShadow(0, 0, MATRIX_COLORS.PRIMARY_HEX, 12);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      scale: 1.5,
      duration: GAME_CONFIG.TRACK_COMPLETE.BANNER_HOLD_MS,
      ease: 'Quad.easeOut',
      onComplete: () => banner.destroy(),
    });
  }

  private buildEndStats(): { label: string; value: string | number }[] {
    const totalHit = this.perfectCount + this.greatCount + this.goodCount;
    const totalAttempted = totalHit + this.missCount;
    const accuracy = totalAttempted > 0 ? Math.round((totalHit / totalAttempted) * 100) : 0;
    return [
      { label: 'Max Combo', value: `${this.maxCombo}×` },
      { label: 'Accuracy', value: `${accuracy}%` },
      { label: 'Perfect', value: this.perfectCount },
      { label: 'Great', value: this.greatCount },
      { label: 'Good', value: this.goodCount },
      { label: 'Miss', value: this.missCount },
    ];
  }

  /**
   * Update UI — score, combo, health bar, multiplier, beat pulse, time.
   */
  private updateUI(): void {
    this.scoreText.setText(`SCORE\n${this.score}`);

    // Combo display (right gutter)
    if (this.combo >= 5) {
      this.comboText.setText(`${this.combo}\nCOMBO`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }

    // Multiplier display
    const comboMultiplier = 1 + Math.floor(this.combo / 10) * GAME_CONFIG.SCORING.COMBO_MULTIPLIER;
    if (comboMultiplier > 1) {
      this.multiplierText?.setText(`x${comboMultiplier.toFixed(1)}`);
      this.multiplierText?.setVisible(true);
    } else {
      this.multiplierText?.setVisible(false);
    }

    // Health bar (right gutter)
    const { WIDTH, LANES } = GAME_CONFIG;
    const totalLaneWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const leftGutterRight = (WIDTH - totalLaneWidth) / 2 - 15;
    const rightGutterLeft = WIDTH - leftGutterRight + 15;
    const healthBarWidth = Math.min(WIDTH - rightGutterLeft - 20, 140);

    this.healthBar.clear();
    const healthPercent = this.health / GAME_CONFIG.HEALTH.MAX;
    let healthColor = MATRIX_COLORS.PRIMARY;
    if (healthPercent < 0.3) {
      healthColor = MATRIX_COLORS.RED;
    } else if (healthPercent < 0.6) {
      healthColor = MATRIX_COLORS.DIM_GREEN;
    }
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRoundedRect(rightGutterLeft + 2, 47, (healthBarWidth - 4) * healthPercent, 12, 2);

    // Time remaining (left gutter)
    const timeLeft = Math.max(0, this.trackDuration - Math.floor(this.gameTime / 1000));
    this.timeText.setText(`TIME\n${timeLeft}s`);

    if (timeLeft <= 10 && timeLeft > 0) {
      this.timeText.setColor(Math.floor(this.gameTime / 200) % 2 === 0 ? '#005500' : MATRIX_COLORS.PRIMARY_HEX);
    }

    // Beat pulse — flash lane overlays and hit line on each beat
    if (!this.isCountdown) {
      const beatPhase = (this.gameTime % this.beatInterval) / this.beatInterval;
      const pulseAlpha = beatPhase < 0.15 ? (1 - beatPhase / 0.15) * 0.35 : 0;
      this.laneFlashes.forEach(flash => flash.setAlpha(pulseAlpha));

      // Hit line brightens on beat
      const hitScale = 1 + pulseAlpha * 0.4;
      this.hitLineImage?.setScale(1, hitScale);
      this.hitLineImage?.setAlpha(0.8 + pulseAlpha);
    }
  }

  /**
   * Scrolling horizontal grid lines across the lane area — creates the classic
   * rhythm-game "highway" motion effect at 30fps to save GPU cycles.
   */
  private gridFrame = 0;
  private updateScrollingGrid(): void {
    this.gridFrame++;
    if (this.gridFrame % 2 !== 0) return; // throttle to 30fps

    this.gridGraphics.clear();

    const { LANES, WIDTH, HEIGHT } = GAME_CONFIG;
    const totalWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const startX = (WIDTH - totalWidth) / 2;
    const gridSpacing = 40;
    const offset = (this.gameTime * 0.15) % gridSpacing;

    this.gridGraphics.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.06);
    for (let y = offset; y < HEIGHT; y += gridSpacing) {
      this.gridGraphics.lineBetween(startX, y, startX + totalWidth, y);
    }
  }

  /**
   * Notes scale up slightly as they approach the hit line — draws the eye
   * to the timing zone and creates depth.
   */
  private updateNoteApproachEffects(): void {
    const { NOTES, HEIGHT } = GAME_CONFIG;

    this.activeNotes.forEach(note => {
      if (note.isHit) return;

      const distToHit = Math.abs(note.y - NOTES.HIT_LINE_Y);
      const approachZone = HEIGHT * 0.3;

      if (distToHit < approachZone) {
        const t = 1 - distToHit / approachZone;
        const scale = 1 + t * 0.15;
        note.setScale(scale);
      } else {
        note.setScale(1);
      }
    });
  }

  /**
   * Glowing overlay behind the hit line that intensifies with combo —
   * rewards sustained accuracy with visual feedback.
   */
  private updateComboGlow(): void {
    this.comboGlow.clear();
    if (this.combo < 10) return;

    const { LANES, WIDTH, NOTES } = GAME_CONFIG;
    const totalWidth = LANES.COUNT * LANES.WIDTH + (LANES.COUNT - 1) * LANES.SPACING;
    const startX = (WIDTH - totalWidth) / 2;

    const intensity = Math.min(this.combo / 100, 1);
    const glowH = 30 + intensity * 20;

    // Warm glow: green → cyan → white as combo increases
    let glowColor = MATRIX_COLORS.PRIMARY;
    if (this.combo >= 50) glowColor = MATRIX_COLORS.CYAN;

    this.comboGlow.fillStyle(glowColor, 0.08 + intensity * 0.12);
    this.comboGlow.fillRect(startX - 5, NOTES.HIT_LINE_Y - glowH / 2, totalWidth + 10, glowH);
  }

  private initTrackAudio(): void {
    if (!this.audioUrl) return;
    try {
      this.trackAudio = new Audio(this.audioUrl);
      this.trackAudio.preload = 'auto';
      this.trackAudio.volume = 0.6;
      this.trackAudio.muted = this.getIsMuted();
    } catch {
      this.trackAudio = null;
    }
  }

  private startTrackAudio(): void {
    if (!this.trackAudio) return;
    this.trackAudio.currentTime = 0;
    this.trackAudio.muted = this.getIsMuted();
    this.trackAudio.play().catch(() => {});
  }

  private stopTrackAudio(): void {
    if (!this.trackAudio) return;
    this.trackAudio.pause();
    this.trackAudio.currentTime = 0;
  }

  protected togglePause(): void {
    const wasPaused = this.isPaused;
    super.togglePause();

    if (this.trackAudio) {
      if (wasPaused) {
        this.trackAudio.play().catch(() => {});
      } else {
        this.trackAudio.pause();
      }
    }
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown(): void {
    this.stopTrackAudio();
    this.stopBackgroundMusic?.();
    if (this.trackAudio) {
      this.trackAudio.src = '';
      this.trackAudio = null;
    }
    this.laneKeys.forEach(key => {
      key.removeAllListeners();
    });
    this.laneKeys = [];
    this.activeNotes = [];
    this.laneFlashes = [];
    this.matrixRainChars.forEach(c => c.destroy());
    this.matrixRainChars = [];
    this.gridGraphics?.destroy();
    this.comboGlow?.destroy();
    this.input.keyboard?.removeAllKeys(true);
    super.shutdown();
  }
}
