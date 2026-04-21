import Phaser from 'phaser';
import { BaseScene } from '@/lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, SOUND_KEYS, REGISTRY_KEYS } from '@/lib/phaser/types';
import {
  GAME_CONFIG,
  ACHIEVEMENTS,
  ENEMY_DEFS,
  POWERUP_DEFS,
  POWERUP_LEGEND,
  ROW_TINTS,
  type EnemyState,
  type BossState,
  type BulletState,
  type ParticleState,
  type FieldPowerUp,
  type EnemyType,
  type PowerUpType,
} from '../config';

export class MatrixInvadersGameScene extends BaseScene {
  private player!: Phaser.GameObjects.Sprite;
  // R85.I4: the shield is drawn as a separate Graphics GameObject that orbits
  // the player. Before R85.I4, the shield power-up mutated the player sprite
  // (setTexture/setTint re-asserted every frame in updateHUD) — Tom's playtest
  // reported "when getting many power-ups, the shooter becomes invisible", and
  // any future alpha- or texture-mutating effect layered on top of that was
  // guaranteed to collide. Giving the shield its own layer makes power-up
  // stacking provably incapable of hiding the player.
  private shieldAura!: Phaser.GameObjects.Graphics;
  private playerHealth = GAME_CONFIG.PLAYER_MAX_HEALTH;
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
  // R85.I3: accumulator that drives enemy-bullet trail spawning. Reset to 0
  // each time we spawn a batch of trails so cadence is stable regardless of
  // framerate. Trails are pushed into `particles` — reusing the existing
  // decay loop means no new lifecycle machinery.
  private enemyBulletTrailAccum = 0;
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
  private dangerWarningTriggered = false;

  private bulletTimeActive = false;
  // R85.I2: charge ∈ [0,1]. 1 = ready, drains to 0 during active, refills
  // back to 1 over BULLET_TIME_COOLDOWN. `wasReady` is an edge latch so the
  // "READY" pulse only fires once per transition, not every frame at charge=1.
  private bulletTimeCharge = 1;
  private bulletTimeWasReady = true;
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
  // R85.I2: persistent bullet-time HUD — label + meter shown for the entire
  // run so players learn the B-key verb through repeated glance. Pulse fires
  // once per cooldown-complete edge.
  private bulletTimeLabel!: Phaser.GameObjects.Text;
  private bulletTimeChargeBg!: Phaser.GameObjects.Graphics;
  private bulletTimeChargeFill!: Phaser.GameObjects.Graphics;
  private bulletTimeReadyPulse!: Phaser.GameObjects.Text;
  private waveCompleteText!: Phaser.GameObjects.Text;
  private bossWarningText!: Phaser.GameObjects.Text;
  private healthLabel!: Phaser.GameObjects.Text;
  // R85.I6: on-pickup power-up legend — 4 stacked Text nodes driven by
  // POWERUP_LEGEND.ENTRIES. Owning them as an array (not individually) makes
  // the back-to-back-pickup guard trivial: we compare the in-flight cohort
  // against `this.powerUpLegend` by reference in the fade-out onComplete so
  // a newer legend that took over while this one was mid-fade doesn't get
  // its fresh text destroyed by a stale tween callback.
  private powerUpLegend: Phaser.GameObjects.Text[] = [];
  private powerUpLegendHideTimer?: Phaser.Time.TimerEvent;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wasdA!: Phaser.Input.Keyboard.Key;
  private wasdD!: Phaser.Input.Keyboard.Key;
  private bulletTimeKey!: Phaser.Input.Keyboard.Key;

  private matrixRainGroup!: Phaser.GameObjects.Group;

