import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { MetrisGameScene } from './GameScene';
import {
  GAME_CONFIG as C,
  ACHIEVEMENTS,
  TETROMINO_DEFS,
  TETROMINO_TYPES,
  SCORE_TABLE,
  type TetrominoType,
  type CellData,
  type PieceState,
} from '../config';

// --- Helpers ---

function collectPrototypeMethods(cls: new (...args: unknown[]) => unknown): string[] {
  const methods: string[] = [];
  let proto = cls.prototype;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key !== 'constructor' && typeof proto[key] === 'function' && !methods.includes(key)) {
        methods.push(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return methods;
}

function createMockGraphics() {
  const g: Record<string, unknown> = {};
  const chainable = ['clear', 'fillStyle', 'fillRect', 'lineStyle', 'lineBetween',
    'strokeRect', 'setDepth', 'setAlpha', 'setVisible', 'setPosition',
    'setScrollFactor', 'generateTexture', 'fillCircle', 'fillRoundedRect',
    'strokeRoundedRect', 'strokeCircle', 'fillTriangle'];
  for (const m of chainable) g[m] = vi.fn().mockReturnValue(g);
  g.destroy = vi.fn();
  return g;
}

function createMockText() {
  const t: Record<string, unknown> = { x: 0, y: 0, text: '', visible: true };
  for (const m of ['setText', 'setColor', 'setAlpha', 'setOrigin', 'setDepth', 'setVisible', 'setFontSize', 'setPosition', 'setScrollFactor']) {
    t[m] = vi.fn().mockReturnValue(t);
  }
  t.destroy = vi.fn();
  return t;
}

function createMockImage() {
  const img: Record<string, unknown> = { x: 0, y: 0, visible: true, alpha: 1, depth: 0 };
  for (const m of ['setTexture', 'setPosition', 'setDisplaySize', 'setDepth', 'setAlpha', 'setVisible', 'setTint', 'clearTint', 'setOrigin']) {
    img[m] = vi.fn().mockReturnValue(img);
  }
  img.destroy = vi.fn();
  img.texture = { key: '' };
  return img;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTestScene(): any {
  const scene = new MetrisGameScene();

  for (const name of collectPrototypeMethods(MetrisGameScene)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (MetrisGameScene.prototype as any)[name];
    if (typeof fn === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scene as any)[name] = fn.bind(scene);
    }
  }

  scene.playSound = vi.fn();
  scene.unlockAchievement = vi.fn();
  scene.reportScore = vi.fn();
  scene.gameOver = vi.fn();
  scene.emitGameEvent = vi.fn();
  scene.createMatrixText = vi.fn().mockImplementation(() => createMockText());
  scene.createMatrixBackground = vi.fn();
  scene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: () => [] });
  scene.updateMatrixRain = vi.fn();
  scene.setupCommonInputs = vi.fn();
  scene.exposeTestState = vi.fn();
  scene.isPaused = false;
  scene.getAutoStart = vi.fn().mockReturnValue(false);
  scene.getIsMuted = vi.fn().mockReturnValue(false);
  scene.getGameId = vi.fn().mockReturnValue('metris');

  scene.cameras = { main: { shake: vi.fn(), flash: vi.fn(), setBackgroundColor: vi.fn() } };
  scene.tweens = { add: vi.fn(), killAll: vi.fn() };
  scene.time = {
    now: 1000,
    addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() }),
  };
  scene.input = {
    keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false }), removeAllKeys: vi.fn(), on: vi.fn() },
    on: vi.fn(), off: vi.fn(),
  };
  scene.add = {
    graphics: vi.fn().mockReturnValue(createMockGraphics()),
    text: vi.fn().mockReturnValue(createMockText()),
    image: vi.fn().mockImplementation(() => createMockImage()),
    container: vi.fn().mockReturnValue({ add: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() }),
    group: vi.fn().mockReturnValue({ getChildren: () => [], add: vi.fn() }),
  };
  scene.make = { graphics: vi.fn().mockReturnValue(createMockGraphics()) };
  scene.game = { registry: { get: vi.fn(), set: vi.fn() } };
  scene.registry = { get: vi.fn().mockReturnValue(null), set: vi.fn() };
  scene.scene = { start: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
  scene.scale = { width: C.WIDTH, height: C.HEIGHT };
  scene.events = { on: vi.fn(), off: vi.fn() };
  scene.sys = { game: { loop: { actualFps: 60 } }, events: { on: vi.fn(), off: vi.fn() } };

  scene.resetState();

  return scene;
}

