import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  POWERUP_DEFS,
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
  private powerUpSprite: Phaser.GameObjects.Image | null = null;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private gridBorder!: Phaser.GameObjects.Graphics;
  private matrixRainGroup!: Phaser.GameObjects.Group;

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

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    this.createMatrixBackground();
    this.matrixRainGroup = this.addMatrixRain(10);
    this.resetState();
    this.drawGrid();
    this.drawGridBorder();
    this.createHUD();
    this.createFoodSprite();
    this.createInitialSnake();
    this.setupInput();
    this.setupCommonInputs();
    this.startMoveTimer();
    this.playSound('menu');
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);
    this.gameTimer += delta;
    this.handleInput();
    this.updateGhostVisuals();
    this.exposeTestState(this.getTestState());
  }

  shutdown(): void {
    this.destroyMoveTimer();
    this.destroyFieldPowerUp();
    this.destroyPowerUpTimers();
    this.snakeSprites.forEach(s => s.destroy());
    this.snakeSprites = [];
    this.powerUpIndicators.forEach(t => t.destroy());
    this.powerUpIndicators.clear();
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
    this.achievementsUnlocked = new Set();
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
    this.gridBorder.lineStyle(2, MATRIX_COLORS.PRIMARY, 0.6);
    this.gridBorder.strokeRect(
      GRID_OFFSET_X - 1,
      GRID_OFFSET_Y - 1,
      GRID_COLS * CELL_SIZE + 2,
      GRID_ROWS * CELL_SIZE + 2,
    );
  }

  // ─── HUD ───────────────────────────────────────────────

  private createHUD(): void {
    const leftX = 100;
    const rightX = 700;

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

    const rightX = 700;
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
  }

  private getLevel(): number {
    return Math.floor(this.score / GAME_CONFIG.POINTS_PER_SPEED_UP) + 1;
  }

  // ─── Input ─────────────────────────────────────────────

  private setupInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupInput());
      return;
    }

    this.arrowKeys = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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
      this.playSound('hit');
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
    this.foodSprite = this.add.image(x, y, 'food');
    this.tweens.add({
      targets: this.foodSprite,
      scale: { from: 0.9, to: 1.1 },
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  private spawnFood(): void {
    this.food = this.getRandomEmptyCell();
    const { x, y } = this.gridToPixel(this.food.x, this.food.y);
    this.foodSprite.setPosition(x, y);
  }

  private eatFood(): void {
    const prevFoodEaten = this.foodEaten;
    this.foodEaten++;
    this.consecutiveFood++;

    let points = GAME_CONFIG.POINTS_PER_FOOD;
    if (this.doublePointsRemaining > 0) {
      points = GAME_CONFIG.POINTS_PER_FOOD_DOUBLE;
      this.doublePointsRemaining--;
    }
    this.score += points;

    this.playSound('score');
    this.createScorePopup(this.food, points);

    if (prevFoodEaten === 0) {
      this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_APPLE);
    }

    if (this.score % GAME_CONFIG.POINTS_PER_SPEED_UP === 0 && !this.speedSlowed) {
      const newSpeed = Math.max(GAME_CONFIG.MIN_SPEED, this.currentSpeed - GAME_CONFIG.SPEED_INCREMENT);
      if (newSpeed !== this.currentSpeed) {
        this.currentSpeed = newSpeed;
        this.restartMoveTimer();
        this.playSound('levelUp');
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.reportScore(this.score, this.highScore);

    this.spawnFood();

    if (!this.fieldPowerUp && Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
      this.spawnFieldPowerUp();
    }
  }

  private createScorePopup(pos: Position, points: number): void {
    const { x, y } = this.gridToPixel(pos.x, pos.y);
    const text = this.createMatrixText(x, y, `+${points}`, 10, MATRIX_COLORS.PRIMARY_HEX);
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
    const types: PowerUpType[] = ['speed', 'double', 'shield', 'ghost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const position = this.getRandomEmptyCell();

    this.fieldPowerUp = { type, position };

    const { x, y } = this.gridToPixel(position.x, position.y);
    this.powerUpSprite = this.add.image(x, y, `powerup_${type}`);
    this.tweens.add({
      targets: this.powerUpSprite,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
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
    this.playSound('powerup');
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

  private destroyPowerUpTimers(): void {
    if (this.speedPowerUpTimer) {
      this.speedPowerUpTimer.destroy();
      this.speedPowerUpTimer = null;
    }
    if (this.ghostPowerUpTimer) {
      this.ghostPowerUpTimer.destroy();
      this.ghostPowerUpTimer = null;
    }
  }

  private recalculateSpeed(): void {
    this.currentSpeed = Math.max(
      GAME_CONFIG.MIN_SPEED,
      GAME_CONFIG.INITIAL_SPEED - Math.floor(this.score / GAME_CONFIG.POINTS_PER_SPEED_UP) * GAME_CONFIG.SPEED_INCREMENT,
    );
  }

  // ─── Snake Visuals ─────────────────────────────────────

  private createInitialSnake(): void {
    const head = this.snake[0];
    const { x, y } = this.gridToPixel(head.x, head.y);
    const sprite = this.add.image(x, y, 'snake_head');
    this.setHeadRotation(sprite, this.direction);
    this.snakeSprites = [sprite];
  }

  private updateSnakeSprites(): void {
    while (this.snakeSprites.length > this.snake.length) {
      const s = this.snakeSprites.pop();
      s?.destroy();
    }

    while (this.snakeSprites.length < this.snake.length) {
      this.snakeSprites.push(this.add.image(0, 0, 'snake_body'));
    }

    for (let i = 0; i < this.snake.length; i++) {
      const pos = this.snake[i];
      const sprite = this.snakeSprites[i];
      const { x, y } = this.gridToPixel(pos.x, pos.y);
      sprite.setPosition(x, y);

      if (i === 0) {
        sprite.setTexture('snake_head');
        this.setHeadRotation(sprite, this.direction);
      } else if (i === this.snake.length - 1 && this.snake.length > 2) {
        sprite.setTexture('snake_tail');
        sprite.setAngle(0);
      } else {
        sprite.setTexture('snake_body');
        sprite.setAngle(0);
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
  }

  // ─── Game Over ─────────────────────────────────────────

  private handleGameOver(): void {
    this.isGameOver = true;
    this.destroyMoveTimer();

    if (this.gameTimer >= 300_000) {
      this.tryUnlockAchievement(ACHIEVEMENTS.SURVIVOR);
    }
    if (this.score >= 100 && this.getLevel() >= 10) {
      this.tryUnlockAchievement(ACHIEVEMENTS.SPEED_DEMON);
    }

    this.playSound('hit');
    this.cameras.main.shake(200, 0.01);

    this.time.delayedCall(600, () => {
      const reason = `Length: ${this.snake.length} | Food: ${this.foodEaten}`;
      this.gameOver(this.score, reason, this.highScore);
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
    };
  }
}
