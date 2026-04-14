/**
 * Matrix Frogger - Game Scene
 *
 * Main gameplay scene implementing Frogger mechanics:
 * - Grid-based movement with hopping animation
 * - Lane-based enemy spawning (Agents, Sentinels, Chasers)
 * - Power-ups: Bullet Time, Ghost, Shield, Magnet, NEO Mode
 * - Kung Fu ability (K key, 3 charges per game)
 * - 5-second countdown before gameplay
 * - Visual lane markings, safe zones, finish line
 * - Level progression with increasing difficulty
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS } from '../config';

/** Enemy sprite with movement data */
interface Enemy extends Phaser.Physics.Arcade.Sprite {
  enemyType: 'agent' | 'sentinel' | 'chaser';
  baseSpeed: number;
  direction: 1 | -1;
  lane: number;
  verticalSpeed?: number;
}

/** Pill collectible */
interface Pill extends Phaser.Physics.Arcade.Sprite {
  pillType: 'red' | 'blue' | 'neo';
}

/** Power-up types */
type PowerUpType = 'bullet_time' | 'ghost' | 'shield' | 'magnet' | 'neo_mode';

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
  private bufferedInput: { col: number; row: number } | null = null;

  // Game state
  private score = 0;
  private maxDistance = 0;
  private nearMissCount = 0;
  private combo = 0;
  private lastComboTime = 0;
  private magnetCollected = 0;
  private isGameOver = false;
  private level = 1;
  private neoDestroyCount = 0;

  // Kung Fu
  private kungFuCharges = GAME_CONFIG.KUNG_FU.MAX_CHARGES;
  private kungFuTotalUsed = 0;
  private lastKungFuTime = 0;
  private kungFuIcons: Phaser.GameObjects.Sprite[] = [];

  // Power-ups
  private activePowerUps: ActivePowerUp[] = [];
  private shieldHits = 0;

  // NEO mode visual
  private neoFlashTimer = 0;

  // Object pools
  private enemies!: Phaser.Physics.Arcade.Group;
  private pills!: Phaser.Physics.Arcade.Group;
  private deathEffects!: Phaser.GameObjects.Group;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private powerUpDisplay!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  // Lane visuals
  private laneGraphics!: Phaser.GameObjects.Graphics;
  private safeZoneFlowers: Phaser.GameObjects.Image[] = [];
  private roadDashSprites: Array<{ sprite: Phaser.GameObjects.TileSprite; direction: number }> = [];

  // Finish line fly decoration
  private flySprite: Phaser.GameObjects.Image | null = null;

  // Matrix rain
  private rainGroup!: Phaser.GameObjects.Group;

  // Lane configuration (bottom to top)
  private lanes: Array<{
    type: string;
    enemyType?: 'agent' | 'sentinel';
    direction?: 1 | -1;
    vehicleTextures?: string[];
  }> = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private kungFuKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  private get frogSpriteMode(): boolean {
    return this.game.registry.get('frogSpriteMode') === true || this.game.registry.get('neoSpriteMode') === true;
  }

  private get playerIdleTexture(): string {
    if (this.game.registry.get('neoSpriteMode') === true) return 'neo_idle';
    return 'frog_idle';
  }

  private get playerHopTexture(): string {
    if (this.game.registry.get('neoSpriteMode') === true) return 'neo_hop';
    return 'frog_hop';
  }

  create(): void {
    this.createMatrixBackground();

    this.setupLanes();
    this.computeLaneLayout();
    this.drawLaneBackgrounds();
    this.addRoadDashes();
    this.addSafeZoneFlowers();
    this.addFinishLineFly();

    this.rainGroup = this.addMatrixRain(25);

    // Initialise game state
    this.score = 0;
    this.maxDistance = 0;
    this.nearMissCount = 0;
    this.combo = 0;
    this.lastComboTime = 0;
    this.magnetCollected = 0;
    this.activePowerUps = [];
    this.shieldHits = 0;
    this.isGameOver = false;
    this.isMoving = false;
    this.level = 1;
    this.neoDestroyCount = 0;
    this.neoFlashTimer = 0;
    this.kungFuCharges = GAME_CONFIG.KUNG_FU.MAX_CHARGES;
    this.kungFuTotalUsed = 0;
    this.lastKungFuTime = 0;
    this.playerCol = GAME_CONFIG.PLAYER.START_COL;
    this.playerRow = GAME_CONFIG.PLAYER.START_ROW;

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

    // Spawn enemies (frozen during countdown)
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

    // Start countdown
    this.startCountdown(GAME_CONFIG.COUNTDOWN.DURATION, () => {});

    // Background music
    this.playBackgroundMusic('/assets/matrix-frogger/audio/soundtrack.mp3');
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    if (!this.cursors) return;

    // Update matrix rain
    this.updateMatrixRain(this.rainGroup, delta);

    // Animate road dashes
    for (const dash of this.roadDashSprites) {
      dash.sprite.tilePositionX += GAME_CONFIG.PERSPECTIVE.LANE_DASH_SPEED * dash.direction * (delta / 1000);
    }

    // During countdown, don't process gameplay
    if (this.isCountingDown) return;

    // Process input
    this.handleInput();

    // Update enemies
    this.updateEnemies(delta);

    // Update power-ups
    this.updatePowerUps(time);

    // NEO mode flash effect
    this.updateNeoFlash(delta);

    // Apply magnet effect
    this.applyMagnetEffect(delta);

    // Update combo decay
    this.updateCombo(time);

    // Check if player reached top
    this.checkProgress();

    // Expose state for E2E tests
    this.exposeTestState({
      score: this.score,
      maxDistance: this.maxDistance,
      combo: this.combo,
      level: this.level,
      kungFuCharges: this.kungFuCharges,
    });
  }

  // ---------------------------------------------------------------------------
  // Lane setup and visuals
  // ---------------------------------------------------------------------------

  private setupLanes(): void {
    // Row 0 = top (goal), Row 8 = bottom (start)
    this.lanes = [
      { type: 'safe' }, // Row 0 - Finish line
      { type: 'road', enemyType: 'sentinel', direction: 1 }, // Row 1
      { type: 'road', enemyType: 'agent', direction: -1 }, // Row 2
      { type: 'road', enemyType: 'sentinel', direction: -1 }, // Row 3
      { type: 'safe' }, // Row 4 - Middle safe zone
      { type: 'road', enemyType: 'agent', direction: 1, vehicleTextures: ['vehicle_car1', 'vehicle_car2', 'vehicle_car3'] }, // Row 5
      { type: 'road', enemyType: 'agent', direction: -1, vehicleTextures: ['vehicle_car2', 'vehicle_car3', 'vehicle_tractor'] }, // Row 6
      { type: 'road', enemyType: 'sentinel', direction: 1, vehicleTextures: ['vehicle_truck'] }, // Row 7
      { type: 'safe' }, // Row 8 - Start
    ];
  }

  private drawLaneBackgrounds(): void {
    this.laneGraphics = this.add.graphics();
    this.laneGraphics.setDepth(1);

    const width = GAME_CONFIG.WIDTH;

    for (let row = 0; row < this.lanes.length; row++) {
      const lane = this.lanes[row];
      const y = this.laneYPos[row];
      const h = this.laneH[row];
      const topIn = this.laneInset(row);
      const botIn = row < this.lanes.length - 1 ? this.laneInset(row + 1) : topIn;

      if (lane.type === 'safe') {
        const colour = row === 0 ? GAME_CONFIG.LANE_COLORS.SAFE_ZONE : GAME_CONFIG.LANE_COLORS.START_ZONE;
        this.laneGraphics.fillStyle(colour, 0.6);
      } else {
        this.laneGraphics.fillStyle(GAME_CONFIG.LANE_COLORS.ROAD_SURFACE, 0.5);
      }

      this.laneGraphics.beginPath();
      this.laneGraphics.moveTo(topIn, y);
      this.laneGraphics.lineTo(width - topIn, y);
      this.laneGraphics.lineTo(width - botIn, y + h);
      this.laneGraphics.lineTo(botIn, y + h);
      this.laneGraphics.closePath();
      this.laneGraphics.fillPath();

      if (lane.type === 'safe' && row === 0) {
        this.drawFinishLine(y, topIn, width - topIn);
      }
      if (lane.type === 'road') {
        this.drawRoadMarkings(y, topIn, width - topIn);
        this.drawRoadMarkings(y + h - 1, botIn, width - botIn);
      }
    }

    const labelStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    };

    const finishLabel = this.add.text(width / 2, this.laneYPos[0] + 6, 'FINISH', { ...labelStyle, color: '#00ff00' });
    finishLabel.setOrigin(0.5, 0);
    finishLabel.setAlpha(0.5);
    finishLabel.setDepth(2);

    const safeLabel = this.add.text(width / 2, this.laneYPos[4] + 6, 'SAFE ZONE', labelStyle);
    safeLabel.setOrigin(0.5, 0);
    safeLabel.setAlpha(0.4);
    safeLabel.setDepth(2);

    const startLabel = this.add.text(width / 2, this.laneYPos[8] + 6, 'START', labelStyle);
    startLabel.setOrigin(0.5, 0);
    startLabel.setAlpha(0.4);
    startLabel.setDepth(2);
  }

  private drawFinishLine(y: number, startX: number, endX: number): void {
    const segmentWidth = 16;
    for (let x = startX; x < endX; x += segmentWidth * 2) {
      this.laneGraphics.fillStyle(GAME_CONFIG.LANE_COLORS.FINISH_LINE, 0.3);
      this.laneGraphics.fillRect(x, y, Math.min(segmentWidth, endX - x), 3);
    }
  }

  private drawRoadMarkings(y: number, startX: number, endX: number): void {
    const dashWidth = 20;
    const gapWidth = 30;
    for (let x = startX; x < endX; x += dashWidth + gapWidth) {
      this.laneGraphics.fillStyle(GAME_CONFIG.LANE_COLORS.ROAD_MARKING, 0.4);
      this.laneGraphics.fillRect(x, y, Math.min(dashWidth, endX - x), 1);
    }
  }

  private addRoadDashes(): void {
    this.roadDashSprites = [];
    for (let row = 0; row < this.lanes.length; row++) {
      const lane = this.lanes[row];
      if (lane.type !== 'road') continue;
      const y = this.rowToY(row);
      const sprite = this.add.tileSprite(GAME_CONFIG.WIDTH / 2, y, GAME_CONFIG.WIDTH, 4, 'road_dashes');
      sprite.setDepth(1);
      sprite.setAlpha(0.25);
      this.roadDashSprites.push({ sprite, direction: lane.direction ?? 1 });
    }
  }

  private addSafeZoneFlowers(): void {
    if (!this.textures.exists('flower_ground_1') || !this.textures.exists('flower_ground_2')) return;

    this.safeZoneFlowers = [];
    const tileSize = 16;

    for (let row = 0; row < this.lanes.length; row++) {
      if (this.lanes[row].type !== 'safe') continue;
      if (row === 0) continue;

      const y = this.laneYPos[row];
      const h = this.laneH[row];
      const flowerScale = h / tileSize;
      const inset = this.laneInset(row);

      for (let tx = inset; tx < GAME_CONFIG.WIDTH - inset; tx += h) {
        const key = Math.random() < 0.5 ? 'flower_ground_1' : 'flower_ground_2';
        const flower = this.add.image(tx + h / 2, y + h / 2, key);
        flower.setScale(flowerScale);
        flower.setTint(MATRIX_COLORS.PRIMARY);
        flower.setAlpha(0.25);
        flower.setDepth(1);
        this.safeZoneFlowers.push(flower);
      }
    }
  }

  private addFinishLineFly(): void {
    if (!this.textures.exists('fly_sprite')) return;

    const x = GAME_CONFIG.WIDTH / 2;
    const y = this.rowToY(0);
    const size = this.laneH[0] * 0.6;

    this.flySprite = this.add.image(x, y, 'fly_sprite');
    this.flySprite.setDisplaySize(size, size);
    this.flySprite.setDepth(5);
    this.flySprite.setAlpha(0.8);

    const sway = 40 * this.laneScale(0);
    this.tweens.add({
      targets: this.flySprite,
      x: { from: x - sway, to: x + sway },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------

  private createPlayer(): void {
    const x = this.colToX(this.playerCol, this.playerRow);
    const y = this.rowToY(this.playerRow);

    if (this.frogSpriteMode) {
      this.player = this.physics.add.sprite(x, y, this.playerIdleTexture);
      this.applyPlayerPerspective();
    } else {
      this.player = this.physics.add.sprite(x, y, 'player', 0);
      this.applyPlayerPerspective();
      this.player.play('player_idle');
    }
    this.player.setDepth(10);
    this.player.setTint(MATRIX_COLORS.PRIMARY);
  }

  private applyPlayerPerspective(): void {
    const scale = this.laneScale(this.playerRow);
    const size = GAME_CONFIG.CELL_SIZE * scale;
    if (this.frogSpriteMode) {
      this.player.setDisplaySize(size, size);
    } else {
      this.player.setScale(scale);
    }
  }

  private setFrogDirection(dx: number, dy: number): void {
    if (dy < 0) this.player.setAngle(0);
    else if (dy > 0) this.player.setAngle(180);
    else if (dx < 0) this.player.setAngle(270);
    else if (dx > 0) this.player.setAngle(90);
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

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
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.distanceText.setDepth(100);

    // Level
    this.levelText = this.add.text(GAME_CONFIG.WIDTH - 10, 35, 'LEVEL: 1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.levelText.setOrigin(1, 0);
    this.levelText.setDepth(100);

    // Combo
    this.comboText = this.add.text(10, 55, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.comboText.setDepth(100);

    // Power-up display (top right)
    this.powerUpDisplay = this.add.container(GAME_CONFIG.WIDTH - 10, 10);
    this.powerUpDisplay.setDepth(100);

    // Kung Fu charge icons (bottom left)
    this.createKungFuDisplay();
  }

  private createKungFuDisplay(): void {
    this.kungFuIcons = [];
    const baseX = 10;
    const baseY = GAME_CONFIG.HEIGHT - 35;

    // Label
    const label = this.add.text(baseX, baseY - 14, 'KUNG FU [K]', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    label.setAlpha(0.6);
    label.setDepth(100);

    for (let i = 0; i < GAME_CONFIG.KUNG_FU.MAX_CHARGES; i++) {
      const icon = this.add.sprite(baseX + 14 + i * 28, baseY + 12, 'kung_fu_icon');
      icon.setDepth(100);
      this.kungFuIcons.push(icon);
    }
  }

  private updateKungFuDisplay(): void {
    this.kungFuIcons.forEach((icon, i) => {
      if (i < this.kungFuCharges) {
        icon.setTexture('kung_fu_icon');
        icon.setAlpha(1);
      } else {
        icon.setTexture('kung_fu_icon_empty');
        icon.setAlpha(0.3);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.kungFuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    });
  }

  private handleInput(): void {
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
      if (this.isMoving) {
        this.bufferedInput = { col: newCol, row: newRow };
      } else {
        this.movePlayer(newCol, newRow);
      }
    }

    // Kung Fu attack
    if (this.kungFuKey && Phaser.Input.Keyboard.JustDown(this.kungFuKey)) {
      this.useKungFu();
    }
  }

  // ---------------------------------------------------------------------------
  // Movement
  // ---------------------------------------------------------------------------

  private movePlayer(col: number, row: number): void {
    this.isMoving = true;
    const wasForward = row < this.playerRow;
    const prevCol = this.playerCol;
    const prevRow = this.playerRow;

    this.playerCol = col;
    this.playerRow = row;

    const targetX = this.colToX(col, row);
    const targetY = this.rowToY(row);

    if (this.frogSpriteMode) {
      this.player.setTexture(this.playerHopTexture);
      this.setFrogDirection(col - prevCol, row - prevRow);
    } else {
      this.player.play('player_hop');
    }
    this.playSound(SOUND_KEYS.FROGGER_MOVE);

    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: GAME_CONFIG.PLAYER.MOVE_SPEED,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isMoving = false;
        this.applyPlayerPerspective();
        if (this.frogSpriteMode) {
          this.player.setTexture(this.playerIdleTexture);
        } else {
          this.player.play('player_idle');
        }

        if (wasForward) {
          this.addScore(GAME_CONFIG.SCORING.STEP_FORWARD);
          const distance = GAME_CONFIG.PLAYER.START_ROW - row;
          if (distance > this.maxDistance) {
            this.maxDistance = distance;
          }
        }

        this.checkNearMiss();

        if (this.bufferedInput) {
          const { col: buffCol, row: buffRow } = this.bufferedInput;
          this.bufferedInput = null;
          this.movePlayer(buffCol, buffRow);
        }
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Collisions
  // ---------------------------------------------------------------------------

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, enemy) => this.handleEnemyCollision(enemy as Enemy),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.pills,
      (_player, pill) => this.collectPill(pill as Pill),
      undefined,
      this
    );
  }

  private handleEnemyCollision(enemy: Enemy): void {
    // NEO mode — destroy the enemy
    if (this.hasPowerUp('neo_mode')) {
      this.destroyEnemyWithNeo(enemy);
      return;
    }

    // Ghost power-up — no collision
    if (this.hasPowerUp('ghost')) {
      return;
    }

    // Shield power-up — absorb hit
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

  // ---------------------------------------------------------------------------
  // NEO Mode
  // ---------------------------------------------------------------------------

  private destroyEnemyWithNeo(enemy: Enemy): void {
    this.neoDestroyCount++;
    this.addScore(GAME_CONFIG.SCORING.NEO_DESTROY);
    this.playSound(SOUND_KEYS.FROGGER_EXTRA_SCORE);

    // Destroy effect
    this.createEnemyDestroyEffect(enemy.x, enemy.y);

    enemy.setActive(false);
    enemy.setVisible(false);

    if (this.neoDestroyCount >= 3) {
      this.unlockAchievement(ACHIEVEMENTS.NEO_UNSTOPPABLE);
    }
  }

  private createEnemyDestroyEffect(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(MATRIX_COLORS.CYAN, 1);
      particle.fillCircle(0, 0, 3);
      particle.x = x;
      particle.y = y;

      const angle = (i / 8) * Math.PI * 2;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private updateNeoFlash(delta: number): void {
    if (!this.hasPowerUp('neo_mode')) return;

    this.neoFlashTimer += delta;
    if (this.neoFlashTimer > 100) {
      this.neoFlashTimer = 0;
      const colours = [MATRIX_COLORS.PRIMARY, MATRIX_COLORS.CYAN, 0xffffff, MATRIX_COLORS.YELLOW];
      const colour = colours[Math.floor(Math.random() * colours.length)];
      this.player.setTint(colour);
    }
  }

  // ---------------------------------------------------------------------------
  // Kung Fu
  // ---------------------------------------------------------------------------

  private useKungFu(): void {
    if (this.kungFuCharges <= 0) return;
    if (this.time.now - this.lastKungFuTime < GAME_CONFIG.KUNG_FU.COOLDOWN) return;

    const range = GAME_CONFIG.KUNG_FU.RANGE * GAME_CONFIG.CELL_SIZE;
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < range && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    });

    if (!nearest) return;

    this.kungFuCharges--;
    this.kungFuTotalUsed++;
    this.lastKungFuTime = this.time.now;

    // Destroy the enemy
    this.createKungFuEffect(this.player.x, this.player.y);
    this.createEnemyDestroyEffect((nearest as Enemy).x, (nearest as Enemy).y);
    (nearest as Enemy).setActive(false);
    (nearest as Enemy).setVisible(false);

    this.playSound('hit');
    this.addScore(50);
    this.updateKungFuDisplay();

    if (this.kungFuTotalUsed >= GAME_CONFIG.KUNG_FU.MAX_CHARGES) {
      this.unlockAchievement(ACHIEVEMENTS.KUNG_FU_MASTER);
    }
  }

  private createKungFuEffect(x: number, y: number): void {
    const circle = this.add.graphics();
    circle.lineStyle(3, MATRIX_COLORS.YELLOW, 1);
    circle.strokeCircle(0, 0, 10);
    circle.x = x;
    circle.y = y;
    circle.setDepth(15);

    this.tweens.add({
      targets: circle,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  // ---------------------------------------------------------------------------
  // Death and game over
  // ---------------------------------------------------------------------------

  private playerDeath(enemy?: Enemy): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.player.setTint(0xff0000);
    this.playSound(SOUND_KEYS.FROGGER_DEATH);

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      scale: 0,
      angle: 360,
      duration: 500,
      onComplete: () => {
        this.reportScore(this.score, this.score);
        const reason = enemy ? `Hit by ${enemy.enemyType.toUpperCase()}` : 'Game Over';
        this.gameOver(this.score, reason, undefined, [
          { label: 'Level', value: this.level },
          { label: 'Near Misses', value: this.nearMissCount },
          { label: 'Kung Fu', value: this.kungFuTotalUsed },
          { label: 'Shield Hits', value: this.shieldHits },
        ], this.level, this.getGameDuration());
      },
    });

    this.cameras.main.shake(300, 0.01);
  }

  // ---------------------------------------------------------------------------
  // Pills and power-ups
  // ---------------------------------------------------------------------------

  private collectPill(pill: Pill): void {
    const pillType = pill.pillType;
    pill.destroy();

    if (pillType === 'red') {
      this.addScore(GAME_CONFIG.SCORING.RED_PILL);
      this.playSound(SOUND_KEYS.FROGGER_PICKUP);

      if (this.hasPowerUp('magnet')) {
        this.magnetCollected++;
        if (this.magnetCollected >= 5) {
          this.unlockAchievement(ACHIEVEMENTS.MAGNET_COLLECTOR);
        }
      }
    } else if (pillType === 'neo') {
      this.activatePowerUp('neo_mode', GAME_CONFIG.POWERUPS.NEO_MODE.DURATION);
      this.neoDestroyCount = 0;
      this.playSound('powerup');
    } else {
      this.grantRandomPowerUp();
      this.playSound('powerup');
    }
  }

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

  private activatePowerUp(type: PowerUpType, duration: number): void {
    this.activePowerUps = this.activePowerUps.filter((p) => p.type !== type);

    this.activePowerUps.push({
      type,
      endTime: this.time.now + duration,
    });

    this.addPowerUpToDisplay(type);
  }

  private hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some((p) => p.type === type);
  }

  private updatePowerUps(time: number): void {
    const expired = this.activePowerUps.filter((p) => p.endTime <= time);
    this.activePowerUps = this.activePowerUps.filter((p) => p.endTime > time);

    expired.forEach((p) => {
      this.removePowerUpFromDisplay(p.type);
      if (p.type === 'neo_mode') {
        this.player.setTint(MATRIX_COLORS.PRIMARY);
      }
    });
  }

  private addPowerUpToDisplay(type: PowerUpType | 'shield'): void {
    const existing = this.powerUpDisplay.getByName(type);
    if (existing) return;

    const index = this.powerUpDisplay.length;
    const icon = this.add.sprite(-40 * index - 16, 16, `powerup_${type}`);
    icon.setName(type);
    this.powerUpDisplay.add(icon);
  }

  private removePowerUpFromDisplay(type: PowerUpType | 'shield'): void {
    const icon = this.powerUpDisplay.getByName(type);
    if (icon) {
      icon.destroy();
      let index = 0;
      this.powerUpDisplay.each((child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Sprite) {
          child.x = -40 * index - 16;
          index++;
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Magnet effect
  // ---------------------------------------------------------------------------

  private applyMagnetEffect(delta: number): void {
    if (!this.hasPowerUp('magnet')) return;

    const playerX = this.player.x;
    const playerY = this.player.y;
    const range = GAME_CONFIG.POWERUPS.MAGNET.RANGE * GAME_CONFIG.CELL_SIZE;

    this.pills.getChildren().forEach((obj) => {
      const pill = obj as Pill;
      const dist = Phaser.Math.Distance.Between(playerX, playerY, pill.x, pill.y);

      if (dist < range && dist > 5) {
        const angle = Phaser.Math.Angle.Between(pill.x, pill.y, playerX, playerY);
        const speed = 200 * (delta / 1000);
        pill.x += Math.cos(angle) * speed;
        pill.y += Math.sin(angle) * speed;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Enemy spawning and movement
  // ---------------------------------------------------------------------------

  private spawnEnemy(): void {
    const roadLanes = this.lanes
      .map((lane, index) => ({ ...lane, row: index }))
      .filter((lane) => lane.type === 'road');

    if (roadLanes.length === 0) return;

    const lane = Phaser.Utils.Array.GetRandom(roadLanes);
    const direction = lane.direction ?? 1;
    const enemyType = lane.enemyType || 'agent';

    const isChaser = this.level >= GAME_CONFIG.DIFFICULTY.CHASING_AGENT_MIN_LEVEL && Math.random() < 0.2;

    const perspScale = this.laneScale(lane.row);
    const inset = this.laneInset(lane.row);
    const startX = direction === 1 ? inset - GAME_CONFIG.CELL_SIZE : GAME_CONFIG.WIDTH - inset + GAME_CONFIG.CELL_SIZE;
    const y = this.rowToY(lane.row);

    const useVehicle = !isChaser && lane.vehicleTextures && lane.vehicleTextures.length > 0;
    const textureKey = useVehicle
      ? Phaser.Utils.Array.GetRandom(lane.vehicleTextures!)
      : (enemyType === 'agent' ? 'enemy_agent' : 'enemy_sentinel');

    const enemy = this.enemies.get(startX, y, textureKey) as Enemy;
    if (!enemy) return;

    enemy.setActive(true);
    enemy.setVisible(true);
    enemy.setTexture(textureKey);
    enemy.enemyType = isChaser ? 'chaser' : enemyType;
    enemy.direction = direction;
    enemy.lane = lane.row;

    if (useVehicle) {
      const baseScale = textureKey === 'vehicle_truck' ? 2.5 : 3.0;
      enemy.setScale(baseScale * perspScale);
      enemy.setFlipX(direction === -1);
      enemy.setOrigin(0.5, 1);
      enemy.setAngle(GAME_CONFIG.PERSPECTIVE.VEHICLE_ROTATION_DEG * (1 - perspScale));
      enemy.clearTint();
    } else {
      enemy.setScale(0.8 * perspScale);
      enemy.setFlipX(false);
      enemy.setOrigin(0.5, 1);
      enemy.setAngle(GAME_CONFIG.PERSPECTIVE.VEHICLE_ROTATION_DEG * (1 - perspScale));
    }

    if (enemy.body) {
      const frame = enemy.frame;
      (enemy.body as Phaser.Physics.Arcade.Body).setSize(frame.width, frame.height);
    }

    const config = GAME_CONFIG.ENEMIES[enemyType.toUpperCase() as 'AGENT' | 'SENTINEL'];
    const difficultyBonus = Math.floor(this.maxDistance / 100) * GAME_CONFIG.DIFFICULTY.SPEED_INCREASE_PER_100;
    const levelBonus = (this.level - 1) * 15;
    enemy.baseSpeed = Phaser.Math.Between(config.SPEED_MIN, config.SPEED_MAX) + difficultyBonus + levelBonus;

    if (isChaser) {
      enemy.verticalSpeed = GAME_CONFIG.DIFFICULTY.CHASING_AGENT_VERTICAL_SPEED;
      enemy.setTint(0xff3333);
    } else if (!useVehicle) {
      enemy.verticalSpeed = 0;
      enemy.setTint(enemyType === 'agent' ? 0x00ff00 : 0xff6600);
    } else {
      enemy.verticalSpeed = 0;
    }
  }

  private spawnInitialEnemies(): void {
    for (let i = 0; i < GAME_CONFIG.DIFFICULTY.ENEMY_COUNT_BASE * 2; i++) {
      this.spawnEnemy();
    }
  }

  private spawnPills(): void {
    const col = Phaser.Math.Between(1, GAME_CONFIG.GRID_COLS - 2);
    const row = Phaser.Math.Between(1, GAME_CONFIG.GRID_ROWS - 2);

    const x = this.colToX(col, row);
    const y = this.rowToY(row);

    // 10% NEO pickup, 18% blue (power-up), 72% red (points)
    const roll = Math.random();
    let textureKey: string;
    let pillType: Pill['pillType'];

    if (roll < 0.10 && this.level >= 2) {
      textureKey = 'neo_pickup';
      pillType = 'neo';
    } else if (roll < 0.28) {
      textureKey = 'blue_pill';
      pillType = 'blue';
    } else {
      textureKey = 'red_pill';
      pillType = 'red';
    }

    const pill = this.pills.get(x, y, textureKey) as Pill;
    if (!pill) return;

    pill.setActive(true);
    pill.setVisible(true);
    pill.pillType = pillType;

    this.tweens.add({
      targets: pill,
      y: y - 5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private updateEnemies(delta: number): void {
    const speedMult = this.hasPowerUp('bullet_time') ? GAME_CONFIG.POWERUPS.BULLET_TIME.SLOW_FACTOR : 1;

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;

      // Horizontal movement
      const speed = enemy.baseSpeed * speedMult * (delta / 1000);
      enemy.x += speed * enemy.direction;

      // Chasing agents drift vertically toward the player
      if (enemy.enemyType === 'chaser' && enemy.verticalSpeed) {
        const playerY = this.rowToY(this.playerRow);
        const diff = playerY - enemy.y;
        if (Math.abs(diff) > 5) {
          const vertSpeed = enemy.verticalSpeed * speedMult * (delta / 1000);
          enemy.y += Math.sign(diff) * vertSpeed;
        }
      }

      // Remove when past perspective lane edge
      const inset = this.laneInset(enemy.lane);
      if (enemy.direction === 1 && enemy.x > GAME_CONFIG.WIDTH - inset + GAME_CONFIG.CELL_SIZE) {
        enemy.setActive(false);
        enemy.setVisible(false);
      } else if (enemy.direction === -1 && enemy.x < inset - GAME_CONFIG.CELL_SIZE) {
        enemy.setActive(false);
        enemy.setVisible(false);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Near-miss detection
  // ---------------------------------------------------------------------------

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

      if (this.nearMissCount >= 10) {
        this.unlockAchievement(ACHIEVEMENTS.DODGE_MASTER);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Progress and level system
  // ---------------------------------------------------------------------------

  private checkProgress(): void {
    // Reached top row (finish line)
    if (this.playerRow === 0) {
      this.unlockAchievement(ACHIEVEMENTS.FIRST_CROSS);

      // Level up
      this.level++;
      this.addScore(GAME_CONFIG.SCORING.CROSS_BONUS);
      this.playSound(SOUND_KEYS.FROGGER_SCORE);

      // Show level text
      this.showLevelUpText();

      if (this.level >= 5) {
        this.unlockAchievement(ACHIEVEMENTS.LEVEL_5);
      }

      // Reset to start
      this.playerRow = GAME_CONFIG.PLAYER.START_ROW;
      this.playerCol = GAME_CONFIG.PLAYER.START_COL;

      this.tweens.add({
        targets: this.player,
        x: this.colToX(this.playerCol, this.playerRow),
        y: this.rowToY(this.playerRow),
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => this.applyPlayerPerspective(),
      });

      this.updateUI();
    }

    // Score achievements
    if (this.score >= 1000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_1000);
    }
    if (this.score >= 5000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_5000);
    }

    // Distance achievement
    if (this.maxDistance >= 5) {
      this.unlockAchievement(ACHIEVEMENTS.DISTANCE_500);
    }
  }

  private showLevelUpText(): void {
    const text = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      `LEVEL ${this.level}`,
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '32px',
        color: '#00ffff',
      }
    );
    text.setOrigin(0.5);
    text.setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: GAME_CONFIG.HEIGHT / 2 - 50,
      scale: 1.5,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  // ---------------------------------------------------------------------------
  // Scoring and combo
  // ---------------------------------------------------------------------------

  private addScore(points: number): void {
    this.score += points;
    this.updateUI();
  }

  private incrementCombo(): void {
    this.combo++;
    this.lastComboTime = this.time.now;

    if (this.combo >= 10) {
      this.unlockAchievement(ACHIEVEMENTS.COMBO_10);
    }

    this.updateUI();
  }

  private updateCombo(time: number): void {
    if (this.combo > 0 && time - this.lastComboTime > 3000) {
      this.combo = 0;
      this.updateUI();
    }
  }

  private getComboMultiplier(): number {
    if (this.combo >= 30) return 5;
    if (this.combo >= 20) return 4;
    if (this.combo >= 10) return 3;
    if (this.combo >= 5) return 2;
    return 1;
  }

  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.distanceText.setText(`DISTANCE: ${this.maxDistance * 100}`);
    this.levelText.setText(`LEVEL: ${this.level}`);

    if (this.combo > 0) {
      const mult = this.getComboMultiplier();
      this.comboText.setText(`COMBO: ${this.combo}x${mult}`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Visual effects
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Grid helpers & perspective
  // ---------------------------------------------------------------------------

  private laneYPos: number[] = [];
  private laneH: number[] = [];

  private laneScale(row: number): number {
    const { VEHICLE_SCALE_MIN, VEHICLE_SCALE_MAX } = GAME_CONFIG.PERSPECTIVE;
    const t = row / (GAME_CONFIG.GRID_ROWS - 1);
    return VEHICLE_SCALE_MIN + t * (VEHICLE_SCALE_MAX - VEHICLE_SCALE_MIN);
  }

  private laneInset(row: number): number {
    return (GAME_CONFIG.WIDTH * (1 - this.laneScale(row))) / 2;
  }

  private computeLaneLayout(): void {
    const rows = GAME_CONFIG.GRID_ROWS;
    const heights: number[] = [];
    let total = 0;
    for (let r = 0; r < rows; r++) {
      const h = GAME_CONFIG.CELL_SIZE * this.laneScale(r);
      heights.push(h);
      total += h;
    }
    const avail = rows * GAME_CONFIG.CELL_SIZE;
    const norm = avail / total;
    let y = 16;
    for (let r = 0; r < rows; r++) {
      this.laneH[r] = heights[r] * norm;
      this.laneYPos[r] = y;
      y += this.laneH[r];
    }
  }

  private colToX(col: number, row?: number): number {
    const flat = col * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2 + 16;
    if (row === undefined || !this.laneYPos?.length) return flat;
    const scale = this.laneScale(row);
    const cx = GAME_CONFIG.WIDTH / 2;
    return cx + (flat - cx) * scale;
  }

  private rowToY(row: number): number {
    if (this.laneYPos?.length > 0) {
      return this.laneYPos[row] + this.laneH[row] / 2;
    }
    return row * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2 + 16;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  shutdown(): void {
    this.stopBackgroundMusic();
    this.time.removeAllEvents();

    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    this.tweens.killAll();
    this.activePowerUps = [];
    this.kungFuIcons = [];

    this.enemies.clear(true, true);
    this.pills.clear(true, true);
    this.deathEffects.clear(true, true);
    this.rainGroup.clear(true, true);

    this.scoreText.destroy();
    this.distanceText.destroy();
    this.comboText.destroy();
    this.levelText.destroy();
    this.powerUpDisplay.destroy();
    this.laneGraphics.destroy();

    this.safeZoneFlowers.forEach(f => f.destroy());
    this.safeZoneFlowers = [];
    this.roadDashSprites.forEach(d => d.sprite.destroy());
    this.roadDashSprites = [];
    if (this.flySprite) {
      this.flySprite.destroy();
      this.flySprite = null;
    }

    super.shutdown();
  }
}
