import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { SCENE_KEYS, MATRIX_COLORS } from '@/lib/phaser/types';
import { GAME_CONFIG, POWERUP_DEFS, type EnemyType, type PowerUpType } from '../config';

const SPRITE_ASSETS = [
  { key: 'sprite_player', path: 'assets/matrix-invaders/player.png' },
  { key: 'sprite_enemy_code', path: 'assets/matrix-invaders/enemy_code.png' },
  { key: 'sprite_enemy_agent', path: 'assets/matrix-invaders/enemy_agent.png' },
  { key: 'sprite_enemy_sentinel', path: 'assets/matrix-invaders/enemy_sentinel.png' },
  { key: 'sprite_enemy_virus', path: 'assets/matrix-invaders/enemy_virus.png' },
  { key: 'sprite_bullet_player', path: 'assets/matrix-invaders/bullet_player.png' },
  { key: 'sprite_bullet_enemy', path: 'assets/matrix-invaders/bullet_enemy.png' },
  { key: 'laser_green', path: 'assets/matrix-invaders/laser_green.png' },
  { key: 'laser_red', path: 'assets/matrix-invaders/laser_red.png' },
  { key: 'backdrop', path: 'assets/matrix-invaders/backdrop.png' },
];

export class MatrixInvadersBootScene extends BootScene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT, nextScene: SCENE_KEYS.MENU });
  }

  protected loadCommonAssets(): void {
    for (const { key, path } of SPRITE_ASSETS) {
      this.load.image(key, path);
    }
  }

  create(): void {
    const spritesLoaded = this.textures.exists('sprite_player');
    this.game.registry.set('spriteMode', spritesLoaded);

    if (!spritesLoaded) {
      this.createPlayerTextures();
    }
    // R85.I1: enemies always use procedural UFO/battleship silhouettes.
    // The PNG fallbacks render as face-like blobs at scale (Tom's
    // "look like pigs" playtest note) — the procedural path is the
    // canonical source so the sprite sheet is intentionally ignored here.
    this.createEnemyTextures();
    this.createBossTexture();
    if (!this.textures.exists('sprite_bullet_player')) {
      this.createBulletTextures();
    }
    this.createPowerUpTextures();
    super.create();
  }

  private createPlayerTextures(): void {
    const W = GAME_CONFIG.PLAYER_WIDTH;
    const H = GAME_CONFIG.PLAYER_HEIGHT;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    g.fillRect(4, Math.floor(H * 0.4), W - 8, Math.ceil(H * 0.6));
    g.fillTriangle(W / 2, 0, 4, Math.floor(H * 0.4), W - 4, Math.floor(H * 0.4));
    g.fillStyle(0xffffff, 1);
    g.fillCircle(W / 2, Math.floor(H * 0.35), 3);
    g.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    g.fillRect(8, H - 4, 6, 4);
    g.fillRect(W - 14, H - 4, 6, 4);
    g.generateTexture('player', W, H);
    g.destroy();

    const gs = this.make.graphics({ x: 0, y: 0 });
    gs.fillStyle(MATRIX_COLORS.MEDIUM_GREEN, 1);
    gs.fillRect(4, Math.floor(H * 0.4), W - 8, Math.ceil(H * 0.6));
    gs.fillTriangle(W / 2, 0, 4, Math.floor(H * 0.4), W - 4, Math.floor(H * 0.4));
    gs.fillStyle(0xffffff, 1);
    gs.fillCircle(W / 2, Math.floor(H * 0.35), 3);
    gs.fillStyle(MATRIX_COLORS.CYAN, 0.8);
    gs.fillRect(8, H - 4, 6, 4);
    gs.fillRect(W - 14, H - 4, 6, 4);
    gs.lineStyle(2, MATRIX_COLORS.MAGENTA, 0.7);
    gs.strokeCircle(W / 2, H / 2, Math.max(W, H) * 0.55);
    gs.generateTexture('player_shield', W, H);
    gs.destroy();
  }

  /**
   * R85.I1: UFO / battleship silhouettes per enemy type.
   *
   * Drawn in pure white (0xffffff) with varying alpha — the GameScene applies
   * ROW_TINTS via setTint(), and Phaser tint multiplies with the texture. A
   * white base means each row comes through as its pure tint colour; tinting
   * a green-filled texture would zero the non-green channels and hide the
   * per-row variation entirely.
   *
   * Shapes intentionally avoid the round "eye" pairs that made the previous
   * sprites read as faces at small scale. Silhouettes are symmetric around
   * the horizontal centre so left/right marching motion stays readable.
   */
  private createEnemyTextures(): void {
    const W = GAME_CONFIG.ENEMY_WIDTH;
    const H = GAME_CONFIG.ENEMY_HEIGHT;
    const WHITE = MATRIX_COLORS.WHITE;

    const builders: Record<EnemyType, (g: Phaser.GameObjects.Graphics) => void> = {
      // code — classic flying saucer: dome + disc + three portholes
      code: (g) => {
        // Lower disc body (wide ellipse approximated via two overlapping rounded rects)
        g.fillStyle(WHITE, 1);
        g.fillRoundedRect(2, Math.floor(H * 0.55), W - 4, Math.floor(H * 0.2), 4);
        // Dome on top (smaller rounded rect)
        g.fillStyle(WHITE, 0.85);
        g.fillRoundedRect(Math.floor(W * 0.3), Math.floor(H * 0.25), Math.floor(W * 0.4), Math.floor(H * 0.35), 6);
        // Rim highlight under the dome
        g.fillStyle(WHITE, 0.55);
        g.fillRect(2, Math.floor(H * 0.52), W - 4, 2);
        // Three portholes along the disc bottom
        g.fillStyle(WHITE, 0.4);
        g.fillCircle(Math.floor(W * 0.28), Math.floor(H * 0.66), 2);
        g.fillCircle(Math.floor(W * 0.5),  Math.floor(H * 0.66), 2);
        g.fillCircle(Math.floor(W * 0.72), Math.floor(H * 0.66), 2);
      },

      // agent — twin-pod battleship: central V-hull, side gun pods, prow spike
      agent: (g) => {
        // Central V-shaped fuselage (two triangles joined at the waist)
        g.fillStyle(WHITE, 1);
        g.fillTriangle(W / 2, Math.floor(H * 0.15), Math.floor(W * 0.3), Math.floor(H * 0.5), Math.floor(W * 0.7), Math.floor(H * 0.5));
        g.fillTriangle(Math.floor(W * 0.3), Math.floor(H * 0.5), Math.floor(W * 0.7), Math.floor(H * 0.5), W / 2, Math.floor(H * 0.85));
        // Side gun pods
        g.fillStyle(WHITE, 0.9);
        g.fillRoundedRect(Math.floor(W * 0.05), Math.floor(H * 0.4), Math.floor(W * 0.18), Math.floor(H * 0.28), 2);
        g.fillRoundedRect(Math.floor(W * 0.77), Math.floor(H * 0.4), Math.floor(W * 0.18), Math.floor(H * 0.28), 2);
        // Gun barrels pointing down
        g.fillStyle(WHITE, 0.7);
        g.fillRect(Math.floor(W * 0.12), Math.floor(H * 0.68), 2, Math.floor(H * 0.18));
        g.fillRect(Math.floor(W * 0.86), Math.floor(H * 0.68), 2, Math.floor(H * 0.18));
        // Forward prow spike under fuselage
        g.fillStyle(WHITE, 0.95);
        g.fillTriangle(W / 2 - 2, Math.floor(H * 0.75), W / 2 + 2, Math.floor(H * 0.75), W / 2, Math.floor(H * 0.95));
      },

      // sentinel — heavy hex cruiser: armoured hull + corner spikes + turret
      sentinel: (g) => {
        // Hex body (approximated with a rectangle + two triangles per side)
        g.fillStyle(WHITE, 1);
        g.fillRect(Math.floor(W * 0.2), Math.floor(H * 0.3), Math.floor(W * 0.6), Math.floor(H * 0.5));
        g.fillTriangle(Math.floor(W * 0.2), Math.floor(H * 0.3), Math.floor(W * 0.2), Math.floor(H * 0.8), Math.floor(W * 0.08), Math.floor(H * 0.55));
        g.fillTriangle(Math.floor(W * 0.8), Math.floor(H * 0.3), Math.floor(W * 0.8), Math.floor(H * 0.8), Math.floor(W * 0.92), Math.floor(H * 0.55));
        // Corner spikes (top-left + top-right)
        g.fillStyle(WHITE, 0.95);
        g.fillTriangle(Math.floor(W * 0.12), Math.floor(H * 0.3), Math.floor(W * 0.02), Math.floor(H * 0.08), Math.floor(W * 0.22), Math.floor(H * 0.22));
        g.fillTriangle(Math.floor(W * 0.88), Math.floor(H * 0.3), Math.floor(W * 0.98), Math.floor(H * 0.08), Math.floor(W * 0.78), Math.floor(H * 0.22));
        // Central turret dome
        g.fillStyle(WHITE, 0.75);
        g.fillCircle(W / 2, Math.floor(H * 0.55), Math.floor(H * 0.2));
        // Engine bar along bottom
        g.fillStyle(WHITE, 0.55);
        g.fillRect(Math.floor(W * 0.3), Math.floor(H * 0.82), Math.floor(W * 0.4), 2);
      },

      // virus — crystalline diamond with four angular spikes and pulse core
      virus: (g) => {
        // Diamond core (four triangles meeting at centre)
        g.fillStyle(WHITE, 1);
        g.fillTriangle(W / 2, Math.floor(H * 0.15), Math.floor(W * 0.85), H / 2, W / 2, H / 2);
        g.fillTriangle(Math.floor(W * 0.85), H / 2, W / 2, Math.floor(H * 0.85), W / 2, H / 2);
        g.fillTriangle(W / 2, Math.floor(H * 0.85), Math.floor(W * 0.15), H / 2, W / 2, H / 2);
        g.fillTriangle(Math.floor(W * 0.15), H / 2, W / 2, Math.floor(H * 0.15), W / 2, H / 2);
        // Four diagonal spike protrusions
        g.fillStyle(WHITE, 0.85);
        g.fillTriangle(Math.floor(W * 0.25), Math.floor(H * 0.35), Math.floor(W * 0.05), Math.floor(H * 0.15), Math.floor(W * 0.2), Math.floor(H * 0.5));
        g.fillTriangle(Math.floor(W * 0.75), Math.floor(H * 0.35), Math.floor(W * 0.95), Math.floor(H * 0.15), Math.floor(W * 0.8), Math.floor(H * 0.5));
        g.fillTriangle(Math.floor(W * 0.25), Math.floor(H * 0.65), Math.floor(W * 0.05), Math.floor(H * 0.85), Math.floor(W * 0.2), Math.floor(H * 0.5));
        g.fillTriangle(Math.floor(W * 0.75), Math.floor(H * 0.65), Math.floor(W * 0.95), Math.floor(H * 0.85), Math.floor(W * 0.8), Math.floor(H * 0.5));
        // Inner pulse core (tint shows through brightest here)
        g.fillStyle(WHITE, 0.5);
        g.fillCircle(W / 2, H / 2, Math.floor(H * 0.15));
      },
    };

    for (const type of Object.keys(builders) as EnemyType[]) {
      const g = this.make.graphics({ x: 0, y: 0 });
      builders[type](g);
      g.generateTexture(`enemy_${type}`, W, H);
      g.destroy();
    }
  }

  private createBossTexture(): void {
    const W = GAME_CONFIG.BOSS_WIDTH;
    const H = GAME_CONFIG.BOSS_HEIGHT;

    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(MATRIX_COLORS.MAGENTA, 0.6);
    g.fillRoundedRect(4, 4, W - 8, H - 8, 6);
    g.lineStyle(2, MATRIX_COLORS.MAGENTA, 1);
    g.strokeRoundedRect(4, 4, W - 8, H - 8, 6);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.35), 5);
    g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.35), 5);
    g.fillStyle(MATRIX_COLORS.RED, 1);
    g.fillCircle(Math.floor(W * 0.35), Math.floor(H * 0.35), 2);
    g.fillCircle(Math.floor(W * 0.65), Math.floor(H * 0.35), 2);

    g.lineStyle(2, MATRIX_COLORS.RED, 0.8);
    g.strokeRect(Math.floor(W * 0.3), Math.floor(H * 0.6), Math.floor(W * 0.4), Math.floor(H * 0.15));

    g.fillStyle(MATRIX_COLORS.RED, 0.8);
    g.fillRect(Math.floor(W * 0.2), H - 8, 8, 8);
    g.fillRect(Math.floor(W / 2) - 4, H - 8, 8, 8);
    g.fillRect(Math.floor(W * 0.8) - 8, H - 8, 8, 8);

    g.generateTexture('boss', W, H);
    g.destroy();
  }

  private createBulletTextures(): void {
    const gp = this.make.graphics({ x: 0, y: 0 });
    gp.fillStyle(MATRIX_COLORS.PRIMARY, 1);
    gp.fillRect(0, 0, GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT);
    gp.generateTexture('bullet_player', GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT);
    gp.destroy();

    // R85.I3: enemy bullet as a layered threat — outer red halo, red body,
    // bright white-hot core column. Three layers give the bullet edge
    // anti-aliasing against the matrix-rain + scanline backdrop that the
    // previous flat red 3×6 rect couldn't compete with.
    const w = GAME_CONFIG.ENEMY_BULLET_WIDTH;
    const h = GAME_CONFIG.ENEMY_BULLET_HEIGHT;
    const ge = this.make.graphics({ x: 0, y: 0 });
    // Outer halo — full extent, low alpha (glow feel)
    ge.fillStyle(MATRIX_COLORS.RED, 0.35);
    ge.fillRoundedRect(0, 0, w, h, Math.min(3, Math.floor(w / 2)));
    // Inner body — centre 60% of width, solid red
    ge.fillStyle(MATRIX_COLORS.RED, 1);
    const bodyX = Math.floor(w * 0.2);
    const bodyW = Math.max(2, Math.floor(w * 0.6));
    ge.fillRect(bodyX, 1, bodyW, h - 2);
    // Hot core — 2px bright white column for contrast
    ge.fillStyle(0xffffff, 0.9);
    const coreX = Math.max(0, Math.floor(w / 2) - 1);
    ge.fillRect(coreX, 2, 2, h - 4);
    ge.generateTexture('bullet_enemy', w, h);
    ge.destroy();
  }

  private createPowerUpTextures(): void {
    const S = GAME_CONFIG.POWERUP_SIZE;

    for (const [type, def] of Object.entries(POWERUP_DEFS) as [PowerUpType, (typeof POWERUP_DEFS)[PowerUpType]][]) {
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(def.color, 0.3);
      g.fillCircle(S / 2, S / 2, S / 2);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(S / 2, S / 2, S / 2 - 1);

      g.fillStyle(def.color, 1);
      if (type === 'rapidFire') {
        g.fillRect(Math.floor(S * 0.25), Math.floor(S * 0.3), 2, Math.floor(S * 0.4));
        g.fillRect(Math.floor(S * 0.5) - 1, Math.floor(S * 0.25), 2, Math.floor(S * 0.5));
        g.fillRect(Math.floor(S * 0.75) - 2, Math.floor(S * 0.3), 2, Math.floor(S * 0.4));
      } else if (type === 'shield') {
        g.fillCircle(S / 2, S / 2, Math.floor(S * 0.25));
      } else if (type === 'scoreMultiplier') {
        g.lineStyle(2, def.color, 1);
        g.lineBetween(S * 0.3, S * 0.3, S * 0.7, S * 0.7);
        g.lineBetween(S * 0.7, S * 0.3, S * 0.3, S * 0.7);
      } else {
        g.fillCircle(S / 2, S / 2, Math.floor(S * 0.2));
        g.lineStyle(2, def.color, 1);
        g.lineBetween(S / 2, Math.floor(S * 0.3), Math.floor(S * 0.65), Math.floor(S * 0.15));
      }

      g.generateTexture(`powerup_${type}`, S, S);
      g.destroy();
    }
  }
}
