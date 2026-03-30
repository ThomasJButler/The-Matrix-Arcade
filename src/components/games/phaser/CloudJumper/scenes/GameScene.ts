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
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
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

  // Game state
  private distance = 0;
  private score = 0;
  private collectiblesCount = 0;
  private bounceStreak = 0;
  private scrollSpeed = GAME_CONFIG.SCROLL.SPEED_BASE;
  private stormCloudsSurvived = 0;
  private hadCloseCall = false;

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

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    // Sky background
    this.cameras.main.setBackgroundColor(0x87ceeb);

    // Reset state
    this.distance = 0;
    this.score = 0;
    this.collectiblesCount = 0;
    this.bounceStreak = 0;
    this.scrollSpeed = GAME_CONFIG.SCROLL.SPEED_BASE;
    this.stormCloudsSurvived = 0;
    this.hadCloseCall = false;
    this.hasJumped = false;
    this.lastCloudX = 0;
    this.jumpPressed = false;

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
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Handle input
    this.handleInput();

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

    // Check game over
    this.checkGameOver();

    // Update score
    this.distance += this.scrollSpeed * (delta / 1000);
    this.score = Math.floor(this.distance / GAME_CONFIG.SCORING.DISTANCE_DIVISOR);

    // Achievements
    this.checkAchievements();

    // Update UI
    this.updateUI();
  }

  /**
   * Create parallax background layers
   */
  private createBackgrounds(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Far layer (slowest)
    this.bgFar = this.add.tileSprite(WIDTH / 2, 75, WIDTH, 150, 'bg_far');
    this.bgFar.setScrollFactor(0);
    this.bgFar.setDepth(-3);

    // Mid layer
    this.bgMid = this.add.tileSprite(WIDTH / 2, HEIGHT - 150, WIDTH, 100, 'bg_mid');
    this.bgMid.setScrollFactor(0);
    this.bgMid.setDepth(-2);

    // Near layer (fastest)
    this.bgNear = this.add.tileSprite(WIDTH / 2, HEIGHT - 50, WIDTH, 60, 'bg_near');
    this.bgNear.setScrollFactor(0);
    this.bgNear.setDepth(-1);
  }

  /**
   * Create player
   */
  private createPlayer(): void {
    const { PLAYER } = GAME_CONFIG;

    this.player = this.physics.add.sprite(PLAYER.START_X, PLAYER.START_Y, 'player');
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(false);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
    body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);
    body.setBounce(0, 0); // No bounce off surfaces
    body.setDrag(0, 0); // No air resistance
    body.setAccelerationY(0); // Let world gravity handle vertical acceleration
    body.enable = true; // Ensure physics body is enabled
  }

  /**
   * Create UI
   */
  private createUI(): void {
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    this.distanceText = this.add.text(20, 45, 'DISTANCE: 0m', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.distanceText.setScrollFactor(0);
    this.distanceText.setDepth(100);
  }

  /**
   * Setup input
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Also allow click/tap to jump
    this.input.on('pointerdown', () => this.jump());

    // Up arrow
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.jump());
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', () => this.jump());
  }

  /**
   * Handle input
   */
  private handleInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.jump();
    }
  }

  /**
   * Jump
   */
  private jump(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Can only jump if on a cloud or near one
    if (body.touching.down || body.blocked.down || this.isNearCloud()) {
      body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
      this.player.setTexture('player');
      this.playSound('jump');

      if (!this.hasJumped) {
        this.hasJumped = true;
        this.unlockAchievement(ACHIEVEMENTS.FIRST_JUMP);
      }
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
   * Check if player can land on cloud
   */
  private canLandOnCloud(player: Phaser.Physics.Arcade.Sprite, cloud: Cloud): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;

    // Land when falling (velocity.y > 0) AND above cloud, or when not moving up and touching
    const isFalling = playerBody.velocity.y > 0;
    const isAboveCloud = player.y + playerBody.height / 2 < cloud.y;
    const isTouchingDown = playerBody.touching.down || playerBody.blocked.down;

    return (isFalling && isAboveCloud) || isTouchingDown;
  }

  /**
   * Handle landing on cloud
   */
  private handleCloudCollision(cloud: Cloud): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Increment bounce streak
    this.bounceStreak++;

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
          this.tweens.add({
            targets: cloud,
            alpha: 0,
            duration: 500,
            onComplete: () => cloud.destroy(),
          });
        }
        break;

      case 'storm':
        // Storm clouds hurt but bounce
        body.setVelocityY(GAME_CONFIG.PLAYER.JUMP_VELOCITY);
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

    this.player.setTexture('player');
  }

  /**
   * Collect item
   */
  private collectItem(item: Collectible): void {
    this.collectiblesCount++;
    this.score += GAME_CONFIG.SCORING.COLLECTIBLE;
    this.playSound('score');

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
    this.player.setTint(0xff0000);

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      y: this.player.y + 100,
      angle: 180,
      duration: 500,
      onComplete: () => {
        this.reportScore(this.score, this.score);
        this.scene.start(SCENE_KEYS.GAME_OVER, {
          score: this.score,
          highScore: this.score,
          reason: `Distance: ${Math.floor(this.distance)}m`,
        });
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
   * Scroll game objects
   */
  private scrollObjects(delta: number): void {
    const scrollAmount = this.scrollSpeed * (delta / 1000);

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
  private createCloud(x: number, y: number, type: CloudType): Cloud {
    const cloud = this.clouds.create(x, y, `cloud_${type}`) as Cloud;
    cloud.cloudType = type;
    cloud.setImmovable(true);
    cloud.setDepth(5);

    // Scale based on type
    const width = Phaser.Math.Between(GAME_CONFIG.CLOUDS.WIDTH_MIN, GAME_CONFIG.CLOUDS.WIDTH_MAX);
    cloud.setScale(width / 120, 1);

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
   * Generate new content
   */
  private generateContent(): void {
    const { WIDTH, HEIGHT, CLOUDS } = GAME_CONFIG;

    // Generate clouds
    while (this.lastCloudX < this.player.x + WIDTH) {
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

    const item = this.collectibles.create(x, y, type) as Collectible;
    item.collectType = type;
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

    const obstacle = this.obstacles.create(x, y, type) as Obstacle;
    obstacle.obstacleType = type;
    obstacle.speed = Phaser.Math.Between(50, 150);
    obstacle.setDepth(8);

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
      this.playerDeath();
    }

    // Left behind (too far left)
    if (this.player.x < -50) {
      this.playerDeath();
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
      this.player.setTexture('player_fall');
    }
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown(): void {
    this.time?.removeAllEvents();
    this.tweens?.killAll();
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
  }
}
