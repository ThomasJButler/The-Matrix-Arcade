import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS, MATRIX_FONTS, SOUND_KEYS, REGISTRY_KEYS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS, MAP_LAYOUTS, getLayoutForLevel, MapLayout } from '../config';

/** Direction vectors */
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 },
};

type Direction = keyof typeof DIRECTIONS;

/** Agent AI states */
type AgentState = 'chase' | 'scatter' | 'frightened' | 'returning';

/** Agent sprite with AI data */
interface Agent extends Phaser.Physics.Arcade.Sprite {
  agentType: 'smith' | 'brown' | 'jones' | 'johnson';
  state: AgentState;
  direction: Direction;
  gridX: number;
  gridY: number;
  moveProgress: number; // 0 to 1
  targetTile: { x: number; y: number };
  scatterTarget: { x: number; y: number };
  homePosition: { x: number; y: number };
  isReleased: boolean;
  frightenedEndTime: number;
}

export class AgentChaseGameScene extends BaseScene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerDirection: Direction = 'LEFT';
  private nextDirection: Direction = 'NONE';
  private mouthOpen = true;
  private playerGridX = 0;
  private playerGridY = 0;
  private playerMoveProgress = 0;

  // Game state
  private score = 0;
  private highScore = 0;
  private lives = 3;
  private level = 1;
  private dotsCollected = 0;
  private totalDots = 0;
  private ghostsEatenThisPellet = 0;
  private diedThisLevel = false;

  // Layout tracking
  private currentLayout!: MapLayout;
  private mazesPlayed: Set<string> = new Set();

  // Maze
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private dots!: Phaser.Physics.Arcade.StaticGroup;
  private powerPellets!: Phaser.Physics.Arcade.StaticGroup;

  // Agents
  private agents!: Phaser.Physics.Arcade.Group;
  private agentReleaseIndex = 0;

  // Fruit
  private fruit?: Phaser.Physics.Arcade.Sprite;
  private fruitSpawned = [false, false];

  // Bullet-time
  private bulletTimeDots!: Phaser.Physics.Arcade.StaticGroup;
  private bulletTimeActive = false;
  private bulletTimeTimer = 0;
  private bulletTimeOverlay?: Phaser.GameObjects.Graphics;
  private nextBulletTimeSpawn = 0;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private mapText!: Phaser.GameObjects.Text;

  // Mode timing
  private scatterMode = true;
  private modeTimer = 0;
  private modePhase = 0;
  private readonly MODE_TIMES = [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  // Animation timer
  private animTimer = 0;

  // Respawn invulnerability
  private isInvulnerable = false;
  private invulnerabilityTimer = 0;
  private readonly INVULNERABILITY_DURATION = 2000; // 2 seconds after death

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.createMatrixBackground();

    // Reset state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.dotsCollected = 0;
    this.totalDots = 0;
    this.ghostsEatenThisPellet = 0;
    this.diedThisLevel = false;
    this.scatterMode = true;
    this.modeTimer = 0;
    this.modePhase = 0;
    this.agentReleaseIndex = 0;
    this.fruitSpawned = [false, false];
    this.playerDirection = 'LEFT';
    this.nextDirection = 'NONE';
    this.mouthOpen = true;
    this.animTimer = 0;
    this.isInvulnerable = false;

    const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
    if (saveSystem) {
      const saveData = saveSystem.getSaveData();
      this.highScore = saveData?.games?.agentChase?.highScore ?? 0;
    }
    this.invulnerabilityTimer = 0;
    this.bulletTimeActive = false;
    this.bulletTimeTimer = 0;
    this.nextBulletTimeSpawn = 0;
    this.mazesPlayed = new Set();

    // Set initial layout
    this.currentLayout = getLayoutForLevel(1);
    this.mazesPlayed.add(this.currentLayout.name);

    // Create groups
    this.walls = this.physics.add.staticGroup();
    this.dots = this.physics.add.staticGroup();
    this.powerPellets = this.physics.add.staticGroup();
    this.bulletTimeDots = this.physics.add.staticGroup();
    this.agents = this.physics.add.group();

    // Build maze
    this.buildMaze();

    // Create player
    this.createPlayer();

    // Create agents
    this.createAgents();

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();
    this.setupCommonInputs();

    // Setup collisions
    this.setupCollisions();

    this.playBackgroundMusic('/assets/audio/music/boss-theme.mp3');
    this.playSound(SOUND_KEYS.JACK_IN);
    this.startCountdown(5, () => {});
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.isCountingDown) return;

    // Update animation
    this.animTimer += delta;
    if (this.animTimer > 100) {
      this.animTimer = 0;
      this.mouthOpen = !this.mouthOpen;
      this.player.setTexture(this.mouthOpen ? 'player_open' : 'player_closed');
    }

    // Update invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      this.player.setAlpha(Math.sin(this.invulnerabilityTimer * 0.01) > 0 ? 1 : 0.3);
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.player.setAlpha(1);
      }
    }

    if (this.cursors) {
      this.handleInput();
    }

    // Move player
    this.movePlayer(delta);

    // Update mode timing
    this.updateModes(delta);

    // Release agents
    this.releaseAgents();

    // Update bullet-time
    this.updateBulletTime(delta);

    // Update agents
    this.updateAgents(delta);

    // Check level complete
    this.checkLevelComplete();

    // Update UI
    this.updateUI();

    // Expose state for E2E tests
    this.exposeTestState({
      score: this.score,
      lives: this.lives,
      level: this.level,
      dotsCollected: this.dotsCollected,
      mapName: this.currentLayout.name,
      mazesPlayed: this.mazesPlayed.size,
      countdownValue: this.countdownValue,
    });
  }

  private buildMaze(): void {
    this.walls.clear(true, true);

    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    for (let row = 0; row < this.currentLayout.grid.length; row++) {
      for (let col = 0; col < this.currentLayout.grid[row].length; col++) {
        const tile = this.currentLayout.grid[row][col];
        const x = offsetX + col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
        const y = offsetY + row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

        switch (tile) {
          case '1': // Wall
            this.walls.create(x, y, 'wall');
            break;
          case '2': // Dot
            this.dots.create(x, y, 'dot');
            this.totalDots++;
            break;
          case '3': { // Power pellet
            const pellet = this.powerPellets.create(x, y, 'power_pellet');
            this.tweens.add({
              targets: pellet,
              alpha: 0.3,
              duration: 300,
              yoyo: true,
              repeat: -1,
            });
            this.totalDots++;
            break;
          }
          // 4 = ghost house, 5 = tunnel (empty)
        }
      }
    }
  }

  private createPlayer(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    this.playerGridX = this.currentLayout.playerStart.x;
    this.playerGridY = this.currentLayout.playerStart.y;
    this.playerMoveProgress = 0;

    const x = offsetX + this.playerGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const y = offsetY + this.playerGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    this.player = this.physics.add.sprite(x, y, 'player_open');
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(false);
    this.player.setVelocity(0, 0);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
  }

  private createAgents(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    const agentConfigs: Array<{
      type: 'smith' | 'brown' | 'jones' | 'johnson';
      gridX: number;
      gridY: number;
      scatterTarget: { x: number; y: number };
    }> = this.currentLayout.agentHomes.map(home => ({
      type: home.type,
      gridX: home.gridX,
      gridY: home.gridY,
      scatterTarget: home.scatterTarget,
    }));

    agentConfigs.forEach((config, index) => {
      const x = offsetX + config.gridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const y = offsetY + config.gridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

      const agent = this.agents.create(x, y, `agent_${config.type}`) as Agent;
      agent.agentType = config.type;
      agent.state = 'scatter';
      agent.direction = 'LEFT';
      agent.gridX = config.gridX;
      agent.gridY = config.gridY;
      agent.moveProgress = 0;
      agent.targetTile = { x: 14, y: 11 };
      agent.scatterTarget = config.scatterTarget;
      agent.homePosition = { x, y };
      agent.isReleased = index === 0;
      agent.frightenedEndTime = 0;
      agent.setDepth(9);
      agent.setVelocity(0, 0);

      const body = agent.body as Phaser.Physics.Arcade.Body;
      body.setSize(GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    });
  }

  /**
   * Defensively destroys any prior text objects to prevent duplicates
   * if the scene's create() is called without a full shutdown cycle.
   */
  private createUI(): void {
    this.scoreText?.destroy();
    this.livesText?.destroy();
    this.levelText?.destroy();
    this.mapText?.destroy();

    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.scoreText.setDepth(100);

    this.livesText = this.add.text(200, 10, `LIVES: ${this.lives}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.livesText.setDepth(100);

    this.levelText = this.add.text(400, 10, `LEVEL: ${this.level}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '14px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.levelText.setDepth(100);

    this.mapText = this.add.text(10, GAME_CONFIG.HEIGHT - 20, `MAP: ${this.currentLayout.name}`, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '10px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.mapText.setDepth(100);
  }

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
    });
  }

  private handleInput(): void {
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      this.nextDirection = 'UP';
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      this.nextDirection = 'DOWN';
    } else if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      this.nextDirection = 'LEFT';
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      this.nextDirection = 'RIGHT';
    }
  }

  private movePlayer(delta: number): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;
    const speed = GAME_CONFIG.PLAYER.SPEED;

    // Try to apply buffered turn at current grid position (pre-move)
    if (this.nextDirection !== 'NONE' && this.playerMoveProgress === 0 &&
        this.canMove(this.playerGridX, this.playerGridY, this.nextDirection)) {
      this.playerDirection = this.nextDirection;
      this.nextDirection = 'NONE';
      this.updatePlayerRotation();
    }

    // When the player has finished traversing one tile, advance to the next
    if (this.playerMoveProgress >= 1.0) {
      const dir = DIRECTIONS[this.playerDirection];
      const nextX = this.playerGridX + dir.x;
      const nextY = this.playerGridY + dir.y;

      // Handle tunnel wrap
      if (nextY === this.currentLayout.tunnelRow && (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS)) {
        this.playerGridX = nextX < 0 ? GAME_CONFIG.MAZE_COLS - 1 : 0;
        this.playerGridY = nextY;
      } else if (this.canMove(this.playerGridX, this.playerGridY, this.playerDirection)) {
        this.playerGridX = nextX;
        this.playerGridY = nextY;
      }

      // Reset progress for the new tile
      this.playerMoveProgress = 0;

      // At the new tile, try the buffered direction again (auto-turn at corners)
      if (this.nextDirection !== 'NONE' && this.canMove(this.playerGridX, this.playerGridY, this.nextDirection)) {
        this.playerDirection = this.nextDirection;
        this.nextDirection = 'NONE';
        this.updatePlayerRotation();
      }
    }

    // Only start new tile movement if the path ahead is clear.
    // If progress > 0 we are mid-tile and must finish arriving at the next grid cell.
    const canAdvance = this.canMove(this.playerGridX, this.playerGridY, this.playerDirection);
    if (canAdvance || this.playerMoveProgress > 0) {
      const deltaSeconds = delta / 1000;
      const tilesPerSecond = speed / GAME_CONFIG.TILE_SIZE;
      this.playerMoveProgress += tilesPerSecond * deltaSeconds;

      // Clamp progress
      if (this.playerMoveProgress > 1.0) {
        this.playerMoveProgress = 1.0;
      }
    }

    // Interpolate position between grid tiles
    const offsetDir = DIRECTIONS[this.playerDirection];
    // Only interpolate toward next tile if the path is clear; otherwise stay at grid position
    const blocked = !this.canMove(this.playerGridX, this.playerGridY, this.playerDirection);
    const interpProgress = blocked ? 0 : this.playerMoveProgress;

    const nextGridX = this.playerGridX + offsetDir.x;
    const nextGridY = this.playerGridY + offsetDir.y;

    const currentX = offsetX + this.playerGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const currentY = offsetY + this.playerGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const nextTileX = offsetX + nextGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const nextTileY = offsetY + nextGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    this.player.x = Phaser.Math.Interpolation.Linear([currentX, nextTileX], interpProgress);
    this.player.y = Phaser.Math.Interpolation.Linear([currentY, nextTileY], interpProgress);
  }

  private updatePlayerRotation(): void {
    if (this.game?.registry?.get('spriteMode')) {
      this.player.setAngle(0);
      this.player.setFlipX(this.playerDirection === 'LEFT');
    } else {
      switch (this.playerDirection) {
        case 'UP': this.player.setAngle(-90); break;
        case 'DOWN': this.player.setAngle(90); break;
        case 'LEFT': this.player.setAngle(180); break;
        case 'RIGHT': this.player.setAngle(0); break;
      }
    }
  }


  private setupCollisions(): void {
    // Player vs dots
    this.physics.add.overlap(
      this.player,
      this.dots,
      (_player, dot) => this.collectDot(dot as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // Player vs power pellets
    this.physics.add.overlap(
      this.player,
      this.powerPellets,
      (_player, pellet) => this.collectPowerPellet(pellet as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // Player vs bullet-time dots
    this.physics.add.overlap(
      this.player,
      this.bulletTimeDots,
      (_player, dot) => this.collectBulletTimeDot(dot as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // Player vs agents
    this.physics.add.overlap(
      this.player,
      this.agents,
      (_player, agent) => this.handleAgentCollision(agent as Agent),
      undefined,
      this
    );
  }

  private collectDot(dot: Phaser.Physics.Arcade.Sprite): void {
    dot.destroy();
    this.score += GAME_CONFIG.SCORING.DOT;
    this.dotsCollected++;
    this.playSound(SOUND_KEYS.DOT_EAT);

    if (this.dotsCollected === 1) {
      this.unlockAchievement(ACHIEVEMENTS.FIRST_DOT);
    }

    this.checkFruitSpawn();
  }

  private collectPowerPellet(pellet: Phaser.Physics.Arcade.Sprite): void {
    pellet.destroy();
    this.score += GAME_CONFIG.SCORING.POWER_PELLET;
    this.dotsCollected++;
    this.ghostsEatenThisPellet = 0;
    this.playSound('powerup');

    const frightenedDuration = Math.max(
      GAME_CONFIG.AGENTS.FRIGHTENED_MIN,
      GAME_CONFIG.AGENTS.FRIGHTENED_DURATION - (this.level - 1) * 500
    );
    const frightenedEndTime = this.time.now + frightenedDuration;

    this.agents.getChildren().forEach((obj) => {
      const agent = obj as Agent;
      if (agent.state !== 'returning') {
        agent.state = 'frightened';
        agent.frightenedEndTime = frightenedEndTime;
        agent.setTexture('agent_frightened');
        // Reverse direction
        agent.direction = this.reverseDirection(agent.direction);
      }
    });
  }

  private handleAgentCollision(agent: Agent): void {
    // Skip collision during respawn invulnerability (but still allow eating frightened agents)
    if (this.isInvulnerable && agent.state !== 'frightened') return;

    if (agent.state === 'frightened') {
      // Eat the ghost
      this.ghostsEatenThisPellet++;
      const points = GAME_CONFIG.SCORING.GHOST_BASE * Math.pow(2, this.ghostsEatenThisPellet - 1);
      this.score += points;
      this.playSound('ghostEat');

      this.unlockAchievement(ACHIEVEMENTS.FIRST_GHOST);

      if (this.ghostsEatenThisPellet >= 4) {
        this.unlockAchievement(ACHIEVEMENTS.EAT_ALL_GHOSTS);
      }

      // Send agent to returning state
      agent.state = 'returning';
      agent.setTexture('agent_eyes');
    } else if (agent.state !== 'returning') {
      // Player dies
      this.playerDeath();
    }
  }

  private playerDeath(): void {
    // Guard against multiple death calls in the same frame (e.g. two agents hitting simultaneously)
    if (this.isInvulnerable) return;

    this.lives = Math.max(0, this.lives - 1);
    this.diedThisLevel = true;
    this.playSound('hit');
    this.cameras.main.shake(150, 0.008);

    if (this.lives <= 0) {
      this.playSound(SOUND_KEYS.GAME_OVER);
      this.cameras.main.flash(120, 255, 0, 0, false, undefined, undefined, 0.25);
      if (this.score > this.highScore) this.highScore = this.score;
      this.reportScore(this.score, this.highScore);

      // R86.A1: defensive second write path — mirror Neo Jump / Metris so the
      // high score + stats slice land even if the React updateGameSave handler
      // is stale when the 'score' event fires. Tom flagged scoreboard-stale
      // symptoms on Agent Chase on 2026-04-22; the shared-state singleton in
      // useSaveSystem now propagates correctly across hook instances, but a
      // direct write here is cheaper insurance than re-deriving the state
      // from the event path.
      const saveSystem = this.registry.get(REGISTRY_KEYS.SAVE_SYSTEM);
      if (saveSystem) {
        const saveData = saveSystem.getSaveData();
        const prev = (saveData?.games?.agentChase?.stats ?? {}) as Record<string, number>;
        const sessionSeconds = Math.floor(this.getGameDuration() / 1000);
        saveSystem.updateGameSave('agentChase', {
          highScore: this.highScore,
          level: this.level,
          stats: {
            gamesPlayed: (prev.gamesPlayed ?? 0) + 1,
            totalScore: (prev.totalScore ?? 0) + this.score,
            longestSurvival: Math.max(prev.longestSurvival ?? 0, sessionSeconds),
          },
        });
      }

      this.gameOver(this.score, `Level ${this.level}`, this.highScore, [
        { label: 'Dots', value: `${this.dotsCollected}/${this.totalDots}` },
      ], this.level, this.getGameDuration());
    } else {
      // Reset positions and grant temporary invulnerability
      this.resetPositions();
      this.isInvulnerable = true;
      this.invulnerabilityTimer = this.INVULNERABILITY_DURATION;
    }
  }

  private resetPositions(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    // Reset player
    this.playerGridX = this.currentLayout.playerStart.x;
    this.playerGridY = this.currentLayout.playerStart.y;
    this.playerMoveProgress = 0;
    this.player.x = offsetX + this.playerGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    this.player.y = offsetY + this.playerGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    this.playerDirection = 'LEFT';
    this.nextDirection = 'NONE';
    this.player.setAngle(180);

    // Reset agents
    this.agents.getChildren().forEach((obj, index) => {
      const agent = obj as Agent;

      // Reset to home position
      agent.x = agent.homePosition.x;
      agent.y = agent.homePosition.y;

      // Reset grid position based on home position
      agent.gridX = Math.round((agent.homePosition.x - offsetX) / GAME_CONFIG.TILE_SIZE);
      agent.gridY = Math.round((agent.homePosition.y - offsetY) / GAME_CONFIG.TILE_SIZE);
      agent.moveProgress = 0;

      agent.state = 'scatter';
      agent.isReleased = index === 0;
      agent.setTexture(`agent_${agent.agentType}`);
    });

    this.agentReleaseIndex = 1;
    this.scatterMode = true;
    this.modePhase = 0;
    this.modeTimer = 0;
  }


  private checkLevelComplete(): void {
    if (this.dotsCollected >= this.totalDots) {
      this.level++;
      this.playSound('levelUp');

      this.unlockAchievement(ACHIEVEMENTS.CLEAR_LEVEL);

      if (!this.diedThisLevel) {
        this.unlockAchievement(ACHIEVEMENTS.NO_DEATH_LEVEL);
      }

      if (this.level >= 5) {
        this.unlockAchievement(ACHIEVEMENTS.SURVIVE_5_LEVELS);
      }

      // Bonus points
      this.score += GAME_CONFIG.SCORING.LEVEL_BONUS;

      // Check if the layout changes for the next level
      const newLayout = getLayoutForLevel(this.level);
      const layoutChanged = newLayout.name !== this.currentLayout.name;

      if (layoutChanged) {
        // Show map announcement
        const announcement = this.add.text(
          GAME_CONFIG.WIDTH / 2,
          GAME_CONFIG.HEIGHT / 2,
          `MAP: ${newLayout.name}`,
          {
            fontFamily: MATRIX_FONTS.PRIMARY,
            fontSize: '18px',
            color: MATRIX_COLORS.PRIMARY_HEX,
          }
        );
        announcement.setOrigin(0.5);
        announcement.setDepth(200);
        this.tweens.add({
          targets: announcement,
          alpha: 0,
          duration: 2000,
          onComplete: () => announcement.destroy(),
        });
      }

      this.mazesPlayed.add(newLayout.name);
      if (this.mazesPlayed.size >= MAP_LAYOUTS.length) {
        this.unlockAchievement(ACHIEVEMENTS.ALL_MAZES);
      }

      // Restart level
      this.restartLevel(newLayout, layoutChanged);
    }
  }

  private restartLevel(newLayout: MapLayout, layoutChanged: boolean): void {
    // Clear existing dots, pellets, and bullet-time dots
    this.dots.clear(true, true);
    this.powerPellets.clear(true, true);
    this.bulletTimeDots.clear(true, true);
    this.bulletTimeActive = false;
    this.bulletTimeTimer = 0;
    this.bulletTimeOverlay?.destroy();
    this.bulletTimeOverlay = undefined;
    this.nextBulletTimeSpawn = GAME_CONFIG.BULLET_TIME.SPAWN_INTERVAL;
    if (this.fruit) {
      this.fruit.destroy();
      this.fruit = undefined;
    }

    this.dotsCollected = 0;
    this.totalDots = 0;
    this.fruitSpawned = [false, false];
    this.diedThisLevel = false;

    if (layoutChanged) {
      this.currentLayout = newLayout;
      // Rebuild walls and dots for the new layout
      this.buildMaze();
    } else {
      // Only rebuild dots — walls haven't changed
      const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
      const offsetY = 40;

      for (let row = 0; row < this.currentLayout.grid.length; row++) {
        for (let col = 0; col < this.currentLayout.grid[row].length; col++) {
          const tile = this.currentLayout.grid[row][col];
          const x = offsetX + col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
          const y = offsetY + row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

          if (tile === '2') {
            this.dots.create(x, y, 'dot');
            this.totalDots++;
          } else if (tile === '3') {
            const pellet = this.powerPellets.create(x, y, 'power_pellet');
            this.tweens.add({
              targets: pellet,
              alpha: 0.3,
              duration: 300,
              yoyo: true,
              repeat: -1,
            });
            this.totalDots++;
          }
        }
      }
    }

    this.resetPositions();
    this.playSound(SOUND_KEYS.JACK_IN);
  }

  private checkFruitSpawn(): void {
    if (this.dotsCollected === GAME_CONFIG.FRUIT.FIRST_SPAWN && !this.fruitSpawned[0]) {
      this.spawnFruit();
      this.fruitSpawned[0] = true;
    } else if (this.dotsCollected === GAME_CONFIG.FRUIT.SECOND_SPAWN && !this.fruitSpawned[1]) {
      this.spawnFruit();
      this.fruitSpawned[1] = true;
    }
  }

  private spawnFruit(): void {
    if (this.fruit) return;

    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;
    const x = offsetX + this.currentLayout.fruitPosition.x * GAME_CONFIG.TILE_SIZE;
    const y = offsetY + this.currentLayout.fruitPosition.y * GAME_CONFIG.TILE_SIZE;

    const fruitIndex = Math.min(this.level - 1, 5);
    const fruits = ['cherry', 'strawberry', 'orange', 'apple', 'grape', 'banana'];

    this.fruit = this.physics.add.sprite(x, y, `fruit_${fruits[fruitIndex]}`);
    this.fruit.setDepth(5);

    // Collect fruit on overlap
    this.physics.add.overlap(
      this.player,
      this.fruit,
      () => this.collectFruit(),
      undefined,
      this
    );

    // Despawn after duration
    this.time.delayedCall(GAME_CONFIG.FRUIT.DURATION, () => {
      if (this.fruit) {
        this.fruit.destroy();
        this.fruit = undefined;
      }
    });
  }

  private collectFruit(): void {
    if (!this.fruit) return;

    const fruitIndex = Math.min(this.level - 1, 5);
    this.score += GAME_CONFIG.SCORING.FRUIT[fruitIndex];
    this.playSound('score');
    this.unlockAchievement(ACHIEVEMENTS.COLLECT_FRUIT);

    this.fruit.destroy();
    this.fruit = undefined;
  }

  /** Spawn, collect, and manage bullet-time freeze mechanic */
  private updateBulletTime(delta: number): void {
    // Tick down active freeze
    if (this.bulletTimeActive) {
      this.bulletTimeTimer -= delta;
      if (this.bulletTimeTimer <= 0) {
        this.bulletTimeActive = false;
        this.bulletTimeOverlay?.destroy();
        this.bulletTimeOverlay = undefined;
      }
    }

    // Periodically try to spawn a bullet-time dot
    this.nextBulletTimeSpawn -= delta;
    if (this.nextBulletTimeSpawn <= 0) {
      this.nextBulletTimeSpawn = GAME_CONFIG.BULLET_TIME.SPAWN_INTERVAL;
      if (
        this.bulletTimeDots.getLength() < GAME_CONFIG.BULLET_TIME.MAX_ON_MAP &&
        Math.random() < GAME_CONFIG.BULLET_TIME.SPAWN_CHANCE
      ) {
        this.spawnBulletTimeDot();
      }
    }
  }

  private spawnBulletTimeDot(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    // Collect all empty corridor tiles (tile === '2' positions that still have dots, or open '0' spaces)
    const candidates: { x: number; y: number }[] = [];
    for (let row = 0; row < this.currentLayout.grid.length; row++) {
      for (let col = 0; col < this.currentLayout.grid[row].length; col++) {
        const tile = this.currentLayout.grid[row][col];
        if (tile === '0' || tile === '5') {
          candidates.push({ x: col, y: row });
        }
      }
    }

    if (candidates.length === 0) return;

    const spot = candidates[Phaser.Math.Between(0, candidates.length - 1)];
    const x = offsetX + spot.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const y = offsetY + spot.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    const dot = this.bulletTimeDots.create(x, y, 'dot') as Phaser.Physics.Arcade.Sprite;
    dot.setTint(MATRIX_COLORS.CYAN);
    dot.setDepth(6);

    // Pulsing animation
    this.tweens.add({
      targets: dot,
      alpha: { from: 1, to: 0.3 },
      scale: { from: 1.3, to: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Auto-despawn after 10 seconds
    this.time.delayedCall(10000, () => {
      if (dot.active) {
        dot.destroy();
      }
    });
  }

  private collectBulletTimeDot(dot: Phaser.Physics.Arcade.Sprite): void {
    dot.destroy();
    this.score += GAME_CONFIG.SCORING.BULLET_TIME_DOT;
    this.playSound('powerup');

    // Activate bullet-time: freeze all agents
    this.bulletTimeActive = true;
    this.bulletTimeTimer = GAME_CONFIG.BULLET_TIME.FREEZE_DURATION;

    // Cyan screen overlay
    this.bulletTimeOverlay?.destroy();
    this.bulletTimeOverlay = this.add.graphics();
    this.bulletTimeOverlay.fillStyle(MATRIX_COLORS.CYAN, 0.08);
    this.bulletTimeOverlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    this.bulletTimeOverlay.setDepth(50);
  }

  private updateModes(delta: number): void {
    this.modeTimer += delta;

    if (this.modeTimer >= this.MODE_TIMES[this.modePhase]) {
      this.modeTimer = 0;
      this.modePhase++;
      this.scatterMode = this.modePhase % 2 === 0;

      // Reverse agents that aren't frightened
      this.agents.getChildren().forEach((obj) => {
        const agent = obj as Agent;
        if (agent.state !== 'frightened' && agent.state !== 'returning') {
          agent.state = this.scatterMode ? 'scatter' : 'chase';
          agent.direction = this.reverseDirection(agent.direction);
        }
      });
    }
  }

  /**
   * R86.A2: staggered dot-count release replaces the 5s timer.
   *
   * Thresholds live in GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS
   * ([0, 10, 30, 60]). The while-loop releases as many agents as the
   * current dot count allows in one pass — important after a death
   * mid-level, where dotsCollected is already high but agentReleaseIndex
   * was reset to 1, so agents[1..3] can all release on the next tick
   * instead of waiting for fresh dots.
   */
  private releaseAgents(): void {
    const agents = this.agents.getChildren() as Agent[];
    const thresholds = GAME_CONFIG.GHOST_HOUSE.RELEASE_DOT_THRESHOLDS;

    while (
      this.agentReleaseIndex < thresholds.length &&
      this.agentReleaseIndex < agents.length &&
      this.dotsCollected >= thresholds[this.agentReleaseIndex]
    ) {
      agents[this.agentReleaseIndex].isReleased = true;
      this.agentReleaseIndex++;
    }
  }

  /**
   * R86.A2: is a grid coordinate inside the ghost-house interior?
   *
   * Bounds intentionally exclude the dead-end pockets at (11, 13-15)
   * and (19, 13-15) — those cells are technically reachable but an
   * agent should never end up there mid-exit, and if it somehow does,
   * normal AI can navigate out via the side corridors.
   */
  private isInsideGhostHouse(gridX: number, gridY: number): boolean {
    const b = GAME_CONFIG.GHOST_HOUSE.BOUNDS;
    return gridY >= b.minRow && gridY <= b.maxRow && gridX >= b.minCol && gridX <= b.maxCol;
  }

  private updateAgents(delta: number): void {
    this.agents.getChildren().forEach((obj) => {
      const agent = obj as Agent;
      if (!agent.isReleased) return;

      // Freeze agents during bullet-time (but still allow returning agents to move)
      if (this.bulletTimeActive && agent.state !== 'returning') {
        // Tint frozen agents cyan to show they are affected
        agent.setTint(MATRIX_COLORS.CYAN);
        return;
      } else if (!this.bulletTimeActive) {
        agent.clearTint();
      }

      // Check frightened state
      if (agent.state === 'frightened') {
        if (this.time.now >= agent.frightenedEndTime) {
          agent.state = this.scatterMode ? 'scatter' : 'chase';
          agent.setTexture(`agent_${agent.agentType}`);
          this.playSound(SOUND_KEYS.ENEMY_ALERT);
        } else if (this.time.now >= agent.frightenedEndTime - GAME_CONFIG.AGENTS.FRIGHTENED_WARNING) {
          // Flash warning
          const flash = Math.floor((agent.frightenedEndTime - this.time.now) / 200) % 2 === 0;
          agent.setTexture(flash ? 'agent_frightened_warning' : 'agent_frightened');
        }
      }

      // Check if returning agent reached home
      if (agent.state === 'returning') {
        const distToHome = Phaser.Math.Distance.Between(
          agent.x, agent.y,
          agent.homePosition.x, agent.homePosition.y
        );
        if (distToHome < GAME_CONFIG.TILE_SIZE) {
          agent.x = agent.homePosition.x;
          agent.y = agent.homePosition.y;
          agent.state = this.scatterMode ? 'scatter' : 'chase';
          agent.setTexture(`agent_${agent.agentType}`);
        }
      }

      // Get speed with difficulty scaling
      const levelMultiplier = 1 + (this.level - 1) * GAME_CONFIG.AGENTS.SPEED_INCREASE_PER_LEVEL;
      let speed = GAME_CONFIG.AGENTS.SPEED_NORMAL * levelMultiplier;
      if (agent.state === 'frightened') {
        speed = GAME_CONFIG.AGENTS.SPEED_FRIGHTENED;
      } else if (agent.state === 'returning') {
        speed = GAME_CONFIG.AGENTS.SPEED_RETURNING;
      }

      // Move agent
      this.moveAgent(agent, speed * (delta / 1000));
    });
  }

  private moveAgent(agent: Agent, speedPixelsPerSecond: number): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    // Complete current tile move if enough progress
    if (agent.moveProgress >= 1.0) {
      agent.moveProgress = 0;

      const dir = DIRECTIONS[agent.direction];
      const nextX = agent.gridX + dir.x;
      const nextY = agent.gridY + dir.y;

      // Handle tunnel wrap
      if (nextY === this.currentLayout.tunnelRow && (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS)) {
        agent.gridX = nextX < 0 ? GAME_CONFIG.MAZE_COLS - 1 : 0;
        agent.gridY = nextY;
      } else if (this.canMove(agent.gridX, agent.gridY, agent.direction, true)) {
        agent.gridX = nextX;
        agent.gridY = nextY;
      }
    }

    // Decide next direction at tile centres
    if (agent.moveProgress === 0) {
      // Get target based on state
      const target = this.getAgentTarget(agent);

      // Find best direction (prefer not to reverse)
      const reverse = this.reverseDirection(agent.direction);
      const directions: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
      let bestDir: Direction = agent.direction;
      let bestDist = Infinity;

      directions.forEach((dir) => {
        if (dir === reverse) return;
        if (!this.canMove(agent.gridX, agent.gridY, dir, true)) return;

        const nextTile = {
          x: agent.gridX + DIRECTIONS[dir].x,
          y: agent.gridY + DIRECTIONS[dir].y,
        };

        const dist = Phaser.Math.Distance.Between(nextTile.x, nextTile.y, target.x, target.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      });

      // Fallback: if no non-reverse direction is valid, allow reverse
      if (bestDist === Infinity && this.canMove(agent.gridX, agent.gridY, reverse, true)) {
        bestDir = reverse;
      }

      agent.direction = bestDir;
    }

    // Progress through current tile movement
    const tilesPerSecond = speedPixelsPerSecond / GAME_CONFIG.TILE_SIZE;
    agent.moveProgress += tilesPerSecond;

    if (agent.moveProgress > 1.0) {
      agent.moveProgress = 1.0;
    }

    // Interpolate position between grid tiles
    const offsetDir = DIRECTIONS[agent.direction];
    const nextGridX = agent.gridX + offsetDir.x;
    const nextGridY = agent.gridY + offsetDir.y;

    const currentX = offsetX + agent.gridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const currentY = offsetY + agent.gridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const nextX = offsetX + nextGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const nextY = offsetY + nextGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    agent.x = Phaser.Math.Interpolation.Linear([currentX, nextX], agent.moveProgress);
    agent.y = Phaser.Math.Interpolation.Linear([currentY, nextY], agent.moveProgress);
  }

  private getAgentTarget(agent: Agent): { x: number; y: number } {
    // R86.A2: inside-house override. Frightened + returning bypass this:
    //  - frightened keeps its random-walk target so power-pellet feel is
    //    preserved even if a power pellet is collected while an agent is
    //    still partly inside the house.
    //  - returning must reach its homePosition (that IS inside the house)
    //    so the "eat ghost → respawn" flow completes correctly.
    // All other states (scatter + chase) force the exit tile until the
    // agent has cleared the house bounds.
    if (
      agent.state !== 'frightened' &&
      agent.state !== 'returning' &&
      this.isInsideGhostHouse(agent.gridX, agent.gridY)
    ) {
      return GAME_CONFIG.GHOST_HOUSE.EXIT_TILE;
    }

    if (agent.state === 'scatter') {
      return agent.scatterTarget;
    }

    if (agent.state === 'returning') {
      const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
      const offsetY = 40;
      return {
        x: Math.round((agent.homePosition.x - offsetX) / GAME_CONFIG.TILE_SIZE),
        y: Math.round((agent.homePosition.y - offsetY) / GAME_CONFIG.TILE_SIZE),
      };
    }

    if (agent.state === 'frightened') {
      return {
        x: Phaser.Math.Between(0, GAME_CONFIG.MAZE_COLS - 1),
        y: Phaser.Math.Between(0, this.currentLayout.grid.length - 1),
      };
    }

    // Chase mode — depends on agent type
    const playerTile = this.getTilePosition(this.player.x, this.player.y);
    const playerDir = DIRECTIONS[this.playerDirection];

    switch (agent.agentType) {
      case 'smith': // Direct chase
        return playerTile;

      case 'brown': // Ambush — target 4 tiles ahead
        return {
          x: playerTile.x + playerDir.x * 4,
          y: playerTile.y + playerDir.y * 4,
        };

      case 'jones': // Patrol — switches between player and scatter
        if (Phaser.Math.Distance.Between(agent.x, agent.y, this.player.x, this.player.y) > 8 * GAME_CONFIG.TILE_SIZE) {
          return playerTile;
        }
        return agent.scatterTarget;

      case 'johnson': { // Flank — target opposite side of player from Smith
        const smithAgent = (this.agents.getChildren() as Agent[]).find((a) => a.agentType === 'smith');
        if (smithAgent) {
          const smithTile = this.getTilePosition(smithAgent.x, smithAgent.y);
          return {
            x: playerTile.x * 2 - smithTile.x,
            y: playerTile.y * 2 - smithTile.y,
          };
        }
        return playerTile;
      }

      default:
        return playerTile;
    }
  }

  private getTilePosition(x: number, y: number): { x: number; y: number } {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    return {
      x: Math.floor((x - offsetX) / GAME_CONFIG.TILE_SIZE),
      y: Math.floor((y - offsetY) / GAME_CONFIG.TILE_SIZE),
    };
  }

  /**
   * Agents can pass through ghost house tiles ('4'); the player cannot.
   */
  private canMove(tileX: number, tileY: number, direction: Direction, isAgent = false): boolean {
    const dir = DIRECTIONS[direction];
    const nextX = tileX + dir.x;
    const nextY = tileY + dir.y;

    // Bounds check
    if (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS || nextY < 0 || nextY >= this.currentLayout.grid.length) {
      // Allow tunnel
      if (nextY === this.currentLayout.tunnelRow && (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS)) {
        return true;
      }
      return false;
    }

    // Wall check
    const tile = this.currentLayout.grid[nextY]?.[nextX];
    if (tile === '1') return false;
    if (tile === '4' && !isAgent) return false;
    return true;
  }

  private reverseDirection(dir: Direction): Direction {
    switch (dir) {
      case 'UP': return 'DOWN';
      case 'DOWN': return 'UP';
      case 'LEFT': return 'RIGHT';
      case 'RIGHT': return 'LEFT';
      default: return dir;
    }
  }

  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.levelText.setText(`LEVEL: ${this.level}`);
    this.mapText.setText(`MAP: ${this.currentLayout.name}`);

    if (this.score >= 10000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_10000);
    }
  }

  shutdown(): void {
    this.stopBackgroundMusic();
    // Remove input listeners
    this.input.off('pointerdown');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    // Destroy groups
    this.walls.clear(true, true);
    this.dots.clear(true, true);
    this.powerPellets.clear(true, true);
    this.bulletTimeDots.clear(true, true);
    this.agents.clear(true, true);

    // Clean up bullet-time overlay
    this.bulletTimeOverlay?.destroy();
    this.bulletTimeOverlay = undefined;

    // Destroy fruit if exists
    if (this.fruit) {
      this.fruit.destroy();
      this.fruit = undefined;
    }

    // Destroy UI elements
    this.scoreText.destroy();
    this.livesText.destroy();
    this.levelText.destroy();
    this.mapText.destroy();
    super.shutdown();
  }
}
