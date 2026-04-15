import Phaser from 'phaser';
import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, SOUND_KEYS, REGISTRY_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  BRICK_DEFS,
  POWERUP_DEFS,
  LEVELS,
  getBrickType,
  type BrickState,
  type BallState,
  type AgentState,
  type LaserState,
  type FieldPowerUp,
  type ParticleState,
  type BossState,
  type PowerUpType,
} from '../config';

export class CodeBreakerGameScene extends BaseScene {
  private paddle!: Phaser.GameObjects.Sprite;
  private paddleWidth = GAME_CONFIG.PADDLE_WIDTH;

  private balls: BallState[] = [];
  private bricks: BrickState[] = [];
  private agents: AgentState[] = [];
  private lasers: LaserState[] = [];
  private fieldPowerUps: FieldPowerUp[] = [];
  private particles: ParticleState[] = [];

  private boss: BossState | null = null;
  private bossBullets: Array<{ sprite: Phaser.GameObjects.Rectangle; vx: number; vy: number }> = [];

  private firewall: Phaser.GameObjects.Sprite | null = null;
  private portal: Phaser.GameObjects.Sprite | null = null;

  private score = 0;
  private highScore = 0;
  private lives = GAME_CONFIG.LIVES;
  private level = 1;
  private combo = 0;
  private agentsKilled = 0;
  private bulletTimeUses = 0;
  private ballLostThisLevel = false;

  private widePaddleActive = false;
  private laserActive = false;
  private bulletTimeActive = false;
  private firewallActive = false;
  private laserTimer = 0;

  private isGameOver = false;
  private isLevelComplete = false;
  private isBallAttached = true;
  private achievementsUnlocked = new Set<string>();

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private bulletTimeText!: Phaser.GameObjects.Text;
  private levelCompleteText!: Phaser.GameObjects.Text;
  private attachHintText!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wasdA!: Phaser.Input.Keyboard.Key;
  private wasdD!: Phaser.Input.Keyboard.Key;
  private numpadLeft!: Phaser.Input.Keyboard.Key;
  private numpadRight!: Phaser.Input.Keyboard.Key;
  private bulletTimeKey!: Phaser.Input.Keyboard.Key;

