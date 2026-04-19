/**
 * Vortex Pong — Game Scene
 *
 * Faithful Phaser 3 port of the React/Canvas Vortex Pong.
 * Manual ball physics with paddle-angle bouncing, adaptive AI,
 * 4-type power-up system, combo/rally tracking, and 7 achievements.
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, SOUND_KEYS, REGISTRY_KEYS } from '../../../../../lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  POWERUP_DEFS,
  type PowerUpType,
  type DifficultyTier,
  DIFFICULTY_TIERS,
  DEFAULT_DIFFICULTY,
  readStoredDifficulty,
} from '../config';
import { DIFFICULTY_REGISTRY_KEY } from './MenuScene';

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
  private highScore = 0;
  private aiScore = 0;
  private combo = 0;
  private rallyCount = 0;
  private maxRally = 0;
  private aiDifficulty = GAME_CONFIG.AI.INITIAL_DIFFICULTY;
  // R84.P3 — selected tier from MenuScene (registry) or localStorage fallback.
  // Default mirrors 'normal' so headless/auto-start entry keeps prior behaviour.
  private aiDifficultyTier: DifficultyTier = DEFAULT_DIFFICULTY;
  private timeSinceLastGoal = 0;
  private lastPaddleHit: 'player' | 'ai' | null = null;
  private hasFirstPoint = false;
  private powerUpsCollected = 0;
  private multiBallsTriggered = 0;
  private scoreMultiplier = 1;
  private currentPaddleHeight = GAME_CONFIG.PADDLE.HEIGHT;
  private isSlowBall = false;
  private playerPaddleVelocity = 0;
  private aiPaddleVelocity = 0;
  private previousPlayerY = 0;
  private lastPointerMoveTime = 0;
  private lastPointerY = 0;

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
    if (this.textures.exists('board')) {
      const board = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'board');
      board.setAlpha(0.15);
      board.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    }
    this.rainGroup = this.addMatrixRain(15);

    this.resetState();

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.vortexPong?.highScore ?? 0;
    }

    this.drawCenterLine();
    this.createPaddles();
    this.spawnBall();
    this.createUI();
    this.setupInput();
    this.setupCommonInputs();
    this.startPowerUpTimer();
    this.playBackgroundMusic('/assets/audio/music/stage-theme.mp3');
    this.startCountdown(5, () => {});
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.isCountingDown) return;
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
      maxRally: this.maxRally,
      ballCount: this.balls.length,
      aiDifficulty: this.aiDifficulty,
      powerUpsCollected: this.powerUpsCollected,
      multiBallsTriggered: this.multiBallsTriggered,
      projectedHighScore: this.computeHighScore(),
      activePowerUps: Array.from(this.activePowerUps.keys()),
      countdownValue: this.countdownValue,
    });
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    this.rainGroup?.destroy(true);
    this.rainGroup = undefined;
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
    this.aiDifficultyTier = this.loadDifficultyTier();
    this.timeSinceLastGoal = 0;
    this.lastPaddleHit = null;
    this.hasFirstPoint = false;
    this.powerUpsCollected = 0;
    this.multiBallsTriggered = 0;
    this.scoreMultiplier = 1;
    this.currentPaddleHeight = GAME_CONFIG.PADDLE.HEIGHT;
    this.isSlowBall = false;
    this.playerPaddleVelocity = 0;
    this.aiPaddleVelocity = 0;
    this.previousPlayerY = GAME_CONFIG.HEIGHT / 2;
    this.lastPointerMoveTime = 0;
    this.lastPointerY = 0;
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
      this.rKey.on('down', () => {
        // R84.P2: report the weighted High Score on mid-match restart too, so
        // a partial run that accrued big rally + power-up bonuses still lands
        // on the leaderboard if it beats the session best.
        const finalHighScore = this.computeHighScore();
        if (finalHighScore > this.highScore) this.highScore = finalHighScore;
        this.reportScore(finalHighScore, this.highScore);
        this.stopAllAudio();
        this.scene.restart();
      });
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

    // Track pointer movement so a stationary cursor stops fighting the keyboard.
    // R83.V1: previously the paddle snapped to pointer-Y on every frame the
    // keyboard was *not* pressed, so releasing W/S "sprung" the paddle back to
    // the cursor (often near the centre). Now we only follow the mouse if it
    // actually moved within the last 600ms.
    const pointer = this.input.activePointer;
    const pointerMoved = pointer && pointer.y !== this.lastPointerY;
    if (pointerMoved) {
      this.lastPointerMoveTime = pointer.event ? pointer.event.timeStamp : Date.now();
      this.lastPointerY = pointer.y;
    }
    const now = Date.now();
    const pointerActive = pointer.isDown || pointer.wasTouch ||
      (now - this.lastPointerMoveTime < 600 && this.lastPointerMoveTime > 0);

    if (kbUp) {
      this.playerPaddle.y -= moveAmount;
    } else if (kbDown) {
      this.playerPaddle.y += moveAmount;
    } else if (pointerActive) {
      this.playerPaddle.y = pointer.y;
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

  /**
   * R84.P3 — tier loader. Prefers the MenuScene-seeded registry value so a
   * cycle in Menu is honoured without a page reload; falls back to
   * localStorage for auto-start / headless entry; finally defaults to
   * `normal` which preserves the exact R83.V1a numbers.
   */
  private loadDifficultyTier(): DifficultyTier {
    const fromRegistry = this.registry.get(DIFFICULTY_REGISTRY_KEY);
    if (fromRegistry === 'easy' || fromRegistry === 'normal' || fromRegistry === 'hard') {
      return fromRegistry;
    }
    return readStoredDifficulty();
  }

  private updateAI(dt: number): void {
    const targetBall = this.getClosestBallToAI();
    if (!targetBall) return;

    // R84.P3: tier params scale the R83.V1a baseline. Normal keeps the
    // exact numbers shipped in R83.V1a (trackingMultiplier=1, maxSpeedFactor
    // =0.95, errorMultiplier=1, outgoingTrackingFactor=0.45).
    const tier = DIFFICULTY_TIERS[this.aiDifficultyTier];

    // R83.V1a: AI was a pushover (Tom: "AI is not very responsive"). Bumped
    // baseTracking 2.5 → 4.0, raised maxSpeed factor 0.85 → 0.95, and
    // shrank rally-driven jitter so the paddle holds its line under pressure.
    const difficultyBonus = Math.min(this.playerScore * 0.08, 0.6);
    const baseTracking = 4.0 * tier.trackingMultiplier;
    const trackingSpeed = baseTracking + difficultyBonus;

    // When the ball is heading away, drift lazily toward center — tier
    // controls how lazy (Hard = 0.6, Normal = 0.45, Easy = 0.25).
    const ballMovingToward = targetBall.vx > 0;
    const effectiveTracking = ballMovingToward
      ? trackingSpeed
      : trackingSpeed * tier.outgoingTrackingFactor;

    // Predictive lookahead — extrapolate the ball's intercept Y at the AI
    // paddle's X column, accounting for any number of top/bottom wall
    // reflections via sawtooth folding. Only applied when the ball is
    // heading toward the AI; outgoing balls keep the gentle centre-drift
    // behaviour to preserve "beatable" feel.
    let predictedY = targetBall.sprite.y;
    if (ballMovingToward && targetBall.vx > 0) {
      const distance = this.aiPaddle.x - targetBall.sprite.x;
      const timeToIntercept = distance / targetBall.vx;
      const projected = targetBall.sprite.y + targetBall.vy * timeToIntercept;
      const period = 2 * GAME_CONFIG.HEIGHT;
      const folded = ((projected % period) + period) % period;
      predictedY = folded > GAME_CONFIG.HEIGHT ? period - folded : folded;
    }

    // Stable, low-amplitude error offset (rally + score seeded — same every
    // frame within a rally so the AI doesn't twitch). Tier scales amplitude
    // so Hard is near-perfect (×0.3) and Easy is visibly fallible (×2.5).
    const errorOffset = Math.sin(this.rallyCount * 1.7 + this.aiScore * 2.3) *
      GAME_CONFIG.AI.ERROR_MARGIN * 0.18 * tier.errorMultiplier;
    const targetY = ballMovingToward
      ? predictedY + errorOffset
      : GAME_CONFIG.HEIGHT / 2;

    const diff = targetY - this.aiPaddle.y;

    const maxSpeed = GAME_CONFIG.PADDLE.SPEED * tier.maxSpeedFactor;
    let moveAmount = diff * effectiveTracking * dt;

    // Minimum speed floor so the paddle always visibly tracks even at small
    // diffs (otherwise the proportional term gets micro-stalls near target).
    const minSpeed = 60;
    if (Math.abs(diff) > 2) {
      const minMove = minSpeed * dt * Math.sign(diff);
      if (Math.abs(moveAmount) < Math.abs(minMove)) {
        moveAmount = minMove;
      }
    }

    moveAmount = clamp(moveAmount, -maxSpeed * dt, maxSpeed * dt);

    this.aiPaddle.y += moveAmount;
    this.clampPaddle(this.aiPaddle, GAME_CONFIG.PADDLE.HEIGHT);
  }

  // ── Balls ────────────────────────────────────────────────────

  private spawnBall(
    x = GAME_CONFIG.WIDTH / 2,
    y = GAME_CONFIG.HEIGHT / 2,
    vx?: number,
    vy?: number,
  ): void {
    const isExtra = this.balls.length > 0;
    const textureKey = isExtra && this.textures?.exists('ball_multi') ? 'ball_multi' : 'ball';
    const sprite = this.add.sprite(x, y, textureKey);

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
        this.playSound(SOUND_KEYS.HIT);
        this.cameras.main.shake(GAME_CONFIG.SHAKE.WALL.duration, GAME_CONFIG.SHAKE.WALL.intensity);
        this.addImpactEffect(ball.sprite.x, 0, 6);
      } else if (ball.sprite.y + GAME_CONFIG.BALL.RADIUS >= GAME_CONFIG.HEIGHT) {
        ball.sprite.y = GAME_CONFIG.HEIGHT - GAME_CONFIG.BALL.RADIUS;
        ball.vy = -Math.abs(ball.vy);
        this.playSound(SOUND_KEYS.HIT);
        this.cameras.main.shake(GAME_CONFIG.SHAKE.WALL.duration, GAME_CONFIG.SHAKE.WALL.intensity);
        this.addImpactEffect(ball.sprite.x, GAME_CONFIG.HEIGHT, 6);
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

    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(GAME_CONFIG.SHAKE.PLAYER_HIT.duration, GAME_CONFIG.SHAKE.PLAYER_HIT.intensity);
    this.addImpactEffect(ball.sprite.x, ball.sprite.y, 10);
    this.createPaddleHitTrail(ball.sprite.x, ball.sprite.y, MATRIX_COLORS.PRIMARY);

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

    this.playSound(SOUND_KEYS.HIT);
    this.cameras.main.shake(GAME_CONFIG.SHAKE.AI_HIT.duration, GAME_CONFIG.SHAKE.AI_HIT.intensity);
    this.addImpactEffect(ball.sprite.x, ball.sprite.y, 8);
    this.createPaddleHitTrail(ball.sprite.x, ball.sprite.y, MATRIX_COLORS.RED);
  }

  // ── Scoring ───────────────���──────────────────────────────────

  private checkGoals(): void {
    const toRemove: PongBall[] = [];

    for (const ball of this.balls) {
      if (ball.sprite.x + GAME_CONFIG.BALL.RADIUS < 0) {
        // Ball exits left — AI scores
        // R84.P2: match score is tight classic-Pong (+1 per goal, first to 10).
        // The scoreMultiplier / combo bonuses now feed the weighted High Score
        // at game-over (see computeHighScore) rather than doubling goals.
        this.aiScore += 1;
        this.playSound('hit');
        this.addImpactEffect(0, ball.sprite.y, 20);
        this.goalFlash(128, 0, 0, 100);
        this.popScoreText(this.aiScoreText);
        toRemove.push(ball);
      } else if (ball.sprite.x - GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.WIDTH) {
        // Ball exits right — Player scores (+1, classic Pong).
        this.playerScore += 1;

        // Combo still fires its audio stinger to keep paddle-hit streaks
        // satisfying; the numeric reward lives in the High Score formula
        // via longest_rally × 10.
        if (this.combo >= 3 && this.scoreMultiplier === 1) this.playSound('combo');
        this.playSound('score');
        this.addImpactEffect(GAME_CONFIG.WIDTH, ball.sprite.y, 20);
        this.goalFlash(0, 128, 0, 100);
        this.popScoreText(this.playerScoreText);

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

      if (!this.prefersReducedMotion()) {
        this.cameras.main.shake(GAME_CONFIG.SHAKE.GOAL.duration, GAME_CONFIG.SHAKE.GOAL.intensity);
      }
      this.updateScoreDisplay();

      if (this.checkWinCondition(ballCountBeforeRemoval)) return;

      // Respawn ball if all gone
      if (this.balls.length === 0) {
        this.time.delayedCall(500, () => this.spawnBall());
      }
    }
  }

  /**
   * R84.P2 — Weighted High Score formula (leaderboard).
   *
   * Match score stays tight classic-Pong 1-per-goal (first to 10 wins).
   * Leaderboard ranking uses this composite so three 10-0 shutouts can
   * still be differentiated by how they were played.
   *
   *   high_score = max(0, playerScore - aiScore)  × 100
   *              + powerUpsCollected               ×  50
   *              + multiBallsTriggered             × 200
   *              + maxRally                        ×  10
   *              + (playerScore ≥ WIN_SCORE ? 500 : 0)   // win bonus
   *
   * Tuning notes for Tom:
   * - match_score_diff is clamped to ≥ 0 so losses do not produce
   *   negative high scores; they still accrue power-up / rally bonuses.
   * - Win bonus (500) rewards finishing a match; dominant shutouts pair
   *   it with a 1000-point match diff for a 1500 floor before juice.
   * - Example: 10-4 win, 5 power-ups, 1 multi-ball, longest rally 12
   *   → 600 + 250 + 200 + 120 + 500 = 1670.
   * - Example: 10-0 flawless, 8 power-ups, 2 multi-balls, rally 20
   *   → 1000 + 400 + 400 + 200 + 500 = 2500.
   * - Loss example: 4-10, 3 power-ups, 0 multi-balls, rally 6
   *   →   0 + 150 +   0 +  60 +   0 = 210.
   */
  protected computeHighScore(): number {
    const matchDiff = Math.max(0, this.playerScore - this.aiScore);
    const winBonus = this.playerScore >= GAME_CONFIG.WIN_SCORE ? 500 : 0;
    return (
      matchDiff * 100 +
      this.powerUpsCollected * 50 +
      this.multiBallsTriggered * 200 +
      this.maxRally * 10 +
      winBonus
    );
  }

  private buildGameOverStats(): { label: string; value: number }[] {
    return [
      { label: 'You', value: this.playerScore },
      { label: 'AI', value: this.aiScore },
      { label: 'Best Rally', value: this.maxRally },
      { label: 'Power-ups', value: this.powerUpsCollected },
      { label: 'Multi-balls', value: this.multiBallsTriggered },
    ];
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
      this.playSound(SOUND_KEYS.ACHIEVEMENT_UNLOCK);
      if (!this.prefersReducedMotion()) {
        this.cameras.main.shake(GAME_CONFIG.SHAKE.GAME_OVER.duration, GAME_CONFIG.SHAKE.GAME_OVER.intensity);
      }
      this.goalFlash(0, 160, 0, 200);
      const finalHighScore = this.computeHighScore();
      if (finalHighScore > this.highScore) this.highScore = finalHighScore;
      this.reportScore(finalHighScore, this.highScore);
      this.time.delayedCall(600, () => {
        this.gameOver(finalHighScore, 'YOU WIN!', this.highScore, this.buildGameOverStats(),
          finalHighScore, this.getGameDuration());
      });
      return true;
    }

    if (this.aiScore >= GAME_CONFIG.WIN_SCORE) {
      if (ballCountBeforeRemoval >= 3) {
        this.unlockAchievement(ACHIEVEMENTS.MULTI_BALL);
      }
      this.playSound(SOUND_KEYS.GAME_OVER);
      if (!this.prefersReducedMotion()) {
        this.cameras.main.shake(GAME_CONFIG.SHAKE.GAME_OVER.duration, GAME_CONFIG.SHAKE.GAME_OVER.intensity);
      }
      this.goalFlash(160, 0, 0, 150);
      const finalHighScore = this.computeHighScore();
      if (finalHighScore > this.highScore) this.highScore = finalHighScore;
      this.reportScore(finalHighScore, this.highScore);
      this.time.delayedCall(600, () => {
        this.gameOver(finalHighScore, 'AI WINS', this.highScore, this.buildGameOverStats(),
          finalHighScore, this.getGameDuration());
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

    this.playSound(SOUND_KEYS.SPECIAL_ABILITY);
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
        this.multiBallsTriggered++;
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
    this.playSound(SOUND_KEYS.POWER_DOWN);

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

    const ring = this.add.circle(x, y, intensity, MATRIX_COLORS.PRIMARY, 0);
    ring.setStrokeStyle(2, MATRIX_COLORS.PRIMARY, 1);

    const glow = this.add.circle(x, y, intensity * 0.5, MATRIX_COLORS.WHITE, 0.4);

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

  private popScoreText(text: Phaser.GameObjects.Text): void {
    this.tweens.add({
      targets: text,
      scale: { from: 1.4, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
    });
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
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '10px',
          color: `#${def.color.toString(16).padStart(6, '0')}`,
        },
      );
      this.powerUpIndicators.push(text);
      idx++;
    }
  }

  // ── R83.V1 helpers ───────────────────────────────────────────

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  /**
   * R83.V1c: Tom flagged the original full-brightness goal flash as an
   * epilepsy concern. We halve the rgb values from 255 to 128, and skip
   * the flash entirely under prefers-reduced-motion.
   */
  private goalFlash(r: number, g: number, b: number, duration: number): void {
    if (this.prefersReducedMotion()) return;
    this.cameras.main.flash(duration, r, g, b, false);
  }

  /**
   * R83.V1e: Paddle-hit particle trail. 10 small dots radiate outward from
   * the impact point and fade over 300ms. Skipped under reduced-motion.
   */
  private createPaddleHitTrail(x: number, y: number, colour: number): void {
    if (this.prefersReducedMotion()) return;
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 30 + Math.random() * 20;
      const particle = this.add.circle(x, y, 2, colour, 0.85);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: { from: 1, to: 0.2 },
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * R83.V1d: previously R-restart left the BGM (and any in-flight Phaser
   * sounds) running, which then doubled up when create() respawned the
   * music track. Stop both audio paths before scene.restart().
   */
  private stopAllAudio(): void {
    this.stopBackgroundMusic();
    if (this.sound && typeof this.sound.stopAll === 'function') {
      this.sound.stopAll();
    }
  }
}
