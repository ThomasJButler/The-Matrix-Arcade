import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS, REGISTRY_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG as C,
  ACHIEVEMENTS,
  SCORE_TABLE,
  TETROMINO_DEFS,
  TETROMINO_TYPES,
  WALL_KICKS_CW,
  WALL_KICKS_CCW,
  type TetrominoType,
  type CellData,
  type PieceState,
  type ParticleData,
} from '../config';

export class MetrisGameScene extends BaseScene {
  private grid: (CellData | null)[][] = [];
  private currentPiece: PieceState | null = null;
  private nextPieceType: TetrominoType = 'T';
  private holdPieceType: TetrominoType | null = null;
  private canHold = true;
  private pieceBag: TetrominoType[] = [];

  private score = 0;
  private highScore = 0;
  private level = 1;
  private lines = 0;
  private combo = 0;
  private tSpins = 0;
  private maxFilledRows = 0;
  private lastRotation = false;
  private softDropActive = false;
  private isGameOver = false;

  private bulletTimeActive = false;
  private bulletTimeMeter = 0;
  private bulletTimeTimer = 0;
  private bulletTimeCount = 0;

  private dropTimer: Phaser.Time.TimerEvent | null = null;
  private particles: ParticleData[] = [];
  private glowMap: Map<string, number> = new Map();
  private sessionStartTime = 0;
  private achievementsUnlocked = new Set<string>();

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private holdGraphics!: Phaser.GameObjects.Graphics;
  private nextGraphics!: Phaser.GameObjects.Graphics;
  private meterGraphics!: Phaser.GameObjects.Graphics;
  private cellImages: Phaser.GameObjects.Image[][] = [];
  private activeImages: Phaser.GameObjects.Image[] = [];
  private ghostImages: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private linesText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private meterLabel!: Phaser.GameObjects.Text;
  private bulletTimeTimerText!: Phaser.GameObjects.Text;
  private matrixRainGroup?: Phaser.GameObjects.Group;

