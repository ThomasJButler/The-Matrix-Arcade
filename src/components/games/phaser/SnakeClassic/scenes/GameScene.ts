import Phaser from 'phaser';
import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS, REGISTRY_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  DEATH_CINEMATIC,
  DREAD_BUILDUP,
  FOOD_PICKUP_JUICE,
  GLITCH_RAIN,
  HUD_X,
  MATRIX_FUNKINESS,
  POWERUP_DEFS,
  SPRITE_POLISH,
  OPPOSITE_DIRECTIONS,
  type Direction,
  type PowerUpType,
  type Position,
} from '../config';

interface FieldPowerUp {
  type: PowerUpType;
  position: Position;
}

export class SnakeGameScene extends BaseScene {
  private snake: Position[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction | null = null;

  private food: Position = { x: 15, y: 10 };

  private fieldPowerUp: FieldPowerUp | null = null;
  private fieldPowerUpTimer: Phaser.Time.TimerEvent | null = null;

  private speedSlowed = false;
  private speedPowerUpTimer: Phaser.Time.TimerEvent | null = null;
  private doublePointsRemaining = 0;
  private shieldActive = false;
  private ghostActive = false;
  private ghostPowerUpTimer: Phaser.Time.TimerEvent | null = null;
  // R84.S3 — new time-gated power-ups. All three follow the ghost/speed
  // pattern (flag + timer destroyed on deactivate/shutdown) so a restart
  // mid-effect can't leak stale state.
  private reverseActive = false;
  private reversePowerUpTimer: Phaser.Time.TimerEvent | null = null;
  private hyperActive = false;
  private hyperPowerUpTimer: Phaser.Time.TimerEvent | null = null;
  private glitchActive = false;
  private glitchPowerUpTimer: Phaser.Time.TimerEvent | null = null;
  private glitchOverlay: Phaser.GameObjects.Text[] = [];

  private score = 0;
  private highScore = 0;
  private foodEaten = 0;
  private consecutiveFood = 0;
  private powerUpsCollected = 0;

  private currentSpeed = GAME_CONFIG.INITIAL_SPEED;
  private moveTimer: Phaser.Time.TimerEvent | null = null;
  private gameTimer = 0;
  private isGameOver = false;

  private snakeSprites: Phaser.GameObjects.Image[] = [];
  private foodSprite!: Phaser.GameObjects.Image;
  private bonusFoodText: Phaser.GameObjects.Text | null = null;
  private isBonusFood = false;
  private powerUpSprite: Phaser.GameObjects.Image | null = null;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private gridBorder!: Phaser.GameObjects.Graphics;
  private matrixRainGroup!: Phaser.GameObjects.Group;
  private playAreaRainGroup!: Phaser.GameObjects.Group;
  private snakeHeadGlow!: Phaser.GameObjects.Graphics;
  private scanlineOverlay!: Phaser.GameObjects.Graphics;
  private powerUpLegend: Phaser.GameObjects.Text[] = [];
  // R84.S4 — Speed-tier dread build-up. `dreadIntensity` is the [0..1] ramp
  // driving all three effects; `dreadActive` flips true on the frame
  // intensity becomes non-zero so we can one-shot the drone + shake timer
  // setup rather than re-triggering them every tick.
  private dreadScanlineOverlay!: Phaser.GameObjects.Graphics;
  private dreadShakeTimer: Phaser.Time.TimerEvent | null = null;
  private dreadActive = false;
  private dreadIntensity = 0;
  // R84.S5 — Snake death cinematic. Red-bar glitch cascade held in a list so
  // teardown can mass-destroy if the scene tears down mid-strobe (restart
  // before the 300 ms window completes). Individual bars also self-destroy
  // via the tween `onComplete` callback to keep the happy-path cheap.
  private deathCinematicBars: Phaser.GameObjects.Rectangle[] = [];

  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private speedBarBg!: Phaser.GameObjects.Graphics;
  private speedBarFill!: Phaser.GameObjects.Graphics;
  private powerUpIndicators: Map<string, Phaser.GameObjects.Text> = new Map();
  private foodCountText!: Phaser.GameObjects.Text;

  private arrowKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;

  private achievementsUnlocked: Set<string> = new Set();

  // R84.CI-4: SR score-milestone announcements. Mirrors Matrix Bird's CI-2
  // pattern via the shared `scoreMilestone` bridge event. Unlike Bird we do
  // NOT fire an extra SFX here — Snake's `levelUp` stinger already fires at
  // every POINTS_PER_SPEED_UP (50 pts) boundary, which matches the 50/100/250
  // thresholds; layering a second sighted cue on top would crowd the mix. The
  // 500 threshold sits beyond the first speed-up wave and marks the longest-
  // run landmark Tom observed during V2 playtest. Set membership is keyed on
  // the threshold (not the current score) so a reverse/glitch pickup that
  // jumps 45 → 120 pts fires both the 50 and 100 announcements on the same
  // frame without repeats on the next food tick.
  private static readonly SCORE_MILESTONES = [50, 100, 250, 500] as const;
  private milestonesHit: Set<number> = new Set();

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    this.createMatrixBackground();
    // Density bumped from 10 → 14 (R83.S1) for extra Matrix wow factor.
    this.matrixRainGroup = this.addMatrixRain(14);
    this.resetState();

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.snakeClassic?.highScore ?? 0;
    }

