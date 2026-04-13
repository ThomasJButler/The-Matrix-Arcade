/**
 * Vortex Pong — Game Scene
 *
 * Faithful Phaser 3 port of the React/Canvas Vortex Pong.
 * Manual ball physics with paddle-angle bouncing, adaptive AI,
 * 4-type power-up system, combo/rally tracking, and 7 achievements.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  POWERUP_DEFS,
  type PowerUpType,
} from '../config';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface PongBall {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
}

interface FieldPowerUp {
  sprite: Phaser.GameObjects.Sprite;
  type: PowerUpType;
}

interface ImpactEffect {
  ring: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  life: number;
}

export class VortexPongGameScene extends BaseScene {
  // Paddles
  private playerPaddle!: Phaser.GameObjects.Image;
  private aiPaddle!: Phaser.GameObjects.Image;

  // Balls
  private balls: PongBall[] = [];

  // Power-ups
  private fieldPowerUps: FieldPowerUp[] = [];
  private activePowerUps: Map<PowerUpType, Phaser.Time.TimerEvent> = new Map();
  private powerUpTimer?: Phaser.Time.TimerEvent;

  // State
  private playerScore = 0;
  private aiScore = 0;
  private combo = 0;
  private rallyCount = 0;
  private maxRally = 0;
  private aiDifficulty = GAME_CONFIG.AI.INITIAL_DIFFICULTY;
  private timeSinceLastGoal = 0;
  private lastPaddleHit: 'player' | 'ai' | null = null;
  private hasFirstPoint = false;
  private powerUpsCollected = 0;
  private scoreMultiplier = 1;
  private currentPaddleHeight = GAME_CONFIG.PADDLE.HEIGHT;
  private isSlowBall = false;
  private playerPaddleVelocity = 0;
  private aiPaddleVelocity = 0;
  private previousPlayerY = 0;

  // Input
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private wKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;
  private rKey?: Phaser.Input.Keyboard.Key;

  // UI
  private playerScoreText!: Phaser.GameObjects.Text;
  private aiScoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private powerUpIndicators: Phaser.GameObjects.Text[] = [];
  private centerLineGraphics!: Phaser.GameObjects.Graphics;

  // Effects
  private impactEffects: ImpactEffect[] = [];
  private rainGroup?: Phaser.GameObjects.Group;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();
    this.rainGroup = this.addMatrixRain(15);

    this.resetState();
    this.drawCenterLine();
    this.createPaddles();
    this.spawnBall();
    this.createUI();
    this.setupInput();
    this.setupCommonInputs();
    this.startPowerUpTimer();
    this.playBackgroundMusic('/assets/audio/music/stage-theme.mp3');
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.rainGroup) this.updateMatrixRain(this.rainGroup, delta);

    const dt = delta / 1000;

    this.timeSinceLastGoal += dt;
    this.trackPlayerVelocity(dt);
    this.handlePlayerInput(dt);
    this.updateAI(dt);
    this.updateBalls(dt);
    this.checkPaddleCollisions();
    this.checkGoals();
    this.checkPowerUpCollisions();
    this.updateImpactEffects(dt);

    this.exposeTestState({
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      combo: this.combo,
      rallyCount: this.rallyCount,
      ballCount: this.balls.length,
      aiDifficulty: this.aiDifficulty,
      powerUpsCollected: this.powerUpsCollected,
      activePowerUps: Array.from(this.activePowerUps.keys()),
    });
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    this.time?.removeAllEvents();
    this.tweens?.killAll();
    this.powerUpTimer?.destroy();
    this.activePowerUps.forEach((timer) => timer.destroy());
    this.activePowerUps.clear();
    this.balls.forEach((b) => b.sprite.destroy());
    this.balls = [];
    this.fieldPowerUps.forEach((p) => p.sprite.destroy());
    this.fieldPowerUps = [];
    this.impactEffects.forEach((e) => { e.ring.destroy(); e.glow.destroy(); });
    this.impactEffects = [];
    this.powerUpIndicators.forEach((t) => t.destroy());
    this.powerUpIndicators = [];
    if (this.input.keyboard) this.input.keyboard.removeAllKeys(true);
    super.shutdown();
  }

  // ── State Reset ──────────────────────────────────────────────

  private resetState(): void {
    this.playerScore = 0;
    this.aiScore = 0;
    this.combo = 0;
    this.rallyCount = 0;
    this.maxRally = 0;
    this.aiDifficulty = GAME_CONFIG.AI.INITIAL_DIFFICULTY;
    this.timeSinceLastGoal = 0;
    this.lastPaddleHit = null;
    this.hasFirstPoint = false;
    this.powerUpsCollected = 0;
    this.scoreMultiplier = 1;
    this.currentPaddleHeight = GAME_CONFIG.PADDLE.HEIGHT;
    this.isSlowBall = false;
    this.playerPaddleVelocity = 0;
    this.aiPaddleVelocity = 0;
    this.previousPlayerY = GAME_CONFIG.HEIGHT / 2;
  }

  // ── Drawing ──────────────────���───────────────────────────────

  private drawCenterLine(): void {
    this.centerLineGraphics = this.add.graphics();
    this.centerLineGraphics.lineStyle(2, MATRIX_COLORS.DARK_GREEN, 0.5);
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 20) {
      this.centerLineGraphics.moveTo(GAME_CONFIG.WIDTH / 2, y);
      this.centerLineGraphics.lineTo(GAME_CONFIG.WIDTH / 2, y + 10);
    }
    this.centerLineGraphics.strokePath();
  }

  // ── Paddles ──────────────────────────��───────────────────────

  private createPaddles(): void {
    this.playerPaddle = this.add.image(
      GAME_CONFIG.PADDLE.OFFSET_X + GAME_CONFIG.PADDLE.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      'paddle_player',
    );
    this.playerPaddle.setDisplaySize(GAME_CONFIG.PADDLE.WIDTH, GAME_CONFIG.PADDLE.HEIGHT);

    this.aiPaddle = this.add.image(
      GAME_CONFIG.WIDTH - GAME_CONFIG.PADDLE.OFFSET_X - GAME_CONFIG.PADDLE.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      'paddle_ai',
    );
    this.aiPaddle.setDisplaySize(GAME_CONFIG.PADDLE.WIDTH, GAME_CONFIG.PADDLE.HEIGHT);

    this.previousPlayerY = GAME_CONFIG.HEIGHT / 2;
  }

  private resizePlayerPaddle(height: number): void {
    this.currentPaddleHeight = height;
    this.playerPaddle.setDisplaySize(GAME_CONFIG.PADDLE.WIDTH, height);
    this.clampPaddle(this.playerPaddle, height);
  }

  private clampPaddle(
    paddle: { y: number },
    height: number,
  ): void {
    paddle.y = clamp(paddle.y, height / 2, GAME_CONFIG.HEIGHT - height / 2);
  }

  // ── Input ─────────────────────────────────���──────────────────

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;

      this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.rKey.on('down', () => this.scene.restart());
    });
  }

  private trackPlayerVelocity(dt: number): void {
    if (dt > 0) {
      this.playerPaddleVelocity = (this.playerPaddle.y - this.previousPlayerY) / dt;
    }
    this.previousPlayerY = this.playerPaddle.y;
  }

  private handlePlayerInput(dt: number): void {
    const moveAmount = GAME_CONFIG.PADDLE.SPEED * dt;
    const kbUp = this.upKey?.isDown || this.wKey?.isDown;
    const kbDown = this.downKey?.isDown || this.sKey?.isDown;

    if (kbUp) {
      this.playerPaddle.y -= moveAmount;
    } else if (kbDown) {
      this.playerPaddle.y += moveAmount;
    }

    // Mouse control — map pointer Y directly to paddle Y
    if (this.input.activePointer.isDown || this.input.activePointer.wasTouch) {
      this.playerPaddle.y = this.input.activePointer.y;
    } else if (
      this.input.activePointer.y !== 0 &&
      !kbUp &&
      !kbDown
    ) {
      // Track mouse even without click (like the original)
      this.playerPaddle.y = this.input.activePointer.y;
    }

    this.clampPaddle(this.playerPaddle, this.currentPaddleHeight);
  }

  // ── AI ───────────────────────────────────────────────────────

  private getClosestBallToAI(): PongBall | undefined {
    if (this.balls.length === 0) return undefined;
    return this.balls.reduce((best, b) =>
      b.sprite.x > best.sprite.x ? b : best,
    );
  }

  private updateAI(dt: number): void {
    const targetBall = this.getClosestBallToAI();
    if (!targetBall) return;

    const maxSpeed = Math.min(this.aiDifficulty, GAME_CONFIG.AI.MAX_SPEED_FACTOR) * 60;
    const ballMovingToward = targetBall.vx > 0;
    const accelRate = ballMovingToward ? GAME_CONFIG.AI.NEAR_ACCELERATION : GAME_CONFIG.AI.FAR_ACCELERATION;
    const distFactor = targetBall.sprite.x < GAME_CONFIG.WIDTH / 2 ? 0.5 : 1.0;

    const errorOffset = (Math.random() - 0.5) * GAME_CONFIG.AI.ERROR_MARGIN;
    const targetY = targetBall.sprite.y + errorOffset;
    const diff = targetY - this.aiPaddle.y;

    // Damping (exponential decay scaled to frame equivalent)
    const frames = dt * 60;
    this.aiPaddleVelocity *= Math.pow(GAME_CONFIG.AI.DAMPING, frames);

    // Accelerate toward target
    this.aiPaddleVelocity += maxSpeed * accelRate * distFactor * Math.sign(diff) * dt;

    // Deliberate mistake (probability scaled to delta)
    const mistakeChance = 1 - Math.pow(1 - GAME_CONFIG.AI.MISTAKE_CHANCE, frames);
    if (Math.random() < mistakeChance) {
      this.aiPaddleVelocity *= -0.5;
    }

    // Clamp velocity and apply
    const maxVel = maxSpeed * 2;
    this.aiPaddleVelocity = clamp(this.aiPaddleVelocity, -maxVel, maxVel);
    this.aiPaddle.y += this.aiPaddleVelocity * dt;
    this.clampPaddle(this.aiPaddle, GAME_CONFIG.PADDLE.HEIGHT);
  }

  // ── Balls ────────────────────────────────────────────────────

  private spawnBall(
    x = GAME_CONFIG.WIDTH / 2,
    y = GAME_CONFIG.HEIGHT / 2,
    vx?: number,
    vy?: number,
  ): void {
    const sprite = this.add.sprite(x, y, 'ball');

    if (vx === undefined || vy === undefined) {
      const angle = (Math.random() - 0.5) * 1.2;
      const dir = Math.random() < 0.5 ? 1 : -1;
      vx = Math.cos(angle) * GAME_CONFIG.BALL.INITIAL_SPEED * dir;
      vy = Math.sin(angle) * GAME_CONFIG.BALL.INITIAL_SPEED;
    }

    this.balls.push({ sprite, vx, vy });
  }

  private getSpeedMultiplier(): number {
    if (this.isSlowBall) return 0.6;
    const ramp = 1 + this.timeSinceLastGoal * GAME_CONFIG.BALL.SPEED_RAMP_PER_SECOND;
    return Math.min(GAME_CONFIG.BALL.MAX_SPEED / GAME_CONFIG.BALL.INITIAL_SPEED, ramp);
  }

  private updateBalls(dt: number): void {
    const multiplier = this.getSpeedMultiplier();

    for (const ball of this.balls) {
      ball.sprite.x += ball.vx * multiplier * dt;
      ball.sprite.y += ball.vy * multiplier * dt;

      // Top/bottom wall bounce
      if (ball.sprite.y - GAME_CONFIG.BALL.RADIUS <= 0) {
        ball.sprite.y = GAME_CONFIG.BALL.RADIUS;
        ball.vy = Math.abs(ball.vy);
        this.playSound('pongBounce');
        this.cameras.main.shake(GAME_CONFIG.SHAKE.WALL.duration, GAME_CONFIG.SHAKE.WALL.intensity);
      } else if (ball.sprite.y + GAME_CONFIG.BALL.RADIUS >= GAME_CONFIG.HEIGHT) {
        ball.sprite.y = GAME_CONFIG.HEIGHT - GAME_CONFIG.BALL.RADIUS;
        ball.vy = -Math.abs(ball.vy);
        this.playSound('pongBounce');
        this.cameras.main.shake(GAME_CONFIG.SHAKE.WALL.duration, GAME_CONFIG.SHAKE.WALL.intensity);
      }
    }
  }

  // ── Collisions ────────────────────────────────��──────────────

  private checkPaddleCollisions(): void {
    for (const ball of this.balls) {
      if (this.ballHitsPaddle(ball, this.playerPaddle, this.currentPaddleHeight)) {
        this.onPlayerPaddleHit(ball);
      } else if (this.ballHitsPaddle(ball, this.aiPaddle, GAME_CONFIG.PADDLE.HEIGHT)) {
        this.onAIPaddleHit(ball);
      }
    }
  }

  private ballHitsPaddle(
    ball: PongBall,
    paddle: { x: number },
    paddleHeight: number,
  ): boolean {
    const bx = ball.sprite.x;
    const by = ball.sprite.y;
    const px = paddle.x - GAME_CONFIG.PADDLE.WIDTH / 2;
    const py = paddle.y - paddleHeight / 2;

    return (
      bx - GAME_CONFIG.BALL.RADIUS <= px + GAME_CONFIG.PADDLE.WIDTH &&
      bx + GAME_CONFIG.BALL.RADIUS >= px &&
      by >= py &&
      by <= py + paddleHeight
    );
  }

  private onPlayerPaddleHit(ball: PongBall): void {
    const paddleCenter = this.playerPaddle.y;
    const relativeIntersect = (paddleCenter - ball.sprite.y) / (this.currentPaddleHeight / 2);
    const normalized = clamp(relativeIntersect, -1, 1);
    const bounceAngle = normalized * GAME_CONFIG.BALL.MAX_BOUNCE_ANGLE;

    ball.vx = Math.cos(bounceAngle) * GAME_CONFIG.BALL.INITIAL_SPEED;
    ball.vy = -Math.sin(bounceAngle) * GAME_CONFIG.BALL.INITIAL_SPEED;
    ball.vy += this.playerPaddleVelocity * GAME_CONFIG.BALL.SPIN_TRANSFER;

    // Push ball out of paddle to prevent repeat collisions
    ball.sprite.x = this.playerPaddle.x + GAME_CONFIG.PADDLE.WIDTH / 2 + GAME_CONFIG.BALL.RADIUS + 1;

    this.combo++;
    this.lastPaddleHit = 'player';
    this.aiDifficulty = Math.min(GAME_CONFIG.AI.MAX_DIFFICULTY, this.aiDifficulty + GAME_CONFIG.AI.DIFFICULTY_INCREMENT);

    // Rally tracking
    this.rallyCount++;
    this.maxRally = Math.max(this.maxRally, this.rallyCount);

    this.playSound('pongBounce');
    this.cameras.main.shake(GAME_CONFIG.SHAKE.PLAYER_HIT.duration, GAME_CONFIG.SHAKE.PLAYER_HIT.intensity);
    this.addImpactEffect(ball.sprite.x, ball.sprite.y, 10);

    // Achievements
    if (this.rallyCount >= 5) this.unlockAchievement(ACHIEVEMENTS.COMBO_KING);
    if (this.rallyCount >= 20) this.unlockAchievement(ACHIEVEMENTS.RALLY_MASTER);
  }

  private onAIPaddleHit(ball: PongBall): void {
    const paddleCenter = this.aiPaddle.y;
    const relativeIntersect = (paddleCenter - ball.sprite.y) / (GAME_CONFIG.PADDLE.HEIGHT / 2);
    const normalized = clamp(relativeIntersect, -1, 1);
    const bounceAngle = normalized * GAME_CONFIG.BALL.MAX_BOUNCE_ANGLE;

    ball.vx = -Math.cos(bounceAngle) * GAME_CONFIG.BALL.INITIAL_SPEED;
    ball.vy = -Math.sin(bounceAngle) * GAME_CONFIG.BALL.INITIAL_SPEED;

    // Push ball out of paddle
    ball.sprite.x = this.aiPaddle.x - GAME_CONFIG.PADDLE.WIDTH / 2 - GAME_CONFIG.BALL.RADIUS - 1;

    this.lastPaddleHit = 'ai';

    this.playSound('pongBounce');
    this.cameras.main.shake(GAME_CONFIG.SHAKE.AI_HIT.duration, GAME_CONFIG.SHAKE.AI_HIT.intensity);
    this.addImpactEffect(ball.sprite.x, ball.sprite.y, 8);
  }

  // ── Scoring ───────────────���──────────────────────────────────

  private checkGoals(): void {
    const toRemove: PongBall[] = [];

    for (const ball of this.balls) {
      if (ball.sprite.x + GAME_CONFIG.BALL.RADIUS < 0) {
        // Ball exits left — AI scores
        this.aiScore += this.scoreMultiplier;
        this.playSound('hit');
        this.addImpactEffect(0, ball.sprite.y, 20);
        toRemove.push(ball);
      } else if (ball.sprite.x - GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.WIDTH) {
        // Ball exits right — Player scores
        const comboBonus = this.scoreMultiplier === 1 ? Math.floor(this.combo / 3) : 0;
        this.playerScore += this.scoreMultiplier + comboBonus;

        if (comboBonus > 0) this.playSound('combo');
        this.playSound('score');
        this.addImpactEffect(GAME_CONFIG.WIDTH, ball.sprite.y, 20);

        if (!this.hasFirstPoint) {
          this.hasFirstPoint = true;
          this.unlockAchievement(ACHIEVEMENTS.FIRST_POINT);
        }

        toRemove.push(ball);
      }
    }

    if (toRemove.length > 0) {
      const ballCountBeforeRemoval = this.balls.length;

      for (const ball of toRemove) {
        ball.sprite.destroy();
        this.balls = this.balls.filter((b) => b !== ball);
      }

      this.combo = 0;
      this.rallyCount = 0;
      this.timeSinceLastGoal = 0;

      this.cameras.main.shake(GAME_CONFIG.SHAKE.GOAL.duration, GAME_CONFIG.SHAKE.GOAL.intensity);
      this.updateScoreDisplay();

      if (this.checkWinCondition(ballCountBeforeRemoval)) return;

      // Respawn ball if all gone
      if (this.balls.length === 0) {
        this.time.delayedCall(500, () => this.spawnBall());
      }
    }
  }

  private checkWinCondition(ballCountBeforeRemoval: number): boolean {
    if (this.playerScore >= GAME_CONFIG.WIN_SCORE) {
      this.unlockAchievement(ACHIEVEMENTS.BEAT_AI);
      if (this.aiScore === 0) {
        this.unlockAchievement(ACHIEVEMENTS.PERFECT_GAME);
      }
      if (ballCountBeforeRemoval >= 3) {
        this.unlockAchievement(ACHIEVEMENTS.MULTI_BALL);
      }
      this.playSound('levelUp');
      this.cameras.main.shake(GAME_CONFIG.SHAKE.GAME_OVER.duration, GAME_CONFIG.SHAKE.GAME_OVER.intensity);
      this.reportScore(this.playerScore);
      this.time.delayedCall(600, () => {
        this.gameOver(this.playerScore, 'YOU WIN!', undefined, [
          { label: 'You', value: this.playerScore },
          { label: 'AI', value: this.aiScore },
          { label: 'Best Rally', value: this.maxRally },
          { label: 'Power-ups', value: this.powerUpsCollected },
        ]);
      });
      return true;
    }

    if (this.aiScore >= GAME_CONFIG.WIN_SCORE) {
      if (ballCountBeforeRemoval >= 3) {
        this.unlockAchievement(ACHIEVEMENTS.MULTI_BALL);
      }
      this.cameras.main.shake(GAME_CONFIG.SHAKE.GAME_OVER.duration, GAME_CONFIG.SHAKE.GAME_OVER.intensity);
      this.reportScore(this.playerScore);
      this.time.delayedCall(600, () => {
        this.gameOver(this.playerScore, 'AI WINS', undefined, [
          { label: 'You', value: this.playerScore },
          { label: 'AI', value: this.aiScore },
          { label: 'Best Rally', value: this.maxRally },
          { label: 'Power-ups', value: this.powerUpsCollected },
        ]);
      });
      return true;
    }

    return false;
  }

  // ── Power-Ups ──────────────────────────���─────────────────────

  private getPowerUpInterval(): number {
    const totalScore = this.playerScore + this.aiScore;
    return Math.max(
      GAME_CONFIG.POWERUP.MIN_INTERVAL,
      GAME_CONFIG.POWERUP.BASE_INTERVAL - totalScore * GAME_CONFIG.POWERUP.INTERVAL_REDUCTION,
    );
  }

  private startPowerUpTimer(): void {
    this.powerUpTimer = this.time.addEvent({
      delay: this.getPowerUpInterval(),
      callback: () => {
        this.spawnPowerUp();
        // Re-schedule with updated interval
        if (this.powerUpTimer) {
          this.powerUpTimer.delay = this.getPowerUpInterval();
        }
      },
      loop: true,
    });
  }

  private spawnPowerUp(): void {
    if (this.fieldPowerUps.length >= GAME_CONFIG.POWERUP.MAX_ON_FIELD) return;

    const types: PowerUpType[] = ['bigger_paddle', 'slower_ball', 'score_multiplier', 'multi_ball'];
    const type = types[Math.floor(Math.random() * types.length)];

    const x = GAME_CONFIG.POWERUP.SPAWN_MARGIN.x + Math.random() * (GAME_CONFIG.WIDTH - GAME_CONFIG.POWERUP.SPAWN_MARGIN.x * 2);
    const y = GAME_CONFIG.POWERUP.SPAWN_MARGIN.y + Math.random() * (GAME_CONFIG.HEIGHT - GAME_CONFIG.POWERUP.SPAWN_MARGIN.y * 2);

    const sprite = this.add.sprite(x, y, `powerup_${type}`);
    sprite.setAlpha(0);

    // Fade in with bob animation
    this.tweens.add({ targets: sprite, alpha: 1, duration: 300 });
    this.tweens.add({
      targets: sprite,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fieldPowerUps.push({ sprite, type });
  }

  private checkPowerUpCollisions(): void {
    const toCollect: FieldPowerUp[] = [];

    for (const pu of this.fieldPowerUps) {
      for (const ball of this.balls) {
        const dx = ball.sprite.x - pu.sprite.x;
        const dy = ball.sprite.y - pu.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < GAME_CONFIG.POWERUP.COLLISION_RADIUS + GAME_CONFIG.BALL.RADIUS) {
          toCollect.push(pu);
          break;
        }
      }
    }

    for (const pu of toCollect) {
      this.collectPowerUp(pu);
    }
  }

  private collectPowerUp(pu: FieldPowerUp): void {
    this.fieldPowerUps = this.fieldPowerUps.filter((p) => p !== pu);
    this.addImpactEffect(pu.sprite.x, pu.sprite.y, 8);
    this.tweens.killTweensOf(pu.sprite);
    pu.sprite.destroy();

    this.playSound('powerup');
    this.powerUpsCollected++;
    this.activatePowerUp(pu.type);

    if (this.powerUpsCollected >= 5) {
      this.unlockAchievement(ACHIEVEMENTS.POWER_MASTER);
    }
  }

  private activatePowerUp(type: PowerUpType): void {
    // Cancel existing timer for this type (refresh duration)
    const existing = this.activePowerUps.get(type);
    if (existing) existing.destroy();

    // Apply effect
    switch (type) {
      case 'bigger_paddle':
        this.resizePlayerPaddle(GAME_CONFIG.PADDLE.HEIGHT * GAME_CONFIG.PADDLE.BIGGER_MULTIPLIER);
        break;
      case 'slower_ball':
        this.isSlowBall = true;
        break;
      case 'score_multiplier':
        this.scoreMultiplier = 2;
        break;
      case 'multi_ball':
        this.spawnMultiBalls();
        this.cameras.main.shake(GAME_CONFIG.SHAKE.MULTI_BALL.duration, GAME_CONFIG.SHAKE.MULTI_BALL.intensity);
        break;
    }

    // Set expiry timer (except multi_ball which is instant)
    if (type !== 'multi_ball') {
      const timer = this.time.delayedCall(GAME_CONFIG.POWERUP.DURATION, () => {
        this.deactivatePowerUp(type);
      });
      this.activePowerUps.set(type, timer);
    }

    this.updatePowerUpIndicators();
  }

  private deactivatePowerUp(type: PowerUpType): void {
    this.activePowerUps.delete(type);

    switch (type) {
      case 'bigger_paddle':
        this.resizePlayerPaddle(GAME_CONFIG.PADDLE.HEIGHT);
        break;
      case 'slower_ball':
        this.isSlowBall = false;
        break;
      case 'score_multiplier':
        this.scoreMultiplier = 1;
        break;
    }

    this.updatePowerUpIndicators();
  }

  private spawnMultiBalls(): void {
    const count = Math.min(2, 3 - this.balls.length);
    for (let i = 0; i < count; i++) {
      const x = GAME_CONFIG.WIDTH / 2 + (Math.random() - 0.5) * 200;
      const y = GAME_CONFIG.HEIGHT / 2 + (Math.random() - 0.5) * 200;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const vx = dir * (GAME_CONFIG.BALL.INITIAL_SPEED + Math.random() * 120);
      const vy = (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED * 1.5;
      this.spawnBall(x, y, vx, vy);
      this.addImpactEffect(x, y, 15);
    }
  }

  // ── Impact Effects ─────────────────────────────────���─────────

  private addImpactEffect(x: number, y: number, intensity: number): void {
    while (this.impactEffects.length >= GAME_CONFIG.MAX_IMPACT_EFFECTS) {
      const oldest = this.impactEffects.shift()!;
      oldest.ring.destroy();
      oldest.glow.destroy();
    }

    const ring = this.add.circle(x, y, intensity, 0x00ff00, 0);
    ring.setStrokeStyle(2, 0x00ff00, 1);

    const glow = this.add.circle(x, y, intensity * 0.5, 0xffffff, 0.4);

    this.impactEffects.push({ ring, glow, life: 1.0 });
  }

  private updateImpactEffects(dt: number): void {
    const toRemove: ImpactEffect[] = [];

    for (const effect of this.impactEffects) {
      effect.life -= dt * 3;
      if (effect.life <= 0) {
        toRemove.push(effect);
        continue;
      }

      const scale = 1 + (1 - effect.life) * 2;
      effect.ring.setScale(scale);
      effect.ring.setAlpha(effect.life);
      effect.glow.setScale(scale * 0.8);
      effect.glow.setAlpha(effect.life * 0.4);
    }

    for (const effect of toRemove) {
      effect.ring.destroy();
      effect.glow.destroy();
      this.impactEffects = this.impactEffects.filter((e) => e !== effect);
    }
  }

  // ── UI ────────────────────────────��──────────────────────────

  private createUI(): void {
    this.playerScoreText = this.createMatrixText(GAME_CONFIG.WIDTH * 0.25, 30, '0', 32);
    this.playerScoreText.setAlpha(0.8);

    this.aiScoreText = this.createMatrixText(GAME_CONFIG.WIDTH * 0.75, 30, '0', 32);
    this.aiScoreText.setAlpha(0.8);

    this.comboText = this.createMatrixText(GAME_CONFIG.WIDTH / 2, 60, '', 14, MATRIX_COLORS.YELLOW_HEX);
    this.comboText.setAlpha(0);
  }

  private updateScoreDisplay(): void {
    this.playerScoreText.setText(this.playerScore.toString());
    this.aiScoreText.setText(this.aiScore.toString());

    if (this.combo > 2) {
      this.comboText.setText(`COMBO x${this.combo}`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
    }
  }

  private updatePowerUpIndicators(): void {
    this.powerUpIndicators.forEach((t) => t.destroy());
    this.powerUpIndicators = [];

    let idx = 0;
    for (const [type] of this.activePowerUps) {
      const def = POWERUP_DEFS[type];
      const text = this.add.text(
        10,
        GAME_CONFIG.HEIGHT - 20 - idx * 18,
        def.label,
        {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: `#${def.color.toString(16).padStart(6, '0')}`,
        },
      );
      this.powerUpIndicators.push(text);
      idx++;
    }
  }
}