  private dasState = { left: 0, right: 0 };
  private dasMovedAt = { left: 0, right: 0 };

  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private cKey?: Phaser.Input.Keyboard.Key;
  private bKey?: Phaser.Input.Keyboard.Key;
  private xKey?: Phaser.Input.Keyboard.Key;
  private zKey?: Phaser.Input.Keyboard.Key;
  private shiftKey?: Phaser.Input.Keyboard.Key;
  private aKey?: Phaser.Input.Keyboard.Key;
  private dKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;
  private wKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();
    this.matrixRainGroup = this.addMatrixRain(8);
    this.resetState();
    this.createGraphics();
    this.createHUD();
    this.setupInput();
    this.setupCommonInputs();
    this.startDropTimer();
    this.playSound(SOUND_KEYS.MENU);
    this.playBackgroundMusic('/assets/audio/music/brothers-and-sisters.mp3');
    this.startCountdown(5, () => {});
  }

  private resetState(): void {
    this.grid = this.createEmptyGrid();
    this.pieceBag = [];
    this.nextPieceType = this.pullFromBag();
    this.currentPiece = this.spawnPiece(this.pullFromBag());
    this.holdPieceType = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = 0;
    this.tSpins = 0;
    this.maxFilledRows = 0;
    this.lastRotation = false;
    this.softDropActive = false;
    this.isGameOver = false;
    this.bulletTimeActive = false;
    this.bulletTimeMeter = 0;
    this.bulletTimeTimer = 0;
    this.bulletTimeCount = 0;
    this.particles = [];
    this.glowMap.clear();
    this.sessionStartTime = this.time.now;
    this.achievementsUnlocked.clear();
    this.dasState = { left: 0, right: 0 };
    this.dasMovedAt = { left: 0, right: 0 };

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.metris?.highScore ?? 0;
      this.bulletTimeCount = (saveData?.games?.metris?.preferences?.bulletTimeCount as number) ?? 0;
    }
  }

  private createEmptyGrid(): (CellData | null)[][] {
    return Array.from({ length: C.ROWS }, () => Array(C.COLS).fill(null));
  }

  private createGraphics(): void {
    this.gridGraphics = this.add.graphics().setDepth(0);
    this.overlayGraphics = this.add.graphics().setDepth(10);
    this.holdGraphics = this.add.graphics();
    this.nextGraphics = this.add.graphics();
    this.meterGraphics = this.add.graphics();

    // Panel sprite backdrops for Hold and Next preview areas
    if (this.textures?.exists('panel_tall')) {
      this.add.image(C.HOLD_X, C.HOLD_Y + 40)
        .setTexture('panel_tall')
        .setDisplaySize(80, 80)
        .setAlpha(0.3)
        .setDepth(0);
      this.add.image(C.NEXT_X, C.NEXT_Y + 120)
        .setTexture('panel_tall')
        .setDisplaySize(80, 240)
        .setAlpha(0.3)
        .setDepth(0);
    }

    this.cellImages = [];
    for (let r = 0; r < C.ROWS; r++) {
      this.cellImages[r] = [];
      for (let c = 0; c < C.COLS; c++) {
        this.cellImages[r][c] = this.add.image(
          C.GRID_X + c * C.CELL_SIZE + C.CELL_SIZE / 2,
          C.GRID_Y + r * C.CELL_SIZE + C.CELL_SIZE / 2,
          'tile_s',
        ).setDisplaySize(C.CELL_SIZE - 2, C.CELL_SIZE - 2).setDepth(2).setVisible(false);
      }
    }

    this.ghostImages = [];
    for (let i = 0; i < 4; i++) {
      this.ghostImages.push(
        this.add.image(0, 0, 'tile_s')
          .setDisplaySize(C.CELL_SIZE - 2, C.CELL_SIZE - 2)
          .setDepth(1)
          .setAlpha(0.25)
          .setVisible(false),
      );
    }

    this.activeImages = [];
    for (let i = 0; i < 4; i++) {
      this.activeImages.push(
        this.add.image(0, 0, 'tile_s')
          .setDisplaySize(C.CELL_SIZE - 2, C.CELL_SIZE - 2)
          .setDepth(3)
          .setVisible(false),
      );
    }
  }

  private createHUD(): void {
    const font = { fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#00ff00' };
    const valFont = { ...font, fontSize: '10px' };

    this.add.text(C.HOLD_X, C.HOLD_Y, 'HOLD [C]', font).setOrigin(0.5, 0);
    this.add.text(C.HOLD_X, 160, 'SCORE', font).setOrigin(0.5, 0);
    this.scoreText = this.add.text(C.HOLD_X, 175, '0', valFont).setOrigin(0.5, 0);
    this.add.text(C.HOLD_X, 200, 'LEVEL', font).setOrigin(0.5, 0);
    this.levelText = this.add.text(C.HOLD_X, 215, '1', valFont).setOrigin(0.5, 0);
    this.add.text(C.HOLD_X, 240, 'LINES', font).setOrigin(0.5, 0);
    this.linesText = this.add.text(C.HOLD_X, 255, '0', valFont).setOrigin(0.5, 0);
    this.add.text(C.HOLD_X, 280, 'COMBO', font).setOrigin(0.5, 0);
    this.comboText = this.add.text(C.HOLD_X, 295, '0', valFont).setOrigin(0.5, 0);

    this.meterLabel = this.add.text(C.HOLD_X, 330, 'BULLET TIME [B]', font).setOrigin(0.5, 0);
    this.bulletTimeTimerText = this.add.text(C.HOLD_X, 370, '', { ...font, color: '#00ffff' }).setOrigin(0.5, 0);

    this.add.text(C.NEXT_X, C.NEXT_Y, 'NEXT', font).setOrigin(0.5, 0);
    this.add.text(C.NEXT_X, 140, 'HIGH SCORE', font).setOrigin(0.5, 0);
    this.highScoreText = this.add.text(C.NEXT_X, 158, String(this.highScore), { ...font, fontSize: '10px', color: '#ffff00' }).setOrigin(0.5, 0);

    const ctrlFont = { ...font, fontSize: '7px', color: '#005500' };
    const cx = C.NEXT_X;
    this.add.text(cx, 200, '←→  MOVE', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 215, '↑/X  ROTATE CW', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 230, 'Z    ROTATE CCW', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 245, '↓    SOFT DROP', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 260, 'SPACE HARD DROP', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 275, 'C    HOLD', ctrlFont).setOrigin(0.5, 0);
    this.add.text(cx, 290, 'B    BULLET TIME', ctrlFont).setOrigin(0.5, 0);
  }

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    });
  }

  // --- Bag Randomiser ---

  private refillBag(): void {
    const bag = [...TETROMINO_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.pieceBag = bag;
  }

  private pullFromBag(): TetrominoType {
    if (this.pieceBag.length === 0) this.refillBag();
    return this.pieceBag.pop()!;
  }

  private spawnPiece(type: TetrominoType): PieceState {
    const def = TETROMINO_DEFS[type];
    const shape = def.shape.map(row => [...row]);
    return {
      type,
      shape,
      x: Math.floor((C.COLS - shape[0].length) / 2),
      y: 0,
      rotation: 0,
    };
  }

  // --- Drop Timer ---

  private getEffectiveDropSpeed(): number {
    let speed = Math.max(C.MIN_DROP_SPEED, C.INITIAL_DROP_SPEED - (this.level - 1) * C.SPEED_DECREASE);
    if (this.softDropActive) speed = C.SOFT_DROP_SPEED;
    if (this.bulletTimeActive) speed = Math.round(speed / C.BULLET_TIME_SLOWDOWN);
    return speed;
  }

  private startDropTimer(): void {
    this.destroyDropTimer();
    this.dropTimer = this.time.addEvent({
      delay: this.getEffectiveDropSpeed(),
      callback: () => this.dropTick(),
      loop: true,
    });
  }

  private destroyDropTimer(): void {
    if (this.dropTimer) {
      this.dropTimer.destroy();
      this.dropTimer = null;
    }
  }

  private restartDropTimer(): void {
    this.startDropTimer();
  }

  // --- Core Game Logic ---

  private dropTick(): void {
    if (!this.currentPiece || this.isGameOver) return;

    if (!this.checkCollision(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y++;
    } else {
      this.lockCurrentPiece();
    }
  }

  private lockCurrentPiece(): void {
    if (!this.currentPiece) return;

    const piece = this.currentPiece;
    const def = TETROMINO_DEFS[piece.type];

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const gy = piece.y + r;
          const gx = piece.x + c;
          if (gy >= 0 && gy < C.ROWS && gx >= 0 && gx < C.COLS) {
            this.grid[gy][gx] = { type: piece.type, color: def.color, glow: 1 };
            this.glowMap.set(`${gy}-${gx}`, 1);
          }
        }
      }
    }

    this.playSound(SOUND_KEYS.HIT);

    const wasTSpin = this.lastRotation && piece.type === 'T';
    const linesCleared = this.clearFullLines();
    this.lastRotation = false;

    if (wasTSpin && linesCleared > 0) {
      this.tSpins++;
      if (this.tSpins >= 5) {
        this.tryUnlockAchievement(ACHIEVEMENTS.T_SPIN_MASTER);
      }
    }

    this.handleScoring(linesCleared);
    this.trackFilledRows();
    this.canHold = true;
    this.spawnNextPiece();
  }

  private clearFullLines(): number {
    const linesToClear: number[] = [];
    for (let r = 0; r < C.ROWS; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        linesToClear.push(r);
      }
    }

    if (linesToClear.length === 0) return 0;

    for (const row of linesToClear) {
      for (let c = 0; c < C.COLS; c++) {
        const px = C.GRID_X + c * C.CELL_SIZE + C.CELL_SIZE / 2;
        const py = C.GRID_Y + row * C.CELL_SIZE + C.CELL_SIZE / 2;
        const cell = this.grid[row][c];
        const color = cell?.color ?? MATRIX_COLORS.PRIMARY;
        for (let i = 0; i < C.PARTICLE_COUNT_PER_CELL; i++) {
          this.particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * (C.PARTICLE_SPEED_MIN + Math.random() * (C.PARTICLE_SPEED_MAX - C.PARTICLE_SPEED_MIN)),
            vy: -(Math.random() * C.PARTICLE_SPEED_MAX),
            color,
            life: 1,
            size: 2 + Math.random() * 3,
          });
        }
      }
    }

    const newGrid = this.grid.filter((_, i) => !linesToClear.includes(i));
    while (newGrid.length < C.ROWS) {
      newGrid.unshift(Array(C.COLS).fill(null));
    }
    this.grid = newGrid;

    const newGlowMap = new Map<string, number>();
    for (let r = 0; r < C.ROWS; r++) {
      for (let c = 0; c < C.COLS; c++) {
        if (this.grid[r][c]) {
          const key = `${r}-${c}`;
          const oldGlow = this.glowMap.get(key);
          if (oldGlow !== undefined) newGlowMap.set(key, oldGlow);
        }
      }
    }
    this.glowMap = newGlowMap;

    return linesToClear.length;
  }

  private handleScoring(linesCleared: number): void {
    if (linesCleared > 0) {
      this.combo++;
      const points = (SCORE_TABLE[linesCleared] ?? 0) * this.level * Math.max(1, this.combo);
      this.score += points;
      this.lines += linesCleared;

      const newLevel = Math.floor(this.lines / C.LINES_PER_LEVEL) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.playSound(SOUND_KEYS.LEVEL_UP);
        this.restartDropTimer();
      }

      this.bulletTimeMeter = Math.min(
        C.BULLET_TIME_MAX_METER,
        this.bulletTimeMeter + linesCleared * C.BULLET_TIME_METER_PER_LINE,
      );

      if (!this.bulletTimeActive && this.bulletTimeMeter >= C.BULLET_TIME_MAX_METER) {
        this.activateBulletTime();
      }

      if (linesCleared === 4) {
        this.playSound(SOUND_KEYS.ACHIEVEMENT_UNLOCK);
        this.playSound(SOUND_KEYS.COMBO);
      } else {
        this.playSound(SOUND_KEYS.SCORE);
      }

      this.checkScoringAchievements(linesCleared);
    } else {
      this.combo = 0;
    }
  }

  private checkScoringAchievements(linesCleared: number): void {
    if (linesCleared > 0 && this.lines - linesCleared === 0) {
      this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_LINE);
    }
    if (linesCleared === 4) {
      this.tryUnlockAchievement(ACHIEVEMENTS.TETRIS);
    }
    if (this.level >= 10) {
      this.tryUnlockAchievement(ACHIEVEMENTS.LEVEL_10);
    }
    if (this.score >= 10000) {
      this.tryUnlockAchievement(ACHIEVEMENTS.HIGH_ROLLER);
    }
    if (this.lines >= 100) {
      this.tryUnlockAchievement(ACHIEVEMENTS.LINE_CLEARER);
    }
    if (this.combo >= 5) {
      this.tryUnlockAchievement(ACHIEVEMENTS.COMBO_KING);
    }
    if (this.level >= 20) {
      this.tryUnlockAchievement(ACHIEVEMENTS.IMMORTAL);
    }
  }

  private trackFilledRows(): void {
    let filledRows = 0;
    for (let r = 0; r < C.ROWS; r++) {
      if (this.grid[r].some(cell => cell !== null)) filledRows++;
    }
    if (filledRows > this.maxFilledRows) {
      this.maxFilledRows = filledRows;
      if (this.maxFilledRows >= 18) {
        this.tryUnlockAchievement(ACHIEVEMENTS.ARCHITECT);
      }
    }
  }

  private spawnNextPiece(): void {
    const next = this.spawnPiece(this.nextPieceType);
    this.nextPieceType = this.pullFromBag();

    if (this.checkCollision(next.shape, next.x, next.y)) {
      this.handleGameOver();
      return;
    }

    this.currentPiece = next;
  }

  private handleGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.currentPiece = null;
    this.destroyDropTimer();

    const sessionSeconds = Math.floor((this.time.now - this.sessionStartTime) / 1000);
    if (sessionSeconds >= 600) {
      this.tryUnlockAchievement(ACHIEVEMENTS.MARATHON_RUNNER);
    }
    if (this.level >= 5) {
      this.tryUnlockAchievement(ACHIEVEMENTS.PERFECT_START);
    }

    this.highScore = Math.max(this.highScore, this.score);

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      const prev = saveData?.games?.metris?.stats ?? {};
      saveSystem.updateGameSave('metris', {
        highScore: this.highScore,
        level: this.level,
        stats: {
          gamesPlayed: ((prev.gamesPlayed as number) ?? 0) + 1,
          totalScore: ((prev.totalScore as number) ?? 0) + this.score,
          bestCombo: Math.max((prev.bestCombo as number) ?? 0, this.combo),
          longestSurvival: Math.max((prev.longestSurvival as number) ?? 0, sessionSeconds),
        },
      });
    }

    this.cameras.main.shake(300, 0.01);
    this.playSound(SOUND_KEYS.POWER_DOWN);
    this.time.delayedCall(600, () => {
      this.gameOver(this.score, 'Board filled', this.highScore, [
        { label: 'Level', value: this.level },
        { label: 'Lines', value: this.lines },
        { label: 'T-Spins', value: this.tSpins },
        { label: 'Bullet Time', value: this.bulletTimeCount },
      ], this.level, this.getGameDuration());
    });
  }

  // --- Movement & Rotation ---

  private movePiece(dx: number, _dy: number): boolean {
    if (!this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece.shape, this.currentPiece.x + dx, this.currentPiece.y + _dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += _dy;
      this.lastRotation = false;
      return true;
    }
    return false;
  }

  private rotatePieceCW(): void {
    this.rotatePieceDir(1);
  }

  private rotatePieceCCW(): void {
    this.rotatePieceDir(-1);
  }

  private rotatePieceDir(direction: 1 | -1): void {
    if (!this.currentPiece) return;
    if (this.currentPiece.type === 'O') return;

    const newShape = direction > 0
      ? this.rotateMatrixCW(this.currentPiece.shape)
      : this.rotateMatrixCCW(this.currentPiece.shape);

    const fromRotation = this.currentPiece.rotation;
    const kicks = direction > 0 ? WALL_KICKS_CW[fromRotation] : WALL_KICKS_CCW[fromRotation];

    for (const [dx, dy] of kicks) {
      if (!this.checkCollision(newShape, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
        this.currentPiece.shape = newShape;
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        this.currentPiece.rotation = ((fromRotation + direction + 4) % 4);
        this.lastRotation = true;
        this.playSound(SOUND_KEYS.SCORE);
        return;
      }
    }
  }

  private hardDrop(): void {
    if (!this.currentPiece) return;
    const ghostY = this.getGhostY();
    const distance = ghostY - this.currentPiece.y;
    if (distance <= 0) {
      this.lockCurrentPiece();
      return;
    }
    this.score += distance * C.HARD_DROP_POINTS_PER_CELL;
    this.currentPiece.y = ghostY;
    this.playSound(SOUND_KEYS.HIT);
    this.playSound(SOUND_KEYS.KUNG_FU_HIT);
    this.lockCurrentPiece();
  }

  private holdCurrentPiece(): void {
    if (!this.currentPiece || !this.canHold) return;

    const currentType = this.currentPiece.type;

    if (this.holdPieceType) {
      this.currentPiece = this.spawnPiece(this.holdPieceType);
    } else {
      this.currentPiece = this.spawnPiece(this.nextPieceType);
      this.nextPieceType = this.pullFromBag();
    }

    this.holdPieceType = currentType;
    this.canHold = false;
    this.lastRotation = false;
    this.playSound(SOUND_KEYS.POWERUP);
  }

  // --- Bullet Time ---

  private activateBulletTime(): void {
    this.bulletTimeActive = true;
    this.bulletTimeMeter = 0;
    this.bulletTimeTimer = C.BULLET_TIME_DURATION;
    this.bulletTimeCount++;

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      const prefs = saveData?.games?.metris?.preferences ?? {};
      saveSystem.updateGameSave('metris', {
        preferences: { ...prefs, bulletTimeCount: this.bulletTimeCount },
      });
    }

    if (this.bulletTimeCount >= 10) {
      this.tryUnlockAchievement(ACHIEVEMENTS.NEOS_APPRENTICE);
    }

    this.playSound(SOUND_KEYS.POWERUP_BULLET_TIME);
    this.restartDropTimer();
  }

  private deactivateBulletTime(): void {
    this.bulletTimeActive = false;
    this.bulletTimeTimer = 0;
    this.playSound(SOUND_KEYS.SCORE);
    this.restartDropTimer();
  }

  private tryManualBulletTime(): void {
    if (this.bulletTimeActive) return;
    if (this.bulletTimeMeter < C.BULLET_TIME_MAX_METER) return;
    this.activateBulletTime();
  }

  // --- Collision & Utility ---

  private checkCollision(shape: number[][], px: number, py: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gx = px + c;
          const gy = py + r;
          if (gx < 0 || gx >= C.COLS || gy >= C.ROWS) return true;
          if (gy >= 0 && this.grid[gy][gx] !== null) return true;
        }
      }
    }
    return false;
  }

  private getGhostY(): number {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.shape, this.currentPiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  private rotateMatrixCW(matrix: number[][]): number[][] {
    const n = matrix.length;
    const rotated = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        rotated[x][n - 1 - y] = matrix[y][x];
      }
    }
    return rotated;
  }

  private rotateMatrixCCW(matrix: number[][]): number[][] {
    const n = matrix.length;
    const rotated = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        rotated[n - 1 - x][y] = matrix[y][x];
      }
    }
    return rotated;
  }

  private tryUnlockAchievement(id: string): void {
    if (this.achievementsUnlocked.has(id)) return;
    this.achievementsUnlocked.add(id);
    this.unlockAchievement(id);
  }

  // --- Input Handling ---

  private handleInput(): void {
    if (this.isGameOver || this.isPaused) return;

    const now = this.time.now;

    const leftDown = this.leftKey?.isDown || this.aKey?.isDown;
    const rightDown = this.rightKey?.isDown || this.dKey?.isDown;
    const downDown = this.downKey?.isDown || this.sKey?.isDown;

    if (leftDown) {
      if (this.dasState.left === 0) {
        this.movePiece(-1, 0);
        this.dasState.left = now;
        this.dasMovedAt.left = now;
      } else {
        const heldFor = now - this.dasState.left;
        if (heldFor >= C.DAS_DELAY && now - this.dasMovedAt.left >= C.DAS_RATE) {
          this.movePiece(-1, 0);
          this.dasMovedAt.left = now;
        }
      }
    } else {
      this.dasState.left = 0;
    }

    if (rightDown) {
      if (this.dasState.right === 0) {
        this.movePiece(1, 0);
        this.dasState.right = now;
        this.dasMovedAt.right = now;
      } else {
        const heldFor = now - this.dasState.right;
        if (heldFor >= C.DAS_DELAY && now - this.dasMovedAt.right >= C.DAS_RATE) {
          this.movePiece(1, 0);
          this.dasMovedAt.right = now;
        }
      }
    } else {
      this.dasState.right = 0;
    }

    const wasSoftDrop = this.softDropActive;
    this.softDropActive = !!downDown;
    if (this.softDropActive !== wasSoftDrop) {
      this.restartDropTimer();
    }

    if (Phaser.Input.Keyboard.JustDown(this.upKey!) || Phaser.Input.Keyboard.JustDown(this.wKey!) || Phaser.Input.Keyboard.JustDown(this.xKey!)) {
      this.rotatePieceCW();
    }
    if (Phaser.Input.Keyboard.JustDown(this.zKey!) || Phaser.Input.Keyboard.JustDown(this.shiftKey!)) {
      this.rotatePieceCCW();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey!)) {
      this.hardDrop();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cKey!)) {
      this.holdCurrentPiece();
    }
    if (this.bKey && Phaser.Input.Keyboard.JustDown(this.bKey)) {
      this.tryManualBulletTime();
    }
  }

  // --- Rendering ---

  private drawPlayfield(): void {
    const g = this.gridGraphics;
    g.clear();

    g.fillStyle(0x001100, 1);
    g.fillRect(C.GRID_X, C.GRID_Y, C.COLS * C.CELL_SIZE, C.ROWS * C.CELL_SIZE);

    if (this.bulletTimeActive) {
      g.fillStyle(0x00ff00, 0.03);
      g.fillRect(C.GRID_X, C.GRID_Y, C.COLS * C.CELL_SIZE, C.ROWS * C.CELL_SIZE);
    }

    for (let r = 0; r < C.ROWS; r++) {
      for (let c = 0; c < C.COLS; c++) {
        const cell = this.grid[r][c];
        const img = this.cellImages[r]?.[c];
        if (!img) continue;
        if (cell) {
          img.setTexture(`tile_${cell.type.toLowerCase()}`);
          img.setVisible(true);
        } else {
          img.setVisible(false);
        }
      }
    }

    let ghostIdx = 0;
    if (this.currentPiece) {
      const ghostY = this.getGhostY();
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c] && ghostY + r >= 0 && ghostIdx < this.ghostImages.length) {
            const img = this.ghostImages[ghostIdx];
            img.setTexture(`tile_${this.currentPiece.type.toLowerCase()}`);
            img.setPosition(
              C.GRID_X + (this.currentPiece.x + c) * C.CELL_SIZE + C.CELL_SIZE / 2,
              C.GRID_Y + (ghostY + r) * C.CELL_SIZE + C.CELL_SIZE / 2,
            );
            img.setVisible(true);
            ghostIdx++;
          }
        }
      }
    }
    for (let i = ghostIdx; i < this.ghostImages.length; i++) {
      this.ghostImages[i].setVisible(false);
    }

    let activeIdx = 0;
    if (this.currentPiece) {
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c] && activeIdx < this.activeImages.length) {
            const gy = this.currentPiece.y + r;
            if (gy >= 0) {
              const img = this.activeImages[activeIdx];
              img.setTexture(`tile_${this.currentPiece.type.toLowerCase()}`);
              img.setPosition(
                C.GRID_X + (this.currentPiece.x + c) * C.CELL_SIZE + C.CELL_SIZE / 2,
                C.GRID_Y + gy * C.CELL_SIZE + C.CELL_SIZE / 2,
              );
              img.setVisible(true);
              activeIdx++;
            }
          }
        }
      }
    }
    for (let i = activeIdx; i < this.activeImages.length; i++) {
      this.activeImages[i].setVisible(false);
    }

    const ov = this.overlayGraphics;
    ov.clear();

    for (const [key, glow] of this.glowMap.entries()) {
      if (glow > 0.1) {
        const parts = key.split('-');
        const row = parseInt(parts[0]);
        const col = parseInt(parts[1]);
        if (this.grid[row]?.[col]) {
          const px = C.GRID_X + col * C.CELL_SIZE;
          const py = C.GRID_Y + row * C.CELL_SIZE;
          ov.fillStyle(0xffffff, glow * 0.3);
          ov.fillRect(px + 1, py + 1, C.CELL_SIZE - 2, C.CELL_SIZE - 2);
        }
      }
    }

    ov.lineStyle(1, 0x003300, 0.5);
    const gridW = C.COLS * C.CELL_SIZE;
    const gridH = C.ROWS * C.CELL_SIZE;
    for (let r = 0; r <= C.ROWS; r++) {
      ov.lineBetween(C.GRID_X, C.GRID_Y + r * C.CELL_SIZE, C.GRID_X + gridW, C.GRID_Y + r * C.CELL_SIZE);
    }
    for (let c = 0; c <= C.COLS; c++) {
      ov.lineBetween(C.GRID_X + c * C.CELL_SIZE, C.GRID_Y, C.GRID_X + c * C.CELL_SIZE, C.GRID_Y + gridH);
    }

    ov.lineStyle(2, 0x00ff00, 0.6);
    ov.strokeRect(C.GRID_X, C.GRID_Y, gridW, gridH);
  }

  private drawPiecePreview(g: Phaser.GameObjects.Graphics, type: TetrominoType | null, cx: number, cy: number): void {
    g.clear();

    const boxSize = 80;
    g.lineStyle(1, 0x003300, 0.5);
    g.strokeRect(cx - boxSize / 2, cy, boxSize, boxSize);

    if (!type) return;

    const def = TETROMINO_DEFS[type];
    const shape = def.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    const cs = C.PREVIEW_CELL;

    const totalW = cols * cs;
    const totalH = rows * cs;
    const ox = cx - totalW / 2;
    const oy = cy + boxSize / 2 - totalH / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          g.fillStyle(def.color, 1);
          g.fillRect(ox + c * cs + 1, oy + r * cs + 1, cs - 2, cs - 2);
        }
      }
    }
  }

  private drawBulletTimeMeter(): void {
    const g = this.meterGraphics;
    g.clear();

    const barX = C.HOLD_X - 60;
    const barY = 345;
    const barW = 120;
    const barH = 12;

    g.lineStyle(1, 0x003300, 1);
    g.strokeRect(barX, barY, barW, barH);

    const fillW = (this.bulletTimeMeter / C.BULLET_TIME_MAX_METER) * barW;
    const fillColor = this.bulletTimeActive ? 0x00ffff : (this.bulletTimeMeter >= C.BULLET_TIME_MAX_METER ? 0xffff00 : 0x00ff00);
    g.fillStyle(fillColor, 0.8);
    g.fillRect(barX + 1, barY + 1, fillW - 2, barH - 2);
  }

  private updateParticles(dt: number): void {
    const g = this.overlayGraphics;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += C.PARTICLE_GRAVITY * dt;
      p.life *= C.PARTICLE_FADE;
      if (p.life < 0.05) {
        this.particles.splice(i, 1);
        continue;
      }
      g.fillStyle(p.color, p.life);
      g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  private updateGlow(): void {
    for (const [key, glow] of this.glowMap.entries()) {
      const newGlow = glow - C.GLOW_DECAY;
      if (newGlow <= 0) {
        this.glowMap.delete(key);
      } else {
        this.glowMap.set(key, newGlow);
      }
    }
  }

  private updateHUD(): void {
    this.scoreText.setText(String(this.score));
    this.levelText.setText(String(this.level));
    this.linesText.setText(String(this.lines));
    this.comboText.setText(this.combo > 0 ? String(this.combo) : '0');
    this.highScoreText.setText(String(this.highScore));

    if (this.bulletTimeActive) {
      const remaining = Math.max(0, this.bulletTimeTimer / 1000);
      this.bulletTimeTimerText.setText(remaining.toFixed(1) + 's');
      this.meterLabel.setColor('#00ffff');
    } else {
      this.bulletTimeTimerText.setText(
        this.bulletTimeMeter >= C.BULLET_TIME_MAX_METER ? 'READY!' : '',
      );
      this.meterLabel.setColor('#00ff00');
    }
  }

  // --- Main Loop ---

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) {
      this.exposeTestState(this.getTestState());
      return;
    }
    if (this.isCountingDown) return;

    if (this.matrixRainGroup) {
      this.updateMatrixRain(this.matrixRainGroup, delta);
    }

    if (this.bulletTimeActive) {
      this.bulletTimeTimer -= delta;
      if (this.bulletTimeTimer <= 0) {
        this.deactivateBulletTime();
      }
    }

    this.handleInput();
    this.updateGlow();

    const dt = delta / 1000;

    this.drawPlayfield();
    this.updateParticles(dt);
    this.drawPiecePreview(this.holdGraphics, this.holdPieceType, C.HOLD_X, C.HOLD_Y + 18);
    this.drawPiecePreview(this.nextGraphics, this.nextPieceType, C.NEXT_X, C.NEXT_Y + 18);
    this.drawBulletTimeMeter();
    this.updateHUD();

    this.exposeTestState(this.getTestState());
  }

  private getTestState(): Record<string, unknown> {
    return {
      grid: this.grid.map(row => row.map(cell => cell ? { ...cell } : null)),
      currentPiece: this.currentPiece
        ? { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y, rotation: this.currentPiece.rotation, shape: this.currentPiece.shape.map(r => [...r]) }
        : null,
      nextPieceType: this.nextPieceType,
      holdPieceType: this.holdPieceType,
      canHold: this.canHold,
      score: this.score,
      highScore: this.highScore,
      level: this.level,
      lines: this.lines,
      combo: this.combo,
      tSpins: this.tSpins,
      isGameOver: this.isGameOver,
      bulletTimeActive: this.bulletTimeActive,
      bulletTimeMeter: this.bulletTimeMeter,
      bulletTimeTimer: this.bulletTimeTimer,
      bulletTimeCount: this.bulletTimeCount,
      softDropActive: this.softDropActive,
      maxFilledRows: this.maxFilledRows,
      ghostY: this.currentPiece ? this.getGhostY() : null,
      pieceBagSize: this.pieceBag.length,
      particleCount: this.particles.length,
      countdownValue: this.countdownValue,
    };
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    this.destroyDropTimer();
    this.particles = [];
    this.glowMap.clear();
    if (this.gridGraphics) this.gridGraphics.destroy();
    if (this.overlayGraphics) this.overlayGraphics.destroy();
    if (this.holdGraphics) this.holdGraphics.destroy();
    if (this.nextGraphics) this.nextGraphics.destroy();
    if (this.meterGraphics) this.meterGraphics.destroy();
    for (const row of this.cellImages) {
      for (const img of row) img.destroy();
    }
    this.cellImages = [];
    for (const img of this.ghostImages) img.destroy();
    this.ghostImages = [];
    for (const img of this.activeImages) img.destroy();
    this.activeImages = [];
    if (this.input.keyboard) this.input.keyboard.removeAllKeys(true);
    super.shutdown();
  }
}
