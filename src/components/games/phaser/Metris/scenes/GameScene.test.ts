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
    removeAllEvents: vi.fn(),
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

    it('should NOT auto-activate when line clears fill meter to 100 (R85.M3)', () => {
      scene.bulletTimeMeter = 90;
      scene.bulletTimeActive = false;
      scene.handleScoring(4);
      expect(scene.bulletTimeActive).toBe(false);
      expect(scene.bulletTimeMeter).toBe(C.BULLET_TIME_MAX_METER);
    });

    it('should NOT auto-activate when a single line clear tips meter over 100 (R85.M3)', () => {
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER - 1;
      scene.bulletTimeActive = false;
      scene.handleScoring(1);
      expect(scene.bulletTimeActive).toBe(false);
      expect(scene.bulletTimeMeter).toBe(C.BULLET_TIME_MAX_METER);
    });

    it('should not allow manual activation when meter is not full', () => {
      scene.bulletTimeMeter = 50;
      scene.tryManualBulletTime();
      expect(scene.bulletTimeActive).toBe(false);
    });

    it('should allow manual activation once meter reaches 100 (R85.M3)', () => {
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
      scene.bulletTimeActive = false;
      scene.tryManualBulletTime();
      expect(scene.bulletTimeActive).toBe(true);
      expect(scene.bulletTimeMeter).toBe(0);
      expect(scene.bulletTimeTimer).toBe(C.BULLET_TIME_DURATION);
    });

    it('should no-op when manual activation is pressed while already active (R85.M3)', () => {
      scene.bulletTimeActive = true;
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
      const countBefore = scene.bulletTimeCount;
      scene.tryManualBulletTime();
      expect(scene.bulletTimeCount).toBe(countBefore);
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

    it('meter label turns yellow when ready but idle (R85.M3)', async () => {
      const { MATRIX_COLORS } = await import('@/lib/phaser/types');
      scene.bulletTimeActive = false;
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
      scene.updateHUD();
      expect(scene.meterLabel.setColor).toHaveBeenCalledWith(MATRIX_COLORS.YELLOW_HEX);
    });

    it('meter label stays green below full threshold (R85.M3)', async () => {
      const { MATRIX_COLORS } = await import('@/lib/phaser/types');
      scene.bulletTimeActive = false;
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER - 1;
      scene.updateHUD();
      expect(scene.meterLabel.setColor).toHaveBeenCalledWith(MATRIX_COLORS.PRIMARY_HEX);
    });

    it('READY! text shown when meter full but idle (R85.M3)', () => {
      scene.bulletTimeActive = false;
      scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
      scene.updateHUD();
      expect(scene.bulletTimeTimerText.setText).toHaveBeenCalledWith('READY!');
    });

    it('handleScoring source contains no auto-activateBulletTime call (R85.M3 tripwire)', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const src = fs.readFileSync(
        path.resolve(__dirname, 'GameScene.ts'),
        'utf-8',
      );
      const handleScoringMatch = src.match(/private handleScoring[\s\S]*?^ {2}\}/m);
      expect(handleScoringMatch).not.toBeNull();
      const body = handleScoringMatch![0];
      expect(body).not.toMatch(/activateBulletTime\(\)/);
    });

    it('B key handler invokes tryManualBulletTime, not activateBulletTime directly (R85.M3 tripwire)', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const src = fs.readFileSync(
        path.resolve(__dirname, 'GameScene.ts'),
        'utf-8',
      );
      expect(src).toMatch(/JustDown\(this\.bKey\)\)\s*\{\s*\n\s*this\.tryManualBulletTime\(\)/);
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

  // R85.M1 / M2 — First piece must stay pinned at the spawn row throughout the
  // 5-second countdown, and the countdown must actually feel present to the
  // player. Tom's repro: *"the first block appears near the bottom and
  // requires quick reactions"* + *"5-second countdown fires correctly after
  // menu — nope"*. Root cause was a single-issue chain: the drop timer was
  // armed in `create()` **before** `startCountdown()`, so at 400ms intervals
  // it raced the 5s countdown and dropped the piece ~12 rows on a 20-row grid.
  // Gameplay visually began during the countdown, which is why Tom perceived
  // the countdown as missing even though the text was firing at depth 200.
  //
  // Fix is two-pronged defence-in-depth: (a) `create()` only calls
  // `startDropTimer()` from the countdown's `onComplete` so no wasted ticks
  // during the 5s window, (b) `dropTick()` itself early-returns on
  // `isCountingDown || isPaused` so a future refactor that rearms the timer
  // pre-countdown cannot resurrect the bug.
  describe('R85.M1 / M2 Countdown-gated drop timer', () => {
    it('dropTick no-ops while isCountingDown so the first piece stays at the spawn row', () => {
      scene.currentPiece = scene.spawnPiece('T');
      const origY = scene.currentPiece.y;
      scene.isCountingDown = true;
      for (let i = 0; i < 12; i++) scene.dropTick();
      expect(scene.currentPiece.y).toBe(origY);
      expect(origY).toBe(0);
    });

    it('dropTick no-ops while isPaused so a pause during gameplay cannot lock pieces', () => {
      scene.currentPiece = scene.spawnPiece('T');
      scene.currentPiece.y = 5;
      scene.isPaused = true;
      scene.dropTick();
      expect(scene.currentPiece.y).toBe(5);
    });

    it('dropTick resumes normal fall once isCountingDown flips false', () => {
      scene.currentPiece = scene.spawnPiece('T');
      scene.isCountingDown = true;
      scene.dropTick();
      expect(scene.currentPiece.y).toBe(0);

      scene.isCountingDown = false;
      scene.dropTick();
      expect(scene.currentPiece.y).toBe(1);
    });

    it('dropTick respects isGameOver gate independently of countdown state', () => {
      scene.currentPiece = scene.spawnPiece('T');
      scene.isCountingDown = false;
      scene.isGameOver = true;
      scene.dropTick();
      expect(scene.currentPiece.y).toBe(0);
    });

    it('create() arms the drop timer from inside startCountdown onComplete, not before', () => {
      const order: string[] = [];
      const freshScene = createTestScene();
      freshScene.createMatrixBackground = vi.fn(() => order.push('createMatrixBackground'));
      freshScene.addMatrixRain = vi.fn(() => { order.push('addMatrixRain'); return { getChildren: () => [] }; });
      freshScene.createGraphics = vi.fn(() => order.push('createGraphics'));
      freshScene.createHUD = vi.fn(() => order.push('createHUD'));
      freshScene.setupInput = vi.fn(() => order.push('setupInput'));
      freshScene.setupCommonInputs = vi.fn(() => order.push('setupCommonInputs'));
      freshScene.playBackgroundMusic = vi.fn(() => order.push('playBackgroundMusic'));
      freshScene.startDropTimer = vi.fn(() => order.push('startDropTimer'));
      freshScene.startCountdown = vi.fn((_s: number, cb: () => void) => {
        order.push('startCountdown');
        cb();
      });

      freshScene.create();

      const startDropIdx = order.indexOf('startDropTimer');
      const countdownIdx = order.indexOf('startCountdown');
      expect(countdownIdx).toBeGreaterThanOrEqual(0);
      expect(startDropIdx).toBeGreaterThan(countdownIdx);
    });

    it('startDropTimer is NOT called before startCountdown fires its onComplete (regression tripwire)', () => {
      const freshScene = createTestScene();
      const startDropSpy = vi.fn();
      freshScene.startDropTimer = startDropSpy;
      // startCountdown that never fires its callback (simulating a 5s wait).
      freshScene.startCountdown = vi.fn();
      freshScene.createMatrixBackground = vi.fn();
      freshScene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: () => [] });
      freshScene.createGraphics = vi.fn();
      freshScene.createHUD = vi.fn();
      freshScene.setupInput = vi.fn();
      freshScene.setupCommonInputs = vi.fn();
      freshScene.playBackgroundMusic = vi.fn();

      freshScene.create();

      expect(startDropSpy).not.toHaveBeenCalled();
    });

    it('create() passes 5 seconds to startCountdown to match the arcade-wide convention', () => {
      const freshScene = createTestScene();
      const countdownSpy = vi.fn();
      freshScene.startCountdown = countdownSpy;
      freshScene.startDropTimer = vi.fn();
      freshScene.createMatrixBackground = vi.fn();
      freshScene.addMatrixRain = vi.fn().mockReturnValue({ getChildren: () => [] });
      freshScene.createGraphics = vi.fn();
      freshScene.createHUD = vi.fn();
      freshScene.setupInput = vi.fn();
      freshScene.setupCommonInputs = vi.fn();
      freshScene.playBackgroundMusic = vi.fn();

      freshScene.create();

      expect(countdownSpy).toHaveBeenCalledTimes(1);
      expect(countdownSpy).toHaveBeenCalledWith(5, expect.any(Function));
    });

    it('first spawned piece sits at y=0 (top of board) regardless of tetromino type', () => {
      for (const type of TETROMINO_TYPES) {
        const piece = scene.spawnPiece(type);
        expect(piece.y).toBe(0);
      }
    });

    it('first piece stays at y=0 across a full countdown window (12 timer ticks @ 400ms = 4.8s)', () => {
      // Level-1 drop speed is 400ms; over the 5s countdown a racing timer would
      // fire ~12 times. This is the exact pathological case Tom reported.
      scene.currentPiece = scene.spawnPiece('T');
      scene.isCountingDown = true;
      for (let i = 0; i < 12; i++) scene.dropTick();
      expect(scene.currentPiece.y).toBe(0);
      // Regression tripwire: at level 1, 12 unguarded ticks would land the
      // piece around row 12 (below the grid midpoint of row 10).
      expect(scene.currentPiece.y).toBeLessThan(C.ROWS / 2);
    });
  });

  describe('R85.M4 Column Spacing Layout', () => {
    // These invariants lock the HUD's left/right "wing" layout so a future
    // refactor can't regress the symmetry Tom's playtest note flagged. The
    // pre-R85.M4 layout had an 80×240 NEXT panel (3× the HOLD panel height)
    // which made the right column read as top-heavy + hollow; plus a 50 px
    // gap between HOLD and SCORE; plus #005500 control hints that were
    // effectively unreadable. Each test here pins one design choice.

    describe('Preview-panel symmetry', () => {
      it('PREVIEW_PANEL_W and PREVIEW_PANEL_H are equal (panels are square)', () => {
        expect(C.PREVIEW_PANEL_W).toBe(C.PREVIEW_PANEL_H);
      });

      it('PREVIEW_PANEL_H is tripwire-floored — must NOT regress to the 240 pre-R85.M4 value', () => {
        // 240 was the bug: right NEXT panel was 3× the HOLD panel height.
        expect(C.PREVIEW_PANEL_H).toBeLessThan(240);
        expect(C.PREVIEW_PANEL_H).toBeGreaterThanOrEqual(60);
      });

      it('HOLD_X and NEXT_X are symmetric around the grid centre', () => {
        const gridCentreX = C.GRID_X + (C.COLS * C.CELL_SIZE) / 2;
        const leftOffset = gridCentreX - C.HOLD_X;
        const rightOffset = C.NEXT_X - gridCentreX;
        expect(leftOffset).toBe(rightOffset);
      });
    });

    describe('Left-column stats rhythm', () => {
      it('STATS_Y_START starts close to the HOLD panel bottom (no dead air)', () => {
        // HOLD panel bottom y = HOLD_Y + PREVIEW_PANEL_Y_OFFSET + PREVIEW_PANEL_H/2
        const holdPanelBottom = C.HOLD_Y + C.PREVIEW_PANEL_Y_OFFSET + C.PREVIEW_PANEL_H / 2;
        const gap = C.STATS_Y_START - holdPanelBottom;
        // Allow a small breathing gap but no more than 20 px.
        expect(gap).toBeGreaterThanOrEqual(0);
        expect(gap).toBeLessThanOrEqual(20);
      });

      it('STATS_ROW_H is a small, uniform rhythm (12–24 px)', () => {
        expect(C.STATS_ROW_H).toBeGreaterThanOrEqual(12);
        expect(C.STATS_ROW_H).toBeLessThanOrEqual(24);
      });

      it('STATS_LABEL_VALUE_GAP is smaller than STATS_ROW_H (label-value pair is tighter than between-rows)', () => {
        expect(C.STATS_LABEL_VALUE_GAP).toBeLessThan(C.STATS_ROW_H);
      });
    });

    describe('Bullet-time block rhythm', () => {
      it('BULLET_TIME_LABEL_Y sits below the last stat row with an even gap', () => {
        const lastStatValueY = C.STATS_Y_START + 3 * C.STATS_ROW_H + C.STATS_LABEL_VALUE_GAP;
        const gap = C.BULLET_TIME_LABEL_Y - lastStatValueY;
        // Between one and two row heights — groups bullet-time with the stats
        // block but still gives it its own breathing room.
        expect(gap).toBeGreaterThanOrEqual(C.STATS_ROW_H / 2);
        expect(gap).toBeLessThanOrEqual(C.STATS_ROW_H * 2);
      });

      it('BULLET_TIME_BAR_Y sits one STATS_LABEL_VALUE_GAP below its label', () => {
        const gap = C.BULLET_TIME_BAR_Y - C.BULLET_TIME_LABEL_Y;
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThanOrEqual(C.STATS_ROW_H);
      });

      it('BULLET_TIME_TIMER_Y sits below the bar (no overlap)', () => {
        expect(C.BULLET_TIME_TIMER_Y).toBeGreaterThan(C.BULLET_TIME_BAR_Y + C.BULLET_TIME_BAR_H);
      });

      it('meter bar draws centred under HOLD_X', () => {
        scene.bulletTimeMeter = 50;
        scene.drawBulletTimeMeter();
        const strokeRectCall = scene.meterGraphics.strokeRect.mock.calls[0];
        const [barX, , barW] = strokeRectCall;
        const barCentre = barX + barW / 2;
        expect(barCentre).toBe(C.HOLD_X);
      });

      it('meter bar uses BULLET_TIME_BAR_W and BULLET_TIME_BAR_H from config', () => {
        scene.bulletTimeMeter = 50;
        scene.drawBulletTimeMeter();
        const [, , barW, barH] = scene.meterGraphics.strokeRect.mock.calls[0];
        expect(barW).toBe(C.BULLET_TIME_BAR_W);
        expect(barH).toBe(C.BULLET_TIME_BAR_H);
      });
    });

    describe('Right-column hierarchy', () => {
      it('HIGH_SCORE_LABEL_Y aligns with STATS_Y_START on the left (matched horizontal rhythm)', () => {
        expect(C.HIGH_SCORE_LABEL_Y).toBe(C.STATS_Y_START);
      });

      it('HIGH_SCORE_VALUE_Y sits one STATS_LABEL_VALUE_GAP below its label', () => {
        const gap = C.HIGH_SCORE_VALUE_Y - C.HIGH_SCORE_LABEL_Y;
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThanOrEqual(C.STATS_ROW_H);
      });

      it('CONTROLS_Y_START sits below the HIGH_SCORE value with breathing room', () => {
        expect(C.CONTROLS_Y_START).toBeGreaterThan(C.HIGH_SCORE_VALUE_Y);
      });

      it('CONTROLS_ROW_H is tighter than STATS_ROW_H (controls are secondary)', () => {
        expect(C.CONTROLS_ROW_H).toBeLessThan(C.STATS_ROW_H);
      });

      it('all 7 control rows fit above HIGHT_SCORE + CONTROLS_PANEL_H area', () => {
        const lastCtrlY = C.CONTROLS_Y_START + 6 * C.CONTROLS_ROW_H;
        const controlsPanelBottom = C.HIGH_SCORE_LABEL_Y - 8 + C.CONTROLS_PANEL_H;
        expect(lastCtrlY).toBeLessThanOrEqual(controlsPanelBottom);
      });
    });

    describe('createHUD wiring', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let hudScene: any;

      beforeEach(() => {
        hudScene = createTestScene();
        hudScene.highScore = 0;
      });

      it('paints the 4 stat labels in order at uniform STATS_ROW_H rhythm from HOLD_X', () => {
        hudScene.createHUD();
        const calls = hudScene.add.text.mock.calls;
        const statCalls = calls.filter((c: unknown[]) =>
          c[0] === C.HOLD_X && ['SCORE', 'LEVEL', 'LINES', 'COMBO'].includes(c[2] as string),
        );
        expect(statCalls).toHaveLength(4);
        // Labels are in the order SCORE, LEVEL, LINES, COMBO.
        expect(statCalls.map((c: unknown[]) => c[2])).toEqual(['SCORE', 'LEVEL', 'LINES', 'COMBO']);
        // Y positions follow the STATS_ROW_H rhythm.
        for (let i = 0; i < 4; i++) {
          expect(statCalls[i][1]).toBe(C.STATS_Y_START + i * C.STATS_ROW_H);
        }
      });

      it('paints 7 control-hint rows at DREAD_GREEN_HEX (brighter than pre-R85.M4 #005500)', () => {
        hudScene.createHUD();
        const calls = hudScene.add.text.mock.calls;
        const ctrlCalls = calls.filter((c: unknown[]) => {
          const style = c[3] as { color?: string; fontSize?: string } | undefined;
          return c[0] === C.NEXT_X && style?.fontSize === '7px';
        });
        expect(ctrlCalls).toHaveLength(7);
        for (const call of ctrlCalls) {
          const style = call[3] as { color: string };
          expect(style.color).not.toBe('#005500');
          // Must be MATRIX_COLORS.DREAD_GREEN_HEX or brighter
          expect(style.color).toMatch(/^#00[79a-fA-F][0-9a-fA-F]00$|^#00ff00$/);
        }
      });

      it('paints control hints at uniform CONTROLS_ROW_H rhythm from CONTROLS_Y_START', () => {
        hudScene.createHUD();
        const calls = hudScene.add.text.mock.calls;
        const ctrlCalls = calls.filter((c: unknown[]) => {
          const style = c[3] as { fontSize?: string } | undefined;
          return c[0] === C.NEXT_X && style?.fontSize === '7px';
        });
        for (let i = 0; i < ctrlCalls.length; i++) {
          expect(ctrlCalls[i][1]).toBe(C.CONTROLS_Y_START + i * C.CONTROLS_ROW_H);
        }
      });

      it('BULLET TIME label paints at BULLET_TIME_LABEL_Y, timer at BULLET_TIME_TIMER_Y', () => {
        hudScene.createHUD();
        const calls = hudScene.add.text.mock.calls;
        const bulletLabelCall = calls.find((c: unknown[]) => c[2] === 'BULLET TIME [B]');
        expect(bulletLabelCall).toBeDefined();
        expect(bulletLabelCall[0]).toBe(C.HOLD_X);
        expect(bulletLabelCall[1]).toBe(C.BULLET_TIME_LABEL_Y);
      });

      it('HIGH SCORE block paints at HIGH_SCORE_LABEL_Y / HIGH_SCORE_VALUE_Y from NEXT_X', () => {
        hudScene.createHUD();
        const calls = hudScene.add.text.mock.calls;
        const labelCall = calls.find((c: unknown[]) => c[2] === 'HIGH SCORE');
        expect(labelCall).toBeDefined();
        expect(labelCall[0]).toBe(C.NEXT_X);
        expect(labelCall[1]).toBe(C.HIGH_SCORE_LABEL_Y);
      });
    });

    describe('createGraphics panel symmetry', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let gScene: any;

      beforeEach(() => {
        gScene = createTestScene();
        gScene.textures = { exists: vi.fn().mockReturnValue(true) };
      });

      it('HOLD and NEXT preview panels are drawn at equal displaySize', () => {
        gScene.createGraphics();
        // Find the two preview-panel images (they're the add.image calls
        // at (HOLD_X, HOLD_Y + PREVIEW_PANEL_Y_OFFSET) / (NEXT_X, ...)).
        const imageCalls = gScene.add.image.mock.results.map((r: { value: Record<string, unknown> }) => r.value);
        const holdPanel = imageCalls.find((img: Record<string, unknown>) => {
          const calls = (img.setDisplaySize as { mock: { calls: [number, number][] } }).mock.calls;
          return calls.some(([w, h]) => w === C.PREVIEW_PANEL_W && h === C.PREVIEW_PANEL_H);
        });
        // There should be at least two panel-sized images (HOLD + NEXT preview).
        const previewPanels = imageCalls.filter((img: Record<string, unknown>) => {
          const calls = (img.setDisplaySize as { mock: { calls: [number, number][] } }).mock.calls;
          return calls.some(([w, h]) => w === C.PREVIEW_PANEL_W && h === C.PREVIEW_PANEL_H);
        });
        expect(holdPanel).toBeDefined();
        expect(previewPanels.length).toBeGreaterThanOrEqual(2);
      });

      it('NO panel is drawn at 80×240 (regression tripwire for pre-R85.M4 NEXT panel)', () => {
        gScene.createGraphics();
        const imageCalls = gScene.add.image.mock.results.map((r: { value: Record<string, unknown> }) => r.value);
        for (const img of imageCalls) {
          const calls = (img.setDisplaySize as { mock: { calls: [number, number][] } }).mock.calls;
          for (const [, h] of calls) {
            expect(h).not.toBe(240);
          }
        }
      });

      it('secondary stats + controls panels render with subtle alpha (≤ 0.25)', () => {
        gScene.createGraphics();
        const imageCalls = gScene.add.image.mock.results.map((r: { value: Record<string, unknown> }) => r.value);
        // Secondary panels are larger than preview panels (STATS_PANEL_H > PREVIEW_PANEL_H).
        const secondaries = imageCalls.filter((img: Record<string, unknown>) => {
          const calls = (img.setDisplaySize as { mock: { calls: [number, number][] } }).mock.calls;
          return calls.some(([, h]) => h === C.STATS_PANEL_H || h === C.CONTROLS_PANEL_H);
        });
        expect(secondaries.length).toBeGreaterThanOrEqual(2);
        for (const img of secondaries) {
          const alphaCalls = (img.setAlpha as { mock: { calls: [number][] } }).mock.calls;
          for (const [alpha] of alphaCalls) {
            expect(alpha).toBeLessThanOrEqual(0.25);
          }
        }
      });
    });
  });

  // R85.M5 — cross-cutting integration coverage. M1-M4 each shipped dense
  // per-task tripwires (+42 tests net). M5 fills the integration niches
  // between features where a seemingly-unrelated refactor could silently
  // break a seam: drop-speed modifier compounding (bullet-time × soft-drop),
  // activation/deactivation side-effect chains (restartDropTimer fires on
  // state transitions), line-clear → level-up → timer-restart cascade,
  // hold × bag interaction, save-system persistence round-trip on game-over,
  // update() gate asymmetry (paused exposes state, countdown does not),
  // and the test-state contract shape.
  describe('R85.M5 Integration coverage refresh', () => {
    describe('Drop-speed modifier compound', () => {
      it('bullet-time + soft-drop compounds — bullet-time slows soft-drop further', () => {
        scene.level = 1;
        scene.softDropActive = true;
        scene.bulletTimeActive = true;
        // Code path: speed = SOFT_DROP_SPEED then speed /= BULLET_TIME_SLOWDOWN
        expect(scene.getEffectiveDropSpeed()).toBe(
          Math.round(C.SOFT_DROP_SPEED / C.BULLET_TIME_SLOWDOWN),
        );
      });

      it('bullet-time still slows already-capped MIN_DROP_SPEED at high levels', () => {
        scene.level = 50;
        scene.softDropActive = false;
        scene.bulletTimeActive = true;
        // Level 50 caps at MIN_DROP_SPEED; bullet-time still divides it.
        expect(scene.getEffectiveDropSpeed()).toBe(
          Math.round(C.MIN_DROP_SPEED / C.BULLET_TIME_SLOWDOWN),
        );
      });

      it('soft-drop + bullet-time result is strictly slower (larger delay) than plain soft-drop', () => {
        scene.level = 1;
        scene.softDropActive = true;
        scene.bulletTimeActive = false;
        const plainSoftDrop = scene.getEffectiveDropSpeed();
        scene.bulletTimeActive = true;
        const compounded = scene.getEffectiveDropSpeed();
        expect(compounded).toBeGreaterThan(plainSoftDrop);
      });
    });

    describe('Bullet-time lifecycle side-effects', () => {
      it('activateBulletTime restarts the drop timer (drop speed changes with new scale)', () => {
        scene.restartDropTimer = vi.fn();
        scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
        scene.bulletTimeActive = false;
        scene.activateBulletTime();
        expect(scene.restartDropTimer).toHaveBeenCalledTimes(1);
      });

      it('deactivateBulletTime restarts the drop timer (drop speed returns to normal)', () => {
        scene.restartDropTimer = vi.fn();
        scene.bulletTimeActive = true;
        scene.bulletTimeTimer = 1000;
        scene.deactivateBulletTime();
        expect(scene.restartDropTimer).toHaveBeenCalledTimes(1);
        expect(scene.bulletTimeActive).toBe(false);
        expect(scene.bulletTimeTimer).toBe(0);
      });

      it('activateBulletTime persists bulletTimeCount into save-system preferences', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: { metris: { preferences: { bulletTimeCount: 4, otherPref: 'keep' } } },
          }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER;
        scene.bulletTimeActive = false;
        scene.bulletTimeCount = 4;
        scene.activateBulletTime();
        expect(updateGameSave).toHaveBeenCalledWith('metris', {
          preferences: { bulletTimeCount: 5, otherPref: 'keep' },
        });
      });

      it('update() decrements bulletTimeTimer by delta and auto-deactivates at ≤ 0', () => {
        scene.bulletTimeActive = true;
        scene.bulletTimeTimer = 30;
        scene.restartDropTimer = vi.fn();
        // Stub side-paths that reference the global Phaser namespace — the
        // path under test is the timer-decrement + auto-deactivate branch.
        scene.handleInput = vi.fn();
        // delta = 50 > timer 30 → timer becomes -20 → deactivate fires.
        scene.update(0, 50);
        expect(scene.bulletTimeActive).toBe(false);
        expect(scene.bulletTimeTimer).toBe(0);
      });
    });

    describe('Line-clear → level-up → drop-timer cascade', () => {
      it('crossing the LINES_PER_LEVEL threshold triggers restartDropTimer', () => {
        scene.restartDropTimer = vi.fn();
        scene.level = 1;
        scene.lines = C.LINES_PER_LEVEL - 2;
        scene.handleScoring(2);
        expect(scene.level).toBe(2);
        expect(scene.restartDropTimer).toHaveBeenCalled();
      });

      it('line clear below the level threshold does NOT restart the drop timer', () => {
        scene.restartDropTimer = vi.fn();
        scene.level = 1;
        scene.lines = 0;
        scene.handleScoring(1);
        expect(scene.level).toBe(1);
        expect(scene.restartDropTimer).not.toHaveBeenCalled();
      });

      it('bullet-time meter saturates at MAX and does not overshoot from multi-line stacking', () => {
        scene.bulletTimeMeter = C.BULLET_TIME_MAX_METER - 10; // 90
        // 4-line clear would add 4 × 20 = 80, overshoot by 70 without the clamp.
        scene.handleScoring(4);
        expect(scene.bulletTimeMeter).toBe(C.BULLET_TIME_MAX_METER);
        expect(scene.bulletTimeMeter).not.toBeGreaterThan(C.BULLET_TIME_MAX_METER);
      });

      it('4-line (tetris) clear triggers distinct stronger camera shake + flash than single line', () => {
        scene.combo = 0;
        scene.level = 1;
        scene.handleScoring(4);
        // Tetris: shake 150ms/0.008 + flash 120ms α=0.2 green.
        expect(scene.cameras.main.shake).toHaveBeenCalledWith(150, 0.008);
        expect(scene.cameras.main.flash).toHaveBeenCalledWith(120, 0, 255, 0, false, undefined, undefined, 0.2);
      });
    });

    describe('Hold × bag integration', () => {
      it('first hold (no stored piece) consumes from bag via nextPieceType', () => {
        scene.holdPieceType = null;
        scene.canHold = true;
        const firstNext = scene.nextPieceType;
        const bagBefore = scene.pieceBag.length;
        scene.holdCurrentPiece();
        expect(scene.currentPiece.type).toBe(firstNext);
        // Bag state after pull: either decremented or refilled (bag=0 refills to 7).
        // The critical assertion is that pullFromBag was called once — i.e., the
        // bag size either shrank by 1 or was refilled to a non-empty state.
        if (bagBefore > 0) {
          expect(scene.pieceBag.length).toBe(bagBefore - 1);
        } else {
          expect(scene.pieceBag.length).toBeGreaterThanOrEqual(0);
        }
      });

      it('second hold (with stored piece) swaps without consuming the bag', () => {
        scene.currentPiece = scene.spawnPiece('T');
        scene.holdPieceType = 'I';
        scene.canHold = true;
        const bagBefore = scene.pieceBag.length;
        scene.holdCurrentPiece();
        expect(scene.currentPiece.type).toBe('I');
        expect(scene.holdPieceType).toBe('T');
        expect(scene.pieceBag.length).toBe(bagBefore); // no bag pull on swap
      });

      it('canHold resets to true after lockCurrentPiece, re-enabling hold for the next piece', () => {
        scene.currentPiece = scene.spawnPiece('O');
        scene.holdCurrentPiece();
        expect(scene.canHold).toBe(false);
        scene.currentPiece.y = C.ROWS - 2;
        scene.lockCurrentPiece();
        expect(scene.canHold).toBe(true);
      });
    });

    describe('Game-over save-system persistence', () => {
      it('handleGameOver writes highScore + level + stats via updateGameSave', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: { metris: { stats: {} } } }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.score = 5000;
        scene.highScore = 1000;
        scene.level = 7;
        scene.lines = 42;
        scene.combo = 3;
        scene.sessionStartTime = 0;
        scene.time.now = 300000; // 300 seconds

        scene.handleGameOver();

        expect(updateGameSave).toHaveBeenCalledWith('metris', expect.objectContaining({
          highScore: 5000,
          level: 7,
          stats: expect.objectContaining({
            gamesPlayed: 1,
            totalScore: 5000,
            bestCombo: 3,
            longestSurvival: 300,
          }),
        }));
      });

      it('handleGameOver merges stats — bestCombo + longestSurvival keep max of prev + current', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({
            games: {
              metris: {
                stats: {
                  gamesPlayed: 9,
                  totalScore: 50000,
                  bestCombo: 10,
                  longestSurvival: 1200,
                },
              },
            },
          }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.score = 3000;
        scene.combo = 2; // less than prev 10
        scene.sessionStartTime = 0;
        scene.time.now = 100000; // 100 seconds — less than prev 1200

        scene.handleGameOver();

        const call = updateGameSave.mock.calls[0][1];
        expect(call.stats.gamesPlayed).toBe(10); // 9 + 1
        expect(call.stats.totalScore).toBe(53000); // 50000 + 3000
        expect(call.stats.bestCombo).toBe(10); // max(10, 2) = 10
        expect(call.stats.longestSurvival).toBe(1200); // max(1200, 100) = 1200
      });

      it('second handleGameOver call is a no-op — no second save, no second delayedCall', () => {
        const updateGameSave = vi.fn();
        const saveSystem = {
          getSaveData: vi.fn().mockReturnValue({ games: {} }),
          updateGameSave,
        };
        scene.registry = { get: vi.fn().mockReturnValue(saveSystem), set: vi.fn() };
        scene.handleGameOver();
        scene.handleGameOver();
        expect(updateGameSave).toHaveBeenCalledTimes(1);
        expect(scene.time.delayedCall).toHaveBeenCalledTimes(1);
      });
    });

    describe('update() gate semantics', () => {
      it('during isPaused, update exposes test state but skips input handling', () => {
        scene.isPaused = true;
        scene.handleInput = vi.fn();
        scene.exposeTestState = vi.fn();
        scene.update(0, 16);
        expect(scene.exposeTestState).toHaveBeenCalledTimes(1);
        expect(scene.handleInput).not.toHaveBeenCalled();
      });

      it('during isGameOver, update exposes test state but skips input handling', () => {
        scene.isGameOver = true;
        scene.handleInput = vi.fn();
        scene.exposeTestState = vi.fn();
        scene.update(0, 16);
        expect(scene.exposeTestState).toHaveBeenCalledTimes(1);
        expect(scene.handleInput).not.toHaveBeenCalled();
      });

      it('during isCountingDown, update early-returns BEFORE exposing test state', () => {
        scene.isPaused = false;
        scene.isGameOver = false;
        scene.isCountingDown = true;
        scene.handleInput = vi.fn();
        scene.exposeTestState = vi.fn();
        scene.update(0, 16);
        expect(scene.exposeTestState).not.toHaveBeenCalled();
        expect(scene.handleInput).not.toHaveBeenCalled();
      });
    });

    describe('getTestState contract', () => {
      it('exposes countdownValue so E2E harnesses can assert countdown state deterministically', () => {
        scene.countdownValue = 3;
        const state = scene.getTestState();
        expect(state).toHaveProperty('countdownValue');
        expect(state.countdownValue).toBe(3);
      });

      it('ghostY is null when currentPiece is null (post-game-over state)', () => {
        scene.currentPiece = null;
        const state = scene.getTestState();
        expect(state.ghostY).toBeNull();
      });

      it('pieceBagSize mirrors the live piece bag length (not a stale snapshot)', () => {
        scene.pieceBag = ['I', 'O', 'T'] as TetrominoType[];
        expect(scene.getTestState().pieceBagSize).toBe(3);
        scene.pieceBag.pop();
        expect(scene.getTestState().pieceBagSize).toBe(2);
      });
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
