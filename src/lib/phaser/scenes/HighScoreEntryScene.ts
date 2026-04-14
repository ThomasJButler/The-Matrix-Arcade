import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, REGISTRY_KEYS, type GameOverStat } from '../types';
import type { ScoreEntry, ScoreboardGameId } from '../../../hooks/useSaveSystem';

export interface HighScoreEntryData {
  score: number;
  highScore?: number;
  reason?: string;
  stats?: GameOverStat[];
  level: number;
  durationMs: number;
}

export class HighScoreEntryScene extends BaseScene {
  protected override allowPause = false;
  private slots: number[] = [0, 0, 0]; // A=0, B=1, ...
  private activeSlot = 0;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private arrowUp: Phaser.GameObjects.Text[] = [];
  private arrowDown: Phaser.GameObjects.Text[] = [];
  private scoreData!: HighScoreEntryData;
  private rainGroup?: Phaser.GameObjects.Group;
  private lastInitials = 'AAA';

  constructor() {
    super(SCENE_KEYS.HIGH_SCORE_ENTRY);
  }

  init(data: HighScoreEntryData): void {
    this.scoreData = data;
    const saveSystem = this.game.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      if (saveData?.lastInitials) {
        this.lastInitials = saveData.lastInitials;
      }
    }
    this.slots = [
      this.lastInitials.charCodeAt(0) - 65,
      this.lastInitials.charCodeAt(1) - 65,
      this.lastInitials.charCodeAt(2) - 65,
    ];
    this.activeSlot = 0;
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(15);

    const w = Number(this.game.config.width);
    const h = Number(this.game.config.height);
    const cx = w / 2;

    this.playSound('scoreboardNewHigh');
    this.createMatrixText(cx, h * 0.10, 'NEW HIGH SCORE!', 18, MATRIX_COLORS.YELLOW_HEX);
    this.createMatrixText(cx, h * 0.20, this.scoreData.score.toLocaleString(), 24);
    this.createMatrixText(cx, h * 0.30, 'ENTER YOUR INITIALS', 10, '#338833');

    const slotWidth = 40;
    const startX = cx - slotWidth;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * slotWidth;

      const up = this.add.text(x, h * 0.38, '\u25B2', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      }).setOrigin(0.5);
      this.arrowUp.push(up);

      const letter = this.add.text(x, h * 0.48, this.getLetter(i), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      }).setOrigin(0.5);
      this.slotTexts.push(letter);

      const down = this.add.text(x, h * 0.58, '\u25BC', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      }).setOrigin(0.5);
      this.arrowDown.push(down);
    }

    this.updateSlotHighlight();

    this.createMatrixText(cx, h * 0.72, 'ARROWS: SELECT    ENTER: CONFIRM', 7, '#338833');

    this.setupInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({
      initials: this.getInitials(),
      activeSlot: this.activeSlot,
      score: this.scoreData.score,
    });
  }

  private getLetter(slot: number): string {
    return String.fromCharCode(65 + this.slots[slot]);
  }

  private getInitials(): string {
    return this.slots.map((_, i) => this.getLetter(i)).join('');
  }

  private updateSlotHighlight(): void {
    for (let i = 0; i < 3; i++) {
      const isActive = i === this.activeSlot;
      this.slotTexts[i].setColor(isActive ? MATRIX_COLORS.YELLOW_HEX : MATRIX_COLORS.PRIMARY_HEX);
      this.arrowUp[i].setAlpha(isActive ? 1 : 0.3);
      this.arrowDown[i].setAlpha(isActive ? 1 : 0.3);

      if (isActive) {
        this.slotTexts[i].setScale(1.1);
      } else {
        this.slotTexts[i].setScale(1.0);
      }
    }
  }

  private cycleLetter(direction: number): void {
    this.slots[this.activeSlot] = (this.slots[this.activeSlot] + direction + 26) % 26;
    this.slotTexts[this.activeSlot].setText(this.getLetter(this.activeSlot));
    this.playSound('scoreboardLetterCycle');
  }

  private moveSlot(direction: number): void {
    this.activeSlot = Math.max(0, Math.min(2, this.activeSlot + direction));
    this.updateSlotHighlight();
    this.playSound('scoreboardLetterCycle');
  }

  private confirm(): void {
    const initials = this.getInitials();
    const entry: ScoreEntry = {
      initials,
      score: this.scoreData.score,
      level: this.scoreData.level,
      durationMs: this.scoreData.durationMs,
      date: new Date().toISOString(),
    };

    const saveSystem = this.game.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    const gameId = this.game.registry.get(REGISTRY_KEYS.GAME_ID) as ScoreboardGameId;
    if (saveSystem?.addScore && gameId) {
      saveSystem.addScore(gameId, entry);
    }

    this.playSound('scoreboardConfirm');

    this.scene.start(SCENE_KEYS.GAME_OVER, {
      score: this.scoreData.score,
      reason: this.scoreData.reason,
      highScore: this.scoreData.highScore ?? this.scoreData.score,
      stats: this.scoreData.stats,
    });
  }

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      up.on('down', () => this.cycleLetter(-1));

      const down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      down.on('down', () => this.cycleLetter(1));

      const left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      left.on('down', () => this.moveSlot(-1));

      const right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      right.on('down', () => this.moveSlot(1));

      const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enter.on('down', () => this.confirm());

      const w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      w.on('down', () => this.cycleLetter(-1));

      const s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      s.on('down', () => this.cycleLetter(1));

      const a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      a.on('down', () => this.moveSlot(-1));

      const d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      d.on('down', () => this.moveSlot(1));
    });
  }

  shutdown(): void {
    this.slotTexts = [];
    this.arrowUp = [];
    this.arrowDown = [];
    this.tweens?.killAll();
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