  private _spriteMode = false;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this._spriteMode = this.game.registry.get('spriteMode') === true;
    this.createMatrixBackground();
    this.matrixRainGroup = this.addMatrixRain(10);
    this.resetState();
    this.createPlayer();
    this.createHUD();
    this.setupInput();
    this.setupCommonInputs();
    this.spawnWave();
    this.playSound(SOUND_KEYS.MENU);
    this.playBackgroundMusic('/assets/audio/music/ostcrunch2-epic.mp3');
    this.startCountdown(5, () => {});
  }

  private resetState(): void {
    this.score = 0;
    this.wave = 1;
    this.combo = 0;
    this.playerHealth = GAME_CONFIG.PLAYER_MAX_HEALTH;
    this.isInvulnerable = false;
    this.shieldActive = false;
    this.bulletTimeActive = false;
    this.bulletTimeCharge = 1;
    this.bulletTimeWasReady = true;
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
    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.matrixInvaders?.highScore ?? 0;
    }
    this.achievementsUnlocked = new Set();
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.fieldPowerUps = [];
    // R85.I6: Phaser reuses the scene instance on restart, so class fields
    // (including powerUpLegend + its hide timer) persist across resets. Clear
    // defensively so a legend lingering from the prior run doesn't survive
    // into the new game.
    this.clearPowerUpLegend();
  }

  private createPlayer(): void {
    const key = this._spriteMode ? 'sprite_player' : 'player';
    this.player = this.add.sprite(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER_Y_OFFSET, key);
    this.player.setDepth(3);
    if (this._spriteMode) {
      this.player.setDisplaySize(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT);
    }

    // R85.I4: shield drawn as a ring + faint fill behind the player. Stays
    // hidden until the shield power-up is active. Kept at a lower depth than
    // the player so the ring pokes out as a halo while the inner fill is
    // occluded by the ship itself — reads as a protective field without
    // obscuring the player silhouette.
    this.shieldAura = this.add.graphics();
    this.shieldAura.setDepth(2);
    this.drawShieldAura();
    this.shieldAura.setVisible(false);
    this.shieldAura.setPosition(this.player.x, this.player.y);
  }

  private drawShieldAura(): void {
    const r = Math.max(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT) * 0.7;
    this.shieldAura.clear();
    this.shieldAura.fillStyle(MATRIX_COLORS.MAGENTA, 0.12);
    this.shieldAura.fillCircle(0, 0, r);
    this.shieldAura.lineStyle(2, MATRIX_COLORS.MAGENTA, 0.9);
    this.shieldAura.strokeCircle(0, 0, r);
  }

  // R85.I4: hard invariant — after this runs the player is fully visible with
  // no tint and no texture drift. Called at the end of any state window where
  // player visuals might have been mutated (hit-blink cleanup, shield-hit
  // cleanup, power-up activation). Cheap and idempotent, so stacking calls is
  // safe.
  private restorePlayerVisuals(): void {
    if (!this.player?.active) return;
    this.player.setVisible(true);
    this.player.setAlpha(1);
    this.player.clearTint();
  }

  private createHUD(): void {
    this.scoreText = this.createMatrixText(10, 12, 'SCORE: 0', 10);
    this.scoreText.setOrigin(0, 0);

    this.waveText = this.createMatrixText(10, 30, 'WAVE: 1', 10);
    this.waveText.setOrigin(0, 0);

    this.comboText = this.createMatrixText(10, 48, '', 10, MATRIX_COLORS.CYAN_HEX);
    this.comboText.setOrigin(0, 0);

    this.highScoreText = this.createMatrixText(GAME_CONFIG.WIDTH - 10, 12, 'HI: 0', 10);
    this.highScoreText.setOrigin(1, 0);

    this.healthLabel = this.createMatrixText(GAME_CONFIG.WIDTH - 210, 30, 'HEALTH', 8);
    this.healthLabel.setOrigin(0, 0);

    this.healthBarBg = this.add.graphics();
    this.healthBarFill = this.add.graphics();

    this.bulletTimeText = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.45, 'BULLET TIME ACTIVE', 12, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bulletTimeText.setVisible(false);
    this.bulletTimeText.setDepth(100);

    // R85.I2: persistent key-reminder label + meter bar in the left HUD column
    // below the combo readout. Magenta to match the active-banner + pulse.
    this.bulletTimeLabel = this.createMatrixText(10, 68, '[B] BULLET TIME', 8, MATRIX_COLORS.MAGENTA_HEX);
    this.bulletTimeLabel.setOrigin(0, 0);
    this.bulletTimeChargeBg = this.add.graphics();
    this.bulletTimeChargeFill = this.add.graphics();

    this.bulletTimeReadyPulse = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.3, 'BULLET TIME READY', 10, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bulletTimeReadyPulse.setVisible(false);
    this.bulletTimeReadyPulse.setDepth(100);

    this.waveCompleteText = this.createMatrixText(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.4, '', 12);
    this.waveCompleteText.setVisible(false);
    this.waveCompleteText.setDepth(100);

    this.bossWarningText = this.createMatrixText(
      GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT * 0.3, 'BOSS INCOMING', 16, MATRIX_COLORS.MAGENTA_HEX
    );
    this.bossWarningText.setVisible(false);
    this.bossWarningText.setDepth(100);
  }

  private setupInput(): void {
    this.waitForKeyboard(() => {
      if (!this.input.keyboard) return;
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.wasdA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.wasdD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.bulletTimeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return;
    if (this.isCountingDown) return;

    this.updateMatrixRain(this.matrixRainGroup, delta);

    const dt = delta / 1000;
    const timeScale = this.bulletTimeActive ? GAME_CONFIG.BULLET_TIME_SCALE : 1.0;
    const scaledDt = dt * timeScale;

    this.handleMovement(scaledDt);
    this.handleShooting(time);
    this.handleBulletTime();
    this.updateBulletTimeCharge(delta);
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
    const speed = GAME_CONFIG.PLAYER_SPEED * dt;
    let dx = 0;

    if (this.cursors?.left.isDown || this.wasdA?.isDown) dx -= speed;
    if (this.cursors?.right.isDown || this.wasdD?.isDown) dx += speed;

    this.player.x = Phaser.Math.Clamp(
      this.player.x + dx,
      GAME_CONFIG.PLAYER_WIDTH / 2,
      GAME_CONFIG.WIDTH - GAME_CONFIG.PLAYER_WIDTH / 2
    );
  }

  // -- Shooting --

  private handleShooting(time: number): void {
    if (!this.spaceKey?.isDown) return;

    const cooldown = this.rapidFireActive ? GAME_CONFIG.RAPID_FIRE_COOLDOWN : GAME_CONFIG.FIRE_COOLDOWN;
    if (time - this.lastFireTime < cooldown) return;
    this.lastFireTime = time;

    this.playSound(SOUND_KEYS.SHOOT);

    const hasLaserGreen = this.textures?.exists('laser_green') ?? false;
    const texKey = hasLaserGreen
      ? 'laser_green'
      : this._spriteMode ? 'sprite_bullet_player' : 'bullet_player';
    const img = this.add.image(
      this.player.x,
      this.player.y - GAME_CONFIG.PLAYER_HEIGHT / 2,
      texKey
    );
    img.setDisplaySize(
      this._spriteMode || hasLaserGreen ? 8 : GAME_CONFIG.PLAYER_BULLET_WIDTH,
      this._spriteMode || hasLaserGreen ? 20 : GAME_CONFIG.PLAYER_BULLET_HEIGHT
    );
    img.setDepth(5);

    const bullet: BulletState = {
      sprite: img,
      vy: -GAME_CONFIG.PLAYER_BULLET_SPEED,
      damage: 1,
      isPlayer: true,
    };
    this.playerBullets.push(bullet);
  }

  private handleBulletTime(): void {
    if (!this.bulletTimeKey || !Phaser.Input.Keyboard.JustDown(this.bulletTimeKey)) return;
    if (this.bulletTimeActive) return;
    // R85.I2: gate activation on full charge so the meter is load-bearing,
    // not decorative. Pressing B on empty/partial meter no-ops silently.
    if (this.bulletTimeCharge < 1) return;

    this.bulletTimeActive = true;
    this.bulletTimeCharge = 1;
    this.bulletTimeWasReady = false;
    this.bulletTimeUses++;
    this.bulletTimeText.setVisible(true);
    this.playSound(SOUND_KEYS.POWERUP);

    this.time.delayedCall(GAME_CONFIG.BULLET_TIME_DURATION, () => {
      this.bulletTimeActive = false;
      this.bulletTimeText.setVisible(false);
    });
  }

  // R85.I2: drain/refill drives the HUD meter + arms the READY pulse.
  // Called unconditionally from update() — pause/gameover return before it,
  // so charge correctly freezes with the rest of the world.
  private updateBulletTimeCharge(delta: number): void {
    if (this.bulletTimeActive) {
      this.bulletTimeCharge = Math.max(0, this.bulletTimeCharge - delta / GAME_CONFIG.BULLET_TIME_DURATION);
      return;
    }
    if (this.bulletTimeCharge >= 1) return;
    this.bulletTimeCharge = Math.min(1, this.bulletTimeCharge + delta / GAME_CONFIG.BULLET_TIME_COOLDOWN);
    if (this.bulletTimeCharge >= 1 && !this.bulletTimeWasReady) {
      this.bulletTimeWasReady = true;
      this.pulseBulletTimeReady();
    }
  }

  private pulseBulletTimeReady(): void {
    this.bulletTimeReadyPulse.setVisible(true).setAlpha(1);
    this.playSound(SOUND_KEYS.POWERUP);
    this.tweens.add({
      targets: this.bulletTimeReadyPulse,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => this.bulletTimeReadyPulse.setVisible(false),
    });
  }

  private handleEnemyShooting(dt: number): void {
    const fireChance = GAME_CONFIG.ENEMY_FIRE_CHANCE * 60;

    for (const enemy of this.enemies) {
      if (Math.random() < fireChance * dt) {
        // R85.I3: single source of truth for bullet size. Texture-key
        // selection still prefers the artwork PNGs, but dimensions come
        // from config so all three render paths agree.
        const hasLaserRed = this.textures?.exists('laser_red') ?? false;
        const texKey = hasLaserRed
          ? 'laser_red'
          : this._spriteMode ? 'sprite_bullet_enemy' : 'bullet_enemy';
        const img = this.add.image(
          enemy.sprite.x,
          enemy.sprite.y + enemy.height / 2,
          texKey
        );
        img.setDisplaySize(GAME_CONFIG.ENEMY_BULLET_WIDTH, GAME_CONFIG.ENEMY_BULLET_HEIGHT);
        img.setDepth(5);

        const bullet: BulletState = {
          sprite: img,
          vy: GAME_CONFIG.ENEMY_BULLET_SPEED,
          damage: GAME_CONFIG.PLAYER_HIT_DAMAGE,
          isPlayer: false,
        };
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
    // R85.I3: spawn trail ghosts at a throttled cadence so peripheral motion
    // reads without flooding the particle pool. Gate on actual bullets being
    // alive — otherwise an idle scene would still allocate rects every tick.
    this.enemyBulletTrailAccum += dt;
    const shouldSpawnTrail =
      this.enemyBullets.length > 0 &&
      this.enemyBulletTrailAccum >= GAME_CONFIG.ENEMY_BULLET_TRAIL_INTERVAL;
    if (shouldSpawnTrail) this.enemyBulletTrailAccum = 0;

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.sprite.y += b.vy * dt;
      if (shouldSpawnTrail && b.sprite.y > 0 && b.sprite.y < GAME_CONFIG.HEIGHT) {
        this.spawnEnemyBulletTrail(b.sprite.x, b.sprite.y - GAME_CONFIG.ENEMY_BULLET_HEIGHT / 2);
      }
      if (b.sprite.y > GAME_CONFIG.HEIGHT + 10) {
        b.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  // R85.I3: trail ghost — small red rect that fades via the existing
  // particle decay loop. Depth 4 keeps it below the bullet (depth 5) so
  // the bright core stays readable on top of the glow tail.
  private spawnEnemyBulletTrail(x: number, y: number): void {
    const rect = this.add.rectangle(x, y, 3, 3, MATRIX_COLORS.RED, 0.7);
    rect.setDepth(4);
    this.particles.push({ rect, vx: 0, vy: 0, life: 0.5 });
  }

  private updateEnemies(dt: number): void {
    if (this.enemies.length === 0) return;

    const waveSpeedFactor = 1 + (this.wave - 1) * GAME_CONFIG.WAVE_SPEED_BONUS;
    const totalSlots = GAME_CONFIG.WAVE_COLS * GAME_CONFIG.WAVE_ROWS;
    const aliveRatio = Math.min(this.enemies.length / totalSlots, 1);
    const speedBoost = 1 + (1 - aliveRatio) * 0.3;

    let shouldReverse = false;
    const halfW = GAME_CONFIG.ENEMY_WIDTH / 2;

    for (const enemy of this.enemies) {
      enemy.sprite.x += this.enemyDirection * GAME_CONFIG.ENEMY_BASE_SPEED *
        enemy.speedMultiplier * waveSpeedFactor * speedBoost * dt;

      if (enemy.sprite.x - halfW < 0 || enemy.sprite.x + halfW > GAME_CONFIG.WIDTH) {
        shouldReverse = true;
        enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x, halfW, GAME_CONFIG.WIDTH - halfW);
      }
    }

    if (shouldReverse) {
      this.enemyDirection *= -1;
      for (const enemy of this.enemies) {
        enemy.sprite.y += GAME_CONFIG.ENEMY_DESCENT;
      }
    }

    if (!this.dangerWarningTriggered) {
      const dangerThreshold = GAME_CONFIG.HEIGHT * 0.6;
      const inDanger = this.enemies.some(e => e.sprite.y > dangerThreshold);
      if (inDanger) {
        this.dangerWarningTriggered = true;
        this.playSound(SOUND_KEYS.DANGER_WARNING);
      }
    }
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;

    this.bossTime += dt;

    const centerX = GAME_CONFIG.WIDTH / 2;
    const amplitude = (GAME_CONFIG.WIDTH - GAME_CONFIG.BOSS_WIDTH) / 2 - 20;
    this.boss.sprite.x = centerX + Math.sin(this.bossTime * GAME_CONFIG.BOSS_SPEED) * amplitude;

    this.drawBossHealthBar();

    const fireChance = GAME_CONFIG.BOSS_FIRE_CHANCE * 60;
    for (const offset of this.boss.barrelOffsets) {
      if (Math.random() < fireChance * dt) {
        // R85.I3: boss bullets scale up from regular enemy bullets (+2 / +4)
        // to preserve threat hierarchy now that regular bullets are 8×18.
        const hasLaserRed = this.textures?.exists('laser_red') ?? false;
        const texKey = hasLaserRed
          ? 'laser_red'
          : this._spriteMode ? 'sprite_bullet_enemy' : 'bullet_enemy';
        const img = this.add.image(
          this.boss.sprite.x + offset,
          this.boss.sprite.y + this.boss.height / 2,
          texKey
        );
        img.setDisplaySize(
          GAME_CONFIG.ENEMY_BULLET_WIDTH + 2,
          GAME_CONFIG.ENEMY_BULLET_HEIGHT + 4
        );
        img.setDepth(5);

        const bullet: BulletState = {
          sprite: img,
          vy: GAME_CONFIG.ENEMY_BULLET_SPEED,
          damage: GAME_CONFIG.PLAYER_HIT_DAMAGE,
          isPlayer: false,
        };
        this.enemyBullets.push(bullet);
      }
    }
  }

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

  private updateFieldPowerUps(dt: number): void {
    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      pu.sprite.y += pu.vy * dt;

      if (pu.sprite.y > GAME_CONFIG.HEIGHT + 10) {
        // R85.I4: kill the infinite yoyo tween before we destroy the sprite
        // so it doesn't outlive its target in the tween manager.
        this.tweens.killTweensOf(pu.sprite);
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
          bullet.sprite.x, bullet.sprite.y, GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT,
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
          bullet.sprite.x, bullet.sprite.y, GAME_CONFIG.PLAYER_BULLET_WIDTH, GAME_CONFIG.PLAYER_BULLET_HEIGHT,
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
        GAME_CONFIG.ENEMY_BULLET_WIDTH + 2, GAME_CONFIG.ENEMY_BULLET_HEIGHT + 2,
        this.player.x, this.player.y,
        GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT
      )) {
        this.hitPlayer();
        bullet.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private checkPowerUpCollisions(): void {
    const pickupDist = (GAME_CONFIG.PLAYER_WIDTH + GAME_CONFIG.POWERUP_SIZE) / 2;

    for (let i = this.fieldPowerUps.length - 1; i >= 0; i--) {
      const pu = this.fieldPowerUps[i];
      const dx = this.player.x - pu.sprite.x;
      const dy = this.player.y - pu.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < pickupDist) {
        this.activatePowerUp(pu.type);
        // R85.I6: on-pickup legend teaches the verb + effect + duration for
        // each power-up. Picked-up row highlights, others dim. Rebuilt every
        // pickup so repeat pickups refresh the timer instead of stacking.
        this.showPowerUpLegend(pu.type);
        // R85.I4: kill the pickup's yoyo tween so it doesn't outlive the
        // sprite — pickup is the hot path where leaks accumulate fastest.
        this.tweens.killTweensOf(pu.sprite);
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
      enemy.sprite.setTint(MATRIX_COLORS.WHITE);
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

    const scoreBonus = Math.floor(enemy.value * (1 + this.combo * GAME_CONFIG.COMBO_MULTIPLIER));
    this.score += scoreBonus * (this.scoreMultiplierActive ? 2 : 1);
    this.combo++;
    this.enemiesKilled++;

    if (this.score > this.highScore) this.highScore = this.score;
    this.reportScore(this.score, this.highScore);
    this.playSound(SOUND_KEYS.SCORE);
    this.cameras.main.shake(50, 0.003);

    this.spawnExplosion(x, y, def.color);

    if (def.splits) {
      this.spawnVirusChildren(x, y);
    }

    if (Math.random() < GAME_CONFIG.POWERUP_DROP_CHANCE) {
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

    this.boss.sprite.setTint(MATRIX_COLORS.WHITE);
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

    this.playSound(SOUND_KEYS.BOSS_EXPLOSION);
    this.playSound(SOUND_KEYS.LEVEL_UP);
    this.tryUnlockAchievement(ACHIEVEMENTS.BOSS_DEFEAT);
  }

  private hitPlayer(): void {
    if (this.isInvulnerable || this.isGameOver) return;

    if (this.shieldActive) {
      // R85.I4: shield break no longer mutates the player sprite — the aura
      // Graphics owns the visual, and the next updateShieldAura() tick hides
      // it. restorePlayerVisuals() is defensive: if any future effect ever
      // touches player alpha/tint, this guarantees the player returns to a
      // clean state on shield-break.
      this.shieldActive = false;
      this.isInvulnerable = true;
      this.playSound(SOUND_KEYS.HIT);
      this.cameras.main.shake(200, 0.005);
      this.restorePlayerVisuals();
      this.time.delayedCall(GAME_CONFIG.INVULNERABLE_DURATION, () => {
        this.isInvulnerable = false;
        this.restorePlayerVisuals();
      });
      return;
    }

    this.playerHealth -= GAME_CONFIG.PLAYER_HIT_DAMAGE;
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
      repeat: Math.floor(GAME_CONFIG.INVULNERABLE_DURATION / 80) - 1,
      callback: () => {
        if (this.player.active) this.player.setVisible(!this.player.visible);
      },
    });

    this.time.delayedCall(GAME_CONFIG.INVULNERABLE_DURATION, () => {
      this.isInvulnerable = false;
      flashEvent.destroy();
      // R85.I4: hard-restore the player instead of relying on the flash-toggle
      // parity landing on "visible". If anything ever throws mid-blink, this
      // still returns the player to a clean visible/alpha=1 state.
      this.restorePlayerVisuals();
    });
  }

  // -- Wave system --

  private spawnWave(): void {
    this.waveDamageTaken = false;
    this.dangerWarningTriggered = false;
    this.enemyDirection = 1;

    if (this.wave % 5 === 0) {
      this.spawnBossWave();
      return;
    }

    this.playSound(SOUND_KEYS.JACK_IN);

    for (let row = 0; row < GAME_CONFIG.WAVE_ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.WAVE_COLS; col++) {
        const type = this.getEnemyType(row);
        const def = ENEMY_DEFS[type];

        const x = GAME_CONFIG.GRID_START_X + col * GAME_CONFIG.GRID_COL_SPACING;
        const y = GAME_CONFIG.GRID_START_Y + row * GAME_CONFIG.GRID_ROW_SPACING;

        // R85.I1: enemies always use the procedural UFO/battleship
        // textures — the PNG sprites read as faces at game scale.
        // setScale(0.8) delivers the PG6 "visible 20% shrink" without
        // changing grid spacing or collision bounds.
        const sprite = this.add.sprite(x, y, `enemy_${type}`);
        sprite.setDepth(3);
        sprite.setScale(0.8);
        sprite.setTint(ROW_TINTS[row % ROW_TINTS.length]);

        this.enemies.push({
          sprite,
          type,
          health: def.health,
          maxHealth: def.health,
          value: def.value,
          speedMultiplier: def.speedMultiplier,
          width: GAME_CONFIG.ENEMY_WIDTH,
          height: GAME_CONFIG.ENEMY_HEIGHT,
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
      const health = GAME_CONFIG.BOSS_BASE_HEALTH + (encounter - 1) * GAME_CONFIG.BOSS_HEALTH_PER_ENCOUNTER;
      const value = GAME_CONFIG.BOSS_BASE_VALUE * encounter;

      const sprite = this.add.sprite(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.BOSS_Y, 'boss');
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
        width: GAME_CONFIG.BOSS_WIDTH,
        height: GAME_CONFIG.BOSS_HEIGHT,
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
    this.boss.healthBg.fillStyle(MATRIX_COLORS.DARK_GREY, 1);
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
    this.cameras.main.shake(150, 0.006);
    this.cameras.main.flash(150, 0, 255, 0, false, undefined, undefined, 0.15);

    this.playerHealth = GAME_CONFIG.PLAYER_MAX_HEALTH;
    this.clearAllBullets();

    this.time.delayedCall(GAME_CONFIG.WAVE_DELAY, () => {
      this.waveCompleteText.setVisible(false);
      this.wave++;
      this.isBossWave = false;
      this.waveTransitioning = false;
      this.spawnWave();
    });
  }

  private checkGameOverConditions(): void {
    if (this.isGameOver || this.waveTransitioning) return;

    const playerTopY = this.player.y - GAME_CONFIG.PLAYER_HEIGHT / 2;
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

    this.playSound(SOUND_KEYS.GAME_OVER);
    this.cameras.main.shake(180, 0.012);
    this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25);

    const reason = this.playerHealth <= 0 ? 'Ship destroyed' : 'Enemies reached your position';
    this.gameOver(this.score, reason, this.highScore, [
      { label: 'Wave', value: this.wave },
      { label: 'Enemies', value: this.enemiesKilled },
      { label: 'Max Combo', value: `${this.combo}×` },
      { label: 'Bullet Time', value: this.bulletTimeUses },
    ], this.wave, this.getGameDuration());
  }

  // -- Power-ups --

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['rapidFire', 'shield', 'scoreMultiplier', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];

    const sprite = this.add.sprite(x, y, `powerup_${type}`);
    sprite.setDepth(4);

    // R85.I4: infinite yoyo tween. Before R85.I4 it was leaked — the sprite
    // got destroyed on pickup but the tween kept running against a destroyed
    // target forever, accumulating dangling targets across a run. Tweens are
    // now killed at every destroy site (pickup + off-screen cleanup).
    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.fieldPowerUps.push({ sprite, type, vy: GAME_CONFIG.POWERUP_FALL_SPEED });
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
        // R85.I4: NO player-sprite mutation. The shield aura Graphics layer
        // handles the visual (see updateShieldAura). Before this change, the
        // shield call-site + updateHUD both setTexture/setTint on the player
        // every frame, and stacking several power-ups created pathological
        // interactions (Tom's "shooter becomes invisible" playtest note).
        this.shieldActive = true;
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

    // R85.I4: invariant — no power-up activation can leave the player with
    // mutated alpha/tint/texture. Belt-and-braces for any future power-up
    // that might add its own visual effect.
    this.restorePlayerVisuals();
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

  private spawnExplosion(x: number, y: number, color: number, count: number = GAME_CONFIG.PARTICLE_COUNT): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = GAME_CONFIG.PARTICLE_SPEED_MIN + Math.random() * (GAME_CONFIG.PARTICLE_SPEED_MAX - GAME_CONFIG.PARTICLE_SPEED_MIN);
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
      // R85.I1: children inherit the procedural UFO silhouette + 20% shrink.
      const sprite = this.add.sprite(x + offsetX, y, 'enemy_code');
      sprite.setDepth(3);
      sprite.setScale(0.8);
      this.enemies.push({
        sprite,
        type: 'code',
        health: 1,
        maxHealth: 1,
        value: GAME_CONFIG.VIRUS_CHILD_VALUE,
        speedMultiplier: ENEMY_DEFS.code.speedMultiplier,
        width: GAME_CONFIG.ENEMY_WIDTH,
        height: GAME_CONFIG.ENEMY_HEIGHT,
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
    this.drawBulletTimeMeter(time);
    // R85.I4: shield visuals live on a separate layer — see updateShieldAura.
    // updateHUD no longer touches the player sprite at all, which means no
    // per-frame texture churn can interfere with the hit-blink setVisible()
    // toggle or any future alpha effect.
    this.updateShieldAura(time);
  }

  // R85.I4: keep the aura glued to the player and pulse alpha when active so
  // the shield reads as a living field rather than a static ring. Hidden when
  // shieldActive=false; the draw is skipped entirely in that case so the
  // Graphics object costs nothing beyond its presence.
  private updateShieldAura(time: number): void {
    if (!this.shieldAura) return;
    this.shieldAura.setPosition(this.player.x, this.player.y);
    if (!this.shieldActive) {
      if (this.shieldAura.visible) this.shieldAura.setVisible(false);
      return;
    }
    if (!this.shieldAura.visible) this.shieldAura.setVisible(true);
    const pulse = 0.75 + 0.25 * Math.sin(time * 0.005);
    this.shieldAura.setAlpha(pulse);
  }

  private drawHealthBar(time: number): void {
    const barX = GAME_CONFIG.WIDTH - 210;
    const barY = 42;
    const barW = 200;
    const barH = 10;
    const healthPct = this.playerHealth / GAME_CONFIG.PLAYER_MAX_HEALTH;

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
    this.healthBarBg.fillStyle(MATRIX_COLORS.DARK_GREY, 1);
    this.healthBarBg.fillRect(barX, barY, barW, barH);
    this.healthBarBg.lineStyle(1, MATRIX_COLORS.PRIMARY, 0.5);
    this.healthBarBg.strokeRect(barX, barY, barW, barH);

    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(barX, barY, barW * healthPct, barH);
  }

  // R85.I2: meter below the combo readout. Fill pulses gently when ready +
  // idle so the eye catches it without being distracting during active play.
  private drawBulletTimeMeter(time: number): void {
    const barX = 10;
    const barY = 80;
    const barW = 140;
    const barH = 6;

    this.bulletTimeChargeBg.clear();
    this.bulletTimeChargeBg.fillStyle(MATRIX_COLORS.DARK_GREY, 1);
    this.bulletTimeChargeBg.fillRect(barX, barY, barW, barH);
    this.bulletTimeChargeBg.lineStyle(1, MATRIX_COLORS.MAGENTA, 0.6);
    this.bulletTimeChargeBg.strokeRect(barX, barY, barW, barH);

    this.bulletTimeChargeFill.clear();
    const isReady = this.bulletTimeCharge >= 1 && !this.bulletTimeActive;
    const alpha = isReady ? 0.75 + 0.25 * Math.sin(time * 0.008) : 1;
    this.bulletTimeChargeFill.fillStyle(MATRIX_COLORS.MAGENTA, alpha);
    this.bulletTimeChargeFill.fillRect(barX, barY, barW * this.bulletTimeCharge, barH);
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

  // ── R85.I6: power-up legend ─────────────────────────────────────────
  //
  // Three-method stack copied from Vortex Pong's R84.P5 implementation.
  // `showPowerUpLegend` rebuilds from scratch on every pickup (the hot
  // path), `hidePowerUpLegend` is the 4s-timer callback that fades the
  // whole cohort out, `clearPowerUpLegend` is the synchronous teardown
  // used by show-on-top-of-show and by scene shutdown.
  //
  // The critical invariant is that rapid back-to-back pickups must not leak
  // Text nodes or fire a stale 4s-hide against a newer cohort. The guard is
  // that hidePowerUpLegend captures the array reference in a local `targets`
  // and only destroys those nodes; show() resets `this.powerUpLegend` to a
  // fresh array so the stale tween sees a detached reference.

  private showPowerUpLegend(activatedType: PowerUpType): void {
    this.clearPowerUpLegend();
    const cx = GAME_CONFIG.WIDTH / 2;
    const baseY = GAME_CONFIG.HEIGHT * POWERUP_LEGEND.BASE_Y_RATIO;
    const reducedMotion = this.prefersReducedMotion();

    POWERUP_LEGEND.ENTRIES.forEach((entry, i) => {
      const def = POWERUP_DEFS[entry.type];
      const isActive = entry.type === activatedType;
      const colour = `#${def.color.toString(16).padStart(6, '0')}`;
      const text = this.add.text(
        cx,
        baseY + i * POWERUP_LEGEND.LINE_HEIGHT,
        `${entry.name} · ${entry.effect} · ${entry.duration}`,
        {
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '10px',
          color: colour,
          align: 'center',
        },
      );
      text.setOrigin(0.5, 0.5);
      text.setDepth(100);
      const targetAlpha = isActive ? POWERUP_LEGEND.ACTIVE_ALPHA : POWERUP_LEGEND.INACTIVE_ALPHA;
      if (reducedMotion) {
        text.setAlpha(targetAlpha);
      } else {
        text.setAlpha(0);
        this.tweens.add({
          targets: text,
          alpha: targetAlpha,
          duration: POWERUP_LEGEND.FADE_IN_MS,
          ease: 'Quad.easeOut',
        });
      }
      this.powerUpLegend.push(text);
    });

    this.powerUpLegendHideTimer = this.time.delayedCall(
      POWERUP_LEGEND.DISPLAY_MS,
      () => this.hidePowerUpLegend(),
    );
  }

  private hidePowerUpLegend(): void {
    if (this.powerUpLegend.length === 0) return;
    const targets = this.powerUpLegend;
    if (this.prefersReducedMotion()) {
      this.clearPowerUpLegend();
      return;
    }
    this.tweens.add({
      targets,
      alpha: 0,
      duration: POWERUP_LEGEND.FADE_OUT_MS,
      onComplete: () => {
        // Guard: a second pickup landing mid-fade will have already rebuilt
        // `this.powerUpLegend`; only destroy the original cohort.
        targets.forEach((t) => t.destroy());
        if (this.powerUpLegend === targets) this.powerUpLegend = [];
      },
    });
  }

  private clearPowerUpLegend(): void {
    this.powerUpLegendHideTimer?.remove(false);
    this.powerUpLegendHideTimer = undefined;
    if (this.powerUpLegend.length > 0) {
      this.tweens.killTweensOf(this.powerUpLegend);
      this.powerUpLegend.forEach((t) => t.destroy());
      this.powerUpLegend = [];
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
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
      bulletTimeCharge: this.bulletTimeCharge,
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
      countdownValue: this.countdownValue,
    };
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    for (const e of this.enemies) e.sprite.destroy();
    this.enemies = [];
    for (const b of this.playerBullets) b.sprite.destroy();
    this.playerBullets = [];
    for (const b of this.enemyBullets) b.sprite.destroy();
    this.enemyBullets = [];
    for (const p of this.particles) p.rect.destroy();
    this.particles = [];
    // R85.I4: kill lingering yoyo tweens so scene teardown doesn't leak tween
    // targets into the next scene instance.
    for (const pu of this.fieldPowerUps) {
      this.tweens?.killTweensOf(pu.sprite);
      pu.sprite.destroy();
    }
    this.fieldPowerUps = [];

    if (this.boss) {
      this.boss.sprite.destroy();
      this.boss.healthBar.destroy();
      this.boss.healthBg.destroy();
      this.boss = null;
    }

    // R85.I6: tear down any active legend cohort + its pending hide timer so
    // teardown doesn't leak Text nodes or fire a delayed-call after the scene
    // is gone.
    this.clearPowerUpLegend();

    this.input.keyboard?.removeAllKeys(true);
    super.shutdown();
  }
}
