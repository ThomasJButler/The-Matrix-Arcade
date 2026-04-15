/**
 * CTRL-S World - Chapter Hub Scene
 *
 * Citizen Sleeper-inspired chapter selection grid.
 * Shows chapter tiles with completion state, puzzle progress, and replay support.
 * Full implementation will come in R80.14 — this is the functional scaffold.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, GAME_CONFIG } from '../config';

interface ChapterTile {
  index: number;
  title: string;
  container: Phaser.GameObjects.Container;
}

export class CtrlSChapterHubScene extends BaseScene {
  protected override allowPause = false;
  private rainGroup?: Phaser.GameObjects.Group;
  private tiles: ChapterTile[] = [];
  private selectedIndex = 0;

  private static readonly CHAPTER_TITLES = [
    'Prologue: The Digital Dawn',
    'Ch 1: Assemble the Heroes',
    'Ch 2: Heart of Silicon Valley',
    'Ch 3: Echoes from the Past',
    'Ch 4: A Glitch in Time',
    'Ch 5: The New Dawn',
  ];

  constructor() {
    super(CTRLS_SCENE_KEYS.CHAPTER_HUB);
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(20);
    this.tiles = [];

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    // Header
    this.createMatrixText(centerX, 40, 'MISSION SELECT', 20);
    this.createMatrixText(centerX, 70, 'Choose your chapter', 10, MATRIX_COLORS.DIM_GREEN_HEX);

    // Chapter grid: 2 columns x 3 rows
    const cols = 2;
    const tileW = 320;
    const tileH = 120;
    const gapX = 30;
    const gapY = 20;
    const gridW = cols * tileW + (cols - 1) * gapX;
    const startX = centerX - gridW / 2 + tileW / 2;
    const startY = 130;

    for (let i = 0; i < GAME_CONFIG.CHAPTERS.TOTAL; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);

      const tile = this.createChapterTile(x, y, tileW, tileH, i);
      this.tiles.push(tile);
    }

    // Start from beginning button
    const startBtn = this.createStartButton(centerX, height - 50);
    startBtn.setData('isStartBtn', true);

    // Keyboard navigation
    this.setupHubInput();
    this.setupCommonInputs();

    this.highlightTile(this.selectedIndex);
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({ selectedChapter: this.selectedIndex });
  }

  private createChapterTile(
    x: number,
    y: number,
    w: number,
    h: number,
    index: number,
  ): ChapterTile {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.3);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.setName('bg');

    // Chapter number badge
    const badge = this.add.text(-w / 2 + 15, -h / 2 + 12, index === 0 ? 'P' : String(index), {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });

    // Title
    const title = this.add.text(-w / 2 + 40, -h / 2 + 12, CtrlSChapterHubScene.CHAPTER_TITLES[index], {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      wordWrap: { width: w - 60 },
    });

    // Status text (placeholder — will show completion from save system in R80.15)
    const status = this.add.text(-w / 2 + 15, h / 2 - 25, 'Ready to play', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });

    container.add([bg, badge, title, status]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      this.selectedIndex = index;
      this.launchChapter(index);
    });

    container.on('pointerover', () => {
      this.selectedIndex = index;
      this.highlightTile(index);
    });

    return { index, title: CtrlSChapterHubScene.CHAPTER_TITLES[index], container };
  }

  private createStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
    bg.fillRoundedRect(-100, -20, 200, 40, 6);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    bg.strokeRoundedRect(-100, -20, 200, 40, 6);

    const text = this.add.text(0, 0, 'START FROM BEGINNING', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-100, -20, 200, 40);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
      bg.fillRoundedRect(-100, -20, 200, 40, 6);
      bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 6);
      text.setColor(MATRIX_COLORS.WHITE_HEX);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
      bg.fillRoundedRect(-100, -20, 200, 40, 6);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 6);
      text.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });

    container.on('pointerdown', () => {
      this.launchChapter(0);
    });

    return container;
  }

  private highlightTile(index: number): void {
    this.tiles.forEach((tile, i) => {
      const bg = tile.container.getByName('bg') as Phaser.GameObjects.Graphics;
      if (!bg) return;

      bg.clear();
      if (i === index) {
        bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.15);
        bg.fillRoundedRect(-160, -60, 320, 120, 8);
        bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
        bg.strokeRoundedRect(-160, -60, 320, 120, 8);
      } else {
        bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.3);
        bg.fillRoundedRect(-160, -60, 320, 120, 8);
        bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
        bg.strokeRoundedRect(-160, -60, 320, 120, 8);
      }
    });
  }

  private setupHubInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.launchChapter(this.selectedIndex));

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.launchChapter(this.selectedIndex));

      const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      upKey.on('down', () => {
        this.selectedIndex = Math.max(0, this.selectedIndex - 2);
        this.highlightTile(this.selectedIndex);
        this.playSound('menu');
      });

      const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      downKey.on('down', () => {
        this.selectedIndex = Math.min(GAME_CONFIG.CHAPTERS.TOTAL - 1, this.selectedIndex + 2);
        this.highlightTile(this.selectedIndex);
        this.playSound('menu');
      });

      const leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      leftKey.on('down', () => {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.highlightTile(this.selectedIndex);
        this.playSound('menu');
      });

      const rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      rightKey.on('down', () => {
        this.selectedIndex = Math.min(GAME_CONFIG.CHAPTERS.TOTAL - 1, this.selectedIndex + 1);
        this.highlightTile(this.selectedIndex);
        this.playSound('menu');
      });
    });
  }

  private launchChapter(chapterIndex: number): void {
    this.playSound('menu');
    this.scene.start(CTRLS_SCENE_KEYS.NARRATIVE, { chapterIndex });
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.tiles = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
