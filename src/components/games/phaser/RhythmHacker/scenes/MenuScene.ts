/**
 * Rhythm Hacker - Menu Scene with Track Selection
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG } from '../config';

export class RhythmHackerMenuScene extends BaseScene {
  private selectedTrack = 0;
  private rainGroup!: Phaser.GameObjects.Group;
  private trackButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    this.createMatrixBackground();
    this.trackButtons = [];
    this.rainGroup = this.addMatrixRain(20);

    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Title
    this.createMatrixText(WIDTH / 2, 60, 'RHYTHM HACKER', 28);
    this.createMatrixText(WIDTH / 2, 100, 'Select Difficulty', 14, MATRIX_COLORS.CYAN_HEX);

    // Track selection buttons
    GAME_CONFIG.TRACKS.forEach((track, index) => {
      const y = 180 + index * 90;
      const button = this.createTrackButton(WIDTH / 2, y, track.name, index);
      this.trackButtons.push(button);
    });

    // HOW TO PLAY section
    this.createMatrixText(WIDTH / 2, HEIGHT - 180, 'HOW TO PLAY', 14, MATRIX_COLORS.CYAN_HEX);
    this.createMatrixText(WIDTH / 2, HEIGHT - 160, 'Q W O P: Hit notes in time | Hold keys for hold notes', 10);
    this.createMatrixText(WIDTH / 2, HEIGHT - 145, 'Goal: Hit falling code fragments to the beat', 10);

    // Controls info
    this.createMatrixText(WIDTH / 2, HEIGHT - 100, 'Select difficulty and press ENTER to start', 12);
    this.createMatrixText(WIDTH / 2, HEIGHT - 70, 'ESC: Exit  P: Pause  M: Mute', 10, MATRIX_COLORS.PRIMARY_HEX).setAlpha(0.3);

    // Keyboard input
    this.setupInput();
    this.setupCommonInputs();

    // Highlight first track
    this.highlightTrack(0);
  }

  update(_time: number, delta: number): void {
    this.updateMatrixRain(this.rainGroup, delta);
  }

  /**
   * Create track selection button
   */
  private createTrackButton(x: number, y: number, name: string, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.5);
    bg.fillRoundedRect(-250, -30, 500, 60, 8);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
    bg.strokeRoundedRect(-250, -30, 500, 60, 8);

    // Track name
    const text = this.add.text(0, -5, name, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '16px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    // Track info
    const track = GAME_CONFIG.TRACKS[index];
    const info = this.add.text(0, 18, `${track.bpm} BPM | ${track.duration}s`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    info.setOrigin(0.5);

    container.add([bg, text, info]);
    container.setData('bg', bg);
    container.setData('text', text);

    // Interactive
    const hitArea = new Phaser.Geom.Rectangle(-250, -30, 500, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => this.highlightTrack(index));
    container.on('pointerdown', () => this.selectTrack(index));

    return container;
  }

  /**
   * Setup keyboard input
   */
  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      upKey.on('down', () => {
        this.selectedTrack = Math.max(0, this.selectedTrack - 1);
        this.highlightTrack(this.selectedTrack);
      });

      downKey.on('down', () => {
        this.selectedTrack = Math.min(GAME_CONFIG.TRACKS.length - 1, this.selectedTrack + 1);
        this.highlightTrack(this.selectedTrack);
      });

      enterKey.on('down', () => this.selectTrack(this.selectedTrack));
      spaceKey.on('down', () => this.selectTrack(this.selectedTrack));
    });
  }

  /**
   * Highlight track button
   */
  private highlightTrack(index: number): void {
    this.selectedTrack = index;

    this.trackButtons.forEach((button, i) => {
      const bg = button.getData('bg') as Phaser.GameObjects.Graphics;
      const text = button.getData('text') as Phaser.GameObjects.Text;

      bg.clear();
      if (i === index) {
        bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
        bg.fillRoundedRect(-250, -30, 500, 60, 8);
        bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
        bg.strokeRoundedRect(-250, -30, 500, 60, 8);
        text.setColor(MATRIX_COLORS.WHITE_HEX);
      } else {
        bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 0.5);
        bg.fillRoundedRect(-250, -30, 500, 60, 8);
        bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.5);
        bg.strokeRoundedRect(-250, -30, 500, 60, 8);
        text.setColor(MATRIX_COLORS.PRIMARY_HEX);
      }
    });

    this.playSound('menu');
  }

  /**
   * Select track and start game
   */
  private selectTrack(index: number): void {
    this.playSound('score');
    this.scene.start(SCENE_KEYS.GAME, { trackIndex: index });
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.trackButtons = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
