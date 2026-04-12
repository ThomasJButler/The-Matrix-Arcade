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
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, NOTE_PROBABILITIES, ACHIEVEMENTS } from '../config';

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

  // Game state
  private score = 0;
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

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(data: { trackIndex?: number }): void {
    this.trackIndex = data.trackIndex ?? 0;
    const track = GAME_CONFIG.TRACKS[this.trackIndex];
    this.trackDuration = track.duration;
    this.trackBpm = track.bpm;
    this.difficulty = track.difficulty as 'easy' | 'normal' | 'hard' | 'insane';
    this.beatInterval = 60000 / this.trackBpm;
  }

  create(): void {
    this.createMatrixBackground();

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
    this.keyHeld = [false, false, false, false];
    this.isCountdown = true;
    this.countdownTime = 0;
    this.laneBackgrounds = [];
    this.keyIndicators = [];
    this.recentLanes = [];

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

    // Check for track end
    if (this.gameTime >= this.trackDuration * 1000 && this.activeNotes.length === 0) {
      this.trackComplete();
    }

    // Update UI
    this.updateUI();

    // Expose state for E2E tests
    this.exposeTestState({
      score: this.score,
      combo: this.combo,
      health: this.health,
      missCount: this.missCount,
    });
  }

  /**
   * Create countdown display
   */
  private createCountdown(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    this.countdownText = this.add.text(WIDTH / 2, HEIGHT / 2 - 50, Math.ceil(GAME_CONFIG.COUNTDOWN.DURATION / 1000).toString(), {
      fontFamily: '"Press Start 2P", monospace',
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
    }
  }

  /**
   * Create lane backgrounds and hit line
   */
  private createLanes(): void {
    const { LANES, HEIGHT, NOTES } = GAME_CONFIG;

    // Lane backgrounds
    this.laneX.forEach((x, _i) => {
      const bg = this.add.image(x, HEIGHT / 2, 'lane_bg');
      bg.setAlpha(0.3);
      this.laneBackgrounds.push(bg);
    });

    // Hit line
    const hitLine = this.add.image(GAME_CONFIG.WIDTH / 2, NOTES.HIT_LINE_Y, 'hit_line');
    hitLine.setDepth(5);

    // Glow effect on hit line
    const glow = this.add.graphics();
    glow.fillStyle(MATRIX_COLORS.PRIMARY, 0.2);
    glow.fillRect(this.laneX[0] - LANES.WIDTH / 2 - 5, NOTES.HIT_LINE_Y - 20, LANES.WIDTH * 4 + LANES.SPACING * 3 + 10, 40);
    glow.setDepth(4);

    // Key indicators
    this.laneX.forEach((x, i) => {
      const key = this.add.image(x, NOTES.HIT_LINE_Y + 50, `key_${i}`);
      key.setDepth(10);
      this.keyIndicators.push(key);

      // Key label
      const label = this.add.text(x, NOTES.HIT_LINE_Y + 50, LANES.KEYS[i], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      label.setDepth(11);
    });
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    const { WIDTH } = GAME_CONFIG;

    // Score
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.scoreText.setDepth(100);

    // Combo
    this.comboText = this.add.text(WIDTH / 2, 100, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.comboText.setOrigin(0.5);
    this.comboText.setDepth(100);

    // Grade display
    this.gradeText = this.add.text(WIDTH / 2, 150, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.gradeText.setOrigin(0.5);
    this.gradeText.setDepth(100);

    // Health bar background
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x333333, 1);
    healthBg.fillRect(WIDTH - 220, 20, 200, 20);
    healthBg.setDepth(100);

    // Health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(100);

    // Health label
    const healthLabel = this.add.text(WIDTH - 220, 45, 'HEALTH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    healthLabel.setDepth(100);

    // Time remaining
    this.timeText = this.add.text(20, 50, `TIME: ${this.trackDuration}s`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.timeText.setDepth(100);

    // Track name
    const track = GAME_CONFIG.TRACKS[this.trackIndex];
    const trackName = this.add.text(WIDTH / 2, 50, track.name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    trackName.setOrigin(0.5);
    trackName.setDepth(100);
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupInput());
      return;
    }

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
        this.reportScore(this.score, this.score);
        this.gameOver(this.score, 'Health depleted');
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
        break;
    }

    // Update max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
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
    if (this.health <= 0) {
      this.reportScore(this.score, this.score);
      this.gameOver(this.score, 'Health depleted');
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
   * Show grade text
   */
  private showGrade(grade: TimingGrade, x: number, y: number): void {
    const colors: Record<TimingGrade, string> = {
      perfect: '#00ffff',
      great: '#00ff00',
      good: '#00aa00',
      miss: '#660000',
    };

    const gradeText = this.add.text(x, y, grade.toUpperCase(), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: colors[grade],
    });
    gradeText.setOrigin(0.5);
    gradeText.setDepth(50);

    this.tweens.add({
      targets: gradeText,
      y: y - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => gradeText.destroy(),
    });
  }

  /**
   * Create hit effect
   */
  private createHitEffect(x: number, y: number, grade: TimingGrade): void {
    for (let i = 0; i < 5; i++) {
      const particle = this.add.image(x, y, `effect_${grade}`);
      particle.setScale(0.5);
      particle.setDepth(40);

      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 50;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Spawn notes based on timing
   */
  private spawnNotes(): void {
    if (this.gameTime >= this.trackDuration * 1000) return;

    while (this.gameTime >= this.nextNoteTime) {
      this.spawnNote();

      // Next note timing (randomized around beat)
      const variation = this.beatInterval * 0.3 * (Math.random() - 0.5);
      this.nextNoteTime += this.beatInterval + variation;

      // Increase note frequency for harder difficulties
      if (this.difficulty === 'hard') {
        this.nextNoteTime -= this.beatInterval * 0.2;
      } else if (this.difficulty === 'insane') {
        this.nextNoteTime -= this.beatInterval * 0.4;
      }
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
  private createNote(x: number, y: number, lane: number, noteType: NoteType): Note {
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
      const holdDuration = Phaser.Math.Between(500, 1500);
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
   * Track complete
   */
  private trackComplete(): void {
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

    this.reportScore(this.score, this.score);
    this.gameOver(this.score, `Max Combo: ${this.maxCombo}`);
  }

  /**
   * Update UI
   */
  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);

    // Combo display
    if (this.combo >= 5) {
      this.comboText.setText(`${this.combo} COMBO`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }

    // Health bar
    this.healthBar.clear();
    const healthPercent = this.health / GAME_CONFIG.HEALTH.MAX;
    let healthColor = MATRIX_COLORS.PRIMARY;
    if (healthPercent < 0.3) {
      healthColor = MATRIX_COLORS.DARK_GREEN;
    } else if (healthPercent < 0.6) {
      healthColor = 0x00aa00;
    }
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(GAME_CONFIG.WIDTH - 218, 22, 196 * healthPercent, 16);

    // Time remaining
    const timeLeft = Math.max(0, this.trackDuration - Math.floor(this.gameTime / 1000));
    this.timeText.setText(`TIME: ${timeLeft}s`);

    // Warning flash when time low
    if (timeLeft <= 10 && timeLeft > 0) {
      this.timeText.setColor(Math.floor(this.gameTime / 200) % 2 === 0 ? '#005500' : '#00ff00');
    }
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown(): void {
    this.time?.removeAllEvents();
    this.tweens?.killAll();
    this.laneKeys.forEach(key => {
      key.removeAllListeners();
    });
    this.laneKeys = [];
    this.activeNotes = [];
    this.input.keyboard?.removeAllKeys(true);
  }
}
