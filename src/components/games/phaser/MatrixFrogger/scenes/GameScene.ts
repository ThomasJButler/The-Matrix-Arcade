/**
 * Matrix Frogger - Game Scene
 *
 * Main gameplay scene implementing Frogger mechanics:
 * - Grid-based movement with hopping animation
 * - Lane-based enemy spawning (Agents and Sentinels)
 * - Power-ups: Bullet Time, Ghost, Shield, Magnet
 * - Collectible pills for score and power-ups
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/** Enemy sprite with movement data */
interface Enemy extends Phaser.Physics.Arcade.Sprite {
  enemyType: 'agent' | 'sentinel';
  baseSpeed: number;
  direction: 1 | -1;
  lane: number;
}

/** Pill collectible */
interface Pill extends Phaser.Physics.Arcade.Sprite {
  pillType: 'red' | 'blue';
}

/** Power-up types */
type PowerUpType = 'bullet_time' | 'ghost' | 'shield' | 'magnet';

/** Active power-up state */
interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

export class FroggerGameScene extends BaseScene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerCol = GAME_CONFIG.PLAYER.START_COL;
  private playerRow = GAME_CONFIG.PLAYER.START_ROW;
  private isMoving = false;

  // Game state
  private score = 0;
  private maxDistance = 0;
  private nearMissCount = 0;
  private combo = 0;
  private lastComboTime = 0;
  private magnetCollected = 0;

  // Power-ups
  private activePowerUps: ActivePowerUp[] = [];
  private shieldHits = 0;

  // Object pools
  private enemies!: Phaser.Physics.Arcade.Group;
  private pills!: Phaser.Physics.Arcade.Group;
  private deathEffects!: Phaser.GameObjects.Group;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private powerUpDisplay!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;

  // Matrix rain
  private rainGroup!: Phaser.GameObjects.Group;

  // Lane configuration (bottom to top)
  private lanes: Array<{ type: string; enemyType?: 'agent' | 'sentinel'; direction: 1 | -1 }> = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(25);

    // Initialize game state
    this.score = 0;
    this.maxDistance = 0;
    this.nearMissCount = 0;
    this.combo = 0;
    this.lastComboTime = 0;
    this.magnetCollected = 0;
    this.activePowerUps = [];
    this.shieldHits = 0;
    this.playerCol = GAME_CONFIG.PLAYER.START_COL;
    this.playerRow = GAME_CONFIG.PLAYER.START_ROW;
    this.isMoving = false;

    // Setup lanes
    this.setupLanes();

    // Create object groups
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: false,
    });

    this.pills = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 20,
    });

    this.deathEffects = this.add.group();

    // Create player
    this.createPlayer();

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();
    this.setupCommonInputs();

    // Setup collisions
    this.setupCollisions();

    // Start spawning
    this.spawnInitialEnemies();
    this.spawnPills();

    // Spawn timers
    this.time.addEvent({
      delay: 2000,
      callback: () => this.spawnEnemy(),
      loop: true,
    });

    this.time.addEvent({
      delay: 3000,
      callback: () => this.spawnPills(),
      loop: true,
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update matrix rain
    this.updateMatrixRain(this.rainGroup, delta);

    // Process input
    this.handleInput();

    // Update enemies
    this.updateEnemies(delta);

    // Update power-ups
    this.updatePowerUps(time);

    // Apply magnet effect
    this.applyMagnetEffect(delta);

    // Update combo decay
    this.updateCombo(time);

    // Check if player reached top
    this.checkProgress();
  }

  /**
   * Setup lane configuration
   */
  private setupLanes(): void {
    // Row 0 = top (goal), Row 8 = bottom (start)
    this.lanes = [
      { type: 'safe' }, // Row 0 - Goal
      { type: 'road', enemyType: 'sentinel', direction: 1 }, // Row 1
      { type: 'road', enemyType: 'agent', direction: -1 }, // Row 2
      { type: 'road', enemyType: 'sentinel', direction: -1 }, // Row 3
      { type: 'safe' }, // Row 4 - Middle safe zone
      { type: 'road', enemyType: 'agent', direction: 1 }, // Row 5
      { type: 'road', enemyType: 'agent', direction: -1 }, // Row 6
      { type: 'road', enemyType: 'sentinel', direction: 1 }, // Row 7
      { type: 'safe' }, // Row 8 - Start
    ];
  }

  /**
   * Create player sprite
   */
  private createPlayer(): void {
    const x = this.colToX(this.playerCol);
    const y = this.rowToY(this.playerRow);

    this.player = this.physics.add.sprite(x, y, 'player', 0);
    this.player.setScale(0.8);
    this.player.setDepth(10);
    this.player.play('player_idle');

    // Add glow effect
    this.player.setTint(MATRIX_COLORS.PRIMARY);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Score
    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.scoreText.setDepth(100);

    // Distance
    this.distanceText = this.add.text(10, 35, 'DISTANCE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.distanceText.setDepth(100);

    // Combo
    this.comboText = this.add.text(10, 55, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: MATRIX_COLORS.YELLOW_HEX,
    });
    this.comboText.setDepth(100);

    // Power-up display (top right)
    this.powerUpDisplay = this.add.container(GAME_CONFIG.WIDTH - 10, 10);
    this.powerUpDisplay.setDepth(100);
  }

  /**
   * Setup keyboard input
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  /**
   * Process movement input
   */
  private handleInput(): void {
    if (this.isMoving) return;

    let newCol = this.playerCol;
    let newRow = this.playerRow;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) {
      newRow = Math.max(0, this.playerRow - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) {
      newRow = Math.min(GAME_CONFIG.GRID_ROWS - 1, this.playerRow + 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) {
      newCol = Math.max(0, this.playerCol - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) {
      newCol = Math.min(GAME_CONFIG.GRID_COLS - 1, this.playerCol + 1);
    }

    if (newCol !== this.playerCol || newRow !== this.playerRow) {
      this.movePlayer(newCol, newRow);
    }
  }

  /**
   * Move player to new grid position
   */
  private movePlayer(col: number, row: number): void {
    this.isMoving = true;
    const wasForward = row < this.playerRow;

    this.playerCol = col;
    this.playerRow = row;

    const targetX = this.colToX(col);
    const targetY = this.rowToY(row);

    // Play hop animation
    this.player.play('player_hop');
    this.playSound('jump');

    // Tween to target position
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: GAME_CONFIG.PLAYER.MOVE_SPEED,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isMoving = false;
        this.player.play('player_idle');

        // Score for forward movement
        if (wasForward) {
          const distance = GAME_CONFIG.PLAYER.START_ROW - row;
          if (distance > this.maxDistance) {
            this.maxDistance = distance;
            this.addScore(GAME_CONFIG.SCORING.STEP_FORWARD);
          }
        }

        // Check near-miss immediately after landing
        this.checkNearMiss();
      },
    });
  }

  /**
   * Setup collision detection
   */
  private setupCollisions(): void {
    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, enemy) => this.handleEnemyCollision(enemy as Enemy),
      undefined,
      this
    );

    // Player vs pills
    this.physics.add.overlap(
      this.player,
      this.pills,
      (_player, pill) => this.collectPill(pill as Pill),
      undefined,
      this
    );
  }

  /**
   * Handle collision with enemy
   */
  private handleEnemyCollision(enemy: Enemy): void {
    // Ghost power-up - no collision
    if (this.hasPowerUp('ghost')) {
      return;
    }

    // Shield power-up - absorb hit
    if (this.shieldHits > 0) {
      this.shieldHits--;
      this.playSound('hit');
      this.createShieldBreakEffect();
      this.removePowerUpFromDisplay('shield');
      this.unlockAchievement(ACHIEVEMENTS.SHIELD_SAVE);
      return;
    }

    // Player dies
    this.playerDeath(enemy);
  }

  /**
   * Player death sequence
   */
  private playerDeath(enemy?: Enemy): void {
    this.player.setTint(0xff0000);
    this.playSound('hit');

    // Death animation
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      scale: 0,
      angle: 360,
      duration: 500,
      onComplete: () => {
        // Report final score
        this.reportScore(this.score, this.score);

        // Transition to game over
        this.scene.start(SCENE_KEYS.GAME_OVER, {
          score: this.score,
          highScore: this.score,
          reason: enemy ? `Hit by ${enemy.enemyType.toUpperCase()}` : 'Game Over',
        });
      },
    });

    // Screen shake
    this.cameras.main.shake(300, 0.01);
  }

  /**
   * Collect a pill
   */
  private collectPill(pill: Pill): void {
    const pillType = pill.pillType;
    pill.destroy();

    if (pillType === 'red') {
      // Score pill
      this.addScore(GAME_CONFIG.SCORING.RED_PILL);
      this.playSound('score');
    } else {
      // Power-up pill
      this.grantRandomPowerUp();
      this.playSound('powerup');
    }
  }

  /**
   * Grant a random power-up
   */
  private grantRandomPowerUp(): void {
    const types: PowerUpType[] = ['bullet_time', 'ghost', 'shield', 'magnet'];
    const type = types[Phaser.Math.Between(0, types.length - 1)];

    switch (type) {
      case 'bullet_time':
        this.activatePowerUp('bullet_time', GAME_CONFIG.POWERUPS.BULLET_TIME.DURATION);
        this.playSound('powerupBulletTime');
        this.unlockAchievement(ACHIEVEMENTS.BULLET_TIME);
        break;
      case 'ghost':
        this.activatePowerUp('ghost', GAME_CONFIG.POWERUPS.GHOST.DURATION);
        this.playSound('powerupGhost');
        this.unlockAchievement(ACHIEVEMENTS.GHOST_MODE);
        break;
      case 'shield':
        this.shieldHits = GAME_CONFIG.POWERUPS.SHIELD.HITS;
        this.addPowerUpToDisplay('shield');
        this.playSound('powerupShield');
        break;
      case 'magnet':
        this.activatePowerUp('magnet', GAME_CONFIG.POWERUPS.MAGNET.DURATION);
        this.playSound('powerupMagnet');
        break;
    }
  }

  /**
   * Activate a timed power-up
   */
  private activatePowerUp(type: PowerUpType, duration: number): void {
    // Remove existing of same type
    this.activePowerUps = this.activePowerUps.filter((p) => p.type !== type);

    // Add new
    this.activePowerUps.push({
      type,
      endTime: this.time.now + duration,
    });

    this.addPowerUpToDisplay(type);
  }

  /**
   * Check if power-up is active
   */
  private hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some((p) => p.type === type);
  }

  /**
   * Update power-up timers
   */
  private updatePowerUps(time: number): void {
    const expired = this.activePowerUps.filter((p) => p.endTime <= time);
    this.activePowerUps = this.activePowerUps.filter((p) => p.endTime > time);

    expired.forEach((p) => {
      this.removePowerUpFromDisplay(p.type);
    });
  }

  /**
   * Add power-up indicator to display
   */
  private addPowerUpToDisplay(type: PowerUpType | 'shield'): void {
    const existing = this.powerUpDisplay.getByName(type);
    if (existing) return;

    const index = this.powerUpDisplay.length;
    const icon = this.add.sprite(-40 * index - 16, 16, `powerup_${type}`);
    icon.setName(type);
    this.powerUpDisplay.add(icon);
  }

  /**
   * Remove power-up indicator from display
   */
  private removePowerUpFromDisplay(type: PowerUpType | 'shield'): void {
    const icon = this.powerUpDisplay.getByName(type);
    if (icon) {
      icon.destroy();
      // Reposition remaining
      let index = 0;
      this.powerUpDisplay.each((child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Sprite) {
          child.x = -40 * index - 16;
          index++;
        }
      });
    }
  }

  /**
   * Apply magnet effect to nearby pills
   */
  private applyMagnetEffect(delta: number): void {
    if (!this.hasPowerUp('magnet')) return;

    const playerX = this.player.x;
    const playerY = this.player.y;
    const range = GAME_CONFIG.POWERUPS.MAGNET.RANGE * GAME_CONFIG.CELL_SIZE;

    this.pills.getChildren().forEach((obj) => {
      const pill = obj as Pill;
      const dist = Phaser.Math.Distance.Between(playerX, playerY, pill.x, pill.y);

      if (dist < range && dist > 5) {
        // Move toward player
        const angle = Phaser.Math.Angle.Between(pill.x, pill.y, playerX, playerY);
        const speed = 200 * (delta / 1000);
        pill.x += Math.cos(angle) * speed;
        pill.y += Math.sin(angle) * speed;
      }
    });
  }

  /**
   * Spawn enemies on a lane
   */
  private spawnEnemy(): void {
    // Pick a random road lane
    const roadLanes = this.lanes
      .map((lane, index) => ({ ...lane, row: index }))
      .filter((lane) => lane.type === 'road');

    if (roadLanes.length === 0) return;

    const lane = Phaser.Utils.Array.GetRandom(roadLanes);
    const direction = lane.direction;
    const enemyType = lane.enemyType || 'agent';

    // Calculate spawn position
    const startX = direction === 1 ? -GAME_CONFIG.CELL_SIZE : GAME_CONFIG.WIDTH + GAME_CONFIG.CELL_SIZE;
    const y = this.rowToY(lane.row);

    // Get or create enemy sprite
    const enemy = this.enemies.get(startX, y, enemyType === 'agent' ? 'enemy_agent' : 'enemy_sentinel') as Enemy;
    if (!enemy) return;

    enemy.setActive(true);
    enemy.setVisible(true);
    enemy.setScale(0.8);
    enemy.enemyType = enemyType;
    enemy.direction = direction;
    enemy.lane = lane.row;

    // Set speed based on type and difficulty
    const config = GAME_CONFIG.ENEMIES[enemyType.toUpperCase() as 'AGENT' | 'SENTINEL'];
    const difficultyBonus = Math.floor(this.maxDistance / 100) * GAME_CONFIG.DIFFICULTY.SPEED_INCREASE_PER_100;
    enemy.baseSpeed = Phaser.Math.Between(config.SPEED_MIN, config.SPEED_MAX) + difficultyBonus;

    // Tint based on type
    enemy.setTint(enemyType === 'agent' ? 0x00ff00 : 0xff6600);
  }

  /**
   * Spawn initial enemies
   */
  private spawnInitialEnemies(): void {
    for (let i = 0; i < GAME_CONFIG.DIFFICULTY.ENEMY_COUNT_BASE * 2; i++) {
      this.spawnEnemy();
    }
  }

  /**
   * Spawn pills on the field
   */
  private spawnPills(): void {
    // Random position not on edges
    const col = Phaser.Math.Between(1, GAME_CONFIG.GRID_COLS - 2);
    const row = Phaser.Math.Between(1, GAME_CONFIG.GRID_ROWS - 2);

    // Skip if lane is not safe and already has enemy nearby
    const x = this.colToX(col);
    const y = this.rowToY(row);

    // 80% red (points), 20% blue (power-up)
    const isBlue = Math.random() < 0.2;
    const textureKey = isBlue ? 'blue_pill' : 'red_pill';

    const pill = this.pills.get(x, y, textureKey) as Pill;
    if (!pill) return;

    pill.setActive(true);
    pill.setVisible(true);
    pill.pillType = isBlue ? 'blue' : 'red';

    // Floating animation
    this.tweens.add({
      targets: pill,
      y: y - 5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Update all enemies
   */
  private updateEnemies(delta: number): void {
    // Get speed multiplier from bullet time
    const speedMult = this.hasPowerUp('bullet_time') ? GAME_CONFIG.POWERUPS.BULLET_TIME.SLOW_FACTOR : 1;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;

      // Move enemy
      const speed = enemy.baseSpeed * speedMult * (delta / 1000);
      enemy.x += speed * enemy.direction;

      // Wrap or remove
      if (enemy.direction === 1 && enemy.x > GAME_CONFIG.WIDTH + GAME_CONFIG.CELL_SIZE) {
        enemy.setActive(false);
        enemy.setVisible(false);
      } else if (enemy.direction === -1 && enemy.x < -GAME_CONFIG.CELL_SIZE) {
        enemy.setActive(false);
        enemy.setVisible(false);
      }
    });
  }

  /**
   * Check for near miss
   */
  private checkNearMiss(): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    const nearMissDistance = GAME_CONFIG.CELL_SIZE * 0.8;

    let hadNearMiss = false;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;

      const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
      if (dist < nearMissDistance && dist > GAME_CONFIG.CELL_SIZE * 0.4) {
        hadNearMiss = true;
      }
    });

    if (hadNearMiss) {
      this.nearMissCount++;
      this.incrementCombo();
      this.addScore(GAME_CONFIG.SCORING.DODGE_NEAR_MISS * this.getComboMultiplier());

      // Achievement for 10 near misses
      if (this.nearMissCount >= 10) {
        this.unlockAchievement(ACHIEVEMENTS.DODGE_MASTER);
      }
    }
  }

  /**
   * Check progress and achievements
   */
  private checkProgress(): void {
    // Reached top row
    if (this.playerRow === 0) {
      // Unlock achievement
      this.unlockAchievement(ACHIEVEMENTS.FIRST_CROSS);

      // Add bonus and reset
      this.addScore(500);
      this.playSound('levelUp');

      // Reset to start
      this.playerRow = GAME_CONFIG.PLAYER.START_ROW;
      this.playerCol = GAME_CONFIG.PLAYER.START_COL;

      this.tweens.add({
        targets: this.player,
        x: this.colToX(this.playerCol),
        y: this.rowToY(this.playerRow),
        duration: 300,
        ease: 'Back.easeOut',
      });
    }

    // Score achievements
    if (this.score >= 1000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_1000);
    }
    if (this.score >= 5000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_5000);
    }

    // Distance achievement
    if (this.maxDistance >= 5) { // 500 distance = 5 rows forward
      this.unlockAchievement(ACHIEVEMENTS.DISTANCE_500);
    }
  }

  /**
   * Add to score with combo multiplier
   */
  private addScore(points: number): void {
    this.score += points;
    this.updateUI();
  }

  /**
   * Increment combo counter
   */
  private incrementCombo(): void {
    this.combo++;
    this.lastComboTime = this.time.now;

    if (this.combo >= 10) {
      this.unlockAchievement(ACHIEVEMENTS.COMBO_10);
    }

    this.updateUI();
  }

  /**
   * Update combo decay
   */
  private updateCombo(time: number): void {
    // Combo expires after 3 seconds
    if (this.combo > 0 && time - this.lastComboTime > 3000) {
      this.combo = 0;
      this.updateUI();
    }
  }

  /**
   * Get combo score multiplier
   */
  private getComboMultiplier(): number {
    if (this.combo >= 30) return 5;
    if (this.combo >= 20) return 4;
    if (this.combo >= 10) return 3;
    if (this.combo >= 5) return 2;
    return 1;
  }

  /**
   * Update UI display
   */
  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.distanceText.setText(`DISTANCE: ${this.maxDistance * 100}`);

    if (this.combo > 0) {
      const mult = this.getComboMultiplier();
      this.comboText.setText(`COMBO: ${this.combo}x${mult}`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }
  }

  /**
   * Create shield break particle effect
   */
  private createShieldBreakEffect(): void {
    const x = this.player.x;
    const y = this.player.y;

    for (let i = 0; i < 10; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(MATRIX_COLORS.PRIMARY, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;

      const angle = (i / 10) * Math.PI * 2;
      const speed = 100;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Convert grid column to screen X
   */
  private colToX(col: number): number {
    return col * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2 + 16;
  }

  /**
   * Convert grid row to screen Y
   */
  private rowToY(row: number): number {
    return row * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2 + 16;
  }

  shutdown(): void {
    // Remove all time events (spawn timers)
    this.time.removeAllEvents();

    // Remove input listeners
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    // Clear tweens
    this.tweens.killAll();

    // Clear active power-ups array
    this.activePowerUps = [];

    // Destroy groups
    this.enemies.clear(true, true);
    this.pills.clear(true, true);
    this.deathEffects.clear(true, true);
    this.rainGroup.clear(true, true);

    // Clear UI references
    this.scoreText.destroy();
    this.distanceText.destroy();
    this.comboText.destroy();
    this.powerUpDisplay.destroy();
  }
}
