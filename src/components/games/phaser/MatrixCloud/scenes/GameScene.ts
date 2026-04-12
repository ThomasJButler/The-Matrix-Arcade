import Phaser from 'phaser';
import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  BOSS_DEFS,
  BOSS_LEVELS,
  POWERUP_DEFS,
  type PipePair,
  type FieldPowerUp,
  type PowerUpType,
  type BossType,
  type BossState,
  type BossAttackState,
  type AttackType,
} from '../config';

const C = GAME_CONFIG;

export class MatrixCloudGameScene extends BaseScene {
  // Player
  private player!: Phaser.GameObjects.Sprite;
  private playerY: number = C.HEIGHT / 2;
  private playerVelocity: number = 0;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: Phaser.Time.TimerEvent | null = null;
  private invulnerableFlashTimer: Phaser.Time.TimerEvent | null = null;

  // Pipes
  private pipes: PipePair[] = [];
  private lastPipeX: number = 0;

  // Power-ups
  private fieldPowerUps: FieldPowerUp[] = [];
  private shieldActive: boolean = false;
  private timeSlowActive: boolean = false;
  private doublePointsActive: boolean = false;
  private timeSlowTimer: Phaser.Time.TimerEvent | null = null;
  private doublePointsTimer: Phaser.Time.TimerEvent | null = null;

  // Scoring
  private score: number = 0;
  private highScore: number = 0;
  private combo: number = 1.0;
  private level: number = 1;

  // Lives
  private lives: number = C.INITIAL_LIVES;

  // Boss
  private inBossBattle: boolean = false;
  private boss: BossState | null = null;
  private bossAttacks: BossAttackState[] = [];
  private bossElapsed: number = 0;
  private bossAttackCooldown: number = 0;
  private bossesDefeated: Set<string> = new Set();
  private pendingBossSpawn: BossType | null = null;

  // Stats
  private powerUpsCollected: number = 0;
  private hasJumped: boolean = false;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private powerUpIndicators: Phaser.GameObjects.Text[] = [];

  // Ground
  private groundRect!: Phaser.GameObjects.Rectangle;

  // Effects
  private matrixRainGroup!: Phaser.GameObjects.Group;