    this.drawGrid();
    this.drawGridBorder();
    this.createPlayAreaMatrixRain();
    this.createSnakeHeadGlow();
    this.createScanlineOverlay();
    this.createDreadScanlineOverlay();
    this.createHUD();
    this.createFoodSprite();
    this.createInitialSnake();
    this.setupInput();
    this.setupCommonInputs();
    this.startMoveTimer();
    this.playSound('menu');
    // BGM softened to 70% for ambient feel — Tom: "more of a background" (R83.S1).
    this.playBackgroundMusic('/assets/audio/music/cruise-control.mp3', 0.7);
    this.startCountdown(5, () => this.showPowerUpLegend());
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return;
    if (this.isCountingDown) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);
    this.updatePlayAreaRain(delta);
    this.updateSnakeHeadGlow();
    this.updateGlitchOverlay(delta);
    this.updateDreadBuildup();
    this.gameTimer += delta;
    this.handleInput();
    this.updateGhostVisuals();
    this.exposeTestState(this.getTestState());
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    this.destroyMoveTimer();
    this.destroyFieldPowerUp();
    this.destroyPowerUpTimers();
    this.snakeSprites.forEach(s => s.destroy());
    this.snakeSprites = [];
    this.powerUpIndicators.forEach(t => t.destroy());
    this.powerUpIndicators.clear();
    this.powerUpLegend.forEach(t => t.destroy());
    this.powerUpLegend = [];
    this.destroyBonusFoodText();
    this.destroyGlitchOverlay();
    this.destroyDeathCinematicBars();
    this.teardownDreadBuildup();
    this.playAreaRainGroup?.destroy(true);
    this.snakeHeadGlow?.destroy();
    this.achievementsUnlocked.clear();

    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    super.shutdown();
  }

  // ─── State ──────────────────────────────────────────────

  private resetState(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'right';
    this.nextDirection = null;
    this.food = { x: 15, y: 10 };
    this.fieldPowerUp = null;
    this.score = 0;
    this.foodEaten = 0;
    this.consecutiveFood = 0;
    this.powerUpsCollected = 0;
    this.currentSpeed = GAME_CONFIG.INITIAL_SPEED;
    this.gameTimer = 0;
    this.isGameOver = false;
    this.speedSlowed = false;
    this.doublePointsRemaining = 0;
    this.shieldActive = false;
    this.ghostActive = false;
    this.reverseActive = false;
    this.hyperActive = false;
    this.glitchActive = false;
    this.isBonusFood = false;
    this.dreadActive = false;
    this.dreadIntensity = 0;
    this.achievementsUnlocked = new Set();
    // R84.CI-4: clear milestone tracker so a restart re-announces the early
    // thresholds to AT users just like the sighted levelUp SFX re-plays.
    this.milestonesHit = new Set();
  }

  // R84.CI-4: emit `scoreMilestone` events for each newly-crossed threshold.
  // Called from every path that mutates `this.score` (eatFood, reverse pickup
  // bonus, glitch pickup bonus). Safe to call even if no thresholds were
  // crossed — the set guard makes it idempotent. The React bridge
  // (PhaserGame.tsx) routes the event into the shared SR live region.
  private checkScoreMilestones(): void {
    for (const threshold of SnakeGameScene.SCORE_MILESTONES) {
      if (this.score >= threshold && !this.milestonesHit.has(threshold)) {
        this.milestonesHit.add(threshold);
        this.emitGameEvent({ type: 'scoreMilestone', data: { value: threshold } });
      }
    }
  }

  // ─── Grid ──────────────────────────────────────────────

  private drawGrid(): void {
    const { CELL_SIZE, GRID_COLS, GRID_ROWS, GRID_OFFSET_X, GRID_OFFSET_Y } = GAME_CONFIG;
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x001a00, 0.3);

    for (let x = 0; x <= GRID_COLS; x++) {
      const px = GRID_OFFSET_X + x * CELL_SIZE;
      this.gridGraphics.lineBetween(px, GRID_OFFSET_Y, px, GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      const py = GRID_OFFSET_Y + y * CELL_SIZE;
      this.gridGraphics.lineBetween(GRID_OFFSET_X, py, GRID_OFFSET_X + GRID_COLS * CELL_SIZE, py);
    }
  }

  private drawGridBorder(): void {
    const { CELL_SIZE, GRID_COLS, GRID_ROWS, GRID_OFFSET_X, GRID_OFFSET_Y } = GAME_CONFIG;
    this.gridBorder = this.add.graphics();

    if (this.spriteMode && this.textures?.exists('wall_sprite')) {
      // Helper: pixel center for a border tile at grid-space col/row (may be -1 or GRID_COLS/GRID_ROWS)
      const tileCenter = (col: number, row: number) => ({
        px: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
        py: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
      });

      const placeWall = (col: number, row: number, isCorner: boolean) => {
        const { px, py } = tileCenter(col, row);
        const key = isCorner ? 'wall_alt_sprite' : 'wall_sprite';
        this.add.image(px, py, key).setDisplaySize(CELL_SIZE, CELL_SIZE).setDepth(0);
      };

      // Top and bottom edge (including corners)
      for (let col = -1; col <= GRID_COLS; col++) {
        const isCorner = col === -1 || col === GRID_COLS;
        placeWall(col, -1, isCorner);         // top row
        placeWall(col, GRID_ROWS, isCorner);  // bottom row
      }

      // Left and right edge (excluding corners already placed above)
      for (let row = 0; row < GRID_ROWS; row++) {
        placeWall(-1, row, false);         // left column
        placeWall(GRID_COLS, row, false);  // right column
      }
    } else {
      this.gridBorder.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.6);
      this.gridBorder.strokeRect(
        GRID_OFFSET_X - 1,
        GRID_OFFSET_Y - 1,
        GRID_COLS * CELL_SIZE + 2,
        GRID_ROWS * CELL_SIZE + 2,
      );
    }
  }

  // ─── Play-area rain (R84.S2a) ──────────────────────────

  /**
   * Subtle second rain layer clipped inside the play area. Renders at depth
   * `-1` beneath the snake sprites (which sit at default depth 0) so the
   * playfield reads as "made of code" without fighting the snake for
   * attention. Skipped in E2E test mode because Phaser's RNG is unseedable.
   */
  private createPlayAreaMatrixRain(): void {
    this.playAreaRainGroup = this.add.group();
    if (typeof window !== 'undefined' && (window as { __TEST__?: boolean }).__TEST__) {
      return;
    }
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const { left, right, top, bottom } = this.getPlayAreaBounds();

    for (let i = 0; i < MATRIX_FUNKINESS.PLAY_AREA_RAIN_DENSITY; i++) {
      const x = Phaser.Math.Between(left, right);
      const y = Phaser.Math.Between(top - 60, bottom);
      const speed = Phaser.Math.Between(
        MATRIX_FUNKINESS.PLAY_AREA_RAIN_SPEED_MIN,
        MATRIX_FUNKINESS.PLAY_AREA_RAIN_SPEED_MAX,
      );
      const char = chars[Phaser.Math.Between(0, chars.length - 1)];
      const text = this.add.text(x, y, char, {
        fontFamily: 'monospace',
        fontSize: `${MATRIX_FUNKINESS.PLAY_AREA_RAIN_FONT_SIZE}px`,
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      text
        .setAlpha(MATRIX_FUNKINESS.PLAY_AREA_RAIN_ALPHA)
        .setDepth(MATRIX_FUNKINESS.PLAY_AREA_RAIN_DEPTH);
      text.setData('speed', speed);
      text.setData('chars', chars);
      this.playAreaRainGroup.add(text);
    }
  }

  private updatePlayAreaRain(delta: number): void {
    if (!this.playAreaRainGroup) return;
    const { left, right, top, bottom } = this.getPlayAreaBounds();

    this.playAreaRainGroup.getChildren().forEach((obj) => {
      const text = obj as Phaser.GameObjects.Text;
      const speed = text.getData('speed') as number;
      const chars = text.getData('chars') as string;
      if (typeof speed !== 'number' || !chars) return;
      text.y += speed * (delta / 1000);
      if (text.y > bottom + 10) {
        text.y = top - 10;
        text.x = Phaser.Math.Between(left, right);
        text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
      }
      if (Math.random() < 0.008) {
        text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
      }
    });
  }

  private getPlayAreaBounds(): { left: number; right: number; top: number; bottom: number } {
    const { GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS, CELL_SIZE } = GAME_CONFIG;
    return {
      left: GRID_OFFSET_X,
      right: GRID_OFFSET_X + GRID_COLS * CELL_SIZE,
      top: GRID_OFFSET_Y,
      bottom: GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE,
    };
  }

  // ─── Snake-head glow (R84.S2b) ─────────────────────────

  /**
   * Twin concentric PRIMARY-green fillCircles under the snake head. Reads
   * as a headlamp cast on the playfield and anchors the eye on the head
   * during frantic rallies. Depth `-1` keeps it beneath the sprite.
   */
  private createSnakeHeadGlow(): void {
    this.snakeHeadGlow = this.add.graphics();
    this.snakeHeadGlow.setDepth(MATRIX_FUNKINESS.HEAD_GLOW_DEPTH);
  }

  private updateSnakeHeadGlow(): void {
    if (!this.snakeHeadGlow || this.snake.length === 0) return;
    this.snakeHeadGlow.clear();
    const head = this.snake[0];
    const { x, y } = this.gridToPixel(head.x, head.y);
    this.snakeHeadGlow.fillStyle(MATRIX_COLORS.PRIMARY, MATRIX_FUNKINESS.HEAD_GLOW_OUTER_ALPHA);
    this.snakeHeadGlow.fillCircle(x, y, MATRIX_FUNKINESS.HEAD_GLOW_OUTER_RADIUS);
    this.snakeHeadGlow.fillStyle(MATRIX_COLORS.PRIMARY, MATRIX_FUNKINESS.HEAD_GLOW_INNER_ALPHA);
    this.snakeHeadGlow.fillCircle(x, y, MATRIX_FUNKINESS.HEAD_GLOW_INNER_RADIUS);
  }

  // ─── HUD ───────────────────────────────────────────────

  private createHUD(): void {
    const leftX = HUD_X.LEFT_X;
    const rightX = HUD_X.RIGHT_X;

    this.createMatrixText(leftX, 40, 'SCORE', 10, MATRIX_COLORS.PRIMARY_HEX);
    this.scoreText = this.createMatrixText(leftX, 65, '00000', 12, MATRIX_COLORS.PRIMARY_HEX);

    this.createMatrixText(leftX, 110, 'HIGH', 10, MATRIX_COLORS.PRIMARY_HEX);
    this.highScoreText = this.createMatrixText(leftX, 135, '00000', 12, MATRIX_COLORS.PRIMARY_HEX);

    this.createMatrixText(leftX, 180, 'LEVEL', 10, MATRIX_COLORS.PRIMARY_HEX);
    this.levelText = this.createMatrixText(leftX, 205, '1', 14, MATRIX_COLORS.PRIMARY_HEX);

    this.createMatrixText(leftX, 260, 'SPEED', 10, MATRIX_COLORS.PRIMARY_HEX);
    this.speedBarBg = this.add.graphics();
    this.speedBarBg.fillStyle(0x002200, 1);
    this.speedBarBg.fillRect(leftX - 50, 280, 100, 8);
    this.speedBarFill = this.add.graphics();

    this.createMatrixText(rightX, 40, 'POWER-UPS', 8, MATRIX_COLORS.PRIMARY_HEX);
    this.foodCountText = this.createMatrixText(rightX, 370, 'FOOD: 0', 8, MATRIX_COLORS.PRIMARY_HEX);

    this.updateHUD();
  }

  private updateHUD(): void {
    this.scoreText.setText(String(this.score).padStart(5, '0'));
    this.highScoreText.setText(String(this.highScore).padStart(5, '0'));
    this.levelText.setText(String(this.getLevel()));
    this.foodCountText.setText(`FOOD: ${this.foodEaten}`);

    const speedRange = GAME_CONFIG.INITIAL_SPEED - GAME_CONFIG.MIN_SPEED;
    const speedPercent = Math.max(20, 100 - ((this.currentSpeed - GAME_CONFIG.MIN_SPEED) / speedRange) * 100);
    this.speedBarFill.clear();
    this.speedBarFill.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    this.speedBarFill.fillRect(50, 280, speedPercent, 8);

    this.updatePowerUpIndicators();
  }

  private updatePowerUpIndicators(): void {
    this.powerUpIndicators.forEach(t => t.destroy());
    this.powerUpIndicators.clear();

    const rightX = HUD_X.RIGHT_X;
    let y = 70;

    if (this.speedSlowed) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.speed.label, 10, MATRIX_COLORS.YELLOW_HEX);
      this.powerUpIndicators.set('speed', t);
      y += 30;
    }
    if (this.doublePointsRemaining > 0) {
      const t = this.createMatrixText(rightX, y, `2X x${this.doublePointsRemaining}`, 10, '#0099ff');
      this.powerUpIndicators.set('double', t);
      y += 30;
    }
    if (this.shieldActive) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.shield.label, 10, MATRIX_COLORS.MAGENTA_HEX);
      this.powerUpIndicators.set('shield', t);
      y += 30;
    }
    if (this.ghostActive) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.ghost.label, 10, MATRIX_COLORS.CYAN_HEX);
      this.powerUpIndicators.set('ghost', t);
      y += 30;
    }
    if (this.reverseActive) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.reverse.label, 10, MATRIX_COLORS.RED_HEX);
      this.powerUpIndicators.set('reverse', t);
      y += 30;
    }
    if (this.hyperActive) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.hyper.label, 10, '#ffaa00');
      this.powerUpIndicators.set('hyper', t);
      y += 30;
    }
    if (this.glitchActive) {
      const t = this.createMatrixText(rightX, y, POWERUP_DEFS.glitch.label, 10, '#aa00ff');
      this.powerUpIndicators.set('glitch', t);
      y += 30;
    }
  }

  private getLevel(): number {
    return Math.floor(this.score / GAME_CONFIG.POINTS_PER_SPEED_UP) + 1;
  }

  // ─── Input ─────────────────────────────────────────────

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      this.arrowKeys = this.input.keyboard.createCursorKeys();
      this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    });
  }

  private handleInput(): void {
    if (!this.arrowKeys) return;

    let newDir: Direction | null = null;

    if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      newDir = 'up';
    } else if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.down) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      newDir = 'down';
    } else if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.left) || Phaser.Input.Keyboard.JustDown(this.aKey)) {
      newDir = 'left';
    } else if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.right) || Phaser.Input.Keyboard.JustDown(this.dKey)) {
      newDir = 'right';
    }

    // R84.S3 reverse power-up: swap the intended axis so UP↔DOWN, LEFT↔RIGHT.
    // Applied BEFORE the 180°-reversal guard so the reversed direction still
    // gets rejected when it would collapse onto the snake's own body.
    if (newDir && this.reverseActive) {
      newDir = OPPOSITE_DIRECTIONS[newDir];
    }

    if (newDir && newDir !== OPPOSITE_DIRECTIONS[this.direction]) {
      this.nextDirection = newDir;
    }
  }

  // ─── Movement ──────────────────────────────────────────

  private startMoveTimer(): void {
    this.moveTimer = this.time.addEvent({
      delay: this.currentSpeed,
      callback: () => this.tick(),
      loop: true,
    });
  }

  private restartMoveTimer(): void {
    this.destroyMoveTimer();
    this.startMoveTimer();
  }

  private destroyMoveTimer(): void {
    if (this.moveTimer) {
      this.moveTimer.destroy();
      this.moveTimer = null;
    }
  }

  private tick(): void {
    if (this.isPaused || this.isGameOver) return;
    if (this.isCountingDown) return;

    if (this.nextDirection) {
      this.direction = this.nextDirection;
      this.nextDirection = null;
    }

    const head = this.snake[0];
    let nextPos = this.getNextPosition(head, this.direction);

    if (this.ghostActive) {
      nextPos = this.wrapPosition(nextPos);
    }

    const wallCollision = !this.ghostActive && this.isOutOfBounds(nextPos);
    const selfCollision = this.checkSelfCollision(nextPos);

    if (wallCollision && this.shieldActive) {
      this.shieldActive = false;
      nextPos = { ...head };
      this.playSound(SOUND_KEYS.GLASS_BREAK);
      this.cameras.main.shake(120, 0.008);
      this.createShieldBreakEffect(head);
    } else if (wallCollision || selfCollision) {
      this.handleGameOver();
      return;
    }

    this.snake.unshift(nextPos);

    if (this.fieldPowerUp && nextPos.x === this.fieldPowerUp.position.x && nextPos.y === this.fieldPowerUp.position.y) {
      this.collectPowerUp(this.fieldPowerUp.type);
    }

    const ateFood = nextPos.x === this.food.x && nextPos.y === this.food.y;
    if (ateFood) {
      this.eatFood();
    } else {
      this.snake.pop();
    }

    this.updateSnakeSprites();
    this.updateHUD();
    this.checkAchievements();
  }

  private getNextPosition(pos: Position, dir: Direction): Position {
    switch (dir) {
      case 'up': return { x: pos.x, y: pos.y - 1 };
      case 'down': return { x: pos.x, y: pos.y + 1 };
      case 'left': return { x: pos.x - 1, y: pos.y };
      case 'right': return { x: pos.x + 1, y: pos.y };
    }
  }

  private wrapPosition(pos: Position): Position {
    const { GRID_COLS, GRID_ROWS } = GAME_CONFIG;
    return {
      x: ((pos.x % GRID_COLS) + GRID_COLS) % GRID_COLS,
      y: ((pos.y % GRID_ROWS) + GRID_ROWS) % GRID_ROWS,
    };
  }

  private isOutOfBounds(pos: Position): boolean {
    return pos.x < 0 || pos.x >= GAME_CONFIG.GRID_COLS || pos.y < 0 || pos.y >= GAME_CONFIG.GRID_ROWS;
  }

  private checkSelfCollision(nextPos: Position): boolean {
    if (this.snake.length <= 1) return false;
    return this.snake.slice(0, -1).some(s => s.x === nextPos.x && s.y === nextPos.y);
  }

  // ─── Food ─────────────────────────────────────────────

  private createFoodSprite(): void {
    const { x, y } = this.gridToPixel(this.food.x, this.food.y);
    const key = this.spriteMode ? 'food_sprite' : 'food';
    this.foodSprite = this.add.image(x, y, key);
    // R84.S8 — migrate R83.S1 shrink from setDisplaySize to setScale so the
    // baseline lives on the same scale track the yoyo pulse writes to. The
    // old `setDisplaySize(CELL_SIZE*0.75)` call was being overwritten by the
    // pulse `scale: { from: 0.85, to: 1.05 }`, re-enlarging the apple to
    // 13.6..16.8 px (overspilling the 16-px cell). The new pulse band
    // [FOOD_PULSE_MIN, FOOD_PULSE_MAX] has its peak equal to FOOD_BASE_SCALE,
    // so the apple never exceeds its shrunk cell-fit size. See
    // SnakeClassic/config.ts SPRITE_POLISH block for the full rationale.
    this.foodSprite.setScale(SPRITE_POLISH.FOOD_BASE_SCALE);
    this.tweens.add({
      targets: this.foodSprite,
      scale: { from: SPRITE_POLISH.FOOD_PULSE_MIN, to: SPRITE_POLISH.FOOD_PULSE_MAX },
      yoyo: true,
      repeat: -1,
      duration: SPRITE_POLISH.FOOD_PULSE_DURATION_MS,
    });
  }

  private spawnFood(): void {
    this.food = this.getRandomEmptyCell();
    const { x, y } = this.gridToPixel(this.food.x, this.food.y);

    this.destroyBonusFoodText();

    if (this.isBonusFood) {
      // Hide apple sprite under the glyph — collision is grid-based so the
      // gameplay is identical, only the visual differs.
      this.foodSprite.setPosition(x, y);
      this.foodSprite.setAlpha(0);
      const glyphs = MATRIX_FUNKINESS.BONUS_FOOD_GLYPHS;
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      this.bonusFoodText = this.add.text(x, y, glyph, {
        fontFamily: 'monospace',
        fontSize: `${MATRIX_FUNKINESS.BONUS_FOOD_FONT_SIZE}px`,
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      this.bonusFoodText
        .setOrigin(0.5)
        .setDepth(MATRIX_FUNKINESS.BONUS_FOOD_DEPTH);
      // R84.S8 — pulse peak clamped to 1.0 so the glyph never enlarges past
      // its baseline font-size (pre-S8 the 0.9..1.15 band peaked at 20.7 px
      // on an 18-px font, overspilling the 16-px cell by ~5 px each side).
      this.tweens.add({
        targets: this.bonusFoodText,
        alpha: { from: SPRITE_POLISH.BONUS_FOOD_ALPHA_MIN, to: SPRITE_POLISH.BONUS_FOOD_ALPHA_MAX },
        scale: { from: SPRITE_POLISH.BONUS_FOOD_PULSE_MIN, to: SPRITE_POLISH.BONUS_FOOD_PULSE_MAX },
        yoyo: true,
        repeat: -1,
        duration: SPRITE_POLISH.BONUS_FOOD_PULSE_DURATION_MS,
      });
    } else {
      this.foodSprite.setAlpha(1);
      this.foodSprite.setPosition(x, y);
      this.foodSprite.setScale(0);
      // R84.S8 — pop-in target = FOOD_BASE_SCALE, not magic 1. Before S8 this
      // tween wrote scale=1 which drove the apple to its full 16-px native
      // texture size for one frame before the pulse tween from
      // createFoodSprite reclaimed it — noticeable flash of overspill.
      this.tweens.add({
        targets: this.foodSprite,
        scale: SPRITE_POLISH.FOOD_BASE_SCALE,
        duration: SPRITE_POLISH.FOOD_POP_IN_DURATION_MS,
        ease: 'Back.easeOut',
      });
    }
  }

  private destroyBonusFoodText(): void {
    if (this.bonusFoodText) {
      this.tweens.killTweensOf(this.bonusFoodText);
      this.bonusFoodText.destroy();
      this.bonusFoodText = null;
    }
  }

  private eatFood(): void {
    const prevFoodEaten = this.foodEaten;
    const wasBonus = this.isBonusFood;
    this.foodEaten++;
    this.consecutiveFood++;

    let points = GAME_CONFIG.POINTS_PER_FOOD;
    if (this.doublePointsRemaining > 0) {
      points = GAME_CONFIG.POINTS_PER_FOOD_DOUBLE;
      this.doublePointsRemaining--;
    }
    // R84.S3 hyper power-up: time-based 2× multiplier stacks on top of the
    // count-based `double` (and on top of bonus food) — a fully-stacked
    // pickup inside an active hyper + bonus window scores 8× base points.
    if (this.hyperActive) {
      points *= 2;
    }
    if (wasBonus) {
      // Bonus food stacks multiplicatively with the 2X power-up so a lucky
      // overlap of the two rewards the player with 4×. Kept simple because
      // the 5-food cadence already limits how often this fires.
      points *= MATRIX_FUNKINESS.BONUS_FOOD_POINTS_MULTIPLIER;
      this.playSound(SOUND_KEYS.COMBO);
    }
    this.score += points;

    this.playSound('snakeEat');
    this.createScorePopup(this.food, points);
    this.createEatBurst(this.food);
    this.cameras.main.shake(60, 0.004);

    if (this.consecutiveFood > 0 && this.consecutiveFood % 5 === 0) {
      this.playSound(SOUND_KEYS.COMBO);
      this.cameras.main.flash(100, 0, 255, 0, false, undefined, undefined, 0.15);
    }

    if (prevFoodEaten === 0) {
      this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_APPLE);
    }

    if (this.score % GAME_CONFIG.POINTS_PER_SPEED_UP === 0 && !this.speedSlowed) {
      const newSpeed = Math.max(GAME_CONFIG.MIN_SPEED, this.currentSpeed - GAME_CONFIG.SPEED_INCREMENT);
      if (newSpeed !== this.currentSpeed) {
        this.currentSpeed = newSpeed;
        this.restartMoveTimer();
        this.playSound('levelUp');
        this.cameras.main.flash(150, 0, 255, 0, false, undefined, undefined, 0.2);
        this.tweens.add({
          targets: this.levelText,
          scale: { from: 1.5, to: 1 },
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.reportScore(this.score, this.highScore);
    // R84.CI-4: AT users hear silence on the 50/100/250/500-pt landmarks
    // otherwise; emit before the bonus-food cadence block so the SR update
    // lands in the same frame as the levelUp stinger sighted players hear.
    this.checkScoreMilestones();

    // Seed the next spawn as bonus on a fixed food-count cadence. Evaluated
    // here (not in spawnFood) so the cadence is deterministic w.r.t. food
    // eaten, independent of any future spawnFood retry logic.
    this.isBonusFood =
      this.foodEaten > 0 &&
      this.foodEaten % MATRIX_FUNKINESS.BONUS_FOOD_INTERVAL === 0;

    this.spawnFood();

    if (!this.fieldPowerUp && Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
      this.spawnFieldPowerUp();
    }
  }

  private createScorePopup(pos: Position, points: number): void {
    const { x, y } = this.gridToPixel(pos.x, pos.y);
    const text = this.createMatrixText(x, y, `+${points}`, 10, MATRIX_COLORS.PRIMARY_HEX);
    // R84.S6 — scale-pop entry gives the "+N" a visible impact frame. End
    // state matches the old static size so no reduced-motion gate is needed.
    text.setScale(FOOD_PICKUP_JUICE.SCORE_POPUP_SCALE_FROM);
    this.tweens.add({
      targets: text,
      scale: FOOD_PICKUP_JUICE.SCORE_POPUP_SCALE_TO,
      duration: FOOD_PICKUP_JUICE.SCORE_POPUP_SCALE_DURATION_MS,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  // ─── Power-Ups ─────────────────────────────────────────

  private spawnFieldPowerUp(): void {
    // R84.S3 extended pool — all 7 types are equal-probability. Kept flat
    // rather than weighted because the 5s/10s/3s durations already gate how
    // often each effect can fire, and weighting would require a new tuning
    // surface Tom hasn't asked for.
    const types: PowerUpType[] = [
      'speed', 'double', 'shield', 'ghost', 'reverse', 'hyper', 'glitch',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const position = this.getRandomEmptyCell();

    this.fieldPowerUp = { type, position };

    const { x, y } = this.gridToPixel(position.x, position.y);
    this.powerUpSprite = this.add.image(x, y, `powerup_${type}`);
    // R84.S8 — baseline + clamped pulse (peak = 1.0 = cell-fit). Pre-S8 the
    // pulse peaked at 1.2× native (19.2 px), overspilling the 16-px cell by
    // 3.2 px each side. New band [POWERUP_PULSE_MIN, POWERUP_PULSE_MAX]
    // reads as "breathing" without crossing into neighbouring cells.
    this.powerUpSprite.setScale(SPRITE_POLISH.POWERUP_BASE_SCALE);
    this.tweens.add({
      targets: this.powerUpSprite,
      scale: { from: SPRITE_POLISH.POWERUP_PULSE_MIN, to: SPRITE_POLISH.POWERUP_PULSE_MAX },
      alpha: { from: SPRITE_POLISH.POWERUP_ALPHA_MIN, to: SPRITE_POLISH.POWERUP_ALPHA_MAX },
      yoyo: true,
      repeat: -1,
      duration: SPRITE_POLISH.POWERUP_PULSE_DURATION_MS,
    });

    this.fieldPowerUpTimer = this.time.delayedCall(GAME_CONFIG.POWERUP_FIELD_DURATION, () => {
      this.destroyFieldPowerUp();
    });
  }

  private destroyFieldPowerUp(): void {
    if (this.powerUpSprite) {
      this.tweens.killTweensOf(this.powerUpSprite);
      this.powerUpSprite.destroy();
      this.powerUpSprite = null;
    }
    if (this.fieldPowerUpTimer) {
      this.fieldPowerUpTimer.destroy();
      this.fieldPowerUpTimer = null;
    }
    this.fieldPowerUp = null;
  }

  private collectPowerUp(type: PowerUpType): void {
    this.powerUpsCollected++;

    const sfxMap: Record<PowerUpType, string> = {
      speed: SOUND_KEYS.POWERUP_BULLET_TIME,
      double: SOUND_KEYS.POWERUP_MAGNET,
      shield: SOUND_KEYS.POWERUP_SHIELD,
      ghost: SOUND_KEYS.POWERUP_GHOST,
      // R84.S3 SFX per type — reverse uses a glassy break to cue "things are
      // flipped", hyper reuses the magnet cue (shared "money-is-good" beat
      // with `double`), glitch uses the special-ability burst because the
      // overlay is a one-shot screen takeover.
      reverse: SOUND_KEYS.GLASS_BREAK,
      hyper: SOUND_KEYS.POWERUP_MAGNET,
      glitch: SOUND_KEYS.SPECIAL_ABILITY,
    };
    this.playSound(sfxMap[type] ?? SOUND_KEYS.COLLECTIBLE);

    if (this.fieldPowerUp) {
      const { x, y } = this.gridToPixel(this.fieldPowerUp.position.x, this.fieldPowerUp.position.y);
      this.createParticleBurst(x, y, MATRIX_COLORS.CYAN, 10);
    }
    this.cameras.main.flash(80, 0, 255, 255, false, undefined, undefined, 0.12);

    this.destroyFieldPowerUp();
    this.activatePowerUp(type);
  }

  private activatePowerUp(type: PowerUpType): void {
    switch (type) {
      case 'speed': {
        this.speedSlowed = true;
        this.currentSpeed = Math.min(
          GAME_CONFIG.INITIAL_SPEED + GAME_CONFIG.SPEED_POWERUP_BONUS,
          this.currentSpeed + GAME_CONFIG.SPEED_POWERUP_BONUS,
        );
        this.restartMoveTimer();
        if (this.speedPowerUpTimer) this.speedPowerUpTimer.destroy();
        this.speedPowerUpTimer = this.time.delayedCall(GAME_CONFIG.SPEED_POWERUP_DURATION, () => {
          this.deactivateSpeedPowerUp();
        });
        break;
      }
      case 'double':
        this.doublePointsRemaining = GAME_CONFIG.DOUBLE_POWERUP_COUNT;
        break;
      case 'shield':
        this.shieldActive = true;
        break;
      case 'ghost': {
        this.ghostActive = true;
        if (this.ghostPowerUpTimer) this.ghostPowerUpTimer.destroy();
        this.ghostPowerUpTimer = this.time.delayedCall(GAME_CONFIG.GHOST_POWERUP_DURATION, () => {
          this.deactivateGhostPowerUp();
        });
        break;
      }
      case 'reverse': {
        // Reverse keyboard mapping 5s. Award a flat score bonus because the
        // challenge itself is pure downside — no effect that "helps" the
        // player, so the reward has to come from collection.
        this.reverseActive = true;
        this.score += GAME_CONFIG.REVERSE_PICKUP_BONUS;
        if (this.score > this.highScore) this.highScore = this.score;
        this.reportScore(this.score, this.highScore);
        this.checkScoreMilestones();
        if (this.reversePowerUpTimer) this.reversePowerUpTimer.destroy();
        this.reversePowerUpTimer = this.time.delayedCall(
          GAME_CONFIG.REVERSE_POWERUP_DURATION,
          () => this.deactivateReversePowerUp(),
        );
        break;
      }
      case 'hyper': {
        // Time-based 2× multiplier on every food pickup for 10s. Distinct
        // from `double` (count-based next-3-pickups) — they stack.
        this.hyperActive = true;
        if (this.hyperPowerUpTimer) this.hyperPowerUpTimer.destroy();
        this.hyperPowerUpTimer = this.time.delayedCall(
          GAME_CONFIG.HYPER_POWERUP_DURATION,
          () => this.deactivateHyperPowerUp(),
        );
        break;
      }
      case 'glitch': {
        // Obscures the screen with dense matrix rain for 3s while granting
        // a flat +100 bonus — gameplay continues normally beneath the
        // overlay (grid collisions untouched). The risk/reward is whether
        // the player remembers their current trajectory well enough to keep
        // steering blind. Bonus awarded up-front so the score bump isn't
        // consumed by an immediate wall crash.
        this.glitchActive = true;
        this.score += GAME_CONFIG.GLITCH_PICKUP_BONUS;
        if (this.score > this.highScore) this.highScore = this.score;
        this.reportScore(this.score, this.highScore);
        this.checkScoreMilestones();
        this.showGlitchOverlay();
        if (this.glitchPowerUpTimer) this.glitchPowerUpTimer.destroy();
        this.glitchPowerUpTimer = this.time.delayedCall(
          GAME_CONFIG.GLITCH_POWERUP_DURATION,
          () => this.deactivateGlitchPowerUp(),
        );
        break;
      }
    }
  }

  private deactivateSpeedPowerUp(): void {
    this.speedSlowed = false;
    this.speedPowerUpTimer = null;
    this.recalculateSpeed();
    this.restartMoveTimer();
  }

  private deactivateGhostPowerUp(): void {
    this.ghostActive = false;
    this.ghostPowerUpTimer = null;
    this.snakeSprites.forEach(s => {
      s.clearTint();
      s.setAlpha(1);
    });
  }

  private deactivateReversePowerUp(): void {
    this.reverseActive = false;
    this.reversePowerUpTimer = null;
  }

  private deactivateHyperPowerUp(): void {
    this.hyperActive = false;
    this.hyperPowerUpTimer = null;
  }

  private deactivateGlitchPowerUp(): void {
    this.glitchActive = false;
    this.glitchPowerUpTimer = null;
    this.destroyGlitchOverlay();
  }

  /**
   * Dense Matrix-rain overlay on top of the playfield for the duration of a
   * glitch power-up. Text objects sit at depth 200 (above scanline=100 and
   * every gameplay sprite) so they read as "the code is eating the
   * playfield". Gameplay continues beneath untouched — collisions stay
   * grid-based. Skipped under `prefers-reduced-motion` to avoid strobing for
   * sensitive users (they still get the score bonus).
   */
  private showGlitchOverlay(): void {
    this.destroyGlitchOverlay();

    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (typeof window !== 'undefined' && (window as { __TEST__?: boolean }).__TEST__) {
      return;
    }

    const w = Number(this.game.config.width);
    const h = Number(this.game.config.height);
    const { GLYPHS, DENSITY, ALPHA, FONT_SIZE, DEPTH, SPEED_MIN, SPEED_MAX } = GLITCH_RAIN;

    for (let i = 0; i < DENSITY; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(-h, h);
      const speed = Phaser.Math.Between(SPEED_MIN, SPEED_MAX);
      const char = GLYPHS[Phaser.Math.Between(0, GLYPHS.length - 1)];
      const text = this.add.text(x, y, char, {
        fontFamily: 'monospace',
        fontSize: `${FONT_SIZE}px`,
        color: MATRIX_COLORS.PRIMARY_HEX,
      });
      text.setAlpha(ALPHA).setDepth(DEPTH);
      text.setData('speed', speed);
      this.glitchOverlay.push(text);
    }
  }

  private destroyGlitchOverlay(): void {
    this.glitchOverlay.forEach(t => t.destroy());
    this.glitchOverlay = [];
  }

  private updateGlitchOverlay(delta: number): void {
    if (this.glitchOverlay.length === 0) return;
    const h = Number(this.game.config.height);
    this.glitchOverlay.forEach(text => {
      const speed = text.getData('speed') as number;
      if (typeof speed !== 'number') return;
      text.y += speed * (delta / 1000);
      if (text.y > h + 10) {
        text.y = -10;
        const glyphs = GLITCH_RAIN.GLYPHS;
        text.setText(glyphs[Math.floor(Math.random() * glyphs.length)]);
      }
    });
  }

  private destroyPowerUpTimers(): void {
    if (this.speedPowerUpTimer) {
      this.speedPowerUpTimer.destroy();
      this.speedPowerUpTimer = null;
    }
    if (this.ghostPowerUpTimer) {
      this.ghostPowerUpTimer.destroy();
      this.ghostPowerUpTimer = null;
    }
    if (this.reversePowerUpTimer) {
      this.reversePowerUpTimer.destroy();
      this.reversePowerUpTimer = null;
    }
    if (this.hyperPowerUpTimer) {
      this.hyperPowerUpTimer.destroy();
      this.hyperPowerUpTimer = null;
    }
    if (this.glitchPowerUpTimer) {
      this.glitchPowerUpTimer.destroy();
      this.glitchPowerUpTimer = null;
    }
  }

  private recalculateSpeed(): void {
    this.currentSpeed = Math.max(
      GAME_CONFIG.MIN_SPEED,
      GAME_CONFIG.INITIAL_SPEED - Math.floor(this.score / GAME_CONFIG.POINTS_PER_SPEED_UP) * GAME_CONFIG.SPEED_INCREMENT,
    );
  }

  // ─── Snake Visuals ─────────────────────────────────────

  private get spriteMode(): boolean {
    return this.game.registry.get('spriteMode') === true;
  }

  private createSnakeImage(x: number, y: number, textureKey: string): Phaser.GameObjects.Image {
    const sprite = this.add.image(x, y, textureKey);
    if (this.spriteMode) {
      sprite.setDisplaySize(GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
    }
    return sprite;
  }

  private createInitialSnake(): void {
    const head = this.snake[0];
    const { x, y } = this.gridToPixel(head.x, head.y);
    const key = this.spriteMode ? 'snake_sprite_head' : 'snake_head';
    const sprite = this.createSnakeImage(x, y, key);
    this.setHeadRotation(sprite, this.direction);
    this.snakeSprites = [sprite];
  }

  private updateSnakeSprites(): void {
    const bodyKey = this.spriteMode ? 'snake_sprite_body' : 'snake_body';
    const headKey = this.spriteMode ? 'snake_sprite_head' : 'snake_head';

    while (this.snakeSprites.length > this.snake.length) {
      const s = this.snakeSprites.pop();
      s?.destroy();
    }

    while (this.snakeSprites.length < this.snake.length) {
      this.snakeSprites.push(this.createSnakeImage(0, 0, bodyKey));
    }

    for (let i = 0; i < this.snake.length; i++) {
      const pos = this.snake[i];
      const sprite = this.snakeSprites[i];
      const { x, y } = this.gridToPixel(pos.x, pos.y);
      sprite.setPosition(x, y);

      if (i === 0) {
        sprite.setTexture(headKey);
        this.setHeadRotation(sprite, this.direction);
      } else if (i === this.snake.length - 1 && this.snake.length > 2) {
        sprite.setTexture(this.spriteMode ? 'snake_sprite_tail' : 'snake_tail');
        const prev = this.snake[i - 1];
        this.setSegmentAngle(sprite, prev, pos);
      } else {
        sprite.setTexture(bodyKey);
        const prev = this.snake[i - 1];
        this.setSegmentAngle(sprite, prev, pos);
      }
    }
  }

  private updateGhostVisuals(): void {
    if (this.ghostActive) {
      this.snakeSprites.forEach(s => {
        s.setTint(MATRIX_COLORS.CYAN);
        s.setAlpha(0.5);
      });
    }
  }

  private setHeadRotation(sprite: Phaser.GameObjects.Image, dir: Direction): void {
    switch (dir) {
      case 'right': sprite.setAngle(0); break;
      case 'down': sprite.setAngle(90); break;
      case 'left': sprite.setAngle(180); break;
      case 'up': sprite.setAngle(270); break;
    }
  }

  private setSegmentAngle(sprite: Phaser.GameObjects.Image, from: Position, to: Position): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx > 0) sprite.setAngle(0);
    else if (dx < 0) sprite.setAngle(180);
    else if (dy > 0) sprite.setAngle(90);
    else if (dy < 0) sprite.setAngle(270);
    else sprite.setAngle(0);
  }

  // ─── Effects ───────────────────────────────────────────

  private createShieldBreakEffect(pos: Position): void {
    const { x, y } = this.gridToPixel(pos.x, pos.y);
    const ring = this.add.circle(x, y, 10, MATRIX_COLORS.MAGENTA, 0.8);
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
    this.createParticleBurst(x, y, MATRIX_COLORS.MAGENTA, 8);
  }

  private createEatBurst(pos: Position): void {
    const { x, y } = this.gridToPixel(pos.x, pos.y);
    // R84.S6 — amplification. `createEatRing` fires first so the expanding
    // pulse reads under the particle burst, not over it. Particle count now
    // sourced from config so a future tuning pass touches one constant.
    this.createEatRing(x, y);
    this.createParticleBurst(x, y, MATRIX_COLORS.PRIMARY, FOOD_PICKUP_JUICE.BURST_COUNT);
    this.createChromaticAberrationFlash(x, y);
  }

  /**
   * R84.S6 — Expanding green stroked ring on every food pickup. Scale tween
   * 1 → SCALE_END with alpha fade mirrors the `createShieldBreakEffect`
   * pattern so the arcade's "pickup pulse" visual grammar stays consistent.
   * Skipped under prefers-reduced-motion — the ring expands rapidly enough
   * to read as motion even with the alpha fade (same rationale as the
   * chromatic-aberration flash gate).
   */
  private createEatRing(x: number, y: number): void {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    // Transparent fill; the visible ring is the stroke. Arc's `scale` is
    // tweenable (Phaser Shape inherits from GameObject) — `radius` is only
    // set at construction, so the scale-tween approach mirrors the existing
    // shield-break and particle-burst effects.
    const ring = this.add.circle(x, y, FOOD_PICKUP_JUICE.EAT_RING_RADIUS, 0x000000, 0);
    ring.setStrokeStyle(
      FOOD_PICKUP_JUICE.EAT_RING_STROKE_WIDTH,
      MATRIX_COLORS.PRIMARY,
    );
    ring.setAlpha(FOOD_PICKUP_JUICE.EAT_RING_INITIAL_ALPHA);
    ring.setDepth(FOOD_PICKUP_JUICE.EAT_RING_DEPTH);
    this.tweens.add({
      targets: ring,
      scale: FOOD_PICKUP_JUICE.EAT_RING_SCALE_END,
      alpha: 0,
      duration: FOOD_PICKUP_JUICE.EAT_RING_DURATION_MS,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  /**
   * Two offset ghost copies (red/cyan) tween outward and fade — gives the
   * pickup a subtle CRT-glitch feel without overwhelming the playfield.
   * R84.S6 widened the offset from ±3 px to ±CHROMATIC_OFFSET_PX (5) because
   * the prior split was barely perceptible at 640×400 scale. Skipped under
   * prefers-reduced-motion to keep the a11y contract.
   */
  private createChromaticAberrationFlash(x: number, y: number): void {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const key = this.spriteMode ? 'food_sprite' : 'food';
    const visual = this.spriteMode ? GAME_CONFIG.CELL_SIZE * 0.75 : GAME_CONFIG.CELL_SIZE;
    const offset = FOOD_PICKUP_JUICE.CHROMATIC_OFFSET_PX;

    const makeGhost = (tint: number, dx: number) => {
      const ghost = this.add.image(x, y, key).setDepth(5);
      if (this.spriteMode) ghost.setDisplaySize(visual, visual);
      ghost.setTint(tint).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ghost,
        x: x + dx,
        alpha: 0,
        scale: 1.4,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => ghost.destroy(),
      });
    };
    makeGhost(0xff3333, -offset);
    makeGhost(0x33ffff, offset);
  }

  /**
   * Static horizontal scanline overlay — every 3px, very low alpha. Adds a
   * subtle CRT scan feel on top of existing matrix rain (R83.S1).
   * Hidden under prefers-reduced-motion (the lines are static so it's mostly
   * fine, but layered visual noise can still bother sensitive users).
   */
  private createScanlineOverlay(): void {
    this.scanlineOverlay = this.add.graphics().setDepth(100);
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const w = Number(this.game.config.width);
    const h = Number(this.game.config.height);
    this.scanlineOverlay.fillStyle(0x000000, 0.18);
    for (let y = 0; y < h; y += 3) {
      this.scanlineOverlay.fillRect(0, y, w, 1);
    }
  }

  // ─── Speed-tier dread build-up (R84.S4) ───────────────

  /**
   * Second scanline layer stacked above the baseline scanline overlay. Fades
   * in proportional to `dreadIntensity` while the snake runs at top-tier
   * speed (≈ level 15+). The pattern mirrors the baseline overlay but uses a
   * higher alpha cap so the CRT feels like it's "tightening" as the run gets
   * dangerous. Hidden under prefers-reduced-motion — the extra layered
   * visual noise can bother sensitive users even though the lines are
   * static.
   */
  private createDreadScanlineOverlay(): void {
    this.dreadScanlineOverlay = this.add
      .graphics()
      .setDepth(DREAD_BUILDUP.SCANLINE_DEPTH);
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const w = Number(this.game.config.width);
    const h = Number(this.game.config.height);
    // Draw at alpha=1 here; the overlay's actual opacity is driven by
    // `setAlpha()` in `updateDreadBuildup()` so the ramp is a single
    // per-frame multiply rather than a full redraw per-tick.
    this.dreadScanlineOverlay.fillStyle(0x000000, 1);
    for (let y = 0; y < h; y += DREAD_BUILDUP.SCANLINE_STRIDE) {
      this.dreadScanlineOverlay.fillRect(0, y, w, 1);
    }
    this.dreadScanlineOverlay.setAlpha(0);
  }

  /**
   * Pure-function intensity ramp: 0 above START_SPEED, 1 at/below MAX_SPEED,
   * linear between. Kept side-effect-free so tests can pin the curve without
   * instantiating any visual/audio plumbing.
   */
  private computeDreadIntensity(currentSpeed: number): number {
    const { START_SPEED, MAX_SPEED } = DREAD_BUILDUP;
    if (currentSpeed >= START_SPEED) return 0;
    if (currentSpeed <= MAX_SPEED) return 1;
    return (START_SPEED - currentSpeed) / (START_SPEED - MAX_SPEED);
  }

  /**
   * Per-frame dread controller. Recomputes intensity from `currentSpeed`,
   * then synchronises the scanline alpha, the sub-bass drone, and the
   * micro-shake loop. Drone + shake are one-shot on activation/deactivation
   * edges so we don't restart Web Audio nodes per tick.
   */
  private updateDreadBuildup(): void {
    const intensity = this.computeDreadIntensity(this.currentSpeed);
    this.dreadIntensity = intensity;

    if (this.dreadScanlineOverlay) {
      const reduced = typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.dreadScanlineOverlay.setAlpha(
        reduced ? 0 : intensity * DREAD_BUILDUP.SCANLINE_MAX_ALPHA,
      );
    }

    const shouldBeActive = intensity > 0;
    if (shouldBeActive && !this.dreadActive) {
      this.dreadActive = true;
      this.startDreadDrone();
      this.startDreadShakeLoop();
    } else if (!shouldBeActive && this.dreadActive) {
      this.dreadActive = false;
      this.stopDreadDrone();
      this.stopDreadShakeLoop();
    }
  }

  private startDreadDrone(): void {
    this.playAmbientDrone({ volume: DREAD_BUILDUP.DRONE_VOLUME });
  }

  private stopDreadDrone(): void {
    this.stopAmbientDrone();
  }

  /**
   * Periodic camera micro-shake while dread is active. Amplitude scales with
   * the current intensity so the final tier feels distinctly more rattled
   * than the first tier past the dread threshold. Skipped entirely under
   * prefers-reduced-motion — camera shake is a common nausea trigger and
   * the scanline + drone already convey the state change.
   */
  private startDreadShakeLoop(): void {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (this.dreadShakeTimer) return;
    this.dreadShakeTimer = this.time.addEvent({
      delay: DREAD_BUILDUP.SHAKE_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!this.dreadActive) return;
        this.cameras.main.shake(
          DREAD_BUILDUP.SHAKE_DURATION_MS,
          DREAD_BUILDUP.SHAKE_MAX_INTENSITY * this.dreadIntensity,
        );
      },
    });
  }

  private stopDreadShakeLoop(): void {
    if (this.dreadShakeTimer) {
      this.dreadShakeTimer.destroy();
      this.dreadShakeTimer = null;
    }
  }

  private teardownDreadBuildup(): void {
    this.stopDreadShakeLoop();
    if (this.dreadActive) {
      this.stopDreadDrone();
      this.dreadActive = false;
    }
    this.dreadScanlineOverlay?.destroy();
    this.dreadIntensity = 0;
  }

  /**
   * Briefly explain the four power-ups after the countdown clears (R83.S1).
   * Two centred lines, fade out after ~4s. Tom: "Need to explain what power-ups are".
   */
  private showPowerUpLegend(): void {
    const cx = Number(this.game.config.width) / 2;
    const baseY = GAME_CONFIG.GRID_OFFSET_Y + GAME_CONFIG.GRID_ROWS * GAME_CONFIG.CELL_SIZE + 18;

    const headline = this.createMatrixText(
      cx, baseY,
      'POWER-UPS · SLOW · 2X · SHIELD · GHOST',
      9,
      MATRIX_COLORS.PRIMARY_HEX,
    );
    // R84.S3 — second line carries the 3 new tokens + a tighter activation
    // cue so the legend still reads in under ~90 characters per row.
    const sub = this.createMatrixText(
      cx, baseY + 14,
      'REVERSE · HYPER · GLITCH · CATCH TOKENS',
      8,
      MATRIX_COLORS.PRIMARY_HEX,
    );
    headline.setAlpha(0).setDepth(10);
    sub.setAlpha(0).setDepth(10);
    this.powerUpLegend = [headline, sub];

    this.tweens.add({
      targets: this.powerUpLegend,
      alpha: 1,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.powerUpLegend,
          alpha: 0,
          delay: 4000,
          duration: 600,
          onComplete: () => {
            this.powerUpLegend.forEach(t => t.destroy());
            this.powerUpLegend = [];
          },
        });
      },
    });
  }

  private createParticleBurst(x: number, y: number, colour: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const particle = this.add.circle(x, y, 3, colour, 0.9);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 25,
        y: y + Math.sin(angle) * 25,
        alpha: 0,
        scale: { from: 0.8, to: 0 },
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ─── Game Over ─────────────────────────────────────────

  /**
   * R84.S5 — Red-bar glitch cascade before Game Over. 5 horizontal bars evenly
   * spaced top-to-bottom, each yoyo-tweened 0 → BAR_ALPHA → 0 over BAR_STROBE_MS.
   * Delays staggered linearly so the last bar finishes exactly at
   * TOTAL_DURATION_MS, giving a clean top-to-bottom "buffer flush" read.
   * Mirrors the R83.CTRLS.12 "buffer flushed" failure juice in
   * `CtrlSWorld/NarrativeScene.spawnGlitchCascade` — shared Matrix-collapse
   * visual language across the arcade.
   *
   * Gated under prefers-reduced-motion: the GAME_OVER sound + camera
   * flash/shake + head sprite turning red already convey death; the cascade
   * is supplemental juice that strobes fast enough to warrant a11y gating
   * for sensitive users.
   */
  private playDeathCinematic(): void {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const w = Number(this.game.config.width);
    const h = Number(this.game.config.height);
    const {
      BAR_COUNT,
      TOTAL_DURATION_MS,
      BAR_STROBE_MS,
      BAR_ALPHA,
      BAR_COLOR,
      BAR_HEIGHT,
      DEPTH,
      MARGIN_Y,
    } = DEATH_CINEMATIC;

    // Even vertical spacing + linear stagger → last bar ends at exactly
    // TOTAL_DURATION_MS. With BAR_COUNT=5, BAR_STROBE_MS=120, TOTAL=300:
    //   delays = [0, 45, 90, 135, 180]; last bar ends 180+120 = 300.
    const yStep = BAR_COUNT > 1 ? (h - MARGIN_Y * 2) / (BAR_COUNT - 1) : 0;
    const delayStep = BAR_COUNT > 1
      ? (TOTAL_DURATION_MS - BAR_STROBE_MS) / (BAR_COUNT - 1)
      : 0;
    const halfStrobe = BAR_STROBE_MS / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      const y = MARGIN_Y + i * yStep;
      const bar = this.add.rectangle(0, y, w, BAR_HEIGHT, BAR_COLOR);
      bar.setOrigin(0, 0.5);
      bar.setAlpha(0);
      bar.setDepth(DEPTH);
      this.deathCinematicBars.push(bar);

      this.tweens.add({
        targets: bar,
        alpha: { from: 0, to: BAR_ALPHA },
        yoyo: true,
        duration: halfStrobe,
        delay: i * delayStep,
        ease: 'Power1',
        onComplete: () => {
          const idx = this.deathCinematicBars.indexOf(bar);
          if (idx !== -1) this.deathCinematicBars.splice(idx, 1);
          bar.destroy();
        },
      });
    }
  }

  private destroyDeathCinematicBars(): void {
    this.deathCinematicBars.forEach(b => b.destroy());
    this.deathCinematicBars = [];
  }

  private handleGameOver(): void {
    this.isGameOver = true;
    this.destroyMoveTimer();

    if (this.gameTimer >= 300_000) {
      this.tryUnlockAchievement(ACHIEVEMENTS.SURVIVOR);
    }
    if (this.score >= 100 && this.getLevel() >= 10) {
      this.tryUnlockAchievement(ACHIEVEMENTS.SPEED_DEMON);
    }

    this.playSound(SOUND_KEYS.GAME_OVER);
    this.playSound(SOUND_KEYS.POWER_DOWN);
    this.cameras.main.shake(180, 0.012);
    this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.3);

    if (this.snakeSprites.length > 0) {
      const headSprite = this.snakeSprites[0];
      const deadKey = this.spriteMode ? 'snake_sprite_dead' : 'snake_head';
      headSprite.setTexture(deadKey);
      if (this.spriteMode) {
        headSprite.setDisplaySize(GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
      }
      headSprite.setTint(MATRIX_COLORS.RED);
    }

    // R84.S5 — 300 ms red-bar glitch cascade bridging death-frame → Game Over.
    // Fires inside the 600 ms delayedCall window so the dead-head freeze is
    // still visible underneath the strobe before the panel takes over.
    this.playDeathCinematic();

    this.time.delayedCall(600, () => {
      this.gameOver(this.score, undefined, this.highScore, [
        { label: 'Length', value: this.snake.length },
        { label: 'Food', value: this.foodEaten },
        { label: 'Power-ups', value: this.powerUpsCollected },
        { label: 'Best Streak', value: this.consecutiveFood },
      ], this.snake.length, this.getGameDuration());
    });
  }

  // ─── Achievements ──────────────────────────────────────

  private checkAchievements(): void {
    if (this.score >= 100) this.tryUnlockAchievement(ACHIEVEMENTS.SCORE_100);
    if (this.score >= 500) this.tryUnlockAchievement(ACHIEVEMENTS.SCORE_500);
    if (this.consecutiveFood >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.COMBO_10);
    if (this.powerUpsCollected >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.POWER_MASTER);
  }

  private tryUnlockAchievement(id: string): void {
    if (this.achievementsUnlocked.has(id)) return;
    this.achievementsUnlocked.add(id);
    this.unlockAchievement(id);
  }

  // ─── Utility ───────────────────────────────────────────

  private gridToPixel(gx: number, gy: number): { x: number; y: number } {
    return {
      x: GAME_CONFIG.GRID_OFFSET_X + gx * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
      y: GAME_CONFIG.GRID_OFFSET_Y + gy * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
    };
  }

  private getRandomEmptyCell(): Position {
    const occupied = new Set<string>();
    for (const s of this.snake) occupied.add(`${s.x},${s.y}`);
    occupied.add(`${this.food.x},${this.food.y}`);
    if (this.fieldPowerUp) {
      occupied.add(`${this.fieldPowerUp.position.x},${this.fieldPowerUp.position.y}`);
    }

    const empty: Position[] = [];
    for (let x = 0; x < GAME_CONFIG.GRID_COLS; x++) {
      for (let y = 0; y < GAME_CONFIG.GRID_ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }

    if (empty.length === 0) return { x: 0, y: 0 };
    return empty[Math.floor(Math.random() * empty.length)];
  }

  private getTestState(): Record<string, unknown> {
    return {
      snake: [...this.snake],
      direction: this.direction,
      food: { ...this.food },
      score: this.score,
      highScore: this.highScore,
      foodEaten: this.foodEaten,
      consecutiveFood: this.consecutiveFood,
      powerUpsCollected: this.powerUpsCollected,
      currentSpeed: this.currentSpeed,
      level: this.getLevel(),
      isGameOver: this.isGameOver,
      ghostActive: this.ghostActive,
      shieldActive: this.shieldActive,
      speedSlowed: this.speedSlowed,
      doublePointsRemaining: this.doublePointsRemaining,
      snakeLength: this.snake.length,
      fieldPowerUp: this.fieldPowerUp ? { ...this.fieldPowerUp } : null,
      gameTimer: this.gameTimer,
      countdownValue: this.countdownValue,
      isBonusFood: this.isBonusFood,
      reverseActive: this.reverseActive,
      hyperActive: this.hyperActive,
      glitchActive: this.glitchActive,
      dreadActive: this.dreadActive,
      dreadIntensity: this.dreadIntensity,
    };
  }
}
