import Phaser from 'phaser';
import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  ENEMY_DEFS,
  POWERUP_DEFS,
  type EnemyState,
  type BossState,
  type BulletState,
  type ParticleState,
  type FieldPowerUp,
  type EnemyType,
  type PowerUpType,
} from '../config';

const C = GAME_CONFIG;

export class MatrixInvadersGameScene extends BaseScene {
  private player!: Phaser.GameObjects.Sprite;
  private playerHealth = C.PLAYER_MAX_HEALTH;
  private isInvulnerable = false;
  private shieldActive = false;

  private enemies: EnemyState[] = [];
  private enemyDirection = 1;

  private boss: BossState | null = null;
  private isBossWave = false;
  private bossTime = 0;
  private bossSpawning = false;

  private playerBullets: BulletState[] = [];
  private enemyBullets: BulletState[] = [];
  private lastFireTime = 0;

  private particles: ParticleState[] = [];
  private fieldPowerUps: FieldPowerUp[] = [];
  private rapidFireActive = false;
  private scoreMultiplierActive = false;

  private score = 0;
  private highScore = 0;
  private wave = 1;
  private combo = 0;
  private enemiesKilled = 0;
  private bulletTimeUses = 0;
  private waveDamageTaken = false;

  private bulletTimeActive = false;
  private isGameOver = false;
  private waveTransitioning = false;
  private achievementsUnlocked = new Set<string>();

  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private bulletTimeText!: Phaser.GameObjects.Text;
  private waveCompleteText!: Phaser.GameObjects.Text;
  private bossWarningText!: Phaser.GameObjects.Text;
  private healthLabel!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wasdA!: Phaser.Input.Keyboard.Key;
  private wasdD!: Phaser.Input.Keyboard.Key;
  private bulletTimeKey!: Phaser.Input.Keyboard.Key;