  // Input
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // Game state
  private isGameOver: boolean = false;
  private achievementsUnlocked: Set<string> = new Set();

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    this.createMatrixBackground();
    this.matrixRainGroup = this.addMatrixRain(10);
    this.resetState();
    this.createGround();
    this.createPlayer();
    this.createHUD();
    this.setupInput();
    this.setupCommonInputs();
    this.playSound(SOUND_KEYS.MENU);
  }

  private resetState(): void {
    this.playerY = C.HEIGHT * 0.4;
    this.playerVelocity = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer?.destroy();
    this.invulnerableTimer = null;
    this.invulnerableFlashTimer?.destroy();
    this.invulnerableFlashTimer = null;

    this.pipes = [];
    this.lastPipeX = C.WIDTH + 100;

    this.fieldPowerUps = [];
    this.shieldActive = false;
    this.timeSlowActive = false;
    this.doublePointsActive = false;
    this.timeSlowTimer?.destroy();
    this.timeSlowTimer = null;
    this.doublePointsTimer?.destroy();
    this.doublePointsTimer = null;

    this.score = 0;
    this.highScore = 0;
    this.combo = 1.0;
    this.level = 1;
    this.lives = C.INITIAL_LIVES;

    this.inBossBattle = false;
    this.boss = null;
    this.bossAttacks = [];
    this.bossElapsed = 0;
    this.bossAttackCooldown = 0;
    this.bossesDefeated = new Set();
    this.pendingBossSpawn = null;

    this.powerUpsCollected = 0;
    this.hasJumped = false;
    this.isGameOver = false;
    this.achievementsUnlocked = new Set();
  }

  private createGround(): void {
    this.groundRect = this.add.rectangle(
      C.WIDTH / 2,
      C.HEIGHT - C.GROUND_HEIGHT / 2,
      C.WIDTH,
      C.GROUND_HEIGHT,
      0x003300,
    );
    this.groundRect.setStrokeStyle(2, MATRIX_COLORS.PRIMARY);
    this.groundRect.setDepth(5);
  }

  private createPlayer(): void {
    this.player = this.add.sprite(C.PLAYER_X, this.playerY, 'player');
    this.player.setDepth(10);
  }

  private createHUD(): void {
    this.scoreText = this.createMatrixText(10, 10, 'SCORE: 0', 10).setOrigin(0, 0);
    this.highScoreText = this.createMatrixText(10, 28, 'HIGH: 0', 8).setOrigin(0, 0);
    this.levelText = this.createMatrixText(C.WIDTH - 10, 10, 'LEVEL: 1', 10).setOrigin(1, 0);
    this.comboText = this.createMatrixText(C.WIDTH - 10, 28, 'COMBO: x1.0', 8).setOrigin(1, 0);
    this.livesText = this.createMatrixText(C.WIDTH / 2, 10, '', 10);
    this.updateHUD();
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.highScoreText.setText(`HIGH: ${this.highScore}`);
    this.levelText.setText(`LEVEL: ${this.level}`);
    this.comboText.setText(`COMBO: x${this.combo.toFixed(1)}`);

    let livesStr = '';
    for (let i = 0; i < this.lives; i++) livesStr += '\u2665 ';
    this.livesText.setText(livesStr.trim());
    this.livesText.setColor(this.lives <= 1 ? MATRIX_COLORS.RED_HEX : MATRIX_COLORS.PRIMARY_HEX);

    this.updatePowerUpIndicators();
  }

  private updatePowerUpIndicators(): void {
    for (const ind of this.powerUpIndicators) ind.destroy();
    this.powerUpIndicators = [];

    let y = 48;
    if (this.shieldActive) {
      const t = this.createMatrixText(C.WIDTH - 10, y, 'SHIELD', 7, MATRIX_COLORS.MAGENTA_HEX).setOrigin(1, 0);
      this.powerUpIndicators.push(t);
      y += 14;
    }
    if (this.timeSlowActive) {
      const t = this.createMatrixText(C.WIDTH - 10, y, 'SLOW', 7, MATRIX_COLORS.YELLOW_HEX).setOrigin(1, 0);
      this.powerUpIndicators.push(t);
      y += 14;
    }
    if (this.doublePointsActive) {
      const t = this.createMatrixText(C.WIDTH - 10, y, '2X POINTS', 7, MATRIX_COLORS.CYAN_HEX).setOrigin(1, 0);
      this.powerUpIndicators.push(t);
    }
  }

  private setupInput(): void {
    if (!this.input.keyboard) {
      this.time.delayedCall(100, () => this.setupInput());
      return;
    }

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.input.on('pointerdown', () => {
      if (!this.isGameOver && !this.isPaused) this.jump();
    });
  }

  private jump(): void {
    this.playerVelocity = C.JUMP_VELOCITY;
    this.playSound(SOUND_KEYS.JUMP);

    if (!this.hasJumped) {
      this.hasJumped = true;
      this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_FLIGHT);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);

    const dt = delta / 1000;
    const speedMult = this.timeSlowActive ? C.TIME_SLOW_FACTOR : 1.0;

    this.handleInput();
    this.updatePlayer(dt);

    if (this.inBossBattle) {
      this.updateBoss(dt, speedMult);
    } else {
      this.updatePipes(dt, speedMult);
      this.updateFieldPowerUps(dt, speedMult);
    }

    this.updateHUD();
    this.checkAchievements();

    this.exposeTestState(this.getTestState());
  }

  private handleInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.jump();
    }
  }

  // --- PLAYER PHYSICS ---

  private updatePlayer(dt: number): void {
    this.playerVelocity += C.GRAVITY * dt;
    this.playerVelocity = Math.min(this.playerVelocity, C.TERMINAL_VELOCITY);
    this.playerY += this.playerVelocity * dt;

    if (this.playerY < 0) {
      this.playerY = 0;
      this.playerVelocity = 0;
    }

    const groundY = C.HEIGHT - C.GROUND_HEIGHT - C.PLAYER_HEIGHT / 2;
    if (this.playerY > groundY) {
      this.handleCollision();
      return;
    }

    this.player.setY(this.playerY);

    const angle = Phaser.Math.Clamp(this.playerVelocity / C.TERMINAL_VELOCITY, -1, 1) * 0.4;
    this.player.setRotation(angle);

    this.updatePlayerTexture();
  }

  private updatePlayerTexture(): void {
    if (this.isInvulnerable) {
      this.player.setTexture('player_damaged');
    } else if (this.shieldActive) {
      this.player.setTexture('player_shield');
    } else {
      this.player.setTexture('player');
    }
  }

  // --- PIPES ---

  private updatePipes(dt: number, speedMult: number): void {
    const pipeSpeed = C.PIPE_SPEED * speedMult;

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= pipeSpeed * dt;
      pipe.topRect.setX(pipe.x + C.PIPE_WIDTH / 2);
      pipe.bottomRect.setX(pipe.x + C.PIPE_WIDTH / 2);

      if (pipe.x + C.PIPE_WIDTH < 0) {
        pipe.topRect.destroy();
        pipe.bottomRect.destroy();
        this.pipes.splice(i, 1);
        continue;
      }

      if (!pipe.passed && pipe.x + C.PIPE_WIDTH < C.PLAYER_X) {
        if (!pipe.hit) {
          this.scorePipe();
        }
        pipe.passed = true;
      }

      if (!pipe.hit) {
        this.checkPipeCollision(pipe);
      }
    }

    if (this.pipes.length === 0 || this.lastPipeX - (pipeSpeed * dt) <= C.WIDTH - C.PIPE_SPACING) {
      this.spawnPipe();
    } else {
      this.lastPipeX -= pipeSpeed * dt;
    }
  }

  private spawnPipe(): void {
    const playableHeight = C.HEIGHT - C.GROUND_HEIGHT;
    const maxGapY = playableHeight - C.PIPE_GAP - C.PIPE_MIN_HEIGHT;
    const gapY = C.PIPE_MIN_HEIGHT + Math.random() * (maxGapY - C.PIPE_MIN_HEIGHT);

    const x = C.WIDTH;

    const topHeight = gapY;
    const topRect = this.add.rectangle(
      x + C.PIPE_WIDTH / 2,
      topHeight / 2,
      C.PIPE_WIDTH,
      topHeight,
      0x003300,
    );
    topRect.setStrokeStyle(2, MATRIX_COLORS.PRIMARY);
    topRect.setDepth(3);

    const bottomY = gapY + C.PIPE_GAP;
    const bottomHeight = playableHeight - bottomY;
    const bottomRect = this.add.rectangle(
      x + C.PIPE_WIDTH / 2,
      bottomY + bottomHeight / 2,
      C.PIPE_WIDTH,
      bottomHeight,
      0x003300,
    );
    bottomRect.setStrokeStyle(2, MATRIX_COLORS.PRIMARY);
    bottomRect.setDepth(3);

    const pipe: PipePair = { topRect, bottomRect, x, gapY, passed: false, hit: false };
    this.pipes.push(pipe);
    this.lastPipeX = x;

    if (!this.inBossBattle && Math.random() < C.POWERUP_CHANCE) {
      this.spawnPowerUp(x);
    }
  }

  private checkPipeCollision(pipe: PipePair): void {
    const px = C.PLAYER_X - C.PLAYER_WIDTH / 2;
    const py = this.playerY - C.PLAYER_HEIGHT / 2;
    const pw = C.PLAYER_WIDTH;
    const ph = C.PLAYER_HEIGHT;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + C.PIPE_WIDTH;

    if (px + pw <= pipeLeft || px >= pipeRight) return;

    const inTopPipe = py < pipe.gapY;
    const inBottomPipe = py + ph > pipe.gapY + C.PIPE_GAP;

    if (inTopPipe || inBottomPipe) {
      pipe.hit = true;
      this.handleCollision();
    }
  }

  private scorePipe(): void {
    const scoreMultiplier = this.doublePointsActive ? 2 : 1;
    const points = Math.floor(C.SCORE_PER_PIPE * Math.min(this.combo, C.MAX_COMBO) * scoreMultiplier);
    this.score += points;
    this.combo = Math.min(this.combo + C.COMBO_INCREMENT, C.MAX_COMBO);

    this.playSound(SOUND_KEYS.SCORE);

    const prevLevel = this.level;
    this.level = Math.floor(this.score / C.LEVEL_THRESHOLD) + 1;

    if (this.level > prevLevel) {
      this.onLevelUp(prevLevel);
    }

    this.reportScore(this.score, this.highScore);
  }

  private onLevelUp(prevLevel: number): void {
    this.playSound(SOUND_KEYS.LEVEL_UP);
    this.cameras.main.shake(200, 0.005);

    const levelText = this.createMatrixText(C.WIDTH / 2, C.HEIGHT / 2, `LEVEL ${this.level}`, 16, MATRIX_COLORS.CYAN_HEX);
    this.tweens.add({
      targets: levelText,
      y: levelText.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => levelText.destroy(),
    });

    const bossType = BOSS_LEVELS[this.level];
    if (bossType && !this.bossesDefeated.has(bossType)) {
      this.pendingBossSpawn = bossType;
      this.time.delayedCall(1000, () => {
        if (this.pendingBossSpawn && !this.isGameOver) {
          this.startBossBattle(this.pendingBossSpawn);
          this.pendingBossSpawn = null;
        }
      });
    }
  }

  // --- POWER-UPS ---

  private spawnPowerUp(x: number): void {
    const types: PowerUpType[] = ['shield', 'timeSlow', 'extraLife', 'doublePoints'];
    const type = types[Math.floor(Math.random() * types.length)];
    const y = 80 + Math.random() * (C.HEIGHT - C.GROUND_HEIGHT - 160);

    const sprite = this.add.sprite(x, y, `powerup_${type}`);
    sprite.setDepth(4);

    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.fieldPowerUps.push({ sprite, type, x, y });
  }

  private updateFieldPowerUps(dt: number, speedMult: number): void {
    const speed = C.PIPE_SPEED * speedMult;

    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      pu.x -= speed * dt;
      pu.sprite.setX(pu.x);

      if (pu.x < -C.POWERUP_SIZE) {
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
        continue;
      }

      if (this.checkPowerUpCollision(pu)) {
        this.collectPowerUp(pu);
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
      }
    }
  }

  private checkPowerUpCollision(pu: FieldPowerUp): boolean {
    const dx = C.PLAYER_X - pu.x;
    const dy = this.playerY - pu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (C.PLAYER_WIDTH + C.POWERUP_SIZE) / 2;
  }

  private collectPowerUp(pu: FieldPowerUp): void {
    this.powerUpsCollected++;
    this.playSound(SOUND_KEYS.POWERUP);
    this.activatePowerUp(pu.type);
  }

  private activatePowerUp(type: PowerUpType): void {
    switch (type) {
      case 'shield':
        this.shieldActive = true;
        break;
      case 'timeSlow':
        this.timeSlowTimer?.destroy();
        this.timeSlowActive = true;
        this.timeSlowTimer = this.time.delayedCall(C.POWERUP_DURATION, () => {
          this.timeSlowActive = false;
          this.timeSlowTimer = null;
        });
        break;
      case 'extraLife':
        this.lives = Math.min(this.lives + 1, C.MAX_LIVES);
        break;
      case 'doublePoints':
        this.doublePointsTimer?.destroy();
        this.doublePointsActive = true;
        this.doublePointsTimer = this.time.delayedCall(C.POWERUP_DURATION, () => {
          this.doublePointsActive = false;
          this.doublePointsTimer = null;
        });
        break;
    }
  }

  // --- COLLISION / DAMAGE ---

  private handleCollision(): void {
    if (this.isInvulnerable || this.isGameOver) return;

    if (this.shieldActive) {
      this.shieldActive = false;
      this.playSound(SOUND_KEYS.HIT);
      this.startInvulnerability();
      this.cameras.main.shake(100, 0.008);
      this.showShieldBreakEffect();
      return;
    }

    this.lives--;
    this.combo = 1.0;
    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(200, 0.01);

    if (this.lives <= 0) {
      this.handleGameOver();
      return;
    }

    this.startInvulnerability();

    this.playerY = Math.min(this.playerY, C.HEIGHT - C.GROUND_HEIGHT - C.PLAYER_HEIGHT);
    this.playerVelocity = C.JUMP_VELOCITY * 0.5;
  }

  private startInvulnerability(): void {
    this.isInvulnerable = true;
    this.invulnerableTimer?.destroy();
    this.invulnerableFlashTimer?.destroy();

    this.invulnerableFlashTimer = this.time.addEvent({
      delay: 100,
      repeat: Math.floor(C.INVULNERABLE_DURATION / 100) - 1,
      callback: () => {
        this.player.setVisible(!this.player.visible);
      },
    });

    this.invulnerableTimer = this.time.delayedCall(C.INVULNERABLE_DURATION, () => {
      this.isInvulnerable = false;
      this.player.setVisible(true);
      this.invulnerableTimer = null;
      this.invulnerableFlashTimer = null;
    });
  }

  private showShieldBreakEffect(): void {
    const ring = this.add.circle(C.PLAYER_X, this.playerY, 10, MATRIX_COLORS.MAGENTA, 0.6);
    ring.setDepth(15);
    this.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
  }

  private handleGameOver(): void {
    this.isGameOver = true;

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    this.clearBossBattle();

    this.time.delayedCall(600, () => {
      this.gameOver(this.score, `Level ${this.level} | Pipes cleared`, this.highScore);
    });
  }

  // --- BOSS SYSTEM ---

  private startBossBattle(type: BossType): void {
    this.inBossBattle = true;
    this.bossElapsed = 0;
    this.bossAttackCooldown = 0;
    this.bossAttacks = [];

    for (const pipe of this.pipes) {
      pipe.topRect.destroy();
      pipe.bottomRect.destroy();
    }
    this.pipes = [];

    for (const pu of this.fieldPowerUps) {
      pu.sprite.destroy();
    }
    this.fieldPowerUps = [];

    const def = BOSS_DEFS[type];
    const sprite = this.add.sprite(C.WIDTH + def.size, C.HEIGHT / 2, `boss_${type}`);
    sprite.setDepth(8);

    const healthBg = this.add.graphics();
    const healthBar = this.add.graphics();
    healthBg.setDepth(9);
    healthBar.setDepth(9);

    this.boss = {
      sprite,
      healthBar,
      healthBg,
      type,
      health: def.health,
      maxHealth: def.health,
      x: C.WIDTH + def.size,
      y: C.HEIGHT / 2,
      elapsedTime: 0,
    };

    this.tweens.add({
      targets: this.boss,
      x: C.WIDTH * 0.75,
      duration: 1500,
      ease: 'Power2',
    });

    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(300, 0.01);

    const bossText = this.createMatrixText(C.WIDTH / 2, C.HEIGHT / 2, `${type.replace('_', ' ').toUpperCase()}`, 14, MATRIX_COLORS.RED_HEX);
    this.tweens.add({
      targets: bossText,
      alpha: 0,
      y: bossText.y - 30,
      duration: 2000,
      onComplete: () => bossText.destroy(),
    });
  }

  private updateBoss(dt: number, speedMult: number): void {
    if (!this.boss) return;

    this.bossElapsed += dt;
    this.boss.elapsedTime += dt * 1000;

    if (this.bossElapsed >= C.BOSS_DURATION) {
      this.endBossBattle(false);
      return;
    }

    this.updateBossMovement(dt, speedMult);
    this.updateBossAttacks(dt, speedMult);
    this.drawBossHealthBar();

    this.bossAttackCooldown -= dt;
    if (this.bossAttackCooldown <= 0) {
      this.fireBossAttack();
      this.bossAttackCooldown = C.BOSS_ATTACK_INTERVAL;
    }

    this.checkBossPlayerCollision();
  }

  private updateBossMovement(dt: number, speedMult: number): void {
    if (!this.boss) return;

    const t = this.boss.elapsedTime;
    const def = BOSS_DEFS[this.boss.type];
    const speed = def.speed * speedMult;

    switch (this.boss.type) {
      case 'agent_smith':
        this.boss.y += Math.sin(t / 1000) * speed * dt;
        break;
      case 'sentinel':
        this.boss.x += Math.sin(t / 1500) * speed * 0.3 * dt;
        this.boss.y += Math.cos(t / 1500) * speed * dt;
        break;
      case 'architect':
        this.boss.y += Math.sin(t / 2000) * speed * dt;
        break;
    }

    this.boss.x = Phaser.Math.Clamp(this.boss.x, C.WIDTH * 0.5, C.WIDTH - def.size);
    this.boss.y = Phaser.Math.Clamp(this.boss.y, def.size, C.HEIGHT - C.GROUND_HEIGHT - def.size);
    this.boss.sprite.setPosition(this.boss.x, this.boss.y);
  }

  private fireBossAttack(): void {
    if (!this.boss) return;

    const def = BOSS_DEFS[this.boss.type];
    const attackType = def.attacks[Math.floor(Math.random() * def.attacks.length)] as AttackType;

    const sprite = this.add.sprite(this.boss.x - def.size / 2, this.boss.y, `attack_${attackType}`);
    sprite.setDepth(7);

    const vy = (Math.random() - 0.5) * 150;
    this.bossAttacks.push({
      sprite,
      vx: -C.BOSS_ATTACK_SPEED,
      vy,
      life: 1.0,
    });
  }

  private updateBossAttacks(dt: number, speedMult: number): void {
    for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
      const attack = this.bossAttacks[i];
      attack.sprite.x += attack.vx * speedMult * dt;
      attack.sprite.y += attack.vy * speedMult * dt;
      attack.life -= dt * 0.5;

      if (attack.life <= 0 || attack.sprite.x < -30) {
        attack.sprite.destroy();
        this.bossAttacks.splice(i, 1);
        continue;
      }

      attack.sprite.setAlpha(Math.max(attack.life, 0.2));

      if (this.checkAttackPlayerCollision(attack)) {
        attack.sprite.destroy();
        this.bossAttacks.splice(i, 1);
        this.handleCollision();
      }
    }
  }

  private checkAttackPlayerCollision(attack: BossAttackState): boolean {
    if (this.isInvulnerable) return false;

    const dx = C.PLAYER_X - attack.sprite.x;
    const dy = this.playerY - attack.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (C.PLAYER_WIDTH + C.BOSS_ATTACK_SIZE) / 2;
  }

  private checkBossPlayerCollision(): void {
    if (!this.boss || this.isInvulnerable) return;

    const def = BOSS_DEFS[this.boss.type];
    const dx = C.PLAYER_X - this.boss.x;
    const dy = this.playerY - this.boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < (C.PLAYER_WIDTH + def.size) / 2) {
      this.boss.health -= C.BOSS_DAMAGE_PER_HIT;
      this.handleCollision();

      if (this.boss.health <= 0) {
        this.defeatBoss();
      }
    }
  }

  private drawBossHealthBar(): void {
    if (!this.boss) return;

    const def = BOSS_DEFS[this.boss.type];
    const barWidth = def.size;
    const barHeight = 6;
    const barX = this.boss.x - barWidth / 2;
    const barY = this.boss.y - def.size / 2 - 12;

    this.boss.healthBg.clear();
    this.boss.healthBg.fillStyle(0x330000, 1);
    this.boss.healthBg.fillRect(barX, barY, barWidth, barHeight);

    const healthFrac = this.boss.health / this.boss.maxHealth;
    this.boss.healthBar.clear();
    this.boss.healthBar.fillStyle(MATRIX_COLORS.RED, 1);
    this.boss.healthBar.fillRect(barX, barY, barWidth * healthFrac, barHeight);
  }

  private defeatBoss(): void {
    if (!this.boss) return;

    const type = this.boss.type;
    const reward = this.boss.maxHealth * 2;
    this.score += reward;
    this.bossesDefeated.add(type);

    this.playSound(SOUND_KEYS.LEVEL_UP);
    this.cameras.main.shake(300, 0.015);

    const rewardText = this.createMatrixText(this.boss.x, this.boss.y, `+${reward}`, 14, MATRIX_COLORS.YELLOW_HEX);
    this.tweens.add({
      targets: rewardText,
      y: rewardText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => rewardText.destroy(),
    });

    if (type === 'agent_smith') this.tryUnlockAchievement(ACHIEVEMENTS.BOSS_SLAYER);
    if (type === 'sentinel') this.tryUnlockAchievement(ACHIEVEMENTS.SENTINEL_DEFEAT);
    if (type === 'architect') this.tryUnlockAchievement(ACHIEVEMENTS.ARCHITECT_DEFEAT);

    if (this.bossesDefeated.size >= 3) {
      this.tryUnlockAchievement(ACHIEVEMENTS.ALL_BOSSES);
    }

    this.endBossBattle(true);
  }

  private endBossBattle(success: boolean): void {
    if (!success) {
      this.playSound(SOUND_KEYS.HIT);
    }

    this.clearBossBattle();
    this.inBossBattle = false;
    this.lastPipeX = C.WIDTH;
  }

  private clearBossBattle(): void {
    if (this.boss) {
      this.boss.sprite.destroy();
      this.boss.healthBar.destroy();
      this.boss.healthBg.destroy();
      this.boss = null;
    }

    for (const attack of this.bossAttacks) {
      attack.sprite.destroy();
    }
    this.bossAttacks = [];
  }

  // --- ACHIEVEMENTS ---

  private tryUnlockAchievement(id: string): void {
    if (this.achievementsUnlocked.has(id)) return;
    this.achievementsUnlocked.add(id);
    this.unlockAchievement(id);
  }

  private checkAchievements(): void {
    if (this.score >= 1000) this.tryUnlockAchievement(ACHIEVEMENTS.HIGH_FLYER);
    if (this.level >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.LEVEL_5);
    if (this.powerUpsCollected >= 20) this.tryUnlockAchievement(ACHIEVEMENTS.POWER_COLLECTOR);
  }

  // --- TEST STATE ---

  private getTestState(): Record<string, unknown> {
    return {
      score: this.score,
      highScore: this.highScore,
      level: this.level,
      lives: this.lives,
      combo: this.combo,
      playerY: this.playerY,
      playerVelocity: this.playerVelocity,
      isInvulnerable: this.isInvulnerable,
      shieldActive: this.shieldActive,
      timeSlowActive: this.timeSlowActive,
      doublePointsActive: this.doublePointsActive,
      powerUpsCollected: this.powerUpsCollected,
      hasJumped: this.hasJumped,
      isGameOver: this.isGameOver,
      inBossBattle: this.inBossBattle,
      bossHealth: this.boss?.health ?? null,
      bossType: this.boss?.type ?? null,
      bossesDefeated: [...this.bossesDefeated],
      pipeCount: this.pipes.length,
      fieldPowerUpCount: this.fieldPowerUps.length,
    };
  }

  // --- CLEANUP ---

  shutdown(): void {
    this.invulnerableTimer?.destroy();
    this.invulnerableFlashTimer?.destroy();
    this.timeSlowTimer?.destroy();
    this.doublePointsTimer?.destroy();

    for (const pipe of this.pipes) {
      pipe.topRect.destroy();
      pipe.bottomRect.destroy();
    }
    this.pipes = [];

    for (const pu of this.fieldPowerUps) {
      pu.sprite.destroy();
    }
    this.fieldPowerUps = [];

    this.clearBossBattle();

    for (const ind of this.powerUpIndicators) {
      ind.destroy();
    }
    this.powerUpIndicators = [];

    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }
    this.input.off('pointerdown');
  }
}
