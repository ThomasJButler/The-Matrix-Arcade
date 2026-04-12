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
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
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

  // Camera tracking — highestY is the single source of truth for altitude
  private highestY = 0;
  private cameraBaseY = 0;
  private lastMaxAltitude = 0;

  // Matrix rain layers (parallax)
  private rainLayers: Phaser.GameObjects.Group[] = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private wasdKeys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  // Game over flag to prevent multiple death triggers
  private isGameOver = false;

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
    this.cameraBaseY = 0;
    this.isGameOver = false;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldGlow = null;
    this.collectiblesCollected = 0;
    this.jetpackFlame = null;
    this.shieldText = null;

    // Create parallax matrix rain
    this.createParallaxRain();

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
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update parallax rain
    this.updateParallaxRain(delta);

    // Handle input
    this.handleInput(delta);

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
    });
  }

  /**
   * Create parallax matrix rain layers
   */
  private createParallaxRain(): void {
    // Three layers with different speeds
    const layerConfigs = [
      { density: 20, speed: 30, alpha: 0.2, size: 10 }, // Far
      { density: 30, speed: 60, alpha: 0.3, size: 12 }, // Mid
      { density: 15, speed: 100, alpha: 0.5, size: 14 }, // Near
    ];

    const chars = 'アイウエオカキクケコサシスセソ0123456789';

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
        text.setScrollFactor(0); // Fixed to camera
        layer.add(text);
      }

      this.rainLayers.push(layer);
    });
  }

  /**
   * Update parallax rain
   */
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
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.altitudeText.setScrollFactor(0);
    this.altitudeText.setDepth(100);

    // Score display
    this.scoreText = this.add.text(10, 28, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    // Fuel bar background
    this.fuelBarBg = this.add.graphics();
    this.fuelBarBg.fillStyle(0x333333, 1);
    this.fuelBarBg.fillRect(GAME_CONFIG.WIDTH - 110, 10, 100, 15);
    this.fuelBarBg.setScrollFactor(0);
    this.fuelBarBg.setDepth(100);

    // Fuel bar
    this.fuelBar = this.add.graphics();
    this.fuelBar.setScrollFactor(0);
    this.fuelBar.setDepth(100);

    // Fuel label
    this.fuelLabel = this.add.text(GAME_CONFIG.WIDTH - 110, 28, 'JETPACK', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.fuelLabel.setScrollFactor(0);
    this.fuelLabel.setDepth(100);
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupInput());
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.wasdKeys = {
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
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

    const projectile = this.projectiles.get(
      this.player.x,
      this.player.y - 20,
      'projectile'
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
        this.playSound('hit');
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

    if (this.playerSpriteMode) {
      this.updatePlayerTexture('death');
    }
    this.player.setTint(0xff0000);

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      y: this.player.y + 100,
      angle: 180,
      duration: 500,
      onComplete: () => {
        this.reportScore(this.score, this.score);
        this.gameOver(this.score, `Altitude: ${this.lastMaxAltitude}m`);
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

    const x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
    const y = cameraTop - 50;

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
      enemy.setDisplaySize(40, 40);
      enemy.setTint(0xff0000);
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

    const cameraBottom = this.cameras.main.scrollY + GAME_CONFIG.HEIGHT;

    // Player fell below bottom of screen — small buffer to avoid false triggers
    if (this.player.y > cameraBottom + 50) {
      this.isGameOver = true;
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

    this.playSound('powerup');

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
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ff00ff',
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
      color = 0xff0000;
    } else if (fuelPercent < 0.6) {
      color = MATRIX_COLORS.YELLOW;
    }

    this.fuelBar.fillStyle(color, 1);
    this.fuelBar.fillRect(GAME_CONFIG.WIDTH - 108, 12, barWidth, 11);
  }

  shutdown(): void {
    // Remove input listeners
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    // Clear tweens
    this.tweens.killAll();

    // Clear parallax rain layers and animations
    this.rainLayers.forEach((layer) => {
      layer.clear(true, true);
    });
    this.rainLayers = [];

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
  }
}
