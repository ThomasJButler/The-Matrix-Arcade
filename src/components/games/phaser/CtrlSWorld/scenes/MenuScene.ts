import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { CTRLS_SCENE_KEYS, MUSIC_TRACKS, STINGER_KEYS } from '../config';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';

const ASCII_TITLE = [
  '  ██████╗████████╗██████╗ ██╗       ███████╗',
  ' ██╔════╝╚══██╔══╝██╔══██╗██║       ██╔════╝',
  ' ██║        ██║   ██████╔╝██║  ███  ███████╗',
  ' ██║        ██║   ██╔══██╗██║  ╚══╝ ╚════██║',
  ' ╚██████╗   ██║   ██║  ██║███████╗  ███████║',
  '  ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝  ╚══════╝',
];

const ENTRANCE_STAGGER = 60;
const TITLE_LINE_HEIGHT = 16;

export class CtrlSMenuScene extends BaseScene {
  protected override allowPause = false;
  private rainGroup?: Phaser.GameObjects.Group;
  private asciiLines: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(CTRLS_SCENE_KEYS.MENU);
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(25);
    this.playBackgroundMusic(MUSIC_TRACKS.MENU);
    this.asciiLines = [];

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const centerX = width / 2;

    const titleTopY = height * 0.12;
    ASCII_TITLE.forEach((line, i) => {
      const text = this.add.text(centerX, titleTopY + i * TITLE_LINE_HEIGHT, line, {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: '12px',
        color: MATRIX_COLORS.PRIMARY_HEX,
        lineSpacing: 0,
      });
      text.setOrigin(0.5);
      text.setAlpha(0);

      this.tweens.add({
        targets: text,
        alpha: { from: 0, to: 1 },
        y: { from: titleTopY + i * TITLE_LINE_HEIGHT - 10, to: titleTopY + i * TITLE_LINE_HEIGHT },
        duration: 600,
        delay: i * ENTRANCE_STAGGER,
        ease: 'Back.easeOut',
      });

      this.asciiLines.push(text);
    });

    const subtitleY = titleTopY + ASCII_TITLE.length * TITLE_LINE_HEIGHT + 20;
    const subtitle = this.add.text(centerX, subtitleY, 'SAVE THE WORLD', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 200,
      ease: 'Power2',
    });

    const taglineY = subtitleY + 30;
    const tagline = this.add.text(centerX, taglineY, 'A Hacker\'s Odyssey', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    tagline.setOrigin(0.5);
    tagline.setAlpha(0);
    this.tweens.add({
      targets: tagline,
      alpha: 0.7,
      duration: 800,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 400,
      ease: 'Power2',
    });

    const statsY = height * 0.62;
    const stats = this.add.text(centerX, statsY, '5 Chapters  ·  19 Puzzles  ·  1 World to Save', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
    });
    stats.setOrigin(0.5);
    stats.setAlpha(0);
    this.tweens.add({
      targets: stats,
      alpha: 0.6,
      duration: 800,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 600,
      ease: 'Power2',
    });

    const buttonY = height * BaseScene.MENU_START_BUTTON_Y_RATIO;
    const button = this.createStartButton(centerX, buttonY);
    button.setAlpha(0);
    this.tweens.add({
      targets: button,
      alpha: 1,
      duration: 600,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 800,
      ease: 'Power2',
    });

    const controls = this.add.text(centerX, height * BaseScene.MENU_CONTROLS_HINT_Y_RATIO, 'ESC: Exit  ·  P: Pause  ·  M: Mute', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: MATRIX_COLORS.DIM_GREEN_HEX,
    });
    controls.setOrigin(0.5);
    controls.setAlpha(0);
    this.tweens.add({
      targets: controls,
      alpha: 0.3,
      duration: 800,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 1000,
      ease: 'Power2',
    });

    this.addTitleGlow();
    this.setupMenuInput();
    this.setupCommonInputs();
  }

  update(_time: number, delta: number): void {
    if (this.rainGroup) {
      this.updateMatrixRain(this.rainGroup, delta);
    }
    this.exposeTestState({});
  }

  private createStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
    bg.fillRoundedRect(-100, -28, 200, 56, 8);
    bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    bg.strokeRoundedRect(-100, -28, 200, 56, 8);

    const text = this.add.text(0, 0, '▸  JACK IN  ◂', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-100, -28, 200, 56);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.PRIMARY, 0.3);
      bg.fillRoundedRect(-100, -28, 200, 56, 8);
      bg.lineStyle(3, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-100, -28, 200, 56, 8);
      text.setColor(MATRIX_COLORS.WHITE_HEX);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(MATRIX_COLORS.DARK_GREEN, 1);
      bg.fillRoundedRect(-100, -28, 200, 56, 8);
      bg.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
      bg.strokeRoundedRect(-100, -28, 200, 56, 8);
      text.setColor(MATRIX_COLORS.PRIMARY_HEX);
    });

    container.on('pointerdown', () => this.startGame());

    return container;
  }

  private setupMenuInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => this.startGame());

      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => this.startGame());
    });
  }

  private startGame(): void {
    this.playSound(STINGER_KEYS.TRANSITION);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(CTRLS_SCENE_KEYS.CHAPTER_HUB);
    });
  }

  private addTitleGlow(): void {
    if (this.asciiLines.length === 0) return;

    this.tweens.add({
      targets: this.asciiLines,
      alpha: { from: 1, to: 0.6 },
      duration: 2000,
      delay: ASCII_TITLE.length * ENTRANCE_STAGGER + 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  shutdown(): void {
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
    this.asciiLines = [];
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