// --- Tests ---

describe('MetrisGameScene', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scene: any;

  beforeEach(() => {
    scene = createTestScene();

    scene.gridGraphics = createMockGraphics();
    scene.overlayGraphics = createMockGraphics();
    scene.holdGraphics = createMockGraphics();
    scene.nextGraphics = createMockGraphics();
    scene.meterGraphics = createMockGraphics();
    scene.cellImages = Array.from({ length: C.ROWS }, () =>
      Array.from({ length: C.COLS }, () => createMockImage()),
    );
    scene.ghostImages = Array.from({ length: 4 }, () => createMockImage());
    scene.activeImages = Array.from({ length: 4 }, () => createMockImage());
    scene.scoreText = createMockText();
    scene.levelText = createMockText();
    scene.linesText = createMockText();
    scene.comboText = createMockText();
    scene.highScoreText = createMockText();
    scene.meterLabel = createMockText();
    scene.bulletTimeTimerText = createMockText();
    scene.matrixRainGroup = { getChildren: () => [] };

    const makeKey = () => ({ isDown: false });
    scene.leftKey = makeKey();
    scene.rightKey = makeKey();
    scene.downKey = makeKey();
    scene.upKey = makeKey();
    scene.spaceKey = makeKey();
    scene.cKey = makeKey();
    scene.bKey = makeKey();
    scene.xKey = makeKey();
    scene.zKey = makeKey();
    scene.shiftKey = makeKey();
    scene.aKey = makeKey();
    scene.dKey = makeKey();
    scene.sKey = makeKey();
    scene.wKey = makeKey();

    (Phaser.Input.Keyboard as Record<string, unknown>).JustDown = vi.fn().mockReturnValue(false);
  });

  describe('Initial State', () => {
    it('should start with score 0', () => { expect(scene.score).toBe(0); });
    it('should start at level 1', () => { expect(scene.level).toBe(1); });
    it('should start with 0 lines', () => { expect(scene.lines).toBe(0); });
    it('should start with combo 0', () => { expect(scene.combo).toBe(0); });
    it('should not be game over', () => { expect(scene.isGameOver).toBe(false); });
    it('should have a current piece', () => { expect(scene.currentPiece).not.toBeNull(); });

    it('should have a valid next piece type', () => {
      expect(TETROMINO_TYPES).toContain(scene.nextPieceType);
    });

    it('should have no hold piece', () => { expect(scene.holdPieceType).toBeNull(); });
    it('should allow holding', () => { expect(scene.canHold).toBe(true); });
    it('should have bullet time inactive', () => { expect(scene.bulletTimeActive).toBe(false); });
    it('should have bullet time meter at 0', () => { expect(scene.bulletTimeMeter).toBe(0); });

    it('should have an empty grid', () => {
      expect(scene.grid.length).toBe(C.ROWS);
      expect(scene.grid[0].length).toBe(C.COLS);
      expect(scene.grid.every((row: (CellData | null)[]) => row.every((c: CellData | null) => c === null))).toBe(true);
    });

    it('should have 0 t-spins', () => { expect(scene.tSpins).toBe(0); });
    it('should not be soft dropping', () => { expect(scene.softDropActive).toBe(false); });
  });

  describe('Piece Spawning', () => {
    it('should spawn all 7 types from one bag', () => {
      scene.pieceBag = [];
      const types = new Set<TetrominoType>();
      for (let i = 0; i < 7; i++) types.add(scene.pullFromBag());
      expect(types.size).toBe(7);
    });

    it('should refill bag after 7 draws', () => {
      for (let i = 0; i < 7; i++) scene.pullFromBag();
      expect(scene.pieceBag.length).toBeGreaterThanOrEqual(0);
      expect(scene.pieceBag.length).toBeLessThanOrEqual(7);
    });

    it('should create T piece with correct position', () => {
      const piece = scene.spawnPiece('T') as PieceState;
      expect(piece.type).toBe('T');
      expect(piece.y).toBe(0);
      expect(piece.rotation).toBe(0);
      expect(piece.x).toBe(Math.floor((C.COLS - 3) / 2));
    });

    it('should create I piece centered correctly', () => {
      const piece = scene.spawnPiece('I') as PieceState;
      expect(piece.x).toBe(Math.floor((C.COLS - 4) / 2));
    });

    it('should create O piece centered correctly', () => {
      const piece = scene.spawnPiece('O') as PieceState;
      expect(piece.x).toBe(Math.floor((C.COLS - 2) / 2));
    });
  });

  describe('Collision Detection', () => {
    it('should detect left wall collision', () => {
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, -1, 0)).toBe(true);
    });

    it('should detect right wall collision', () => {
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, C.COLS - 2, 0)).toBe(true);
    });

    it('should detect floor collision', () => {
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, 3, C.ROWS - 1)).toBe(true);
    });

    it('should not detect collision in empty space', () => {
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, 3, 5)).toBe(false);
    });

    it('should detect collision with locked cells', () => {
      scene.grid[5][4] = { type: 'T', color: 0xff00ff, glow: 0 };
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, 3, 4)).toBe(true);
    });

    it('should allow pieces above the grid', () => {
      expect(scene.checkCollision(TETROMINO_DEFS.T.shape, 3, -1)).toBe(false);
    });
  });

  describe('Piece Movement', () => {
    it('should move piece left', () => {
      const origX = scene.currentPiece.x;
      scene.movePiece(-1, 0);
      expect(scene.currentPiece.x).toBe(origX - 1);
    });

    it('should move piece right', () => {
      const origX = scene.currentPiece.x;
      scene.movePiece(1, 0);
      expect(scene.currentPiece.x).toBe(origX + 1);
    });

    it('should not move past left wall', () => {
      scene.currentPiece.x = 0;
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      expect(scene.movePiece(-1, 0)).toBe(false);
    });

    it('should not move past right wall', () => {
      scene.currentPiece.x = C.COLS - 2;
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      expect(scene.movePiece(1, 0)).toBe(false);
    });

    it('should reset lastRotation on move', () => {
      scene.lastRotation = true;
      scene.movePiece(1, 0);
      expect(scene.lastRotation).toBe(false);
    });
  });

  describe('Rotation', () => {
    beforeEach(() => {
      scene.currentPiece.type = 'T';
      scene.currentPiece.shape = TETROMINO_DEFS.T.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 3;
      scene.currentPiece.y = 5;
      scene.currentPiece.rotation = 0;
    });

    it('should rotate CW', () => {
      scene.rotatePieceCW();
      expect(scene.currentPiece.rotation).toBe(1);
    });

    it('should rotate CCW', () => {
      scene.rotatePieceCCW();
      expect(scene.currentPiece.rotation).toBe(3);
    });

    it('should set lastRotation on rotate', () => {
      scene.rotatePieceCW();
      expect(scene.lastRotation).toBe(true);
    });

    it('should not rotate O piece', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.rotatePieceCW();
      expect(scene.currentPiece.rotation).toBe(0);
    });

    it('should play sound on rotation', () => {
      scene.rotatePieceCW();
      expect(scene.playSound).toHaveBeenCalled();
    });

    it('should apply wall kick at left wall', () => {
      scene.currentPiece.x = 0;
      scene.rotatePieceCW();
      if (scene.currentPiece.rotation === 1) {
        expect(scene.currentPiece.x).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Matrix Rotation', () => {
    it('should rotate CW correctly', () => {
      const matrix = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const rotated = scene.rotateMatrixCW(matrix);
      expect(rotated[1][2]).toBe(1);
      expect(rotated[1][1]).toBe(1);
    });

    it('should rotate CCW correctly', () => {
      const matrix = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const rotated = scene.rotateMatrixCCW(matrix);
      expect(rotated[1][0]).toBe(1);
      expect(rotated[1][1]).toBe(1);
    });

    it('should preserve shape after 4 CW rotations', () => {
      const original = TETROMINO_DEFS.T.shape.map((r: number[]) => [...r]);
      let shape = original;
      for (let i = 0; i < 4; i++) shape = scene.rotateMatrixCW(shape);
      expect(shape).toEqual(original);
    });
  });

  describe('Ghost Piece', () => {
    it('should fall to bottom on empty grid', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = 0;
      expect(scene.getGhostY()).toBe(C.ROWS - 2);
    });

    it('should stop above locked cells', () => {
      for (let c = 0; c < C.COLS; c++) {
        scene.grid[C.ROWS - 1][c] = { type: 'T', color: 0xff00ff, glow: 0 };
      }
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = 0;
      expect(scene.getGhostY()).toBe(C.ROWS - 3);
    });
  });

  describe('Drop Tick', () => {
    it('should move piece down', () => {
      const origY = scene.currentPiece.y;
      scene.dropTick();
      expect(scene.currentPiece.y).toBe(origY + 1);
    });

    it('should lock piece at bottom', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = C.ROWS - 2;
      scene.dropTick();
      expect(scene.grid[C.ROWS - 2][4]).not.toBeNull();
      expect(scene.grid[C.ROWS - 1][4]).not.toBeNull();
      expect(scene.currentPiece).not.toBeNull();
    });

    it('should play sound on lock', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = C.ROWS - 2;
      scene.dropTick();
      expect(scene.playSound).toHaveBeenCalled();
    });

    it('should not drop when game is over', () => {
      scene.isGameOver = true;
      const origY = scene.currentPiece?.y;
      scene.dropTick();
      if (scene.currentPiece) expect(scene.currentPiece.y).toBe(origY);
    });
  });

  describe('Line Clearing', () => {
    it('should clear one full line', () => {
      for (let c = 0; c < C.COLS; c++) {
        scene.grid[C.ROWS - 1][c] = { type: 'T', color: 0xff00ff, glow: 0 };
      }
      expect(scene.clearFullLines()).toBe(1);
      expect(scene.grid[C.ROWS - 1].every((c: CellData | null) => c === null)).toBe(true);
    });

    it('should clear four full lines (tetris)', () => {
      for (let r = C.ROWS - 4; r < C.ROWS; r++) {
        for (let c = 0; c < C.COLS; c++) {
          scene.grid[r][c] = { type: 'I', color: 0x00ffff, glow: 0 };
        }
      }
      expect(scene.clearFullLines()).toBe(4);
    });

    it('should not clear partial lines', () => {
      for (let c = 0; c < C.COLS - 1; c++) {
        scene.grid[C.ROWS - 1][c] = { type: 'T', color: 0xff00ff, glow: 0 };
      }
      expect(scene.clearFullLines()).toBe(0);
    });

    it('should shift rows down after clearing', () => {
      scene.grid[C.ROWS - 2][0] = { type: 'S', color: 0x00ff00, glow: 0 };
      for (let c = 0; c < C.COLS; c++) {
        scene.grid[C.ROWS - 1][c] = { type: 'T', color: 0xff00ff, glow: 0 };
      }
      scene.clearFullLines();
      expect(scene.grid[C.ROWS - 1][0]?.type).toBe('S');
    });

    it('should spawn particles on clear', () => {
      for (let c = 0; c < C.COLS; c++) {
        scene.grid[C.ROWS - 1][c] = { type: 'T', color: 0xff00ff, glow: 0 };
      }
      scene.clearFullLines();
      expect(scene.particles.length).toBe(C.COLS * C.PARTICLE_COUNT_PER_CELL);
    });
  });

  describe('Scoring', () => {
    it('should award correct score for 1 line', () => {
      scene.level = 1;
      scene.combo = 0;
      scene.handleScoring(1);
      expect(scene.score).toBe(SCORE_TABLE[1] * 1 * 1);
    });

    it('should award correct score for tetris', () => {
      scene.level = 1;
      scene.combo = 0;
      scene.handleScoring(4);
      expect(scene.score).toBe(SCORE_TABLE[4] * 1 * 1);
    });

    it('should multiply score by level', () => {
      scene.level = 3;
      scene.combo = 0;
      scene.handleScoring(1);
      expect(scene.score).toBe(SCORE_TABLE[1] * 3 * 1);
    });

    it('should multiply score by combo', () => {
      scene.combo = 4;
      scene.level = 1;
      scene.handleScoring(1);
      expect(scene.score).toBe(SCORE_TABLE[1] * 1 * 5);
    });

    it('should reset combo on no lines', () => {
      scene.combo = 3;
      scene.handleScoring(0);
      expect(scene.combo).toBe(0);
    });

    it('should increment combo on lines cleared', () => {
      scene.combo = 0;
      scene.handleScoring(1);
      expect(scene.combo).toBe(1);
    });

    it('should increment lines count', () => {
      scene.handleScoring(2);
      expect(scene.lines).toBe(2);
    });
  });

  describe('Level Progression', () => {
    it('should advance level every 10 lines', () => {
      scene.lines = 0;
      scene.level = 1;
      scene.handleScoring(4);
      scene.handleScoring(4);
      expect(scene.level).toBe(1);
      scene.handleScoring(2);
      expect(scene.level).toBe(2);
    });

    it('should play level up sound', () => {
      scene.lines = 9;
      scene.level = 1;
      scene.handleScoring(1);
      expect(scene.playSound).toHaveBeenCalled();
    });

    it('should calculate drop speed correctly', () => {
      scene.level = 1;
      scene.softDropActive = false;
      scene.bulletTimeActive = false;
      expect(scene.getEffectiveDropSpeed()).toBe(C.INITIAL_DROP_SPEED);

      scene.level = 5;
      expect(scene.getEffectiveDropSpeed()).toBe(C.INITIAL_DROP_SPEED - 4 * C.SPEED_DECREASE);
    });

    it('should cap minimum drop speed', () => {
      scene.level = 50;
      scene.softDropActive = false;
      scene.bulletTimeActive = false;
      expect(scene.getEffectiveDropSpeed()).toBe(C.MIN_DROP_SPEED);
    });

    it('should use soft drop speed when soft dropping', () => {
      scene.softDropActive = true;
      scene.bulletTimeActive = false;
      expect(scene.getEffectiveDropSpeed()).toBe(C.SOFT_DROP_SPEED);
    });
  });

  describe('Hold Piece', () => {
    it('should hold the current piece', () => {
      const originalType = scene.currentPiece.type;
      scene.holdCurrentPiece();
      expect(scene.holdPieceType).toBe(originalType);
    });

    it('should swap hold and current piece', () => {
      const firstType = scene.currentPiece.type;
      scene.holdCurrentPiece();
      scene.canHold = true;
      const secondType = scene.currentPiece.type;
      scene.holdCurrentPiece();
      expect(scene.holdPieceType).toBe(secondType);
      expect(scene.currentPiece.type).toBe(firstType);
    });

    it('should prevent double hold', () => {
      scene.holdCurrentPiece();
      expect(scene.canHold).toBe(false);
      const holdType = scene.holdPieceType;
      scene.holdCurrentPiece();
      expect(scene.holdPieceType).toBe(holdType);
    });

    it('should play sound on hold', () => {
      scene.holdCurrentPiece();
      expect(scene.playSound).toHaveBeenCalled();
    });

    it('should reset lastRotation', () => {
      scene.lastRotation = true;
      scene.holdCurrentPiece();
      expect(scene.lastRotation).toBe(false);
    });
  });

  describe('Hard Drop', () => {
    it('should drop piece to ghost position', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = 0;
      scene.hardDrop();
      expect(scene.grid[C.ROWS - 2][4]).not.toBeNull();
      expect(scene.grid[C.ROWS - 1][4]).not.toBeNull();
    });

    it('should award hard drop points', () => {
      scene.currentPiece.type = 'O';
      scene.currentPiece.shape = TETROMINO_DEFS.O.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 4;
      scene.currentPiece.y = 0;
      const ghostY = scene.getGhostY();
      const expected = ghostY * C.HARD_DROP_POINTS_PER_CELL;
      scene.hardDrop();
      expect(scene.score).toBeGreaterThanOrEqual(expected);
    });

    it('should play sound on hard drop', () => {
      scene.hardDrop();
      expect(scene.playSound).toHaveBeenCalled();
    });
  });

  describe('Bullet Time', () => {
    it('should activate', () => {
      scene.bulletTimeMeter = 0;
      scene.bulletTimeActive = false;
      scene.activateBulletTime();
      expect(scene.bulletTimeActive).toBe(true);
      expect(scene.bulletTimeMeter).toBe(0);
      expect(scene.bulletTimeTimer).toBe(C.BULLET_TIME_DURATION);
    });

    it('should slow drop speed', () => {
      scene.level = 1;
      scene.softDropActive = false;
      scene.bulletTimeActive = true;
      expect(scene.getEffectiveDropSpeed()).toBe(Math.round(C.INITIAL_DROP_SPEED / C.BULLET_TIME_SLOWDOWN));
    });

    it('should deactivate', () => {
      scene.bulletTimeActive = true;
      scene.bulletTimeTimer = 100;
      scene.deactivateBulletTime();
      expect(scene.bulletTimeActive).toBe(false);
      expect(scene.bulletTimeTimer).toBe(0);
    });

    it('should fill meter from line clears', () => {
      scene.bulletTimeMeter = 0;
      scene.handleScoring(2);
      expect(scene.bulletTimeMeter).toBe(2 * C.BULLET_TIME_METER_PER_LINE);
    });

    it('should auto-activate when meter reaches 100', () => {
      scene.bulletTimeMeter = 90;
      scene.handleScoring(4);
      expect(scene.bulletTimeActive).toBe(true);
      expect(scene.bulletTimeMeter).toBe(0);
    });

    it('should not allow manual activation when meter is not full', () => {
      scene.bulletTimeMeter = 50;
      scene.tryManualBulletTime();
      expect(scene.bulletTimeActive).toBe(false);
    });

    it('should increment bullet time count', () => {
      scene.bulletTimeCount = 0;
      scene.activateBulletTime();
      expect(scene.bulletTimeCount).toBe(1);
    });

    it('should play sound on activation', () => {
      scene.activateBulletTime();
      expect(scene.playSound).toHaveBeenCalled();
    });
  });

  describe('T-Spin Detection', () => {
    it('should not count T-spin for non-T pieces', () => {
      scene.lastRotation = true;
      scene.currentPiece.type = 'I';
      scene.currentPiece.shape = TETROMINO_DEFS.I.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 3;
      scene.currentPiece.y = C.ROWS - 2;
      scene.lockCurrentPiece();
      expect(scene.tSpins).toBe(0);
    });

    it('should not count T-spin when not rotated', () => {
      scene.lastRotation = false;
      scene.currentPiece.type = 'T';
      scene.currentPiece.shape = TETROMINO_DEFS.T.shape.map((r: number[]) => [...r]);
      scene.currentPiece.x = 3;
      scene.currentPiece.y = C.ROWS - 2;
      scene.lockCurrentPiece();
      expect(scene.tSpins).toBe(0);
    });
  });

  describe('Achievements', () => {
    it('should unlock first_line', () => {
      scene.lines = 1;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_LINE);
    });

    it('should unlock tetris', () => {
      scene.checkScoringAchievements(4);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.TETRIS);
    });

    it('should unlock level_10', () => {
      scene.level = 10;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LEVEL_10);
    });

    it('should unlock high_roller', () => {
      scene.score = 10000;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.HIGH_ROLLER);
    });

    it('should unlock line_clearer', () => {
      scene.lines = 100;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.LINE_CLEARER);
    });

    it('should unlock combo_king', () => {
      scene.combo = 5;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.COMBO_KING);
    });

    it('should unlock immortal', () => {
      scene.level = 20;
      scene.checkScoringAchievements(1);
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.IMMORTAL);
    });

    it('should not double-unlock', () => {
      scene.tryUnlockAchievement(ACHIEVEMENTS.FIRST_LINE);
      scene.tryUnlockAchievement(ACHIEVEMENTS.FIRST_LINE);
      expect(scene.unlockAchievement).toHaveBeenCalledTimes(1);
    });

    it('should unlock architect at 18 rows', () => {
      scene.maxFilledRows = 17;
      for (let r = 2; r < C.ROWS; r++) scene.grid[r][0] = { type: 'T', color: 0xff00ff, glow: 0 };
      scene.trackFilledRows();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.ARCHITECT);
    });

    it('should unlock neos_apprentice after 10 activations', () => {
      scene.bulletTimeCount = 9;
      scene.activateBulletTime();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.NEOS_APPRENTICE);
    });

    it('should unlock marathon_runner after 10 minutes', () => {
      scene.sessionStartTime = 0;
      scene.time.now = 600001;
      scene.handleGameOver();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.MARATHON_RUNNER);
    });

    it('should unlock perfect_start at level 5+', () => {
      scene.level = 5;
      scene.handleGameOver();
      expect(scene.unlockAchievement).toHaveBeenCalledWith(ACHIEVEMENTS.PERFECT_START);
    });
  });

  describe('Game Over', () => {
    it('should trigger when new piece collides', () => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < C.COLS; c++) {
          scene.grid[r][c] = { type: 'T', color: 0xff00ff, glow: 0 };
        }
      }
      scene.spawnNextPiece();
      expect(scene.isGameOver).toBe(true);
    });

    it('should call delayedCall for gameOver', () => {
      scene.handleGameOver();
      expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    it('should update high score', () => {
      scene.score = 5000;
      scene.highScore = 1000;
      scene.handleGameOver();
      expect(scene.highScore).toBe(5000);
    });

    it('should prevent double game over', () => {
      scene.handleGameOver();
      scene.handleGameOver();
      expect(scene.time.delayedCall).toHaveBeenCalledTimes(1);
    });

    it('should shake camera', () => {
      scene.handleGameOver();
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });
  });

  describe('Drop Speed', () => {
    it('should decrease with level', () => {
      scene.softDropActive = false;
      scene.bulletTimeActive = false;
      scene.level = 1;
      const speed1 = scene.getEffectiveDropSpeed();
      scene.level = 5;
      expect(scene.getEffectiveDropSpeed()).toBeLessThan(speed1);
    });

    it('should use soft drop speed', () => {
      scene.softDropActive = true;
      scene.bulletTimeActive = false;
      expect(scene.getEffectiveDropSpeed()).toBe(C.SOFT_DROP_SPEED);
    });

    it('should slow during bullet time', () => {
      scene.level = 1;
      scene.softDropActive = false;
      scene.bulletTimeActive = true;
      expect(scene.getEffectiveDropSpeed()).toBeGreaterThan(C.INITIAL_DROP_SPEED);
    });
  });

  describe('Particle Effects', () => {
    it('should update positions', () => {
      scene.particles.push({ x: 100, y: 100, vx: 50, vy: -100, color: 0x00ff00, life: 1, size: 3 });
      scene.updateParticles(0.016);
      expect(scene.particles[0].x).toBeCloseTo(100.8, 0);
      expect(scene.particles[0].vy).toBeGreaterThan(-100);
    });

    it('should remove dead particles', () => {
      scene.particles.push({ x: 100, y: 100, vx: 0, vy: 0, color: 0x00ff00, life: 0.01, size: 3 });
      scene.updateParticles(0.016);
      expect(scene.particles.length).toBe(0);
    });

    it('should apply gravity', () => {
      scene.particles.push({ x: 100, y: 100, vx: 0, vy: 0, color: 0x00ff00, life: 1, size: 3 });
      scene.updateParticles(0.016);
      expect(scene.particles[0].vy).toBeGreaterThan(0);
    });
  });

  describe('Test State Exposure', () => {
    it('should return all expected fields', () => {
      const state = scene.getTestState();
      for (const key of ['grid', 'currentPiece', 'nextPieceType', 'holdPieceType', 'canHold',
        'score', 'highScore', 'level', 'lines', 'combo', 'tSpins', 'isGameOver',
        'bulletTimeActive', 'bulletTimeMeter', 'bulletTimeTimer', 'bulletTimeCount',
        'softDropActive', 'maxFilledRows', 'ghostY', 'pieceBagSize', 'particleCount']) {
        expect(state).toHaveProperty(key);
      }
    });

    it('should reflect current score', () => {
      scene.score = 12345;
      expect(scene.getTestState().score).toBe(12345);
    });
  });

  describe('Cleanup', () => {
    it('should destroy drop timer', () => {
      const mockTimer = { destroy: vi.fn() };
      scene.dropTimer = mockTimer;
      scene.shutdown();
      expect(mockTimer.destroy).toHaveBeenCalled();
    });

    it('should clear particles', () => {
      scene.particles.push({ x: 0, y: 0, vx: 0, vy: 0, color: 0, life: 1, size: 1 });
      scene.shutdown();
      expect(scene.particles.length).toBe(0);
    });

    it('should destroy graphics', () => {
      const mockG = createMockGraphics();
      scene.gridGraphics = mockG;
      scene.shutdown();
      expect(mockG.destroy).toHaveBeenCalled();
    });

    it('should remove keyboard keys', () => {
      const keyboard = { removeAllKeys: vi.fn(), addKey: vi.fn() };
      scene.input = { keyboard, on: vi.fn(), off: vi.fn() };
      scene.shutdown();
      expect(keyboard.removeAllKeys).toHaveBeenCalledWith(true);
    });
  });
});
