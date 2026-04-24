/**
 * Cloud Jumper - Game Scene
 *
 * Flappy Bird / Doodle Jump hybrid:
 * - Side-scrolling auto-scroll
 * - Jump between clouds
 * - Collect items, avoid obstacles
 * - Different cloud types
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, SOUND_KEYS, REGISTRY_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/** Cloud types */
type CloudType = 'normal' | 'moving' | 'disappearing' | 'storm';

/** Cloud platform */
interface Cloud extends Phaser.Physics.Arcade.Sprite {
  cloudType: CloudType;
  moveDirection?: number;
  moveSpeed?: number;
  isUsed?: boolean;
  baseY?: number;
}

/** Collectible item */
interface Collectible extends Phaser.Physics.Arcade.Sprite {
  collectType: string;
}

/** Obstacle */
interface Obstacle extends Phaser.Physics.Arcade.Sprite {
  obstacleType: string;
  speed: number;
}

export class CloudJumperGameScene extends BaseScene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private hasJumped = false;

  /**
   * R87.C1 — single-jump gate.
   *
   * Only `true` immediately after a cloud-contact fires `handleCloudCollision`.
   * `jump()` consumes it. Prevents mid-air double/triple-jump spam that Tom
   * flagged in the 2026-04-22 playtest: *"The player should not be able to
   * jump unless they jump on a cloud. They can't jump again in mid-air."*
   *
   * Starts `false` so the player must land on the starting platform before
   * their first manual jump (physics/gravity handles the landing well inside
   * the 5-second countdown — ~300 ms given START_Y 225, starting cloud 275,
   * GRAVITY 800).
   */
  private canJump = false;

  private get playerSpriteMode(): boolean {
    return this.game.registry.get('playerSpriteMode') === true;
  }

  // Game state
  private distance = 0;
  private score = 0;
  private highScore = 0;
  private collectiblesCount = 0;
  private bounceStreak = 0;
  private scrollSpeed = GAME_CONFIG.SCROLL.SPEED_BASE;
  private stormCloudsSurvived = 0;
  private hadCloseCall = false;
  private isGameOver = false;

  // Object groups
  private clouds!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;

  // Background layers
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;

  // Cloud generation
  private lastCloudX = 0;

  // Input
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private jumpPressed = false;
  private lastJumpTime = -Infinity;
  private static readonly JUMP_COOLDOWN_MS = 300;

  /**
   * R87.C3 — lateral movement keys. LEFT/A and RIGHT/D.
   *
   * Held-key polling drives `handleHorizontalMovement()` each update tick;
   * release → physics drag (`HORIZONTAL_DRAG`) decelerates velocity.x back
   * to 0 over ~0.25 s, satisfying Tom's *"should be able to stop"* brief
   * without the robotic feel of an instant `setVelocityX(0)` on release.
   *
   * Stored as optional because `setupInput()` uses `waitForKeyboard` —
   * tests that bypass the wrapper or exercise the scene before keyboard
   * init complete must tolerate `undefined` without throwing.
   */
  private moveLeftKey?: Phaser.Input.Keyboard.Key;
  private moveLeftKeyA?: Phaser.Input.Keyboard.Key;
  private moveRightKey?: Phaser.Input.Keyboard.Key;
  private moveRightKeyD?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    // Sky background
    this.cameras.main.setBackgroundColor(MATRIX_COLORS.NEAR_BLACK); // Dark Matrix-green sky

    // Reset state
    this.distance = 0;
    this.score = 0;
    this.collectiblesCount = 0;
    this.bounceStreak = 0;
    this.scrollSpeed = GAME_CONFIG.SCROLL.SPEED_BASE;
    this.stormCloudsSurvived = 0;
    this.hadCloseCall = false;
    this.isGameOver = false;
    this.hasJumped = false;
    this.canJump = false;
    this.lastCloudX = 0;
    this.jumpPressed = false;
    this.lastJumpTime = -Infinity;

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.cloudJumper?.highScore ?? 0;
    }

    // Create parallax backgrounds
    this.createBackgrounds();

    // Create groups
    this.clouds = this.physics.add.group({
      allowGravity: false,
    });

    this.collectibles = this.physics.add.group({
      allowGravity: false,
    });

    this.obstacles = this.physics.add.group({
      allowGravity: false,
    });

    // Create player
    this.createPlayer();

    // Generate initial clouds
    this.generateInitialClouds();

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();
    this.setupCommonInputs();

    // Setup collisions
    this.setupCollisions();

    this.playBackgroundMusic('/assets/rhythm-hacker/tracks/in-the-moonlight.mp3');
    this.startCountdown(5, () => {});
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.isCountingDown) return;

    // Update scroll speed
    this.updateScrollSpeed(delta);

    // Scroll backgrounds
    this.scrollBackgrounds(delta);

    // Scroll objects
    this.scrollObjects(delta);

    // Update clouds
    this.updateClouds(delta);

    // Generate new content
    this.generateContent();

    // Update obstacles
    this.updateObstacles(delta);

    // R87.C3 — lateral movement (LEFT/RIGHT/A/D with drag-based stop).
    // Runs before checkGameOver so the final-frame input still registers
    // and before enforceCeiling so the boundary clamp wins in edge cases.
    this.handleHorizontalMovement();

    // Check game over
    this.checkGameOver();

    // R87.C2 — ceiling clamp (belt guarantee against off-screen-above
    // excursions from high-cloud + manual-jump chains)
    this.enforceCeiling();

    // Update score
    this.distance += this.scrollSpeed * (delta / 1000);
    this.score = Math.floor(this.distance / GAME_CONFIG.SCORING.DISTANCE_DIVISOR);

    // Achievements
    this.checkAchievements();

    // Update UI
    this.updateUI();

    // Expose state for E2E tests
    const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
    this.exposeTestState({
      score: this.score,
      distance: this.distance,
      bounceStreak: this.bounceStreak,
      countdownValue: this.countdownValue,
      canJump: this.canJump,
      playerX: this.player?.x ?? 0,
      velocityX: body?.velocity?.x ?? 0,
    });
  }

  /**
   * Create parallax background layers
   */
  private createBackgrounds(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const bgSpriteMode = this.game.registry.get('bgSpriteMode') === true;

    if (bgSpriteMode) {
      this.bgFar = this.add.tileSprite(WIDTH / 2, 75, WIDTH, 176, 'bg_sprite_cloud1');
      this.bgFar.setScrollFactor(0);
      this.bgFar.setDepth(-3);
      this.bgFar.setAlpha(0.3);
      this.bgFar.setTint(MATRIX_COLORS.PRIMARY);

      this.bgMid = this.add.tileSprite(WIDTH / 2, HEIGHT - 150, WIDTH, 176, 'bg_sprite_cloud2');
      this.bgMid.setScrollFactor(0);
      this.bgMid.setDepth(-2);
      this.bgMid.setAlpha(0.4);
      this.bgMid.setTint(MATRIX_COLORS.MEDIUM_GREEN);

      this.bgNear = this.add.tileSprite(WIDTH / 2, HEIGHT - 50, WIDTH, 176, 'bg_sprite_cloud1');
      this.bgNear.setScrollFactor(0);
      this.bgNear.setDepth(-1);
      this.bgNear.setAlpha(0.5);
      this.bgNear.setTint(MATRIX_COLORS.DIM_GREEN);
    } else {
      this.bgFar = this.add.tileSprite(WIDTH / 2, 75, WIDTH, 150, 'bg_far');
      this.bgFar.setScrollFactor(0);
      this.bgFar.setDepth(-3);

      this.bgMid = this.add.tileSprite(WIDTH / 2, HEIGHT - 150, WIDTH, 100, 'bg_mid');
      this.bgMid.setScrollFactor(0);
      this.bgMid.setDepth(-2);

      this.bgNear = this.add.tileSprite(WIDTH / 2, HEIGHT - 50, WIDTH, 60, 'bg_near');
      this.bgNear.setScrollFactor(0);
      this.bgNear.setDepth(-1);
    }
  }

  /**
   * Create player
   */
  private createPlayer(): void {
    const { PLAYER } = GAME_CONFIG;
    const textureKey = this.playerSpriteMode ? 'player_sprite_idle' : 'player';

    this.player = this.physics.add.sprite(PLAYER.START_X, PLAYER.START_Y, textureKey);
    if (this.playerSpriteMode) {
      this.player.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);
    }
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(false);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
    body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);
    body.setBounce(0, 0);
    // R87.C3 — X-axis drag decelerates lateral velocity to 0 when no
    // move key is held; Y drag stays 0 so falls remain gravity-driven.
    body.setDrag(PLAYER.HORIZONTAL_DRAG, 0);
    body.setAccelerationY(0);
    body.enable = true;
  }

  /**
   * Create UI
   */
  private createUI(): void {
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      stroke: MATRIX_COLORS.BACKGROUND_HEX,
      strokeThickness: 3,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    this.distanceText = this.add.text(20, 45, 'DISTANCE: 0m', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      stroke: MATRIX_COLORS.BACKGROUND_HEX,
      strokeThickness: 2,
    });
    this.distanceText.setScrollFactor(0);
    this.distanceText.setDepth(100);
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      // All jump inputs use event callbacks for consistency
      this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.jumpKey.on('down', () => this.jump());
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.jump());
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', () => this.jump());

      // R87.C3 — lateral movement keys, polled each update tick rather
      // than event-driven so a held key produces sustained velocity.
      this.moveLeftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.moveLeftKeyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.moveRightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.moveRightKeyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

      // Also allow click/tap to jump
      this.input.on('pointerdown', () => this.jump());
    });
  }

  /**
   * Jump — applies upward impulse when the player is freshly off a cloud.
   *
   * R87.C1 gate: `canJump` is armed in `handleCloudCollision` and consumed
   * here, so pressing SPACE/UP/W/click in mid-air after the first jump is a
   * no-op until the player touches another cloud. A short cooldown is kept
   * as a belt-and-braces guard against key-repeat fire within a single
   * cloud-contact window.
   *
   * Gate order (important — see R87.C1 tests):
   *   1. Scene-state guards (countdown, game-over) — early-return with no
   *      side effects.
   *   2. Cooldown — returns WITHOUT consuming `canJump` so a held key past
   *      300 ms doesn't silently swallow the gate.
   *   3. `canJump` gate — the core R87.C1 contract.
   *   4. Apply velocity + sound + texture.
   *   5. Consume `canJump` LAST so a future refactor that re-orders the
   *      body can't consume the gate without actually firing a jump.
   */
  private jump(): void {
    if (this.isCountingDown || this.isGameOver) return;

    const now = this.time.now;
    if (now - this.lastJumpTime < CloudJumperGameScene.JUMP_COOLDOWN_MS) return;

    if (!this.canJump) return;

    this.lastJumpTime = now;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
    this.player.setTexture(this.playerSpriteMode ? 'player_sprite_jump' : 'player');
    this.playSound('jump');

    this.canJump = false;

    if (!this.hasJumped) {
      this.hasJumped = true;
      this.unlockAchievement(ACHIEVEMENTS.FIRST_JUMP);
    }
  }

  /**
   * Check if player is near a cloud (for lenient jumping)
   */
  private isNearCloud(): boolean {
    const playerY = this.player.y + GAME_CONFIG.PLAYER.HEIGHT / 2;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Only allow near-jump when falling
    if (body.velocity.y < 0) return false;

    let nearCloud = false;
    this.clouds.getChildren().forEach((obj) => {
      const cloud = obj as Cloud;
      const cloudTop = cloud.y - GAME_CONFIG.CLOUDS.HEIGHT / 2;

      // Check if player is just above cloud
      if (
        this.player.x > cloud.x - cloud.width / 2 &&
        this.player.x < cloud.x + cloud.width / 2 &&
        playerY > cloudTop - 20 &&
        playerY < cloudTop + 10
      ) {
        nearCloud = true;
      }
    });

    return nearCloud;
  }

  /**
   * Setup collisions
   */
  private setupCollisions(): void {
    // Player vs clouds
    this.physics.add.collider(
      this.player,
      this.clouds,
      (_player, cloud) => this.handleCloudCollision(cloud as Cloud),
      (player, cloud) => this.canLandOnCloud(player as Phaser.Physics.Arcade.Sprite, cloud as Cloud),
      this
    );

    // Player vs collectibles
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      (_player, item) => this.collectItem(item as Collectible),
      undefined,
      this
    );

    // Player vs obstacles
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      (_player, obstacle) => this.hitObstacle(obstacle as Obstacle),
      undefined,
      this
    );
  }

  /**
   * Check if player can land on cloud — one-way platform pattern.
   * Only collide when falling; rising through clouds passes through.
   */
  private canLandOnCloud(player: Phaser.Physics.Arcade.Sprite, _cloud: Cloud): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    return playerBody.velocity.y >= 0;
  }

  /**
   * Handle landing on cloud
   */
  private handleCloudCollision(cloud: Cloud): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // R87.C1 — arm the single-jump gate on every cloud contact (including
    // storm clouds: Tom's rule is about mid-air, not about cloud quality).
    this.canJump = true;

    // Increment bounce streak (storm clouds break the streak)
    if (cloud.cloudType === 'storm') {
      this.bounceStreak = 0;
    } else {
      this.bounceStreak++;
    }

    // Handle based on cloud type
    switch (cloud.cloudType) {
      case 'normal':
      case 'moving':
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY * 0.8);
        this.playSound('jump');
        this.score += GAME_CONFIG.SCORING.CLOUD_BONUS;
        break;

      case 'disappearing':
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY * 0.8);
        this.playSound('jump');
        if (!cloud.isUsed) {
          cloud.isUsed = true;
          this.playSound(SOUND_KEYS.PLATFORM_BREAK);
          this.tweens.add({
            targets: cloud,
            alpha: 0,
            duration: 500,
            onComplete: () => cloud.destroy(),
          });
        }
        break;

      case 'storm':
        // Storm clouds hurt and give a weak bounce (punishment, not reward)
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY * 0.5);
        this.playSound('hit');
        this.stormCloudsSurvived++;
        if (this.stormCloudsSurvived >= 1) {
          this.unlockAchievement(ACHIEVEMENTS.SURVIVE_STORM);
        }
        // Visual feedback
        this.player.setTint(0xff6666);
        this.time.delayedCall(200, () => this.player.clearTint());
        break;
    }

    this.player.setTexture(this.playerSpriteMode ? 'player_sprite_idle' : 'player');
  }

  /**
   * Collect item
   */
  private collectItem(item: Collectible): void {
    this.collectiblesCount++;
    this.score += GAME_CONFIG.SCORING.COLLECTIBLE;
    this.playSound(SOUND_KEYS.COLLECTIBLE);

    // Visual effect
    this.tweens.add({
      targets: item,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => item.destroy(),
    });

    if (this.collectiblesCount >= 10) {
      this.unlockAchievement(ACHIEVEMENTS.COLLECT_10);
    }
  }

  /**
   * Hit obstacle
   */
  private hitObstacle(_obstacle: Obstacle): void {
    // Game over
    this.playSound('hit');
    this.playerDeath();
  }

  /**
   * Player death
   */
  private playerDeath(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // R87.C4: Soft procedural sine-arpeggio via CLOUD_JUMPER_DEATH replaces
    // the previous GAME_OVER route (sfx_explosion_emp.mp3, Tom: "harrowing
    // lol"). The new envelope fades over ~500 ms so players hear a melancholic
    // descent rather than a punitive explosion.
    this.playSound(SOUND_KEYS.CLOUD_JUMPER_DEATH);
    this.cameras.main.shake(200, 0.012);
    this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25);

    this.player.setTexture('player_dead');
    this.player.clearTint();

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      y: this.player.y + 100,
      duration: 600,
      onComplete: () => {
        if (this.score > this.highScore) this.highScore = this.score;
        this.reportScore(this.score, this.highScore);
        this.gameOver(this.score, `Distance: ${Math.floor(this.distance)}m`, this.highScore, [
          { label: 'Collectibles', value: this.collectiblesCount },
          { label: 'Bounce Streak', value: this.bounceStreak },
          { label: 'Storms', value: this.stormCloudsSurvived },
        ], Math.floor(this.distance / 100), this.getGameDuration());
      },
    });
  }

  /**
   * Update scroll speed
   */
  private updateScrollSpeed(delta: number): void {
    this.scrollSpeed = Math.min(
      GAME_CONFIG.SCROLL.SPEED_MAX,
      this.scrollSpeed + GAME_CONFIG.SCROLL.ACCELERATION * (delta / 1000)
    );
  }

  /**
   * Scroll background layers
   */
  private scrollBackgrounds(delta: number): void {
    const scrollAmount = this.scrollSpeed * (delta / 1000);

    this.bgFar.tilePositionX += scrollAmount * 0.2;
    this.bgMid.tilePositionX += scrollAmount * 0.5;
    this.bgNear.tilePositionX += scrollAmount * 0.8;
  }

  /**
   * Scroll game objects — also tracks lastCloudX so new clouds generate continuously
   */
  private scrollObjects(delta: number): void {
    const scrollAmount = this.scrollSpeed * (delta / 1000);

    // Keep lastCloudX in sync with the scrolling world so generateContent()
    // keeps producing new clouds as old ones scroll off the left edge
    this.lastCloudX -= scrollAmount;

    // Scroll clouds
    this.clouds.getChildren().forEach((obj) => {
      const cloud = obj as Cloud;
      cloud.x -= scrollAmount;
    });

    // Scroll collectibles
    this.collectibles.getChildren().forEach((obj) => {
      const item = obj as Collectible;
      item.x -= scrollAmount;
    });

    // Scroll obstacles
    this.obstacles.getChildren().forEach((obj) => {
      const obstacle = obj as Obstacle;
      obstacle.x -= scrollAmount + obstacle.speed * (delta / 1000);
    });
  }

  /**
   * Generate initial clouds
   */
  private generateInitialClouds(): void {
    const { WIDTH, HEIGHT, PLAYER, CLOUDS } = GAME_CONFIG;

    // Starting platform
    this.createCloud(PLAYER.START_X, PLAYER.START_Y + 50, 'normal');

    // Generate clouds across screen
    let x = PLAYER.START_X + 150;
    while (x < WIDTH + 200) {
      const y = HEIGHT / 2 + Phaser.Math.Between(-CLOUDS.VERTICAL_RANGE, CLOUDS.VERTICAL_RANGE);
      this.createCloud(x, y, this.getRandomCloudType());
      x += Phaser.Math.Between(CLOUDS.SPACING_MIN, CLOUDS.SPACING_MAX);
    }

    this.lastCloudX = x;
  }

  /**
   * Create a cloud
   */
  private static readonly CLOUD_TINTS: Record<CloudType, number> = {
    normal: MATRIX_COLORS.WHITE,
    moving: 0x66ffff,
    disappearing: 0xaaaaaa,
    storm: 0xff6666,
  };

  private createCloud(x: number, y: number, type: CloudType): Cloud {
    const spriteMode = this.game.registry.get('spriteMode') === true;
    const textureKey = spriteMode ? `cloud_sprite_${type}` : `cloud_${type}`;
    const cloud = this.clouds.create(x, y, textureKey) as Cloud;
    cloud.cloudType = type;
    cloud.setImmovable(true);
    cloud.setDepth(5);

    const width = Phaser.Math.Between(GAME_CONFIG.CLOUDS.WIDTH_MIN, GAME_CONFIG.CLOUDS.WIDTH_MAX);

    const cloudBody = cloud.body as Phaser.Physics.Arcade.Body;
    if (spriteMode) {
      cloud.setDisplaySize(width, GAME_CONFIG.CLOUDS.HEIGHT);
      const tint = CloudJumperGameScene.CLOUD_TINTS[type];
      if (tint !== MATRIX_COLORS.WHITE) cloud.setTint(tint);
      cloudBody.setSize(cloud.width, cloud.height);
    } else {
      cloud.setScale(width / 120, 1);
      cloudBody.setSize(width, GAME_CONFIG.CLOUDS.HEIGHT);
      cloudBody.setOffset((120 - width) / 2, 0);
    }

    // Moving cloud setup
    if (type === 'moving') {
      cloud.moveDirection = Math.random() > 0.5 ? 1 : -1;
      cloud.moveSpeed = Phaser.Math.Between(30, 60);
      cloud.baseY = y;
    }

    return cloud;
  }

  /**
   * Get random cloud type
   */
  private getRandomCloudType(): CloudType {
    const types = GAME_CONFIG.CLOUD_TYPES;
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, config] of Object.entries(types)) {
      cumulative += config.weight;
      if (rand < cumulative) {
        return type.toLowerCase() as CloudType;
      }
    }

    return 'normal';
  }

  /**
   * Update clouds
   */
  private updateClouds(delta: number): void {
    this.clouds.getChildren().forEach((obj) => {
      const cloud = obj as Cloud;

      // Moving clouds
      if (cloud.cloudType === 'moving' && cloud.moveDirection && cloud.moveSpeed && cloud.baseY !== undefined) {
        cloud.y += cloud.moveDirection * cloud.moveSpeed * (delta / 1000);

        // Bounce within range
        const range = GAME_CONFIG.CLOUDS.VERTICAL_RANGE / 2;
        if (cloud.y < cloud.baseY - range) {
          cloud.y = cloud.baseY - range;
          cloud.moveDirection = 1;
        } else if (cloud.y > cloud.baseY + range) {
          cloud.y = cloud.baseY + range;
          cloud.moveDirection = -1;
        }
      }

      // Remove off-screen clouds
      if (cloud.x < -100) {
        cloud.destroy();
      }
    });
  }

  /**
   * Generate new content — uses screen width only since the player never moves horizontally
   */
  private generateContent(): void {
    const { WIDTH, HEIGHT, CLOUDS } = GAME_CONFIG;

    // Generate clouds ahead of the right screen edge
    while (this.lastCloudX < WIDTH) {
      const x = this.lastCloudX + Phaser.Math.Between(CLOUDS.SPACING_MIN, CLOUDS.SPACING_MAX);
      const y = HEIGHT / 2 + Phaser.Math.Between(-CLOUDS.VERTICAL_RANGE, CLOUDS.VERTICAL_RANGE);

      this.createCloud(x, y, this.getRandomCloudType());
      this.lastCloudX = x;

      // Maybe spawn collectible
      if (Math.random() < GAME_CONFIG.COLLECTIBLES.SPAWN_CHANCE) {
        this.spawnCollectible(x, y - 50);
      }

      // Maybe spawn obstacle
      if (this.distance > GAME_CONFIG.OBSTACLES.SPAWN_DISTANCE) {
        const spawnChance = Math.min(
          GAME_CONFIG.OBSTACLES.SPAWN_CHANCE_BASE + this.distance / 10000,
          GAME_CONFIG.OBSTACLES.SPAWN_CHANCE_MAX
        );
        if (Math.random() < spawnChance) {
          this.spawnObstacle();
        }
      }
    }
  }

  /**
   * Spawn collectible
   */
  private spawnCollectible(x: number, y: number): void {
    const types = GAME_CONFIG.COLLECTIBLES.TYPES;
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    const collectibleSpriteMode = this.game.registry.get('collectibleSpriteMode') === true;

    const textureKey = collectibleSpriteMode
      ? `collectible_sprite_${type}`
      : type;

    const item = this.collectibles.create(x, y, textureKey) as Collectible;
    item.collectType = type;
    if (collectibleSpriteMode) {
      item.setScale(1.5);
      item.setTint(MATRIX_COLORS.PRIMARY);
    }
    item.setDepth(6);

    // Floating animation
    this.tweens.add({
      targets: item,
      y: y - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Spawn obstacle
   */
  private spawnObstacle(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const types = GAME_CONFIG.OBSTACLES.TYPES;
    const type = types[Phaser.Math.Between(0, types.length - 1)];

    const x = WIDTH + 50;
    const y = Phaser.Math.Between(50, HEIGHT - 100);

    const obstacleSpriteMode = this.game.registry.get('obstacleSpriteMode') === true;
    const textureKey = obstacleSpriteMode
      ? `obstacle_sprite_${type}`
      : type;

    const obstacle = this.obstacles.create(x, y, textureKey) as Obstacle;
    obstacle.obstacleType = type;
    obstacle.speed = Phaser.Math.Between(50, 150);
    obstacle.setDepth(8);
    if (obstacleSpriteMode) {
      obstacle.setTint(0xff3333);
    }

    // Birds flap
    if (type === 'bird') {
      this.tweens.add({
        targets: obstacle,
        y: y - 20,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Update obstacles
   */
  private updateObstacles(_delta: number): void {
    this.obstacles.getChildren().forEach((obj) => {
      const obstacle = obj as Obstacle;

      // Check for close call
      if (!this.hadCloseCall) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          obstacle.x,
          obstacle.y
        );
        if (dist < 30 && dist > 10) {
          this.hadCloseCall = true;
          this.unlockAchievement(ACHIEVEMENTS.CLOSE_CALL);
        }
      }

      // Remove off-screen
      if (obstacle.x < -100) {
        obstacle.destroy();
      }
    });
  }

  /**
   * Check game over conditions
   */
  private checkGameOver(): void {
    // Fell off bottom
    if (this.player.y > GAME_CONFIG.HEIGHT + 50) {
      this.playSound(SOUND_KEYS.FALL);
      this.playerDeath();
    }
  }

  /**
   * R87.C3 — lateral movement with release-to-stop deceleration.
   *
   * Tom's 2026-04-22 playtest: *"The player should be able to stop. This is
   * to avoid hitting things by accident and provide more control."*
   * Pre-R87.C3 CloudJumper pinned the player at `START_X=150` with no
   * lateral agency — obstacles always arrived at a fixed column.
   *
   * Control model: LEFT/A drives `setVelocityX(-HORIZONTAL_SPEED)`,
   * RIGHT/D drives `setVelocityX(+HORIZONTAL_SPEED)`, no key held leaves
   * the body to Phaser's arcade drag (`HORIZONTAL_DRAG` on the X axis,
   * set in `createPlayer()`) which decelerates velocity back to 0 over
   * ~0.25 s. Tom's "stop" beat is the drag-decay — crisp enough to feel
   * responsive, smooth enough not to read as a glitch when the key
   * releases mid-stride.
   *
   * Gates: `isCountingDown` and `isGameOver` both short-circuit so neither
   * the pre-game countdown window nor the death tween gets interrupted by
   * a late keystroke. Both-keys-held resolves to no-op (drag kicks in) so
   * a player mashing both directions can't accumulate invisible velocity.
   *
   * Boundary clamp: `player.x` is pinned to `[WIDTH/2, CANVAS_WIDTH - WIDTH/2]`
   * with any into-wall velocity component zeroed so the player can lean
   * against a wall without accumulating impossible momentum, which would
   * fire the moment the wall was no longer there.
   */
  private handleHorizontalMovement(): void {
    if (this.isCountingDown || this.isGameOver) return;
    if (!this.player || !this.player.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const leftDown = this.moveLeftKey?.isDown === true || this.moveLeftKeyA?.isDown === true;
    const rightDown = this.moveRightKey?.isDown === true || this.moveRightKeyD?.isDown === true;

    if (leftDown && !rightDown) {
      body.setVelocityX(-GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
    } else if (rightDown && !leftDown) {
      body.setVelocityX(GAME_CONFIG.PLAYER.HORIZONTAL_SPEED);
    }
    // else: no key or both keys held → drag handles deceleration

    // Clamp to canvas bounds so lateral movement can't escape the viewport.
    const halfWidth = GAME_CONFIG.PLAYER.WIDTH / 2;
    const maxX = GAME_CONFIG.WIDTH - halfWidth;
    if (this.player.x < halfWidth) {
      this.player.x = halfWidth;
      if (body.velocity.x < 0) body.setVelocityX(0);
    } else if (this.player.x > maxX) {
      this.player.x = maxX;
      if (body.velocity.x > 0) body.setVelocityX(0);
    }
  }

  /**
   * R87.C2 — ceiling clamp to prevent off-screen-above excursions.
   *
   * Belt guarantee against Tom's *"jumps too hard and goes off screen"*
   * scenario. A no-op on any jump that lands below `CEILING_Y` so the
   * mid-canvas-cloud-plus-normal-jump feel is untouched. Active only on
   * the pathological high-cloud-plus-manual-chain corner case: clamps `y`
   * back to `CEILING_Y` and zeroes upward velocity so gravity pulls the
   * player back into play instead of letting them accumulate invisible
   * upward travel.
   *
   * Skipped while `isGameOver` is true — the death tween animates `y` by
   * +100 from current position and mustn't be interfered with (the death
   * fall could never trip the ceiling anyway since the tween moves DOWN,
   * but the guard is symmetric with `checkGameOver`'s contract).
   */
  private enforceCeiling(): void {
    if (this.isGameOver) return;
    if (!this.player || !this.player.body) return;
    if (this.player.y >= GAME_CONFIG.PLAYER.CEILING_Y) return;

    this.player.y = GAME_CONFIG.PLAYER.CEILING_Y;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < 0) {
      body.setVelocityY(0);
    }
  }

  /**
   * Check achievements
   */
  private checkAchievements(): void {
    if (this.distance >= 500) {
      this.unlockAchievement(ACHIEVEMENTS.DISTANCE_500);
    }
    if (this.distance >= 2000) {
      this.unlockAchievement(ACHIEVEMENTS.DISTANCE_2000);
    }
    if (this.bounceStreak >= 10) {
      this.unlockAchievement(ACHIEVEMENTS.BOUNCE_STREAK);
    }
  }

  /**
   * Update UI
   */
  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.distanceText.setText(`DISTANCE: ${Math.floor(this.distance)}m`);

    // Update player texture based on velocity
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 100) {
      this.player.setTexture(this.playerSpriteMode ? 'player_sprite_fall' : 'player_fall');
    }
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown(): void {
    this.stopBackgroundMusic();
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    super.shutdown();
  }
}