  private matrixRainGroup!: Phaser.GameObjects.Group;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();
    this.matrixRainGroup = this.addMatrixRain(10);
    this.resetState();
    this.createPlayer();
    this.createHUD();
    this.setupInput();
    this.setupCommonInputs();
    this.spawnWave();
    this.playSound(SOUND_KEYS.MENU);
  }

  private resetState(): void {
    this.score = 0;
    this.wave = 1;
    this.combo = 0;
    this.playerHealth = C.PLAYER_MAX_HEALTH;
    this.isInvulnerable = false;
    this.shieldActive = false;
    this.bulletTimeActive = false;
    this.bulletTimeUses = 0;
    this.rapidFireActive = false;
    this.scoreMultiplierActive = false;
    this.isGameOver = false;
    this.enemiesKilled = 0;
    this.waveDamageTaken = false;
    this.lastFireTime = 0;
    this.enemyDirection = 1;
    this.waveTransitioning = false;
    this.isBossWave = false;
    this.bossSpawning = false;
    this.boss = null;
    this.bossTime = 0;
    this.highScore = 0;
    this.achievementsUnlocked = new Set();
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.fieldPowerUps = [];
  }

  private createPlayer(): void {
    this.player = this.add.sprite(
      C.WIDTH / 2,
      C.HEIGHT - C.PLAYER_Y_OFFSET,
      'player'
    );
  }

  private createHUD(): void {
    this.scoreText = this.createMatrixText(10, 12, 'SCORE: 0', 10);
    this.scoreText.setOrigin(0, 0);

    this.waveText = this.createMatrixText(10, 30, 'WAVE: 1', 10);
    this.waveText.setOrigin(0, 0);

    this.comboText = this.createMatrixText(10, 48, '', 10, MATRIX_COLORS.CYAN_HEX);
    this.comboText.setOrigin(0, 0);

    this.highScoreText = this.createMatrixText(C.WIDTH - 10, 12, 'HI: 0', 10);
    this.highScoreText.setOrigin(1, 0);

    this.healthLabel = this.createMatrixText(C.WIDTH - 210, 30, 'HEALTH', 8);
    this.healthLabel.setOrigin(0, 0);

    this.healthBarBg = this.add.graphics();
    this.healthBarFill = this.add.graphics();

    this.bulletTimeText = this.createMatrixText(
      C.WIDTH / 2, C.HEIGHT * 0.45, 'BULLET TIME ACTIVE', 12, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bulletTimeText.setVisible(false);
    this.bulletTimeText.setDepth(100);

    this.waveCompleteText = this.createMatrixText(C.WIDTH / 2, C.HEIGHT * 0.4, '', 12);
    this.waveCompleteText.setVisible(false);
    this.waveCompleteText.setDepth(100);

    this.bossWarningText = this.createMatrixText(
      C.WIDTH / 2, C.HEIGHT * 0.3, 'BOSS INCOMING', 16, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bossWarningText.setVisible(false);
    this.bossWarningText.setDepth(100);
  }

  private setupInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupInput());
      return;
    }
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.wasdA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.wasdD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.bulletTimeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);

    const dt = delta / 1000;
    const timeScale = this.bulletTimeActive ? C.BULLET_TIME_SCALE : 1.0;
    const scaledDt = dt * timeScale;

    this.handleMovement(scaledDt);
    this.handleShooting(time);
    this.handleBulletTime();
    this.updatePlayerBullets(scaledDt);
    this.updateEnemyBullets(scaledDt);

    if (!this.waveTransitioning) {
      if (this.isBossWave && this.boss) {
        this.updateBoss(scaledDt);
      } else if (!this.bossSpawning) {
        this.updateEnemies(scaledDt);
        this.handleEnemyShooting(scaledDt);
      }
    }

    this.updateParticles(scaledDt);
    this.updateFieldPowerUps(scaledDt);
    this.checkPlayerBulletCollisions();
    this.checkEnemyBulletCollisions();
    this.checkPowerUpCollisions();
    this.checkGameOverConditions();
    this.checkWaveComplete();
    this.updateHUD(time);
    this.checkAchievements();
    this.exposeTestState(this.getTestState());
  }

  // -- Movement --

  private handleMovement(dt: number): void {
    const speed = C.PLAYER_SPEED * dt;
    let dx = 0;

    if (this.cursors?.left.isDown || this.wasdA?.isDown) dx -= speed;
    if (this.cursors?.right.isDown || this.wasdD?.isDown) dx += speed;

    this.player.x = Phaser.Math.Clamp(
      this.player.x + dx,
      C.PLAYER_WIDTH / 2,
      C.WIDTH - C.PLAYER_WIDTH / 2
    );
  }

  // -- Shooting --

  private handleShooting(time: number): void {
    if (!this.spaceKey?.isDown) return;

    const cooldown = this.rapidFireActive ? C.RAPID_FIRE_COOLDOWN : C.FIRE_COOLDOWN;
    if (time - this.lastFireTime < cooldown) return;
    this.lastFireTime = time;

    this.playSound(SOUND_KEYS.SHOOT);

    const bullet: BulletState = {
      sprite: this.add.rectangle(
        this.player.x,
        this.player.y - C.PLAYER_HEIGHT / 2,
        C.PLAYER_BULLET_WIDTH,
        C.PLAYER_BULLET_HEIGHT,
        MATRIX_COLORS.PRIMARY
      ),
      vy: -C.PLAYER_BULLET_SPEED,
      damage: 1,
      isPlayer: true,
    };
    bullet.sprite.setDepth(5);
    this.playerBullets.push(bullet);
  }

  private handleBulletTime(): void {
    if (!this.bulletTimeKey || !Phaser.Input.Keyboard.JustDown(this.bulletTimeKey)) return;
    if (this.bulletTimeActive) return;

    this.bulletTimeActive = true;
    this.bulletTimeUses++;
    this.bulletTimeText.setVisible(true);
    this.playSound(SOUND_KEYS.POWERUP);

    this.time.delayedCall(C.BULLET_TIME_DURATION, () => {
      this.bulletTimeActive = false;
      this.bulletTimeText.setVisible(false);
    });
  }

  private handleEnemyShooting(dt: number): void {
    const fireChance = C.ENEMY_FIRE_CHANCE * 60;

    for (const enemy of this.enemies) {
      if (Math.random() < fireChance * dt) {
        const bullet: BulletState = {
          sprite: this.add.rectangle(
            enemy.sprite.x,
            enemy.sprite.y + enemy.height / 2,
            C.ENEMY_BULLET_WIDTH,
            C.ENEMY_BULLET_HEIGHT,
            MATRIX_COLORS.RED
          ),
          vy: C.ENEMY_BULLET_SPEED,
          damage: C.PLAYER_HIT_DAMAGE,
          isPlayer: false,
        };
        bullet.sprite.setDepth(5);
        this.enemyBullets.push(bullet);
      }
    }
  }

  // -- Updates --

  private updatePlayerBullets(dt: number): void {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.sprite.y += b.vy * dt;
      if (b.sprite.y < -10) {
        b.sprite.destroy();
        this.playerBullets.splice(i, 1);
      }
    }
  }

  private updateEnemyBullets(dt: number): void {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.sprite.y += b.vy * dt;
      if (b.sprite.y > C.HEIGHT + 10) {
        b.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number): void {
    if (this.enemies.length === 0) return;

    const waveSpeedFactor = 1 + (this.wave - 1) * C.WAVE_SPEED_BONUS;
    const totalSlots = C.WAVE_COLS * C.WAVE_ROWS;
    const aliveRatio = Math.min(this.enemies.length / totalSlots, 1);
    const speedBoost = 1 + (1 - aliveRatio) * 0.3;

    let shouldReverse = false;
    const halfW = C.ENEMY_WIDTH / 2;

    for (const enemy of this.enemies) {
      enemy.sprite.x += this.enemyDirection * C.ENEMY_BASE_SPEED *
        enemy.speedMultiplier * waveSpeedFactor * speedBoost * dt;

      if (enemy.sprite.x - halfW < 0 || enemy.sprite.x + halfW > C.WIDTH) {
        shouldReverse = true;
        enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x, halfW, C.WIDTH - halfW);
      }
    }

    if (shouldReverse) {
      this.enemyDirection *= -1;
      for (const enemy of this.enemies) {
        enemy.sprite.y += C.ENEMY_DESCENT;
      }
    }
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;

    this.bossTime += dt;

    const centerX = C.WIDTH / 2;
    const amplitude = (C.WIDTH - C.BOSS_WIDTH) / 2 - 20;
    this.boss.sprite.x = centerX + Math.sin(this.bossTime * C.BOSS_SPEED) * amplitude;

    this.drawBossHealthBar();

    const fireChance = C.BOSS_FIRE_CHANCE * 60;
    for (const offset of this.boss.barrelOffsets) {
      if (Math.random() < fireChance * dt) {
        const bullet: BulletState = {
          sprite: this.add.rectangle(
            this.boss.sprite.x + offset,
            this.boss.sprite.y + this.boss.height / 2,
            C.ENEMY_BULLET_WIDTH + 2,
            C.ENEMY_BULLET_HEIGHT + 2,
            MATRIX_COLORS.MAGENTA
          ),
          vy: C.ENEMY_BULLET_SPEED,
          damage: C.PLAYER_HIT_DAMAGE,
          isPlayer: false,
        };
        bullet.sprite.setDepth(5);
        this.enemyBullets.push(bullet);
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.rect.x += p.vx * dt;
      p.rect.y += p.vy * dt;
      p.life -= C.PARTICLE_DECAY * dt;
      p.rect.setAlpha(Math.max(0, p.life));

      if (p.life <= 0) {
        p.rect.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFieldPowerUps(dt: number): void {
    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      pu.sprite.y += pu.vy * dt;

      if (pu.sprite.y > C.HEIGHT + 10) {
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
      }
    }
  }

  // -- Collisions --

  private aabbOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
  }

  private checkPlayerBulletCollisions(): void {
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const bullet = this.playerBullets[bi];
      let consumed = false;

      if (this.boss) {
        if (this.aabbOverlap(
          bullet.sprite.x, bullet.sprite.y, C.PLAYER_BULLET_WIDTH, C.PLAYER_BULLET_HEIGHT,
          this.boss.sprite.x, this.boss.sprite.y, this.boss.width, this.boss.height
        )) {
          this.hitBoss(bullet.damage);
          bullet.sprite.destroy();
          this.playerBullets.splice(bi, 1);
          consumed = true;
        }
      }

      if (consumed) continue;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (this.aabbOverlap(
          bullet.sprite.x, bullet.sprite.y, C.PLAYER_BULLET_WIDTH, C.PLAYER_BULLET_HEIGHT,
          enemy.sprite.x, enemy.sprite.y, enemy.width, enemy.height
        )) {
          this.hitEnemy(ei, bullet.damage);
          bullet.sprite.destroy();
          this.playerBullets.splice(bi, 1);
          break;
        }
      }
    }
  }

  private checkEnemyBulletCollisions(): void {
    if (this.isInvulnerable) return;

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      if (this.aabbOverlap(
        bullet.sprite.x, bullet.sprite.y,
        bullet.sprite.width, bullet.sprite.height,
        this.player.x, this.player.y,
        C.PLAYER_WIDTH, C.PLAYER_HEIGHT
      )) {
        this.hitPlayer();
        bullet.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private checkPowerUpCollisions(): void {
    const pickupDist = (C.PLAYER_WIDTH + C.POWERUP_SIZE) / 2;

    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      const dx = this.player.x - pu.sprite.x;
      const dy = this.player.y - pu.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < pickupDist) {
        this.activatePowerUp(pu.type);
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
      }
    }
  }

  // -- Hit handling --

  private hitEnemy(enemyIndex: number, damage: number): void {
    const enemy = this.enemies[enemyIndex];
    enemy.health -= damage;

    if (enemy.health <= 0) {
      this.killEnemy(enemyIndex);
    } else {
      this.playSound(SOUND_KEYS.HIT);
      enemy.sprite.setTint(0xffffff);
      this.time.delayedCall(100, () => {
        if (enemy.sprite.active) enemy.sprite.clearTint();
      });
    }
  }

  private killEnemy(enemyIndex: number): void {
    const enemy = this.enemies[enemyIndex];
    const x = enemy.sprite.x;
    const y = enemy.sprite.y;
    const def = ENEMY_DEFS[enemy.type];

    const scoreBonus = Math.floor(enemy.value * (1 + this.combo * C.COMBO_MULTIPLIER));
    this.score += scoreBonus * (this.scoreMultiplierActive ? 2 : 1);
    this.combo++;
    this.enemiesKilled++;

    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);
    this.playSound(SOUND_KEYS.SCORE);

    this.spawnExplosion(x, y, def.color);

    if (def.splits) {
      this.spawnVirusChildren(x, y);
    }

    if (Math.random() < C.POWERUP_DROP_CHANCE) {
      this.spawnPowerUp(x, y);
    }

    enemy.sprite.destroy();
    this.enemies.splice(enemyIndex, 1);

    this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_KILL);
    if (this.enemiesKilled >= 100) {
      this.tryUnlockAchievement(ACHIEVEMENTS.ENEMIES_100);
    }
  }

  private hitBoss(damage: number): void {
    if (!this.boss) return;

    this.boss.health -= damage;
    this.playSound(SOUND_KEYS.HIT);

    this.boss.sprite.setTint(0xffffff);
    this.time.delayedCall(100, () => {
      if (this.boss?.sprite.active) this.boss.sprite.clearTint();
    });

    if (this.boss.health <= 0) {
      this.defeatBoss();
    }
  }

  private defeatBoss(): void {
    if (!this.boss) return;

    const x = this.boss.sprite.x;
    const y = this.boss.sprite.y;

    this.spawnExplosion(x, y, MATRIX_COLORS.MAGENTA, 40);
    this.spawnExplosion(x - 30, y, MATRIX_COLORS.RED, 20);
    this.spawnExplosion(x + 30, y, MATRIX_COLORS.RED, 20);
    this.spawnExplosion(x, y + 20, MATRIX_COLORS.WHITE, 15);

    const bossValue = this.boss.value * (this.scoreMultiplierActive ? 2 : 1);
    this.score += bossValue;
    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);

    this.boss.sprite.destroy();
    this.boss.healthBar.destroy();
    this.boss.healthBg.destroy();
    this.boss = null;
    this.isBossWave = false;

    this.playSound(SOUND_KEYS.LEVEL_UP);
    this.tryUnlockAchievement(ACHIEVEMENTS.BOSS_DEFEAT);
  }

  private hitPlayer(): void {
    if (this.isInvulnerable || this.isGameOver) return;

    if (this.shieldActive) {
      this.shieldActive = false;
      this.isInvulnerable = true;
      this.playSound(SOUND_KEYS.HIT);
      this.cameras.main.shake(200, 0.005);
      this.player.setTexture('player');
      this.time.delayedCall(C.INVULNERABLE_DURATION, () => {
        this.isInvulnerable = false;
      });
      return;
    }

    this.playerHealth -= C.PLAYER_HIT_DAMAGE;
    this.playerHealth = Math.max(0, this.playerHealth);
    this.combo = 0;
    this.waveDamageTaken = true;
    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(200, 0.005);

    this.spawnExplosion(this.player.x, this.player.y, MATRIX_COLORS.RED, 10);

    if (this.playerHealth <= 0) {
      this.handleGameOver();
      return;
    }

    this.isInvulnerable = true;
    const flashEvent = this.time.addEvent({
      delay: 80,
      repeat: Math.floor(C.INVULNERABLE_DURATION / 80) - 1,
      callback: () => {
        if (this.player.active) this.player.setVisible(!this.player.visible);
      },
    });

    this.time.delayedCall(C.INVULNERABLE_DURATION, () => {
      this.isInvulnerable = false;
      if (this.player.active) this.player.setVisible(true);
      flashEvent.destroy();
    });
  }

  // -- Wave system --

  private spawnWave(): void {
    this.waveDamageTaken = false;
    this.enemyDirection = 1;

    if (this.wave % 5 === 0) {
      this.spawnBossWave();
      return;
    }

    for (let row = 0; row < C.WAVE_ROWS; row++) {
      for (let col = 0; col < C.WAVE_COLS; col++) {
        const type = this.getEnemyType(row);
        const def = ENEMY_DEFS[type];

        const x = C.GRID_START_X + col * C.GRID_COL_SPACING;
        const y = C.GRID_START_Y + row * C.GRID_ROW_SPACING;

        const sprite = this.add.sprite(x, y, `enemy_${type}`);
        sprite.setDepth(3);

        this.enemies.push({
          sprite,
          type,
          health: def.health,
          maxHealth: def.health,
          value: def.value,
          speedMultiplier: def.speedMultiplier,
          width: C.ENEMY_WIDTH,
          height: C.ENEMY_HEIGHT,
        });
      }
    }
  }

  private getEnemyType(row: number): EnemyType {
    if (this.wave >= 10 && row === 0) return 'sentinel';
    if (this.wave <= 2) return 'code';
    if (this.wave <= 5) return Math.random() < 0.5 ? 'code' : 'agent';

    const rand = Math.random();
    if (rand < 0.3) return 'code';
    if (rand < 0.6) return 'agent';
    if (rand < 0.8) return 'sentinel';
    return 'virus';
  }

  private spawnBossWave(): void {
    this.isBossWave = true;
    this.bossSpawning = true;
    this.bossTime = 0;

    this.bossWarningText.setVisible(true);
    this.playSound(SOUND_KEYS.LEVEL_UP);

    this.time.delayedCall(1500, () => {
      this.bossWarningText.setVisible(false);
      this.bossSpawning = false;

      const encounter = this.wave / 5;
      const health = C.BOSS_BASE_HEALTH + (encounter - 1) * C.BOSS_HEALTH_PER_ENCOUNTER;
      const value = C.BOSS_BASE_VALUE * encounter;

      const sprite = this.add.sprite(C.WIDTH / 2, C.BOSS_Y, 'boss');
      sprite.setDepth(3);
      const healthBg = this.add.graphics();
      healthBg.setDepth(10);
      const healthBar = this.add.graphics();
      healthBar.setDepth(10);

      this.boss = {
        sprite,
        healthBar,
        healthBg,
        health,
        maxHealth: health,
        value,
        width: C.BOSS_WIDTH,
        height: C.BOSS_HEIGHT,
        barrelOffsets: [-30, 0, 30],
      };

      this.drawBossHealthBar();
    });
  }

  private drawBossHealthBar(): void {
    if (!this.boss) return;

    const barWidth = 100;
    const barHeight = 6;
    const x = this.boss.sprite.x - barWidth / 2;
    const y = this.boss.sprite.y - this.boss.height / 2 - 12;
    const healthPct = Math.max(0, this.boss.health / this.boss.maxHealth);

    let color = MATRIX_COLORS.PRIMARY;
    if (healthPct < 0.25) color = MATRIX_COLORS.RED;
    else if (healthPct < 0.5) color = MATRIX_COLORS.YELLOW;

    this.boss.healthBg.clear();
    this.boss.healthBg.fillStyle(0x333333, 1);
    this.boss.healthBg.fillRect(x, y, barWidth, barHeight);

    this.boss.healthBar.clear();
    this.boss.healthBar.fillStyle(color, 1);
    this.boss.healthBar.fillRect(x, y, barWidth * healthPct, barHeight);
  }

  private checkWaveComplete(): void {
    if (this.waveTransitioning || this.bossSpawning) return;
    if (this.isBossWave && this.boss) return;
    if (this.enemies.length > 0) return;

    this.waveTransitioning = true;

    if (this.wave > 1 && !this.waveDamageTaken) {
      this.tryUnlockAchievement(ACHIEVEMENTS.PERFECT_WAVE);
    }

    if (this.wave >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.WAVE_5);
    if (this.wave >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.WAVE_10);
    if (this.wave >= 20) this.tryUnlockAchievement(ACHIEVEMENTS.WAVE_20);

    this.waveCompleteText.setText('WAVE COMPLETE\nHEALTH RESTORED!');
    this.waveCompleteText.setVisible(true);
    this.playSound(SOUND_KEYS.LEVEL_UP);

    this.playerHealth = C.PLAYER_MAX_HEALTH;
    this.clearAllBullets();

    this.time.delayedCall(C.WAVE_DELAY, () => {
      this.waveCompleteText.setVisible(false);
      this.wave++;
      this.isBossWave = false;
      this.waveTransitioning = false;
      this.spawnWave();
    });
  }

  private checkGameOverConditions(): void {
    if (this.isGameOver || this.waveTransitioning) return;

    const playerTopY = this.player.y - C.PLAYER_HEIGHT / 2;
    for (const enemy of this.enemies) {
      if (enemy.sprite.y + enemy.height / 2 >= playerTopY) {
        this.handleGameOver();
        return;
      }
    }
  }

  private handleGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.combo >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.COMBO_10);
    if (this.bulletTimeUses >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.BULLET_TIME);
    if (this.score >= 10000) this.tryUnlockAchievement(ACHIEVEMENTS.HIGH_SCORE);

    const reason = this.playerHealth <= 0 ? 'Ship destroyed' : 'Enemies reached your position';
    this.gameOver(this.score, reason, this.highScore);
  }

  // -- Power-ups --

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['rapidFire', 'shield', 'scoreMultiplier', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];

    const sprite = this.add.sprite(x, y, `powerup_${type}`);
    sprite.setDepth(4);

    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.fieldPowerUps.push({ sprite, type, vy: C.POWERUP_FALL_SPEED });
  }

  private activatePowerUp(type: PowerUpType): void {
    this.playSound(SOUND_KEYS.POWERUP);

    switch (type) {
      case 'rapidFire':
        this.rapidFireActive = true;
        this.time.delayedCall(POWERUP_DEFS.rapidFire.duration, () => {
          this.rapidFireActive = false;
        });
        break;

      case 'shield':
        this.shieldActive = true;
        this.player.setTexture('player_shield');
        break;

      case 'scoreMultiplier':
        this.scoreMultiplierActive = true;
        this.time.delayedCall(POWERUP_DEFS.scoreMultiplier.duration, () => {
          this.scoreMultiplierActive = false;
        });
        break;

      case 'bomb':
        this.activateBomb();
        break;
    }
  }

  private activateBomb(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      this.spawnExplosion(enemy.sprite.x, enemy.sprite.y, ENEMY_DEFS[enemy.type].color, 5);
      this.score += enemy.value;
      this.enemiesKilled++;
      enemy.sprite.destroy();
    }
    this.enemies = [];

    if (this.boss) {
      this.boss.health -= 20;
      if (this.boss.health <= 0) {
        this.defeatBoss();
      }
    }

    this.cameras.main.flash(200, 0, 255, 0);

    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);
  }

  // -- Effects --

  private spawnExplosion(x: number, y: number, color: number, count: number = C.PARTICLE_COUNT): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = C.PARTICLE_SPEED_MIN + Math.random() * (C.PARTICLE_SPEED_MAX - C.PARTICLE_SPEED_MIN);
      const size = 2 + Math.random() * 4;

      const rect = this.add.rectangle(x, y, size, size, color);
      rect.setAlpha(1);
      rect.setDepth(6);

      this.particles.push({
        rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
      });
    }
  }

  private spawnVirusChildren(x: number, y: number): void {
    for (const offsetX of [-20, 20]) {
      const sprite = this.add.sprite(x + offsetX, y, 'enemy_code');
      sprite.setDepth(3);
      this.enemies.push({
        sprite,
        type: 'code',
        health: 1,
        maxHealth: 1,
        value: C.VIRUS_CHILD_VALUE,
        speedMultiplier: ENEMY_DEFS.code.speedMultiplier,
        width: C.ENEMY_WIDTH,
        height: C.ENEMY_HEIGHT,
      });
    }
  }

  // -- HUD --

  private updateHUD(time: number): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.waveText.setText(`WAVE: ${this.wave}`);
    this.comboText.setText(this.combo > 0 ? `COMBO: ${this.combo}x` : '');
    this.highScoreText.setText(`HI: ${this.highScore}`);

    this.drawHealthBar(time);

    if (this.shieldActive) {
      this.player.setTexture('player_shield');
    } else {
      this.player.setTexture('player');
    }
  }

  private drawHealthBar(time: number): void {
    const barX = C.WIDTH - 210;
    const barY = 42;
    const barW = 200;
    const barH = 10;
    const healthPct = this.playerHealth / C.PLAYER_MAX_HEALTH;

    let color = MATRIX_COLORS.PRIMARY;
    if (healthPct < 0.25) {
      const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;
      color = MATRIX_COLORS.RED;
      this.healthBarFill.setAlpha(pulse);
    } else if (healthPct < 0.5) {
      color = MATRIX_COLORS.YELLOW;
      this.healthBarFill.setAlpha(1);
    } else {
      this.healthBarFill.setAlpha(1);
    }

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x333333, 1);
    this.healthBarBg.fillRect(barX, barY, barW, barH);
    this.healthBarBg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.5);
    this.healthBarBg.strokeRect(barX, barY, barW, barH);

    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(barX, barY, barW * healthPct, barH);
  }

  // -- Achievements --

  private tryUnlockAchievement(id: string): void {
    if (this.achievementsUnlocked.has(id)) return;
    this.achievementsUnlocked.add(id);
    this.unlockAchievement(id);
  }

  private checkAchievements(): void {
    if (this.combo >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.COMBO_10);
    if (this.score >= 10000) this.tryUnlockAchievement(ACHIEVEMENTS.HIGH_SCORE);
    if (this.bulletTimeUses >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.BULLET_TIME);
    if (this.enemiesKilled >= 100) this.tryUnlockAchievement(ACHIEVEMENTS.ENEMIES_100);
  }

  // -- Cleanup --

  private clearAllBullets(): void {
    for (const b of this.playerBullets) b.sprite.destroy();
    this.playerBullets = [];
    for (const b of this.enemyBullets) b.sprite.destroy();
    this.enemyBullets = [];
  }

  private getTestState(): Record<string, unknown> {
    return {
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      combo: this.combo,
      playerHealth: this.playerHealth,
      playerX: this.player.x,
      isInvulnerable: this.isInvulnerable,
      shieldActive: this.shieldActive,
      rapidFireActive: this.rapidFireActive,
      scoreMultiplierActive: this.scoreMultiplierActive,
      bulletTimeActive: this.bulletTimeActive,
      bulletTimeUses: this.bulletTimeUses,
      enemiesKilled: this.enemiesKilled,
      waveDamageTaken: this.waveDamageTaken,
      isGameOver: this.isGameOver,
      isBossWave: this.isBossWave,
      bossHealth: this.boss?.health ?? null,
      enemyCount: this.enemies.length,
      playerBulletCount: this.playerBullets.length,
      enemyBulletCount: this.enemyBullets.length,
      fieldPowerUpCount: this.fieldPowerUps.length,
      waveTransitioning: this.waveTransitioning,
    };
  }

  shutdown(): void {
    for (const e of this.enemies) e.sprite.destroy();
    this.enemies = [];
    for (const b of this.playerBullets) b.sprite.destroy();
    this.playerBullets = [];
    for (const b of this.enemyBullets) b.sprite.destroy();
    this.enemyBullets = [];
    for (const p of this.particles) p.rect.destroy();
    this.particles = [];
    for (const pu of this.fieldPowerUps) pu.sprite.destroy();
    this.fieldPowerUps = [];

    if (this.boss) {
      this.boss.sprite.destroy();
      this.boss.healthBar.destroy();
      this.boss.healthBg.destroy();
      this.boss = null;
    }

    this.input.keyboard?.removeAllKeys(true);
  }
}
