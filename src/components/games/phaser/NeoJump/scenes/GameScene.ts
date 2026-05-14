/**
 * Neo Jump - Game Scene
 *
 * Doodle Jump-style vertical platformer:
 * - Auto-bounce on platforms
 * - Platform types: Normal, Moving, Spring, Disappearing, Breakable
 * - Shoot projectiles to kill enemies
 * - Jetpack power-up for controlled flight
 * - Camera follows player upward
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, SOUND_KEYS, REGISTRY_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/** Platform types */
type PlatformType = 'normal' | 'moving' | 'spring' | 'disappearing' | 'breakable';

/** Platform sprite with type data */
interface Platform extends Phaser.Physics.Arcade.Sprite {
  platformType: PlatformType;
  moveDirection?: number;
  moveSpeed?: number;
  isUsed?: boolean;
  originalY?: number;
  springCompressed?: boolean;
}

/** Enemy sprite */
interface Enemy extends Phaser.Physics.Arcade.Sprite {
  direction: number;
  speed: number;
  isDying: boolean;
}

/** Collectible types */
type CollectibleType = 'fuel' | 'score' | 'shield';

/** Collectible sprite */
interface Collectible extends Phaser.Physics.Arcade.Sprite {
  collectibleType: CollectibleType;
}

export class NeoJumpGameScene extends BaseScene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private facingRight = true;
  private playerSpriteMode = false;

  // Game state — altitude is derived from highestY, no separate tracking needed
  private score = 0;
  private highScore = 0;
  private enemiesKilled = 0;
  private bounceCombo = 0;
  private hasJumped = false;

  // Jetpack
  private jetpackFuel = GAME_CONFIG.JETPACK.FUEL_MAX;
  private jetpackActive = false;
  private hasUsedJetpack = false;

  // Shield
  private shieldActive = false;
  private shieldTimer = 0;
  private shieldGlow: Phaser.GameObjects.Graphics | null = null;

  // Collectibles
  private collectiblesCollected = 0;
  private collectibleSpriteMode = false;

  // Sprite modes
  private platformSpriteMode = false;
  private enemySpriteMode = false;

  // Object groups
  private platforms!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;

  // Jetpack flame visual
  private jetpackFlame: Phaser.GameObjects.Image | null = null;

  // UI
  private altitudeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private fuelBar!: Phaser.GameObjects.Graphics;
  private fuelBarBg!: Phaser.GameObjects.Graphics;
  private fuelLabel!: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text | null = null;

  // R86.N3: in-play controls overlay — lives only during the 5 s countdown
  // so new players learn the keys before gameplay starts. Held in a
  // container so the shutdown path can destroy the whole group even if
  // the fade-out tween hasn't finished yet (e.g. player hits ESC early).
  private controlsOverlay: Phaser.GameObjects.Container | null = null;

  // Camera tracking — highestY is the single source of truth for altitude
  private highestY = 0;
  private cameraBaseY = 0;
  private lastMaxAltitude = 0;

  // R86.N2: fall-death tracker. `fallApexY` is the smallest `player.y` seen
  // since the last platform landing (or game start). Fall distance at any
  // moment = `player.y - fallApexY`. If this exceeds
  // `PLAYER.MAX_FALL_DISTANCE_METRES × pixels-per-metre (10)`, the player
  // dies even if the camera still sees them. Reset on platform collision.
  private fallApexY = 0;

  // Matrix rain layers (parallax)
  private rainLayers: Phaser.GameObjects.Group[] = [];
  private parallaxSprites: Phaser.GameObjects.TileSprite[] = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private wasdKeys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  // Game over flag to prevent multiple death triggers
  private isGameOver = false;

  // R86.N5 — opening-beat spawn protection. `spawnProtectionUntil` is a
  // Date.now() timestamp set when the countdown completes. While Date.now()
  // is below it, `maybeSpawnEnemy` early-returns and `handleEnemyCollision`
  // treats the player as invulnerable (so pre-countdown enemies already in
  // flight can't kill Neo in his first second of gameplay). The flash
  // tween gives the player a visual "I'm safe for a moment" read.
  protected spawnProtectionUntil = 0;
  private spawnProtectionTween: Phaser.Tweens.Tween | null = null;

  /**
   * Registry key for the retry-shortcut timestamp. Kept on `game.registry`
   * so it survives `scene.start(GAME)` restarts but dies with the root
   * Phaser.Game instance — aligns with a single-session "rapid-retry" loop
   * that resets when the player leaves the portal. Exposed as a static
   * protected field for the test harness.
   */
  protected static readonly LAST_DEATH_REGISTRY_KEY = 'neoJumpLastDeathAt';

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();

    // Read sprite mode flags from registry
    this.playerSpriteMode = this.game.registry.get('playerSpriteMode') === true;
    this.platformSpriteMode = this.game.registry.get('platformSpriteMode') === true;
    this.enemySpriteMode = this.game.registry.get('enemySpriteMode') === true;
    this.collectibleSpriteMode = this.game.registry.get('collectibleSpriteMode') === true;

    // Initialize state
    this.score = 0;
    this.lastMaxAltitude = 0;
    this.enemiesKilled = 0;
    this.bounceCombo = 0;
    this.hasJumped = false;
    this.jetpackFuel = GAME_CONFIG.JETPACK.FUEL_MAX;
    this.jetpackActive = false;
    this.hasUsedJetpack = false;
    this.facingRight = true;
    this.highestY = GAME_CONFIG.HEIGHT - 100;
    this.fallApexY = GAME_CONFIG.HEIGHT - 100;
    this.cameraBaseY = 0;
    this.isGameOver = false;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldGlow = null;
    this.collectiblesCollected = 0;
    this.jetpackFlame = null;
    this.shieldText = null;

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.neoJump?.highScore ?? 0;
    }

    // Create parallax layers (rain + buildings)
    this.createParallaxRain();
    this.createParallaxBuildings();

    // Create object groups
    this.platforms = this.physics.add.group({
      allowGravity: false,
    });

    this.enemies = this.physics.add.group({
      allowGravity: false,
    });

    this.projectiles = this.physics.add.group({
      allowGravity: false,
    });

    this.collectibles = this.physics.add.group({
      allowGravity: false,
    });

    // Create player
    this.createPlayer();

    // Create jetpack flame visual
    this.createJetpackFlame();

    // Create initial platforms
    this.generateInitialPlatforms();

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();
    this.setupCommonInputs();

    // Setup collisions
    this.setupCollisions();

    // Setup camera
    this.setupCamera();

    this.playBackgroundMusic('/assets/rhythm-hacker/tracks/enhancements.mp3');

    // R86.N5 — retry-window shortcut. On cold start (no death in registry,
    // or last death > WINDOW_MS ago) use the full 5-second countdown so the
    // first run of a session feels deliberate. Within WINDOW_MS of a death,
    // use the shortened countdown so the rapid-retry loop stays tight.
    const countdownSeconds = this.computeCountdownSeconds();
    this.startCountdown(countdownSeconds, () => this.onCountdownComplete());
    // R86.N3: show the controls overlay while the countdown is running, then
    // fade it out before gameplay begins. Must be called AFTER startCountdown
    // so the countdown digit at depth 200 lands on top of the overlay (150)
    // and the overlay disappears by the time `isCountingDown` flips false.
    this.createControlsOverlay();
  }

  /**
   * R86.N5 — decide this run's countdown length. Reads
   * `LAST_DEATH_REGISTRY_KEY` from `game.registry`; if the player died
   * less than `RETRY.WINDOW_MS` ago, returns the shortened countdown.
   * Otherwise returns the cold-start countdown. Extracted as a method
   * so the test harness can exercise both branches without needing a
   * full scene restart.
   */
  protected computeCountdownSeconds(): number {
    // `this.registry` on a Phaser Scene aliases `this.game.registry` (both
    // refer to the same `Phaser.Data.DataManager` created on the root
    // game). Using `this.registry` keeps the call-site consistent with
    // `playerDeath`'s `this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM)` and
    // matches the pattern every other arcade game uses for game-global
    // state.
    const lastDeathAt = this.registry.get(NeoJumpGameScene.LAST_DEATH_REGISTRY_KEY);
    const now = Date.now();
    if (typeof lastDeathAt === 'number' && now - lastDeathAt < GAME_CONFIG.RETRY.WINDOW_MS) {
      return GAME_CONFIG.RETRY.RETRY_COUNTDOWN_SECONDS;
    }
    return GAME_CONFIG.RETRY.COLD_COUNTDOWN_SECONDS;
  }

  /**
   * R86.N5 — fires when the countdown tween finishes. Arms the opening-beat
   * spawn protection window (time-based invuln + no-spawn) and starts the
   * player-alpha flash that visualises it. Extracted from `startCountdown`'s
   * inline callback so both branches (cold 5 s / retry 2 s) share the same
   * post-countdown contract and the test harness can invoke it directly.
   */
  protected onCountdownComplete(): void {
    this.spawnProtectionUntil = Date.now() + GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS;

    // Visual cue — alpha yo-yo so the player can see they're safe. Stored
    // on a named field so the shutdown path can cancel it cleanly even if
    // the player dies before the window closes.
    if (this.player) {
      this.spawnProtectionTween = this.tweens.add({
        targets: this.player,
        alpha: { from: 1, to: 0.4 },
        duration: GAME_CONFIG.SPAWN_PROTECTION.FLASH_PERIOD_MS,
        yoyo: true,
        repeat: Math.floor(
          GAME_CONFIG.SPAWN_PROTECTION.DURATION_MS /
            (GAME_CONFIG.SPAWN_PROTECTION.FLASH_PERIOD_MS * 2)
        ) - 1,
        onComplete: () => {
          this.spawnProtectionTween = null;
          this.player?.setAlpha(1);
        },
      });
    }
  }

  /**
   * R86.N5 — true while the opening-beat spawn-protection window is open.
   * Exposed as a protected helper so both `maybeSpawnEnemy` and
   * `handleEnemyCollision` share the same check and tests can drive the
   * branch deterministically without clock mocking.
   */
  protected isSpawnProtected(): boolean {
    return Date.now() < this.spawnProtectionUntil;
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.isCountingDown) return;

    // Update parallax layers
    this.updateParallaxRain(delta);
    this.updateParallaxBuildings();

    if (this.cursors) {
      this.handleInput(delta);
    }

    // Update player
    this.updatePlayer(delta);

    // Update platforms
    this.updatePlatforms(delta);

    // Update enemies
    this.updateEnemies(delta);

    // Update projectiles
    this.updateProjectiles();

    // Update collectibles
    this.updateCollectibles();

    // Update shield
    this.updateShield(delta);

    // Update jetpack flame visual
    this.updateJetpackFlame();

    // Generate new platforms/enemies as player climbs
    this.generateContent();

    // Check for game over
    this.checkGameOver();

    // Update UI
    this.updateUI();

    // Expose state for E2E tests
    this.exposeTestState({
      altitude: this.lastMaxAltitude,
      score: this.score,
      isGameOver: this.isGameOver,
      jetpackFuel: this.jetpackFuel,
      shieldActive: this.shieldActive,
      collectiblesCollected: this.collectiblesCollected,
      countdownValue: this.countdownValue,
    });
  }

  /**
   * Create parallax matrix rain layers
   */
  private createParallaxRain(): void {
    const layerConfigs = [
      { density: 20, speed: 30, alpha: 0.2, size: 10 },
      { density: 30, speed: 60, alpha: 0.3, size: 12 },
      { density: 15, speed: 100, alpha: 0.5, size: 14 },
    ];

    const chars = 'アイウエオカキクケコサシスセソ0123456789';
    const rainDepth = GAME_CONFIG.PARALLAX.RAIN_DEPTH;

    layerConfigs.forEach((config) => {
      const layer = this.add.group();

      for (let i = 0; i < config.density; i++) {
        const x = Phaser.Math.Between(0, GAME_CONFIG.WIDTH);
        const y = Phaser.Math.Between(-GAME_CONFIG.HEIGHT, GAME_CONFIG.HEIGHT * 2);
        const char = chars[Phaser.Math.Between(0, chars.length - 1)];

        const text = this.add.text(x, y, char, {
          fontFamily: 'monospace',
          fontSize: `${config.size}px`,
          color: MATRIX_COLORS.PRIMARY_HEX,
        });
        text.setAlpha(config.alpha);
        text.setData('speed', config.speed);
        text.setData('chars', chars);
        text.setScrollFactor(0);
        text.setDepth(rainDepth);
        layer.add(text);
      }

      this.rainLayers.push(layer);
    });
  }

  private createParallaxBuildings(): void {
    this.parallaxSprites = [];
    for (const cfg of GAME_CONFIG.PARALLAX.LAYERS) {
      const sprite = this.add.tileSprite(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, cfg.key);
      sprite.setOrigin(0, 0);
      sprite.setScrollFactor(0);
      sprite.setDepth(cfg.depth);
      this.parallaxSprites.push(sprite);
    }
  }

  private updateParallaxRain(delta: number): void {
    this.rainLayers.forEach((layer) => {
      layer.getChildren().forEach((obj) => {
        const text = obj as Phaser.GameObjects.Text;
        const speed = text.getData('speed') as number;
        const chars = text.getData('chars') as string;

        text.y += speed * (delta / 1000);

        if (text.y > GAME_CONFIG.HEIGHT + 20) {
          text.y = -20;
          text.x = Phaser.Math.Between(0, GAME_CONFIG.WIDTH);
          text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
        }

        if (Math.random() < 0.01) {
          text.setText(chars[Phaser.Math.Between(0, chars.length - 1)]);
        }
      });
    });
  }

  private updateParallaxBuildings(): void {
    const camY = this.cameras.main.scrollY;
    const layers = GAME_CONFIG.PARALLAX.LAYERS;
    for (let i = 0; i < layers.length && i < this.parallaxSprites.length; i++) {
      this.parallaxSprites[i].tilePositionY = -camY * (1 - layers[i].scrollFactor);
    }
  }

  /**
   * Create player
   */
  private createPlayer(): void {
    const textureKey = this.playerSpriteMode ? 'player_sprite_idle' : 'player_idle';
    this.player = this.physics.add.sprite(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT - 100,
      textureKey
    );

    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.setDepth(10);

    if (this.playerSpriteMode) {
      this.player.setDisplaySize(GAME_CONFIG.PLAYER.WIDTH, GAME_CONFIG.PLAYER.HEIGHT);
    } else {
      this.player.setScale(0.6);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(GAME_CONFIG.PLAYER.WIDTH, GAME_CONFIG.PLAYER.HEIGHT);
    body.setMaxVelocityY(GAME_CONFIG.PLAYER.MAX_VELOCITY_Y);

    body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
    this.updatePlayerTexture('jump');
  }

  private updatePlayerTexture(state: 'idle' | 'jump' | 'fall' | 'shoot' | 'death'): void {
    if (this.playerSpriteMode) {
      this.player.setTexture(`player_sprite_${state}`);
      this.player.setDisplaySize(GAME_CONFIG.PLAYER.WIDTH, GAME_CONFIG.PLAYER.HEIGHT);
    } else {
      if (state === 'jump') {
        this.player.play('player_jump');
      } else if (state === 'fall') {
        this.player.play('player_fall');
      } else if (state === 'death') {
        this.player.play('player_death');
      }
    }
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Altitude display
    this.altitudeText = this.add.text(10, 10, 'ALTITUDE: 0m', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.altitudeText.setScrollFactor(0);
    this.altitudeText.setDepth(100);

    // Score display
    this.scoreText = this.add.text(10, 28, 'SCORE: 0', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    // Fuel bar background
    this.fuelBarBg = this.add.graphics();
    this.fuelBarBg.fillStyle(MATRIX_COLORS.DARK_GREY, 1);
    this.fuelBarBg.fillRect(GAME_CONFIG.WIDTH - 110, 10, 100, 15);
    this.fuelBarBg.setScrollFactor(0);
    this.fuelBarBg.setDepth(100);

    // Fuel bar
    this.fuelBar = this.add.graphics();
    this.fuelBar.setScrollFactor(0);
    this.fuelBar.setDepth(100);

    // Fuel label
    this.fuelLabel = this.add.text(GAME_CONFIG.WIDTH - 110, 28, 'JETPACK', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '8px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.fuelLabel.setScrollFactor(0);
    this.fuelLabel.setDepth(100);
  }

  /**
   * R86.N3: in-play controls reminder rendered on top of the countdown.
   *
   * Layout: two stacked lines at the top of the canvas (y ≈ 60) so the big
   * centred countdown digit (depth 200) stays readable. Line 1 lists movement
   * + jetpack cues, line 2 lists shoot + pause — terser than the MenuScene
   * panel because the player only has 5 s to scan it.
   *
   * Timing (total lifetime 4.1 s, fits inside the 5 s countdown):
   *   0.0 s  container created at alpha 0
   *   0.0 → 0.3 s  fade-in tween to alpha 1
   *   0.3 → 3.3 s  hold (3 s is enough to read two short lines)
   *   3.3 → 4.1 s  fade-out tween back to 0, destroy onComplete
   *
   * Scroll factor 0 pins it to the camera; depth 150 keeps it under the
   * countdown digit (depth 200) but over the HUD chrome (100).
   */
  private createControlsOverlay(): void {
    // Guard against re-entry — `create()` is invoked once per scene start,
    // but this keeps the overlay safe if a future refactor rearms it.
    if (this.controlsOverlay) return;

    const line1 = this.add.text(0, 0, '← → MOVE  ·  ↑ JETPACK', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    line1.setOrigin(0.5, 0);

    const line2 = this.add.text(0, 16, 'SPACE SHOOT  ·  P PAUSE', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    line2.setOrigin(0.5, 0);

    const container = this.add.container(GAME_CONFIG.WIDTH / 2, 50, [line1, line2]);
    container.setScrollFactor(0);
    container.setDepth(150);
    container.setAlpha(0);
    this.controlsOverlay = container;

    // Fade in → hold → fade out → destroy. A single chained tween keeps
    // shutdown cleanup simple (we only need to null the reference; the
    // tween manager auto-cancels its tweens when the target is destroyed).
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        if (!this.controlsOverlay) return;
        this.tweens.add({
          targets: this.controlsOverlay,
          alpha: 0,
          duration: 800,
          delay: 3000,
          onComplete: () => {
            this.controlsOverlay?.destroy();
            this.controlsOverlay = null;
          },
        });
      },
    });
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.wasdKeys = {
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    });
  }

  /**
   * Handle input
   */
  private handleInput(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      body.setVelocityX(-GAME_CONFIG.PLAYER.MOVE_SPEED);
      if (this.facingRight) {
        this.player.setFlipX(true);
        this.facingRight = false;
      }
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      body.setVelocityX(GAME_CONFIG.PLAYER.MOVE_SPEED);
      if (!this.facingRight) {
        this.player.setFlipX(false);
        this.facingRight = true;
      }
    } else {
      body.setVelocityX(0);
    }

    // Wrap around screen
    if (this.player.x < -GAME_CONFIG.PLAYER.WIDTH / 2) {
      this.player.x = GAME_CONFIG.WIDTH + GAME_CONFIG.PLAYER.WIDTH / 2;
    } else if (this.player.x > GAME_CONFIG.WIDTH + GAME_CONFIG.PLAYER.WIDTH / 2) {
      this.player.x = -GAME_CONFIG.PLAYER.WIDTH / 2;
    }

    // Jetpack (UP arrow or W key)
    if (this.cursors.up.isDown || this.wKey.isDown) {
      if (this.jetpackFuel > 0) {
        this.jetpackActive = true;
        // Direct velocity set — additive thrust was too weak to counter gravity
        body.setVelocityY(-400);
        this.jetpackFuel = Math.max(0, this.jetpackFuel - GAME_CONFIG.JETPACK.FUEL_DRAIN * (delta / 1000));

        if (!this.hasUsedJetpack) {
          this.hasUsedJetpack = true;
          this.unlockAchievement(ACHIEVEMENTS.USE_JETPACK);
        }
      }
    } else {
      this.jetpackActive = false;
    }

    // Shooting (SPACE key only)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shoot();
    }
  }

  /**
   * Update player state
   */
  private updatePlayer(_delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Update texture based on velocity
    if (body.velocity.y < 0) {
      if (this.playerSpriteMode) {
        if (this.player.texture.key !== 'player_sprite_jump') {
          this.updatePlayerTexture('jump');
        }
      } else if (this.player.anims.currentAnim?.key !== 'player_jump') {
        this.updatePlayerTexture('jump');
      }
    } else if (body.velocity.y > 0) {
      if (this.playerSpriteMode) {
        if (this.player.texture.key !== 'player_sprite_fall') {
          this.updatePlayerTexture('fall');
        }
      } else if (this.player.anims.currentAnim?.key !== 'player_fall') {
        this.updatePlayerTexture('fall');
      }
    }

    // Track highest position — single source of truth for altitude
    if (this.player.y < this.highestY) {
      this.highestY = this.player.y;
    }

    // R86.N2: track local apex since last platform landing for fall-death
    if (this.player.y < this.fallApexY) {
      this.fallApexY = this.player.y;
    }

    // Derive altitude from highestY
    const maxAltitude = Math.max(0, Math.floor((GAME_CONFIG.HEIGHT - 100 - this.highestY) / 10));
    if (maxAltitude > this.lastMaxAltitude) {
      this.lastMaxAltitude = maxAltitude;
      this.score = Math.floor(maxAltitude / GAME_CONFIG.SCORING.ALTITUDE_DIVISOR) * 10;

      // Achievement checks
      if (maxAltitude >= 100) {
        this.unlockAchievement(ACHIEVEMENTS.ALTITUDE_1000);
      }
      if (maxAltitude >= 500) {
        this.unlockAchievement(ACHIEVEMENTS.ALTITUDE_5000);
      }
    }
  }

  /**
   * Shoot projectile
   */
  private shoot(): void {
    if (this.playerSpriteMode) {
      this.updatePlayerTexture('shoot');
      this.time.delayedCall(200, () => {
        if (!this.isGameOver) {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          this.updatePlayerTexture(body.velocity.y < 0 ? 'jump' : 'fall');
        }
      });
    }

    const projKey = this.game?.registry?.get('projectileSpriteMode') ? 'projectile_sprite' : 'projectile';
    const projectile = this.projectiles.get(
      this.player.x,
      this.player.y - 20,
      projKey
    ) as Phaser.Physics.Arcade.Sprite;

    if (!projectile) return;

    projectile.setActive(true);
    projectile.setVisible(true);
    projectile.setDepth(5);

    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-500);

    this.playSound('shoot');
  }

  /**
   * Setup collisions
   */
  private setupCollisions(): void {
    // Player vs platforms (only from above)
    this.physics.add.collider(
      this.player,
      this.platforms,
      (_player, platform) => this.handlePlatformCollision(platform as Platform),
      (player, platform) => this.canCollideWithPlatform(player as Phaser.Physics.Arcade.Sprite, platform as Platform),
      this
    );

    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, enemy) => this.handleEnemyCollision(enemy as Enemy),
      undefined,
      this
    );

    // Projectiles vs enemies
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (projectile, enemy) => this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, enemy as Enemy),
      undefined,
      this
    );

    // Player vs collectibles
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      (_player, collectible) => this.handleCollectiblePickup(collectible as Collectible),
      undefined,
      this
    );
  }

  /**
   * Check if player can collide with platform
   */
  private canCollideWithPlatform(player: Phaser.Physics.Arcade.Sprite, platform: Platform): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;

    // Only collide when falling and above platform
    return playerBody.velocity.y > 0 && player.y + playerBody.height / 2 < platform.y;
  }

  /**
   * Handle landing on platform
   */
  private handlePlatformCollision(platform: Platform): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // First jump achievement
    if (!this.hasJumped) {
      this.hasJumped = true;
      this.unlockAchievement(ACHIEVEMENTS.FIRST_JUMP);
    }

    // Increment bounce combo
    this.bounceCombo++;
    if (this.bounceCombo >= 5) {
      this.unlockAchievement(ACHIEVEMENTS.COMBO_BOUNCE);
    }

    // Handle based on platform type
    switch (platform.platformType) {
      case 'normal':
      case 'moving':
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
        this.playSound('jump');
        break;

      case 'spring':
        body.setVelocityY(GAME_CONFIG.PLAYER.SPRING_VELOCITY);
        this.playSound('powerup');
        this.unlockAchievement(ACHIEVEMENTS.SPRING_BOUNCE);
        // Spring compression animation
        this.animateSpringCompression(platform);
        break;

      case 'disappearing':
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
        this.playSound('jump');
        // Start fade out
        if (!platform.isUsed) {
          platform.isUsed = true;
          this.tweens.add({
            targets: platform,
            alpha: 0,
            duration: 500,
            onComplete: () => platform.destroy(),
          });
        }
        break;

      case 'breakable':
        // Platform breaks, no bounce
        this.playSound(SOUND_KEYS.PLATFORM_BREAK);
        this.tweens.add({
          targets: platform,
          y: platform.y + 100,
          alpha: 0,
          angle: 30,
          duration: 300,
          onComplete: () => platform.destroy(),
        });
        break;
    }

    // Regenerate jetpack fuel
    this.jetpackFuel = Math.min(
      GAME_CONFIG.JETPACK.FUEL_MAX,
      this.jetpackFuel + GAME_CONFIG.JETPACK.FUEL_REGEN
    );

    // R86.N2: successful platform touch resets the fall-death clock. Using
    // `player.y` (not `platform.y`) anchors the new apex at the contact
    // point so the next bounce's 50m budget starts from where Neo actually
    // stood, not a sprite-Y above it.
    this.fallApexY = this.player.y;
  }

  /**
   * Animate spring platform compression
   */
  private animateSpringCompression(platform: Platform): void {
    if (platform.springCompressed) return;
    platform.springCompressed = true;

    const originalY = platform.originalY ?? platform.y;
    platform.originalY = originalY;

    this.tweens.add({
      targets: platform,
      scaleY: 0.5,
      y: originalY + 8,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        platform.springCompressed = false;
        platform.y = originalY;
        platform.scaleY = 1;
      },
    });
  }

  /**
   * Handle enemy collision
   */
  private handleEnemyCollision(enemy: Enemy): void {
    if (enemy.isDying) return;

    // R86.N5 — opening-beat invuln. Enemies already in flight when the
    // countdown ends can still collide with the player on frame 1 of
    // gameplay; during the protection window the collision is a no-op so
    // the first second of a run never ends in an unavoidable death. Stomp
    // and projectile kills are still routed normally (those paths don't
    // go through this method for the "harm player" branch), and the enemy
    // keeps its isDying=false so the player can still interact with it
    // after the window closes.
    if (this.isSpawnProtected()) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    // Check if stomping from above
    if (playerBody.velocity.y > 0 && this.player.y < enemy.y - 10) {
      // Stomp kill
      this.killEnemy(enemy);
      playerBody.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
    } else if (this.shieldActive) {
      // Shield absorbs the hit and destroys the enemy
      this.killEnemy(enemy);
      this.shieldActive = false;
      this.shieldTimer = 0;
    } else {
      // Player dies
      this.playerDeath();
    }
  }

  /**
   * Handle projectile hitting enemy
   */
  private handleProjectileHit(projectile: Phaser.Physics.Arcade.Sprite, enemy: Enemy): void {
    if (enemy.isDying) return;

    projectile.destroy();
    this.killEnemy(enemy);
  }

  /**
   * Kill enemy
   */
  private killEnemy(enemy: Enemy): void {
    enemy.isDying = true;
    this.enemiesKilled++;
    this.score += GAME_CONFIG.SCORING.ENEMY_KILL;
    this.playSound('hit');

    // Achievement
    this.unlockAchievement(ACHIEVEMENTS.KILL_ENEMY);
    if (this.enemiesKilled >= 5) {
      this.unlockAchievement(ACHIEVEMENTS.KILL_5_ENEMIES);
    }

    // Death animation
    this.tweens.add({
      targets: enemy,
      angle: 360,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => enemy.destroy(),
    });
  }

  /**
   * Player death
   */
  private playerDeath(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // R86.N5: kill the opening-beat flash tween if it's still running. Both
    // tweens target `this.player.alpha`; if we leave N5's yo-yo live, it
    // overwrites the death tween's final `alpha: 0` and the player stays
    // visible on the game-over screen.
    if (this.spawnProtectionTween) {
      this.spawnProtectionTween.stop();
      this.spawnProtectionTween = null;
    }
    this.spawnProtectionUntil = 0;
    this.player?.setAlpha(1);

    this.playSound(SOUND_KEYS.GAME_OVER);
    this.cameras.main.shake(200, 0.012);
    this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25);

    if (this.playerSpriteMode) {
      this.updatePlayerTexture('death');
    }
    this.player.setTint(MATRIX_COLORS.RED);

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      y: this.player.y + 100,
      angle: 180,
      duration: 500,
      onComplete: () => {
        if (this.score > this.highScore) this.highScore = this.score;
        this.reportScore(this.score, this.highScore);

        // R86.G1: defensive second write path — mirror Metris handleGameOver
        // so highScore + stats land even if the React updateGameSave handler
        // is stale when the 'score' event fires. Tom's playtest showed the
        // persistence broken for Neo Jump while Frogger worked the same day,
        // which points at a transient event-binding hiccup; a direct write
        // here is the cheapest guarantee.
        const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
        if (saveSystem) {
          const saveData = saveSystem.getSaveData();
          const prev = (saveData?.games?.neoJump?.stats ?? {}) as Record<string, number>;
          const sessionSeconds = Math.floor(this.getGameDuration() / 1000);
          saveSystem.updateGameSave('neoJump', {
            highScore: this.highScore,
            level: Math.floor((this.lastMaxAltitude ?? 0) / 500),
            stats: {
              gamesPlayed: (prev.gamesPlayed ?? 0) + 1,
              totalScore: (prev.totalScore ?? 0) + this.score,
              bestCombo: Math.max(prev.bestCombo ?? 0, this.bounceCombo ?? 0),
              longestSurvival: Math.max(prev.longestSurvival ?? 0, sessionSeconds),
            },
          });
        }

        // R86.N5 — record the death timestamp on the registry so the next
        // `create()` can detect a rapid retry (< WINDOW_MS) and drop the
        // countdown from 5 s to 2 s. The scene `registry` aliases
        // `game.registry` (same DataManager), so this write survives
        // `scene.start(GAME)` restarts but dies with the root Phaser.Game
        // instance — matching Tom's "rapid-retry loop" intent without
        // leaking the shortcut across portal sessions.
        this.registry.set(NeoJumpGameScene.LAST_DEATH_REGISTRY_KEY, Date.now());

        this.gameOver(this.score, `Altitude: ${this.lastMaxAltitude}m`, this.highScore, [
          { label: 'Enemies', value: this.enemiesKilled },
          { label: 'Collectibles', value: this.collectiblesCollected },
        ], Math.floor((this.lastMaxAltitude ?? 0) / 500), this.getGameDuration());
      },
    });
  }

  /**
   * Setup camera
   */
  private setupCamera(): void {
    // Camera follows player but only upward
    this.cameras.main.startFollow(this.player, true, 0, 0.1);
    this.cameras.main.setDeadzone(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.3);
  }

  /**
   * Generate initial platforms
   */
  private generateInitialPlatforms(): void {
    // Starting platform
    this.createPlatform(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 50, 'normal');

    // Generate platforms upward
    let y = GAME_CONFIG.HEIGHT - 100;
    while (y > -GAME_CONFIG.HEIGHT) {
      const x = Phaser.Math.Between(
        GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING,
        GAME_CONFIG.WIDTH - GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING
      );
      this.createPlatform(x, y, this.getRandomPlatformType(GAME_CONFIG.HEIGHT - y));
      y -= Phaser.Math.Between(
        GAME_CONFIG.PLATFORMS.SPACING_MIN,
        GAME_CONFIG.PLATFORMS.SPACING_MAX
      );
    }
  }

  /**
   * Create a platform
   */
  private createPlatform(x: number, y: number, type: PlatformType): Platform {
    const textureKey = this.platformSpriteMode
      ? `platform_sprite_${type}`
      : `platform_${type}`;
    const platform = this.platforms.create(x, y, textureKey) as Platform;

    platform.platformType = type;
    platform.setImmovable(true);
    platform.setDepth(5);

    if (this.platformSpriteMode) {
      platform.setDisplaySize(GAME_CONFIG.PLATFORMS.WIDTH, GAME_CONFIG.PLATFORMS.HEIGHT);
      const tintMap: Record<PlatformType, number> = {
        normal: MATRIX_COLORS.PRIMARY,
        moving: MATRIX_COLORS.CYAN,
        spring: MATRIX_COLORS.YELLOW,
        disappearing: 0x888888,
        breakable: 0xff6600,
      };
      platform.setTint(tintMap[type]);
    }

    if (type === 'moving') {
      platform.moveDirection = Math.random() > 0.5 ? 1 : -1;
      platform.moveSpeed = Phaser.Math.Between(50, 100);
    }

    return platform;
  }

  /**
   * Get random platform type based on altitude
   */
  private getRandomPlatformType(altitude: number): PlatformType {
    const rand = Math.random();

    // At low altitude, mostly normal
    if (altitude < 500) {
      if (rand < 0.7) return 'normal';
      if (rand < 0.9) return 'spring';
      return 'moving';
    }

    // Mid altitude, more variety
    if (altitude < 2000) {
      if (rand < 0.5) return 'normal';
      if (rand < 0.65) return 'moving';
      if (rand < 0.8) return 'spring';
      if (rand < 0.9) return 'disappearing';
      return 'breakable';
    }

    // High altitude, harder platforms
    if (rand < 0.3) return 'normal';
    if (rand < 0.5) return 'moving';
    if (rand < 0.65) return 'spring';
    if (rand < 0.85) return 'disappearing';
    return 'breakable';
  }

  /**
   * Generate new content as player climbs
   */
  private generateContent(): void {
    // Generate platforms above camera
    const cameraTop = this.cameras.main.scrollY;
    const generateAbove = cameraTop - GAME_CONFIG.HEIGHT;

    // Find highest platform
    let highestPlatformY = GAME_CONFIG.HEIGHT;
    this.platforms.getChildren().forEach((obj) => {
      const platform = obj as Platform;
      if (platform.y < highestPlatformY) {
        highestPlatformY = platform.y;
      }
    });

    // Generate new platforms if needed
    while (highestPlatformY > generateAbove) {
      const x = Phaser.Math.Between(
        GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING,
        GAME_CONFIG.WIDTH - GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING
      );
      const altitude = GAME_CONFIG.HEIGHT - highestPlatformY;
      const platY = highestPlatformY - Phaser.Math.Between(50, 100);
      const platform = this.createPlatform(x, platY, this.getRandomPlatformType(altitude));

      // Maybe spawn a collectible above this platform
      if (altitude > GAME_CONFIG.COLLECTIBLES.SPAWN_ALTITUDE &&
          platform.platformType !== 'breakable' &&
          Math.random() < GAME_CONFIG.COLLECTIBLES.SPAWN_CHANCE) {
        this.spawnCollectible(x, platY - 30);
      }

      highestPlatformY -= Phaser.Math.Between(
        GAME_CONFIG.PLATFORMS.SPACING_MIN,
        GAME_CONFIG.PLATFORMS.SPACING_MAX
      );
    }

    // Remove platforms below camera
    const cameraBottom = this.cameras.main.scrollY + GAME_CONFIG.HEIGHT + 100;
    this.platforms.getChildren().forEach((obj) => {
      const platform = obj as Platform;
      if (platform.y > cameraBottom) {
        platform.destroy();
      }
    });

    // Spawn enemies
    this.maybeSpawnEnemy();
  }

  /**
   * Maybe spawn an enemy
   */
  private maybeSpawnEnemy(): void {
    // R86.N5 — opening-beat time guard. Even if the spawn-chance RNG fires,
    // block any new enemy for the first `SPAWN_PROTECTION.DURATION_MS` of
    // gameplay. Pairs with the per-spawn spatial guard
    // (MIN_HORIZONTAL_SPACING_FROM_PLAYER) to close both the "bomb lands on
    // me" and "bomb was already in flight" vectors of Tom's complaint.
    if (this.isSpawnProtected()) return;

    const altitude = GAME_CONFIG.HEIGHT - this.highestY;

    // Only spawn above certain altitude
    if (altitude < GAME_CONFIG.ENEMIES.SPAWN_ALTITUDE) return;

    // Calculate spawn chance
    const baseChance = GAME_CONFIG.ENEMIES.SPAWN_CHANCE_BASE;
    const bonusChance = Math.floor(altitude / 1000) * GAME_CONFIG.ENEMIES.SPAWN_CHANCE_PER_1000;
    const spawnChance = Math.min(baseChance + bonusChance, GAME_CONFIG.ENEMIES.SPAWN_CHANCE_MAX);

    if (Math.random() > spawnChance) return;

    // Check if there's already an enemy nearby
    const cameraTop = this.cameras.main.scrollY;
    let hasNearbyEnemy = false;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (enemy.y < cameraTop + 200 && enemy.y > cameraTop - 100) {
        hasNearbyEnemy = true;
      }
    });

    if (hasNearbyEnemy) return;

    // R86.N1 — fairness guard: retry a few times to place the enemy at least
    // MIN_HORIZONTAL_SPACING_FROM_PLAYER away from the player's current X.
    // Tom: "you often just hit a bomb out of nowhere; you can't really avoid
    // it" — root cause was the old `Phaser.Math.Between(50, WIDTH-50)` could
    // land directly above an ascending player. After 5 failed attempts we
    // bail out of the spawn entirely (the player's column is denied this
    // tick) rather than force an unfair spawn.
    const playerX = this.player.x;
    let x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
    let attempts = 0;
    while (
      Math.abs(x - playerX) < GAME_CONFIG.ENEMIES.MIN_HORIZONTAL_SPACING_FROM_PLAYER &&
      attempts < 5
    ) {
      x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
      attempts++;
    }
    if (Math.abs(x - playerX) < GAME_CONFIG.ENEMIES.MIN_HORIZONTAL_SPACING_FROM_PLAYER) return;

    // R86.N1 — enter 150px above the camera edge (was hardcoded 50) so the
    // player sees the enemy for ~1s of descent before it reaches gameplay
    // height, instead of materialising near the playfield.
    const y = cameraTop - GAME_CONFIG.ENEMIES.SPAWN_Y_OFFSET_ABOVE_CAMERA;

    const enemyTexture = this.enemySpriteMode ? 'enemy_sprite' : 'enemy';
    const enemy = this.enemies.create(x, y, enemyTexture) as Enemy;
    enemy.direction = Math.random() > 0.5 ? 1 : -1;
    enemy.speed = Phaser.Math.Between(
      GAME_CONFIG.ENEMIES.SPEED_MIN,
      GAME_CONFIG.ENEMIES.SPEED_MAX
    );
    enemy.isDying = false;
    enemy.setDepth(8);

    if (this.enemySpriteMode) {
      enemy.setDisplaySize(28, 28);
      enemy.setTint(MATRIX_COLORS.RED);
    }
  }

  /**
   * Update platforms
   */
  private updatePlatforms(delta: number): void {
    this.platforms.getChildren().forEach((obj) => {
      const platform = obj as Platform;

      // Moving platforms
      if (platform.platformType === 'moving' && platform.moveDirection && platform.moveSpeed) {
        platform.x += platform.moveDirection * platform.moveSpeed * (delta / 1000);

        // Bounce off edges
        if (platform.x < GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING) {
          platform.x = GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING;
          platform.moveDirection = 1;
        } else if (platform.x > GAME_CONFIG.WIDTH - GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING) {
          platform.x = GAME_CONFIG.WIDTH - GAME_CONFIG.PLATFORMS.HORIZONTAL_PADDING;
          platform.moveDirection = -1;
        }
      }
    });
  }

  /**
   * Update enemies
   */
  private updateEnemies(delta: number): void {
    const cameraBottom = this.cameras.main.scrollY + GAME_CONFIG.HEIGHT + 100;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;

      if (enemy.isDying) return;

      // Move horizontally
      enemy.x += enemy.direction * enemy.speed * (delta / 1000);

      // Bounce off edges
      if (enemy.x < 30) {
        enemy.x = 30;
        enemy.direction = 1;
      } else if (enemy.x > GAME_CONFIG.WIDTH - 30) {
        enemy.x = GAME_CONFIG.WIDTH - 30;
        enemy.direction = -1;
      }

      // Remove if below camera
      if (enemy.y > cameraBottom) {
        enemy.destroy();
      }
    });
  }

  /**
   * Update projectiles
   */
  private updateProjectiles(): void {
    const cameraTop = this.cameras.main.scrollY - 50;

    this.projectiles.getChildren().forEach((obj) => {
      const projectile = obj as Phaser.Physics.Arcade.Sprite;
      if (projectile.y < cameraTop) {
        projectile.destroy();
      }
    });
  }

  /**
   * Check for game over
   */
  private checkGameOver(): void {
    if (this.isGameOver) return;

    // R86.N2: Tom: "if the player falls over 50 m, they die." A drop greater
    // than `MAX_FALL_DISTANCE_METRES` from the last apex/landing kills even
    // while still on-camera. Checked before the off-screen guard so a
    // mid-fall death animation plays while the player is still visible.
    const fallPx = this.player.y - this.fallApexY;
    const fallMetres = fallPx / GAME_CONFIG.SCORING.ALTITUDE_DIVISOR;
    if (fallMetres > GAME_CONFIG.PLAYER.MAX_FALL_DISTANCE_METRES) {
      this.playSound(SOUND_KEYS.FALL);
      this.playerDeath();
      return;
    }

    const cameraBottom = this.cameras.main.scrollY + GAME_CONFIG.HEIGHT;

    // Player fell below bottom of screen — small buffer to avoid false triggers
    if (this.player.y > cameraBottom + 50) {
      this.playSound(SOUND_KEYS.FALL);
      this.playerDeath();
    }
  }

  /**
   * Spawn a collectible at the given position
   */
  spawnCollectible(x: number, y: number): void {
    const types: CollectibleType[] = ['fuel', 'score', 'shield'];
    const type = types[Phaser.Math.Between(0, types.length - 1)];

    const textureKey = this.collectibleSpriteMode
      ? `collectible_sprite_${type}`
      : `collectible_${type}`;

    const collectible = this.collectibles.create(x, y, textureKey) as Collectible;
    collectible.collectibleType = type;
    collectible.setDepth(7);
    collectible.setDisplaySize(GAME_CONFIG.COLLECTIBLES.SIZE, GAME_CONFIG.COLLECTIBLES.SIZE);

    // Gentle floating animation
    this.tweens.add({
      targets: collectible,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Handle collecting a pickup
   */
  handleCollectiblePickup(collectible: Collectible): void {
    const type = collectible.collectibleType;
    collectible.destroy();
    this.collectiblesCollected++;

    this.playSound(SOUND_KEYS.COLLECTIBLE);

    switch (type) {
      case 'fuel':
        this.jetpackFuel = Math.min(
          GAME_CONFIG.JETPACK.FUEL_MAX,
          this.jetpackFuel + GAME_CONFIG.COLLECTIBLES.FUEL_RESTORE
        );
        break;
      case 'score':
        this.score += GAME_CONFIG.COLLECTIBLES.SCORE_BONUS;
        break;
      case 'shield':
        this.shieldActive = true;
        this.shieldTimer = GAME_CONFIG.COLLECTIBLES.SHIELD_DURATION;
        this.unlockAchievement(ACHIEVEMENTS.COLLECT_SHIELD);
        break;
    }

    if (this.collectiblesCollected >= 10) {
      this.unlockAchievement(ACHIEVEMENTS.COLLECT_10);
    }
  }

  /**
   * Update collectibles — remove those below camera
   */
  private updateCollectibles(): void {
    const cameraBottom = this.cameras.main.scrollY + GAME_CONFIG.HEIGHT + 100;

    this.collectibles.getChildren().forEach((obj) => {
      const c = obj as Collectible;
      if (c.y > cameraBottom) {
        c.destroy();
      }
    });
  }

  /**
   * Update shield timer and visual
   */
  updateShield(delta: number): void {
    if (!this.shieldActive) {
      if (this.shieldGlow) {
        this.shieldGlow.destroy();
        this.shieldGlow = null;
      }
      if (this.shieldText) {
        this.shieldText.destroy();
        this.shieldText = null;
      }
      return;
    }

    this.shieldTimer = Math.max(0, this.shieldTimer - delta);
    if (this.shieldTimer <= 0) {
      this.shieldActive = false;
      return;
    }

    // Draw shield glow around player
    if (!this.shieldGlow) {
      this.shieldGlow = this.add.graphics();
      this.shieldGlow.setDepth(11);
    }
    this.shieldGlow.clear();
    const flashAlpha = this.shieldTimer < 1500 ? 0.2 + 0.3 * Math.sin(this.shieldTimer * 0.01) : 0.4;
    this.shieldGlow.lineStyle(2, MATRIX_COLORS.MAGENTA, flashAlpha);
    this.shieldGlow.strokeCircle(this.player.x, this.player.y, 24);

    // Shield HUD indicator
    if (!this.shieldText) {
      this.shieldText = this.add.text(10, 44, '', {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '8px',
        color: MATRIX_COLORS.MAGENTA_HEX,
      });
      this.shieldText.setScrollFactor(0);
      this.shieldText.setDepth(100);
    }
    const remaining = Math.ceil(this.shieldTimer / 1000);
    this.shieldText.setText(`SHIELD: ${remaining}s`);
  }

  /**
   * Create jetpack flame visual
   */
  private createJetpackFlame(): void {
    const textureKey = this.textures.exists('jetpack_flame_sprite')
      ? 'jetpack_flame_sprite'
      : 'jetpack_flame';
    this.jetpackFlame = this.add.image(0, 0, textureKey);
    this.jetpackFlame.setDisplaySize(12, 16);
    this.jetpackFlame.setDepth(9);
    this.jetpackFlame.setVisible(false);
    this.jetpackFlame.setTint(0xff6600);
  }

  /**
   * Update jetpack flame position and visibility
   */
  private updateJetpackFlame(): void {
    if (!this.jetpackFlame) return;

    if (this.jetpackActive && this.jetpackFuel > 0) {
      this.jetpackFlame.setVisible(true);
      this.jetpackFlame.setPosition(
        this.player.x,
        this.player.y + GAME_CONFIG.PLAYER.HEIGHT / 2 + 6
      );
      // Flicker effect
      const flicker = 0.6 + Math.random() * 0.4;
      this.jetpackFlame.setAlpha(flicker);
      this.jetpackFlame.setDisplaySize(10 + Math.random() * 4, 14 + Math.random() * 6);
    } else {
      this.jetpackFlame.setVisible(false);
    }
  }

  /**
   * Update UI
   */
  private updateUI(): void {
    this.altitudeText.setText(`ALTITUDE: ${this.lastMaxAltitude}m`);
    this.scoreText.setText(`SCORE: ${this.score}`);

    // Update fuel bar
    this.fuelBar.clear();
    const fuelPercent = this.jetpackFuel / GAME_CONFIG.JETPACK.FUEL_MAX;
    const barWidth = 96 * fuelPercent;

    // Color based on fuel level
    let color = MATRIX_COLORS.PRIMARY;
    if (fuelPercent < 0.3) {
      color = MATRIX_COLORS.RED;
    } else if (fuelPercent < 0.6) {
      color = MATRIX_COLORS.YELLOW;
    }

    this.fuelBar.fillStyle(color, 1);
    this.fuelBar.fillRect(GAME_CONFIG.WIDTH - 108, 12, barWidth, 11);
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    // Remove input listeners
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    // Clear parallax layers
    this.rainLayers.forEach((layer) => {
      layer.clear(true, true);
    });
    this.rainLayers = [];
    this.parallaxSprites.forEach((s) => s.destroy());
    this.parallaxSprites = [];

    // Destroy groups
    this.platforms.clear(true, true);
    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);
    this.collectibles.clear(true, true);

    // Destroy jetpack flame
    if (this.jetpackFlame) {
      this.jetpackFlame.destroy();
      this.jetpackFlame = null;
    }

    // Destroy shield glow
    if (this.shieldGlow) {
      this.shieldGlow.destroy();
      this.shieldGlow = null;
    }

    // Destroy UI elements
    this.altitudeText.destroy();
    this.scoreText.destroy();
    this.fuelBar.destroy();
    this.fuelBarBg.destroy();
    this.fuelLabel.destroy();
    if (this.shieldText) {
      this.shieldText.destroy();
      this.shieldText = null;
    }

    // R86.N3: tear down the controls overlay if it's still mid-fade when
    // the scene shuts down (e.g. ESC pressed during the 5 s countdown).
    // Destroying the container also cancels any in-flight alpha tweens.
    if (this.controlsOverlay) {
      this.controlsOverlay.destroy();
      this.controlsOverlay = null;
    }

    // R86.N5: cancel the opening-beat flash tween if the scene tears down
    // mid-window (ESC during protection, or death during protection — the
    // latter would otherwise fight the death-alpha tween on the same target).
    if (this.spawnProtectionTween) {
      this.spawnProtectionTween.stop();
      this.spawnProtectionTween = null;
    }
    this.spawnProtectionUntil = 0;

    super.shutdown();
  }
}