  private matrixRainGroup!: Phaser.GameObjects.Group;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();
    if (this.textures.exists('frame_bg')) {
      const bg = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'frame_bg');
      bg.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
      bg.setAlpha(0.15);
      bg.setTint(MATRIX_COLORS.PRIMARY);
      bg.setDepth(-1);
    }
    this.matrixRainGroup = this.addMatrixRain(8);
    this.resetState();
    this.createPaddle();
    this.createHUD();
    this.setupInput();
    this.setupCommonInputs();
    this.loadLevel(this.level);
    this.spawnBall(true);
    this.playSound(SOUND_KEYS.MENU);
    this.playBackgroundMusic('/assets/rhythm-hacker/tracks/ostcrunch2-resonance.mp3');
    this.startCountdown(5, () => {});
  }

  private resetState(): void {
    this.score = 0;
    this.lives = GAME_CONFIG.LIVES;
    this.level = 1;
    this.combo = 0;
    this.agentsKilled = 0;
    this.bulletTimeUses = 0;
    this.ballLostThisLevel = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isBallAttached = true;
    this.widePaddleActive = false;
    this.laserActive = false;
    this.bulletTimeActive = false;
    this.firewallActive = false;
    this.laserTimer = 0;
    this.highScore = 0;
    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.codeBreaker?.highScore ?? 0;
    }
    this.achievementsUnlocked = new Set();
    this.paddleWidth = GAME_CONFIG.PADDLE_WIDTH;
    this.balls = [];
    this.bricks = [];
    this.agents = [];
    this.lasers = [];
    this.fieldPowerUps = [];
    this.particles = [];
    this.boss = null;
    this.bossBullets = [];
    this.firewall = null;
    this.portal = null;
  }

  // -- Paddle --

  private createPaddle(): void {
    this.paddle = this.add.sprite(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.PADDLE_Y, 'paddle');
    this.paddle.setDisplaySize(GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);
    this.paddle.setDepth(5);
  }

  // -- Ball --

  private spawnBall(attached: boolean): void {
    const ballSize = GAME_CONFIG.BALL_RADIUS * 2;
    const sprite = this.add.image(
      attached ? this.paddle.x : GAME_CONFIG.WIDTH / 2,
      attached ? this.paddle.y - GAME_CONFIG.PADDLE_HEIGHT / 2 - GAME_CONFIG.BALL_RADIUS - 1 : GAME_CONFIG.HEIGHT * 0.6,
      'ball'
    );
    sprite.setDisplaySize(ballSize, ballSize);
    sprite.setDepth(6);

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const ball: BallState = {
      sprite,
      vx: attached ? 0 : Math.cos(angle) * GAME_CONFIG.BALL_SPEED,
      vy: attached ? 0 : Math.sin(angle) * GAME_CONFIG.BALL_SPEED,
    };
    this.balls.push(ball);
  }

  private launchBall(): void {
    if (!this.isBallAttached || this.balls.length === 0) return;
    this.isBallAttached = false;

    const ball = this.balls[0];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    ball.vx = Math.cos(angle) * GAME_CONFIG.BALL_SPEED;
    ball.vy = Math.sin(angle) * GAME_CONFIG.BALL_SPEED;

    if (this.attachHintText) this.attachHintText.setVisible(false);
  }

  // -- Level --

  private loadLevel(level: number): void {
    this.clearLevel();
    this.ballLostThisLevel = false;

    const layoutIndex = Math.min(level - 1, LEVELS.length - 1);
    const layout = LEVELS[layoutIndex];

    for (let row = 0; row < layout.length; row++) {
      for (let col = 0; col < layout[row].length; col++) {
        const code = layout[row][col];
        const brickType = getBrickType(code);
        if (!brickType) continue;

        const def = BRICK_DEFS[brickType];
        const x = GAME_CONFIG.BRICK_OFFSET_X + col * (GAME_CONFIG.BRICK_WIDTH + GAME_CONFIG.BRICK_PADDING) + GAME_CONFIG.BRICK_WIDTH / 2;
        const y = GAME_CONFIG.BRICK_OFFSET_Y + row * (GAME_CONFIG.BRICK_HEIGHT + GAME_CONFIG.BRICK_PADDING) + GAME_CONFIG.BRICK_HEIGHT / 2;

        const textureKey = `brick_${brickType}`;
        const sprite = this.add.image(x, y, textureKey);
        sprite.setDisplaySize(GAME_CONFIG.BRICK_WIDTH, GAME_CONFIG.BRICK_HEIGHT);
        sprite.setDepth(3);

        this.bricks.push({
          sprite,
          type: brickType,
          health: def.health,
          maxHealth: def.health,
          value: def.value,
          row,
          col,
          width: GAME_CONFIG.BRICK_WIDTH,
          height: GAME_CONFIG.BRICK_HEIGHT,
        });
      }
    }

    if ((GAME_CONFIG.BOSS_LEVELS as readonly number[]).includes(level)) {
      this.spawnBoss();
    }
  }

  private clearLevel(): void {
    for (const b of this.bricks) b.sprite.destroy();
    this.bricks = [];
    for (const a of this.agents) a.sprite.destroy();
    this.agents = [];
    for (const l of this.lasers) l.sprite.destroy();
    this.lasers = [];
    for (const p of this.fieldPowerUps) p.sprite.destroy();
    this.fieldPowerUps = [];
    for (const p of this.particles) p.rect.destroy();
    this.particles = [];
    for (const b of this.bossBullets) b.sprite.destroy();
    this.bossBullets = [];

    if (this.boss) {
      this.boss.sprite.destroy();
      this.boss.healthBar.destroy();
      this.boss.healthBg.destroy();
      this.boss = null;
    }
    if (this.firewall) {
      this.firewall.destroy();
      this.firewall = null;
      this.firewallActive = false;
    }
    if (this.portal) {
      this.portal.destroy();
      this.portal = null;
    }

    this.widePaddleActive = false;
    this.laserActive = false;
    this.bulletTimeActive = false;
    this.laserTimer = 0;
    this.paddleWidth = GAME_CONFIG.PADDLE_WIDTH;
    this.updatePaddleTexture();
  }

  // -- Boss --

  private spawnBoss(): void {
    const health = GAME_CONFIG.BOSS_BASE_HEALTH + (this.level - 1) * GAME_CONFIG.BOSS_HEALTH_PER_LEVEL;
    const sprite = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2, 30,
      GAME_CONFIG.BOSS_WIDTH, GAME_CONFIG.BOSS_HEIGHT,
      0x880000
    );
    sprite.setDepth(4);
    sprite.setStrokeStyle(2, MATRIX_COLORS.RED);

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
      value: GAME_CONFIG.BOSS_VALUE,
      width: GAME_CONFIG.BOSS_WIDTH,
      height: GAME_CONFIG.BOSS_HEIGHT,
      direction: 1,
      speed: GAME_CONFIG.BOSS_SPEED,
      fireTimer: 0,
    };
  }

  // -- HUD --

  private createHUD(): void {
    this.scoreText = this.createMatrixText(10, 8, 'SCORE: 0', 9);
    this.scoreText.setOrigin(0, 0);

    this.levelText = this.createMatrixText(10, 24, 'LEVEL: 1', 9);
    this.levelText.setOrigin(0, 0);

    this.comboText = this.createMatrixText(10, 40, '', 8, MATRIX_COLORS.CYAN_HEX);
    this.comboText.setOrigin(0, 0);

    this.highScoreText = this.createMatrixText(GAME_CONFIG.WIDTH - 10, 8, 'HI: 0', 9);
    this.highScoreText.setOrigin(1, 0);

    this.livesText = this.createMatrixText(GAME_CONFIG.WIDTH - 10, 24, `LIVES: ${this.lives}`, 9);
    this.livesText.setOrigin(1, 0);

    this.bulletTimeText = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.45, 'BULLET TIME', 12, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bulletTimeText.setVisible(false);
    this.bulletTimeText.setDepth(100);

    this.levelCompleteText = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.4, '', 14
    );
    this.levelCompleteText.setVisible(false);
    this.levelCompleteText.setDepth(100);

    this.attachHintText = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.PADDLE_Y - 30, 'PRESS SPACE TO LAUNCH', 8, MATRIX_COLORS.CYAN_HEX
    );
    this.attachHintText.setDepth(100);
  }

  // -- Input --

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.wasdA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.wasdD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.numpadLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR);
      this.numpadRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX);
      this.bulletTimeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    });
  }

  // -- Update loop --

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver || this.isLevelComplete) return;
    if (this.isCountingDown) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);

    const dt = delta / 1000;
    const timeScale = this.bulletTimeActive ? GAME_CONFIG.BULLET_TIME_SCALE : 1.0;
    const scaledDt = dt * timeScale;

    this.handlePaddleMovement(dt);
    this.handleLaunch();
    this.handleBulletTime();
    this.handleLaserFiring(dt);

    this.updateBalls(scaledDt);
    this.updateAgents(scaledDt);
    this.updateLasers(scaledDt);
    this.updateFieldPowerUps(scaledDt);
    this.updateParticles(scaledDt);
    this.updateBoss(scaledDt);
    this.updateBossBullets(scaledDt);

    this.checkBallBrickCollisions();
    this.checkBallPaddleCollisions();
    this.checkBallWallCollisions();
    this.checkBallBottomCollisions();
    this.checkLaserBrickCollisions();
    this.checkAgentPaddleCollisions();
    this.checkBossBulletPaddleCollisions();
    this.checkPowerUpCollisions();
    this.checkPortalCollision();

    this.checkLevelComplete();
    this.updateHUD();
    this.checkAchievements();
    this.exposeTestState(this.getTestState());
  }

  // -- Paddle movement --

  private handlePaddleMovement(dt: number): void {
    const speed = GAME_CONFIG.PADDLE_SPEED * dt;
    let dx = 0;

    if (this.cursors?.left.isDown || this.wasdA?.isDown || this.numpadLeft?.isDown) dx -= speed;
    if (this.cursors?.right.isDown || this.wasdD?.isDown || this.numpadRight?.isDown) dx += speed;

    const pointer = this.input.activePointer;
    if (pointer.isDown || pointer.x !== this.paddle.x) {
      const targetX = Phaser.Math.Clamp(
        pointer.x,
        this.paddleWidth / 2,
        GAME_CONFIG.WIDTH - this.paddleWidth / 2
      );
      const diff = targetX - this.paddle.x;
      if (Math.abs(diff) > 2) {
        dx = Math.sign(diff) * Math.min(Math.abs(diff), speed * 2);
      }
    }

    this.paddle.x = Phaser.Math.Clamp(
      this.paddle.x + dx,
      this.paddleWidth / 2,
      GAME_CONFIG.WIDTH - this.paddleWidth / 2
    );

    if (this.isBallAttached && this.balls.length > 0) {
      this.balls[0].sprite.x = this.paddle.x;
      this.balls[0].sprite.y = this.paddle.y - GAME_CONFIG.PADDLE_HEIGHT / 2 - GAME_CONFIG.BALL_RADIUS - 1;
    }
  }

  private handleLaunch(): void {
    if (!this.spaceKey || !Phaser.Input.Keyboard.JustDown(this.spaceKey)) return;
    if (this.isBallAttached) this.launchBall();
  }

  private handleBulletTime(): void {
    if (!this.bulletTimeKey || !Phaser.Input.Keyboard.JustDown(this.bulletTimeKey)) return;
    if (this.bulletTimeActive) return;

    this.bulletTimeActive = true;
    this.bulletTimeUses++;
    this.bulletTimeText.setVisible(true);
    this.playSound(SOUND_KEYS.SPECIAL_ABILITY);

    this.time.delayedCall(POWERUP_DEFS.bulletTime.duration, () => {
      this.bulletTimeActive = false;
      this.bulletTimeText.setVisible(false);
    });
  }

  private handleLaserFiring(dt: number): void {
    if (!this.laserActive) return;

    this.laserTimer += dt;
    if (this.laserTimer >= GAME_CONFIG.LASER_FIRE_INTERVAL) {
      this.laserTimer -= GAME_CONFIG.LASER_FIRE_INTERVAL;
      this.fireLaser();
    }
  }

  private fireLaser(): void {
    const sprite = this.add.rectangle(
      this.paddle.x,
      this.paddle.y - GAME_CONFIG.PADDLE_HEIGHT / 2 - GAME_CONFIG.LASER_HEIGHT / 2,
      GAME_CONFIG.LASER_WIDTH,
      GAME_CONFIG.LASER_HEIGHT,
      MATRIX_COLORS.MAGENTA
    );
    sprite.setDepth(5);
    this.lasers.push({ sprite, vy: -GAME_CONFIG.LASER_SPEED });
    this.playSound(SOUND_KEYS.SHOOT);
  }

  // -- Ball updates --

  private updateBalls(dt: number): void {
    for (const ball of this.balls) {
      if (this.isBallAttached && ball === this.balls[0]) continue;
      ball.sprite.x += ball.vx * dt;
      ball.sprite.y += ball.vy * dt;
    }
  }

  // -- Agent updates --

  private updateAgents(dt: number): void {
    for (let i = this.agents.length - 1; i >= 0; i--) {
      const agent = this.agents[i];
      agent.sprite.y += agent.vy * dt;

      if (agent.sprite.y > GAME_CONFIG.HEIGHT + 20) {
        agent.sprite.destroy();
        this.agents.splice(i, 1);
      }
    }
  }

  // -- Laser updates --

  private updateLasers(dt: number): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.sprite.y += laser.vy * dt;

      if (laser.sprite.y < -10) {
        laser.sprite.destroy();
        this.lasers.splice(i, 1);
      }
    }
  }

  // -- Power-up field updates --

  private updateFieldPowerUps(dt: number): void {
    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      pu.sprite.y += pu.vy * dt;

      if (pu.sprite.y > GAME_CONFIG.HEIGHT + 10) {
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
      }
    }
  }

  // -- Particle updates --

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.rect.x += p.vx * dt;
      p.rect.y += p.vy * dt;
      p.life -= GAME_CONFIG.PARTICLE_DECAY * dt;
      p.rect.setAlpha(Math.max(0, p.life));

      if (p.life <= 0) {
        p.rect.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  // -- Boss updates --

  private updateBoss(dt: number): void {
    if (!this.boss) return;

    this.boss.sprite.x += this.boss.direction * this.boss.speed * dt;

    if (this.boss.sprite.x - this.boss.width / 2 <= 0) {
      this.boss.direction = 1;
      this.boss.sprite.x = this.boss.width / 2;
    } else if (this.boss.sprite.x + this.boss.width / 2 >= GAME_CONFIG.WIDTH) {
      this.boss.direction = -1;
      this.boss.sprite.x = GAME_CONFIG.WIDTH - this.boss.width / 2;
    }

    this.boss.fireTimer += dt;
    if (this.boss.fireTimer >= GAME_CONFIG.BOSS_FIRE_INTERVAL) {
      this.boss.fireTimer -= GAME_CONFIG.BOSS_FIRE_INTERVAL;
      this.fireBossBullet();
    }

    this.drawBossHealthBar();
  }

  private fireBossBullet(): void {
    if (!this.boss) return;

    const dx = this.paddle.x - this.boss.sprite.x;
    const dy = this.paddle.y - this.boss.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;

    const sprite = this.add.rectangle(
      this.boss.sprite.x,
      this.boss.sprite.y + this.boss.height / 2,
      6, 6, MATRIX_COLORS.RED
    );
    sprite.setDepth(5);

    this.bossBullets.push({
      sprite,
      vx: nx * GAME_CONFIG.BOSS_BULLET_SPEED,
      vy: ny * GAME_CONFIG.BOSS_BULLET_SPEED,
    });
  }

  private updateBossBullets(dt: number): void {
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const b = this.bossBullets[i];
      b.sprite.x += b.vx * dt;
      b.sprite.y += b.vy * dt;

      if (b.sprite.y > GAME_CONFIG.HEIGHT + 10 || b.sprite.x < -10 || b.sprite.x > GAME_CONFIG.WIDTH + 10) {
        b.sprite.destroy();
        this.bossBullets.splice(i, 1);
      }
    }
  }

  private drawBossHealthBar(): void {
    if (!this.boss) return;

    const barWidth = 100;
    const barHeight = 6;
    const x = this.boss.sprite.x - barWidth / 2;
    const y = this.boss.sprite.y - this.boss.height / 2 - 10;
    const healthPct = Math.max(0, this.boss.health / this.boss.maxHealth);

    let color = MATRIX_COLORS.PRIMARY;
    if (healthPct < 0.25) color = MATRIX_COLORS.RED;
    else if (healthPct < 0.5) color = MATRIX_COLORS.YELLOW;

    this.boss.healthBg.clear();
    this.boss.healthBg.fillStyle(MATRIX_COLORS.DARK_GREY, 1);
    this.boss.healthBg.fillRect(x, y, barWidth, barHeight);

    this.boss.healthBar.clear();
    this.boss.healthBar.fillStyle(color, 1);
    this.boss.healthBar.fillRect(x, y, barWidth * healthPct, barHeight);
  }

  // -- Collision detection --

  private aabbOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
  }

  private checkBallBrickCollisions(): void {
    const ballR = GAME_CONFIG.BALL_RADIUS;
    const ballD = ballR * 2;

    for (const ball of this.balls) {
      if (this.isBallAttached && ball === this.balls[0]) continue;

      for (let bi = this.bricks.length - 1; bi >= 0; bi--) {
        const brick = this.bricks[bi];

        if (this.aabbOverlap(
          ball.sprite.x, ball.sprite.y, ballD, ballD,
          brick.sprite.x, brick.sprite.y, brick.width, brick.height
        )) {
          const dx = ball.sprite.x - brick.sprite.x;
          const dy = ball.sprite.y - brick.sprite.y;
          const overlapX = (ballR + brick.width / 2) - Math.abs(dx);
          const overlapY = (ballR + brick.height / 2) - Math.abs(dy);

          if (overlapX < overlapY) {
            ball.vx = Math.abs(ball.vx) * Math.sign(dx || 1);
          } else {
            ball.vy = Math.abs(ball.vy) * Math.sign(dy || 1);
          }

          this.hitBrick(bi);
          break;
        }
      }

      if (this.boss && this.aabbOverlap(
        ball.sprite.x, ball.sprite.y, ballD, ballD,
        this.boss.sprite.x, this.boss.sprite.y, this.boss.width, this.boss.height
      )) {
        ball.vy = Math.abs(ball.vy);
        this.hitBoss(1);
      }
    }
  }

  private checkBallPaddleCollisions(): void {
    const ballR = GAME_CONFIG.BALL_RADIUS;

    for (const ball of this.balls) {
      if (this.isBallAttached && ball === this.balls[0]) continue;
      if (ball.vy < 0) continue;

      if (this.aabbOverlap(
        ball.sprite.x, ball.sprite.y, ballR * 2, ballR * 2,
        this.paddle.x, this.paddle.y, this.paddleWidth, GAME_CONFIG.PADDLE_HEIGHT
      )) {
        const hitPos = (ball.sprite.x - this.paddle.x) / (this.paddleWidth / 2);
        const angle = Phaser.Math.Clamp(hitPos, -0.9, 0.9) * (Math.PI / 3);
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const newSpeed = Math.min(speed + GAME_CONFIG.BALL_SPEED_INCREMENT, GAME_CONFIG.BALL_MAX_SPEED);

        ball.vx = Math.sin(angle) * newSpeed;
        ball.vy = -Math.cos(angle) * newSpeed;
        ball.sprite.y = this.paddle.y - GAME_CONFIG.PADDLE_HEIGHT / 2 - ballR - 1;

        this.playSound(SOUND_KEYS.HIT);
      }
    }
  }

  private checkBallWallCollisions(): void {
    const ballR = GAME_CONFIG.BALL_RADIUS;

    for (const ball of this.balls) {
      if (this.isBallAttached && ball === this.balls[0]) continue;

      if (ball.sprite.x - ballR <= 0) {
        ball.sprite.x = ballR;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.sprite.x + ballR >= GAME_CONFIG.WIDTH) {
        ball.sprite.x = GAME_CONFIG.WIDTH - ballR;
        ball.vx = -Math.abs(ball.vx);
      }

      if (ball.sprite.y - ballR <= 0) {
        ball.sprite.y = ballR;
        ball.vy = Math.abs(ball.vy);
      }
    }
  }

  private checkBallBottomCollisions(): void {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (this.isBallAttached && ball === this.balls[0]) continue;

      if (ball.sprite.y + GAME_CONFIG.BALL_RADIUS >= GAME_CONFIG.FIREWALL_Y) {
        if (this.firewallActive && this.firewall) {
          ball.vy = -Math.abs(ball.vy);
          ball.sprite.y = GAME_CONFIG.FIREWALL_Y - GAME_CONFIG.BALL_RADIUS - 1;
          this.firewall.destroy();
          this.firewall = null;
          this.firewallActive = false;
          this.playSound(SOUND_KEYS.HIT);
          continue;
        }

        ball.sprite.destroy();
        this.balls.splice(i, 1);
      }
    }

    if (this.balls.length === 0 && !this.isBallAttached) {
      this.loseLife();
    }
  }

  private checkLaserBrickCollisions(): void {
    for (let li = this.lasers.length - 1; li >= 0; li--) {
      const laser = this.lasers[li];

      for (let bi = this.bricks.length - 1; bi >= 0; bi--) {
        const brick = this.bricks[bi];

        if (this.aabbOverlap(
          laser.sprite.x, laser.sprite.y, GAME_CONFIG.LASER_WIDTH, GAME_CONFIG.LASER_HEIGHT,
          brick.sprite.x, brick.sprite.y, brick.width, brick.height
        )) {
          this.hitBrick(bi);
          laser.sprite.destroy();
          this.lasers.splice(li, 1);
          break;
        }
      }

      if (this.boss && li < this.lasers.length && this.aabbOverlap(
        laser.sprite.x, laser.sprite.y, GAME_CONFIG.LASER_WIDTH, GAME_CONFIG.LASER_HEIGHT,
        this.boss.sprite.x, this.boss.sprite.y, this.boss.width, this.boss.height
      )) {
        this.hitBoss(1);
        laser.sprite.destroy();
        this.lasers.splice(li, 1);
      }
    }
  }

  private checkAgentPaddleCollisions(): void {
    for (let i = this.agents.length - 1; i >= 0; i--) {
      const agent = this.agents[i];

      if (this.aabbOverlap(
        agent.sprite.x, agent.sprite.y, agent.width, agent.height,
        this.paddle.x, this.paddle.y, this.paddleWidth, GAME_CONFIG.PADDLE_HEIGHT
      )) {
        this.spawnExplosion(agent.sprite.x, agent.sprite.y, MATRIX_COLORS.RED, 6);
        agent.sprite.destroy();
        this.agents.splice(i, 1);
        this.loseLife();
      }
    }
  }

  private checkBossBulletPaddleCollisions(): void {
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const bullet = this.bossBullets[i];

      if (this.aabbOverlap(
        bullet.sprite.x, bullet.sprite.y, 6, 6,
        this.paddle.x, this.paddle.y, this.paddleWidth, GAME_CONFIG.PADDLE_HEIGHT
      )) {
        this.spawnExplosion(bullet.sprite.x, bullet.sprite.y, MATRIX_COLORS.RED, 4);
        bullet.sprite.destroy();
        this.bossBullets.splice(i, 1);
        this.loseLife();
      }
    }
  }

  private checkPowerUpCollisions(): void {
    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];

      if (this.aabbOverlap(
        pu.sprite.x, pu.sprite.y, GAME_CONFIG.POWERUP_SIZE, GAME_CONFIG.POWERUP_SIZE,
        this.paddle.x, this.paddle.y, this.paddleWidth, GAME_CONFIG.PADDLE_HEIGHT + 10
      )) {
        this.activatePowerUp(pu.type);
        pu.sprite.destroy();
        this.fieldPowerUps.splice(i, 1);
      }
    }
  }

  private checkPortalCollision(): void {
    if (!this.portal) return;

    for (const ball of this.balls) {
      if (this.isBallAttached && ball === this.balls[0]) continue;

      const dx = ball.sprite.x - this.portal.x;
      const dy = ball.sprite.y - this.portal.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        this.completeLevel();
        return;
      }
    }
  }

  // -- Brick hit logic --

  private hitBrick(brickIndex: number): void {
    const brick = this.bricks[brickIndex];

    if (brick.type === 'unbreakable') {
      this.playSound(SOUND_KEYS.HIT);
      brick.sprite.setAlpha(0.7);
      this.time.delayedCall(100, () => {
        if (brick.sprite.active) brick.sprite.setAlpha(1);
      });
      return;
    }

    brick.health--;

    if (brick.health <= 0) {
      this.destroyBrick(brickIndex);
    } else {
      this.playSound(SOUND_KEYS.HIT);
      brick.sprite.setAlpha(0.6);
      this.time.delayedCall(100, () => {
        if (brick.sprite.active) brick.sprite.setAlpha(1);
      });
    }
  }

  private destroyBrick(brickIndex: number): void {
    const brick = this.bricks[brickIndex];
    const x = brick.sprite.x;
    const y = brick.sprite.y;

    this.combo++;
    const scoreBonus = Math.floor(brick.value * (1 + this.combo * GAME_CONFIG.COMBO_MULTIPLIER));
    this.score += scoreBonus;

    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);
    this.playSound(SOUND_KEYS.SCORE);

    this.playSound(SOUND_KEYS.GLASS_BREAK);
    this.cameras.main.shake(50, 0.003);
    this.spawnExplosion(x, y, BRICK_DEFS[brick.type].color);
    brick.sprite.destroy();
    this.bricks.splice(brickIndex, 1);

    this.tryUnlockAchievement(ACHIEVEMENTS.FIRST_BREAK);

    if (Math.random() < GAME_CONFIG.POWERUP_DROP_CHANCE) {
      this.spawnPowerUp(x, y);
    }

    if (brick.type === 'sentinel' && Math.random() < GAME_CONFIG.AGENT_SPAWN_CHANCE) {
      this.spawnAgent(x, y);
    }
  }

  // -- Boss hit --

  private hitBoss(damage: number): void {
    if (!this.boss) return;

    this.boss.health -= damage;
    this.playSound(SOUND_KEYS.HIT);

    this.boss.sprite.setFillStyle(MATRIX_COLORS.WHITE);
    this.time.delayedCall(80, () => {
      if (this.boss?.sprite.active) this.boss.sprite.setFillStyle(0x880000);
    });

    if (this.boss.health <= 0) {
      this.defeatBoss();
    }
  }

  private defeatBoss(): void {
    if (!this.boss) return;

    const x = this.boss.sprite.x;
    const y = this.boss.sprite.y;

    this.spawnExplosion(x, y, MATRIX_COLORS.RED, 30);
    this.spawnExplosion(x - 30, y, MATRIX_COLORS.YELLOW, 15);
    this.spawnExplosion(x + 30, y, MATRIX_COLORS.YELLOW, 15);

    this.score += this.boss.value;
    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);

    this.boss.sprite.destroy();
    this.boss.healthBar.destroy();
    this.boss.healthBg.destroy();
    this.boss = null;

    for (const b of this.bossBullets) b.sprite.destroy();
    this.bossBullets = [];

    this.playSound(SOUND_KEYS.LEVEL_UP);
    this.tryUnlockAchievement(ACHIEVEMENTS.BOSS_DEFEAT);
  }

  // -- Lose life --

  private loseLife(): void {
    this.lives--;
    this.combo = 0;
    this.ballLostThisLevel = true;
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(200, 0.005);

    if (this.lives <= 0) {
      this.handleGameOver();
      return;
    }

    this.isBallAttached = true;
    this.spawnBall(true);
    this.attachHintText.setVisible(true);
  }

  // -- Level complete --

  private checkLevelComplete(): void {
    if (this.isLevelComplete) return;

    const breakableBricks = this.bricks.filter(b => b.type !== 'unbreakable');
    if (breakableBricks.length > 0) return;
    if (this.boss) return;

    if (!this.portal) {
      const cx = GAME_CONFIG.WIDTH / 2;
      const cy = GAME_CONFIG.HEIGHT * 0.35;
      this.portal = this.add.sprite(cx, cy, 'portal');
      this.portal.setDepth(4);
      this.tweens.add({
        targets: this.portal,
        angle: 360,
        duration: 3000,
        repeat: -1,
      });
      this.tweens.add({
        targets: this.portal,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
      this.playSound(SOUND_KEYS.LEVEL_UP);
      return;
    }
  }

  private completeLevel(): void {
    this.isLevelComplete = true;

    if (!this.ballLostThisLevel) {
      this.tryUnlockAchievement(ACHIEVEMENTS.NO_MISS);
    }

    if (this.level >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.LEVEL_5);

    if (this.level >= GAME_CONFIG.TOTAL_LEVELS) {
      this.tryUnlockAchievement(ACHIEVEMENTS.LEVEL_10);
      this.levelCompleteText.setText('SIMULATION ESCAPED!\nYOU ARE FREE');
      this.levelCompleteText.setVisible(true);

      this.time.delayedCall(GAME_CONFIG.LEVEL_TRANSITION_DELAY, () => {
        this.handleGameOver('escaped');
      });
      return;
    }

    this.levelCompleteText.setText(`LEVEL ${this.level} COMPLETE`);
    this.levelCompleteText.setVisible(true);
    this.playSound(SOUND_KEYS.LEVEL_UP);

    this.time.delayedCall(GAME_CONFIG.LEVEL_TRANSITION_DELAY, () => {
      this.levelCompleteText.setVisible(false);
      this.level++;
      this.isLevelComplete = false;

      for (const b of this.balls) b.sprite.destroy();
      this.balls = [];
      if (this.portal) {
        this.portal.destroy();
        this.portal = null;
      }

      this.playSound(SOUND_KEYS.JACK_IN);
      this.loadLevel(this.level);
      this.isBallAttached = true;
      this.spawnBall(true);
      this.attachHintText.setVisible(true);
    });
  }

  // -- Game over --

  private handleGameOver(reason?: string): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.playSound(SOUND_KEYS.GAME_OVER);
    this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25);

    const message = reason === 'escaped'
      ? `Escaped the simulation at level ${this.level}`
      : `Terminated at level ${this.level}`;

    this.gameOver(this.score, message, this.highScore, [
      { label: 'Level', value: `${this.level}/10` },
      { label: 'Agents', value: this.agentsKilled },
      { label: 'Bullet Time', value: this.bulletTimeUses },
    ], this.level, this.getGameDuration());
  }

  // -- Spawning --

  private spawnAgent(x: number, y: number): void {
    const sprite = this.add.sprite(x, y, 'agent_smith');
    sprite.setDepth(4);

    this.agents.push({
      sprite,
      vy: GAME_CONFIG.AGENT_SPEED,
      width: GAME_CONFIG.AGENT_WIDTH,
      height: GAME_CONFIG.AGENT_HEIGHT,
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['multiBall', 'widePaddle', 'laser', 'bulletTime', 'firewall', 'emp'];
    const type = types[Math.floor(Math.random() * types.length)];

    const sprite = this.add.sprite(x, y, `powerup_${type}`);
    sprite.setDisplaySize(GAME_CONFIG.POWERUP_SIZE, GAME_CONFIG.POWERUP_SIZE);
    sprite.setDepth(4);

    this.tweens.add({
      targets: sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.fieldPowerUps.push({ sprite, type, vy: GAME_CONFIG.POWERUP_FALL_SPEED });
  }

  private spawnExplosion(x: number, y: number, color: number, count: number = GAME_CONFIG.PARTICLE_COUNT): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = GAME_CONFIG.PARTICLE_SPEED_MIN + Math.random() * (GAME_CONFIG.PARTICLE_SPEED_MAX - GAME_CONFIG.PARTICLE_SPEED_MIN);
      const size = 2 + Math.random() * 3;

      const rect = this.add.rectangle(x, y, size, size, color);
      rect.setAlpha(1);
      rect.setDepth(7);

      this.particles.push({
        rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
      });
    }
  }

  // -- Power-up activation --

  private activatePowerUp(type: PowerUpType): void {
    this.playSound(SOUND_KEYS.SPECIAL_ABILITY);

    switch (type) {
      case 'multiBall':
        this.activateMultiBall();
        break;
      case 'widePaddle':
        this.activateWidePaddle();
        break;
      case 'laser':
        this.activateLaser();
        break;
      case 'bulletTime':
        this.activateBulletTimePowerUp();
        break;
      case 'firewall':
        this.activateFirewall();
        break;
      case 'emp':
        this.activateEMP();
        break;
    }
  }

  private activateMultiBall(): void {
    for (let i = 0; i < 2; i++) {
      this.spawnBall(false);
    }

    if (this.balls.length >= 3) {
      this.tryUnlockAchievement(ACHIEVEMENTS.MULTI_BALL);
    }
  }

  private activateWidePaddle(): void {
    this.widePaddleActive = true;
    this.paddleWidth = GAME_CONFIG.PADDLE_WIDE_WIDTH;
    this.updatePaddleTexture();

    this.time.delayedCall(POWERUP_DEFS.widePaddle.duration, () => {
      this.widePaddleActive = false;
      this.paddleWidth = GAME_CONFIG.PADDLE_WIDTH;
      this.updatePaddleTexture();
    });
  }

  private activateLaser(): void {
    this.laserActive = true;
    this.laserTimer = 0;
    this.updatePaddleTexture();

    this.time.delayedCall(POWERUP_DEFS.laser.duration, () => {
      this.laserActive = false;
      this.updatePaddleTexture();
    });
  }

  private activateBulletTimePowerUp(): void {
    if (this.bulletTimeActive) return;

    this.bulletTimeActive = true;
    this.bulletTimeUses++;
    this.bulletTimeText.setVisible(true);

    this.time.delayedCall(POWERUP_DEFS.bulletTime.duration, () => {
      this.bulletTimeActive = false;
      this.bulletTimeText.setVisible(false);
    });
  }

  private activateFirewall(): void {
    if (this.firewallActive) return;

    this.firewallActive = true;
    this.firewall = this.add.sprite(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.FIREWALL_Y, 'firewall');
    this.firewall.setDepth(2);
  }

  private activateEMP(): void {
    const centerX = this.paddle.x;
    const centerY = GAME_CONFIG.HEIGHT * 0.4;

    for (let bi = this.bricks.length - 1; bi >= 0; bi--) {
      const brick = this.bricks[bi];
      if (brick.type === 'unbreakable') continue;

      const dx = brick.sprite.x - centerX;
      const dy = brick.sprite.y - centerY;
      if (Math.sqrt(dx * dx + dy * dy) <= GAME_CONFIG.EMP_RADIUS) {
        this.destroyBrick(bi);
      }
    }

    this.cameras.main.flash(200, 0, 255, 255);
  }

  private updatePaddleTexture(): void {
    if (this.laserActive) {
      this.paddle.setTexture('paddle_laser');
      this.paddle.setDisplaySize(GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);
    } else if (this.widePaddleActive) {
      this.paddle.setTexture('paddle_wide');
      this.paddle.setDisplaySize(GAME_CONFIG.PADDLE_WIDE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);
    } else {
      this.paddle.setTexture('paddle');
      this.paddle.setDisplaySize(GAME_CONFIG.PADDLE_WIDTH, GAME_CONFIG.PADDLE_HEIGHT);
    }
  }

  // -- HUD --

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.levelText.setText(`LEVEL: ${this.level}`);
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.comboText.setText(this.combo > 0 ? `COMBO: ${this.combo}x` : '');
    this.highScoreText.setText(`HI: ${this.highScore}`);
  }

  // -- Achievements --

  private tryUnlockAchievement(id: string): void {
    if (this.achievementsUnlocked.has(id)) return;
    this.achievementsUnlocked.add(id);
    this.unlockAchievement(id);
  }

  private checkAchievements(): void {
    if (this.combo >= 15) this.tryUnlockAchievement(ACHIEVEMENTS.COMBO_15);
    if (this.score >= 10000) this.tryUnlockAchievement(ACHIEVEMENTS.HIGH_SCORE);
    if (this.agentsKilled >= 10) this.tryUnlockAchievement(ACHIEVEMENTS.SMITH_SLAYER);
    if (this.bulletTimeUses >= 5) this.tryUnlockAchievement(ACHIEVEMENTS.BULLET_TIME);
    if (this.balls.length >= 3) this.tryUnlockAchievement(ACHIEVEMENTS.MULTI_BALL);
  }

  // -- Test state --

  private getTestState(): Record<string, unknown> {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      level: this.level,
      combo: this.combo,
      agentsKilled: this.agentsKilled,
      bulletTimeUses: this.bulletTimeUses,
      ballLostThisLevel: this.ballLostThisLevel,
      isGameOver: this.isGameOver,
      isLevelComplete: this.isLevelComplete,
      isBallAttached: this.isBallAttached,
      widePaddleActive: this.widePaddleActive,
      laserActive: this.laserActive,
      bulletTimeActive: this.bulletTimeActive,
      firewallActive: this.firewallActive,
      paddleX: this.paddle?.x ?? 0,
      paddleWidth: this.paddleWidth,
      ballCount: this.balls.length,
      brickCount: this.bricks.length,
      agentCount: this.agents.length,
      laserCount: this.lasers.length,
      fieldPowerUpCount: this.fieldPowerUps.length,
      bossHealth: this.boss?.health ?? null,
      hasPortal: this.portal !== null,
      countdownValue: this.countdownValue,
    };
  }

  // -- Cleanup --

  shutdown(): void {
    this.stopBackgroundMusic();
    for (const b of this.balls) b.sprite.destroy();
    this.balls = [];
    for (const b of this.bricks) b.sprite.destroy();
    this.bricks = [];
    for (const a of this.agents) a.sprite.destroy();
    this.agents = [];
    for (const l of this.lasers) l.sprite.destroy();
    this.lasers = [];
    for (const p of this.fieldPowerUps) p.sprite.destroy();
    this.fieldPowerUps = [];
    for (const p of this.particles) p.rect.destroy();
    this.particles = [];
    for (const b of this.bossBullets) b.sprite.destroy();
    this.bossBullets = [];

    if (this.boss) {
      this.boss.sprite.destroy();
      this.boss.healthBar.destroy();
      this.boss.healthBg.destroy();
      this.boss = null;
    }
    if (this.firewall) {
      this.firewall.destroy();
      this.firewall = null;
    }
    if (this.portal) {
      this.portal.destroy();
      this.portal = null;
    }

    this.input.keyboard?.removeAllKeys(true);
    super.shutdown();
  }
}
