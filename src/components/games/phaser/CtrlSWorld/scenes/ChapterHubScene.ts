/**
 * CTRL-S World - Chapter Hub Scene
 *
 * Citizen Sleeper-inspired chapter selection grid.
 * Shows chapter tiles with completion state (locked/available/in-progress/complete),
 * puzzle progress bars, staggered entrance animation, and smooth launch transitions.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, CTRLS_REGISTRY_KEYS, HUB_CONFIG, MUSIC_TRACKS, type ChapterStatus } from '../config';
import { getChapterTitle, getChapterPuzzleCount, TOTAL_CHAPTERS } from '../../../../../data/ctrlsChapters';

interface ChapterTile {
  index: number;
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  statusIcon: Phaser.GameObjects.Text;
  statusLabel: Phaser.GameObjects.Text;
  progressBar?: Phaser.GameObjects.Graphics;
  progressFill?: Phaser.GameObjects.Graphics;
  glowTween?: Phaser.Tweens.Tween;
}

interface ChapterProgress {
  status: ChapterStatus;
  puzzlesCompleted: number;
  puzzlesTotal: number;
}

const STATUS_COLOURS: Record<ChapterStatus, { fill: number; border: number; text: string; label: string }> = {
  'locked':      { fill: 0x111111, border: 0x333333, text: '#555555', label: 'LOCKED' },
  'available':   { fill: 0x001a00, border: 0x006600, text: '#00aa00', label: 'AVAILABLE' },
  'in-progress': { fill: 0x002200, border: 0x00cc00, text: '#00ff00', label: 'IN PROGRESS' },
  'complete':    { fill: 0x001100, border: 0x009900, text: '#00dd00', label: 'COMPLETE' },
};

const STATUS_ICONS: Record<ChapterStatus, string> = {
  'locked':      '🔒',
  'available':   '▸',
  'in-progress': '◉',
  'complete':    '✓',
};

export class CtrlSChapterHubScene extends BaseScene {
  protected override allowPause = false;
  private rainGroup?: Phaser.GameObjects.Group;
  private tiles: ChapterTile[] = [];
  private selectedIndex = 0;
  private headerText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private startBtn?: Phaser.GameObjects.Container;
  private isLaunching = false;
  private connectionLines?: Phaser.GameObjects.Graphics;

  constructor() {
    super(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  create(): void {
    this.createMatrixBackground();
    this.createHubBackground();
    this.rainGroup = this.addMatrixRain(15);
    this.playBackgroundMusic(MUSIC_TRACKS.MENU);
    this.tiles = [];
    this.isLaunching = false;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    this.headerText = this.createMatrixText(centerX, HUB_CONFIG.HEADER_Y, 'MISSION SELECT', 18);
    this.headerText.setAlpha(0);

    this.subtitleText = this.createMatrixText(centerX, HUB_CONFIG.SUBTITLE_Y, 'Choose your chapter', 9, MATRIX_COLORS.DIM_GREEN_HEX);
    this.subtitleText.setAlpha(0);

    this.connectionLines = this.add.graphics();
    this.connectionLines.setDepth(0);

    const { COLS, TILE_W, TILE_H, GAP_X, GAP_Y, GRID_TOP_Y } = HUB_CONFIG;
    const gridW = COLS * TILE_W + (COLS - 1) * GAP_X;
    const startX = centerX - gridW / 2 + TILE_W / 2;

    const progress = this.getChapterProgress();

    for (let i = 0; i < TOTAL_CHAPTERS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * (TILE_W + GAP_X);
      const y = GRID_TOP_Y + row * (TILE_H + GAP_Y);

      const tile = this.createChapterTile(x, y, TILE_W, TILE_H, i, progress[i]);
      tile.container.setAlpha(0);
      this.tiles.push(tile);
    }

    this.drawConnectionLines();

    this.startBtn = this.createStartButton(centerX, height - 45);
    this.startBtn.setAlpha(0);

    this.playEntranceAnimation();
    this.setupHubInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({ selectedChapter: this.selectedIndex });
  }

  private getChapterProgress(): ChapterProgress[] {
    const completedChapters: number[] = this.registry.get(CTRLS_REGISTRY_KEYS.COMPLETED_CHAPTERS) ?? [];
    const completedPuzzles: string[] = this.registry.get(CTRLS_REGISTRY_KEYS.COMPLETED_PUZZLES) ?? [];
    const currentChapter: number = this.registry.get(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER) ?? 0;

    return Array.from({ length: TOTAL_CHAPTERS }, (_, i) => {
      const puzzlesTotal = getChapterPuzzleCount(i);
      const chapterPuzzlePrefix = i === 0 ? 'prologue_' : `ch${i}_`;
      const puzzlesCompleted = completedPuzzles.filter(
        (p: string) => p.startsWith(chapterPuzzlePrefix),
      ).length;

      let status: ChapterStatus;
      if (completedChapters.includes(i)) {
        status = 'complete';
      } else if (i === currentChapter) {
        status = 'in-progress';
      } else if (i <= currentChapter) {
        status = 'available';
      } else {
        status = 'locked';
      }

      return { status, puzzlesCompleted, puzzlesTotal };
    });
  }

  private createChapterTile(
    x: number, y: number, w: number, h: number,
    index: number, progress: ChapterProgress,
  ): ChapterTile {
    const container = this.add.container(x, y);
    container.setDepth(1);
    const colours = STATUS_COLOURS[progress.status];

    const bg = this.add.graphics();
    this.drawTileBg(bg, w, h, colours.fill, colours.border, 0.4, 0.6);
    bg.setName('bg');

    const badgeText = index === 0 ? 'P' : String(index);
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(colours.border, 0.3);
    badgeBg.fillRoundedRect(-w / 2 + 8, -h / 2 + 8, 28, 28, 6);
    badgeBg.lineStyle(1, colours.border, 0.8);
    badgeBg.strokeRoundedRect(-w / 2 + 8, -h / 2 + 8, 28, 28, 6);

    const badge = this.add.text(-w / 2 + 22, -h / 2 + 22, badgeText, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: colours.text,
    });
    badge.setOrigin(0.5);

    const title = this.add.text(-w / 2 + 44, -h / 2 + 12, getChapterTitle(index), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '9px',
      color: progress.status === 'locked' ? '#555555' : MATRIX_COLORS.PRIMARY_HEX,
      wordWrap: { width: w - 90 },
    });

    const statusIcon = this.add.text(w / 2 - 20, -h / 2 + 14, STATUS_ICONS[progress.status], {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: '14px',
      color: colours.text,
    });
    statusIcon.setOrigin(0.5);

    const statusLabel = this.add.text(-w / 2 + 44, -h / 2 + 34, colours.label, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '7px',
      color: colours.text,
    });
    statusLabel.setAlpha(0.8);

    container.add([bg, badgeBg, badge, title, statusIcon, statusLabel]);

    let progressBar: Phaser.GameObjects.Graphics | undefined;
    let progressFill: Phaser.GameObjects.Graphics | undefined;

    if (progress.puzzlesTotal > 0) {
      const barX = -w / 2 + 44;
      const barY = h / 2 - 28;

      progressBar = this.add.graphics();
      progressBar.fillStyle(0x111111, 0.8);
      progressBar.fillRoundedRect(barX, barY, HUB_CONFIG.PROGRESS_BAR_W, HUB_CONFIG.PROGRESS_BAR_H, 2);
      progressBar.lineStyle(1, colours.border, 0.3);
      progressBar.strokeRoundedRect(barX, barY, HUB_CONFIG.PROGRESS_BAR_W, HUB_CONFIG.PROGRESS_BAR_H, 2);

      progressFill = this.add.graphics();
      const fillW = (progress.puzzlesCompleted / progress.puzzlesTotal) * HUB_CONFIG.PROGRESS_BAR_W;
      if (fillW > 0) {
        progressFill.fillStyle(colours.border, 0.8);
        progressFill.fillRoundedRect(barX, barY, fillW, HUB_CONFIG.PROGRESS_BAR_H, 2);
      }

      const puzzleLabel = this.add.text(
        barX + HUB_CONFIG.PROGRESS_BAR_W + 8, barY - 1,
        `${progress.puzzlesCompleted}/${progress.puzzlesTotal}`,
        {
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '7px',
          color: colours.text,
        },
      );
      puzzleLabel.setAlpha(0.7);

      container.add([progressBar, progressFill, puzzleLabel]);
    }

    if (progress.status === 'complete') {
      const checkText = this.add.text(w / 2 - 20, h / 2 - 18, '✓', {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: '16px',
        color: '#00dd00',
      });
      checkText.setOrigin(0.5);
      checkText.setAlpha(0.6);
      container.add(checkText);
    }

    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      if (this.isLaunching) return;
      this.selectedIndex = index;
      this.launchChapter(index);
    });

    container.on('pointerover', () => {
      if (this.isLaunching) return;
      this.selectedIndex = index;
      this.highlightTile(index);
    });

    return { index, container, bg, statusIcon, statusLabel, progressBar, progressFill };
  }

  private drawTileBg(
    gfx: Phaser.GameObjects.Graphics,
    w: number, h: number,
    fill: number, border: number,
    fillAlpha: number, borderAlpha: number,
  ): void {
    gfx.clear();
    gfx.fillStyle(fill, fillAlpha);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    gfx.lineStyle(2, border, borderAlpha);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  }

  private drawConnectionLines(): void {
    if (!this.connectionLines || this.tiles.length < 2) return;
    const gfx = this.connectionLines;
    gfx.clear();
    gfx.lineStyle(1, MATRIX_COLORS.DARK_GREEN, 0.3);

    for (let i = 0; i < this.tiles.length - 1; i++) {
      const from = this.tiles[i].container;
      const to = this.tiles[i + 1].container;
      gfx.beginPath();
      gfx.moveTo(from.x, from.y);
      gfx.lineTo(to.x, to.y);
      gfx.strokePath();
    }
  }

  private createStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(2);
    const bw = 220;
    const bh = 36;

    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.6);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.7);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);

    const text = this.add.text(0, 0, 'START FROM BEGINNING', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-bw / 2, -bh / 2, bw, bh);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.2);
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      text.setColor(MATRIX_COLORS.WHITE_HEX);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.6);
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.7);
      bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      text.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });

    container.on('pointerdown', () => {
      if (this.isLaunching) return;
      this.launchChapter(0);
    });

    return container;
  }

  private playEntranceAnimation(): void {
    this.tweens.add({
      targets: this.headerText,
      alpha: 1,
      y: HUB_CONFIG.HEADER_Y,
      duration: 500,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      delay: 200,
      duration: 400,
      ease: 'Power2',
    });

    this.tiles.forEach((tile, i) => {
      tile.container.y += 20;
      this.tweens.add({
        targets: tile.container,
        alpha: 1,
        y: tile.container.y - 20,
        delay: 300 + i * HUB_CONFIG.STAGGER_DELAY,
        duration: HUB_CONFIG.TILE_FADE_DURATION,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (i === this.tiles.length - 1) {
            this.highlightTile(this.selectedIndex);
          }
        },
      });
    });

    if (this.startBtn) {
      this.tweens.add({
        targets: this.startBtn,
        alpha: 1,
        delay: 300 + this.tiles.length * HUB_CONFIG.STAGGER_DELAY + 100,
        duration: 400,
        ease: 'Power2',
      });
    }
  }

  private highlightTile(index: number): void {
    const { TILE_W, TILE_H } = HUB_CONFIG;
    const progress = this.getChapterProgress();

    this.tiles.forEach((tile, i) => {
      if (tile.glowTween) {
        tile.glowTween.destroy();
        tile.glowTween = undefined;
      }

      const colours = STATUS_COLOURS[progress[i].status];

      if (i === index) {
        this.drawTileBg(tile.bg, TILE_W, TILE_H, colours.fill, MATRIX_COLORS.PRIMARY, 0.5, 1);

        tile.glowTween = this.tweens.add({
          targets: tile.container,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: HUB_CONFIG.SELECT_PULSE_DURATION,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        tile.container.setScale(1);
        this.drawTileBg(tile.bg, TILE_W, TILE_H, colours.fill, colours.border, 0.4, 0.6);
      }
    });
  }

  private setupHubInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => {
        if (!this.isLaunching) this.launchChapter(this.selectedIndex);
      });

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => {
        if (!this.isLaunching) this.launchChapter(this.selectedIndex);
      });

      const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      upKey.on('down', () => this.moveSelection(-2));

      const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      downKey.on('down', () => this.moveSelection(2));

      const leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      leftKey.on('down', () => this.moveSelection(-1));

      const rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      rightKey.on('down', () => this.moveSelection(1));
    });
  }

  private moveSelection(delta: number): void {
    if (this.isLaunching) return;
    const next = this.selectedIndex + delta;
    if (next < 0 || next >= TOTAL_CHAPTERS) return;
    this.selectedIndex = next;
    this.highlightTile(this.selectedIndex);
    this.playSound('menu');
  }

  private createHubBackground(): void {
    if (!this.textures.exists('bg-hub-node')) return;

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    const bg = this.add.image(width / 2, height / 2, 'bg-hub-node');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.08);
    bg.setTint(0x003300);
  }

  private launchChapter(chapterIndex: number): void {
    if (this.isLaunching) return;
    this.isLaunching = true;
    this.playSound('menu');

    this.registry.set(CTRLS_REGISTRY_KEYS.CURRENT_CHAPTER, chapterIndex);
    this.emitGameEvent({
      type: 'pause',
      data: { action: 'chapterLaunch', chapterIndex },
    });

    const tile = this.tiles[chapterIndex];
    if (!tile) {
      this.scene.start(CTRLS_SCENE_KEYS.NARRATIVE, { chapterIndex });
      return;
    }

    this.tweens.add({
      targets: tile.container,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: HUB_CONFIG.LAUNCH_ZOOM_DURATION,
      ease: 'Back.easeIn',
    });

    this.tiles.forEach((t, i) => {
      if (i !== chapterIndex) {
        this.tweens.add({
          targets: t.container,
          alpha: 0,
          duration: 250,
          ease: 'Power2',
        });
      }
    });

    if (this.startBtn) {
      this.tweens.add({ targets: this.startBtn, alpha: 0, duration: 200 });
    }
    if (this.headerText) {
      this.tweens.add({ targets: this.headerText, alpha: 0, duration: 200 });
    }
    if (this.subtitleText) {
      this.tweens.add({ targets: this.subtitleText, alpha: 0, duration: 200 });
    }

    this.cameras.main.fadeOut(HUB_CONFIG.LAUNCH_ZOOM_DURATION + 100, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(CTRLS_SCENE_KEYS.NARRATIVE, { chapterIndex });
    });
  }

  shutdown(): void {
    this.tiles.forEach((t) => t.glowTween?.destroy());
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.connectionLines?.destroy();
    this.connectionLines = undefined;
    this.tiles = [];
    this.headerText = undefined;
    this.subtitleText = undefined;
    this.startBtn = undefined;
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
