/**
 * Agent Chase - Game Scene
 *
 * Pacman-style maze game:
 * - Navigate maze collecting dots
 * - Avoid agents (ghosts) with unique AI behaviours
 * - Power pellets make agents vulnerable
 * - Collect fruit for bonus points
 */

import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';
import { GAME_CONFIG, ACHIEVEMENTS, MAZE_LAYOUT } from '../config';

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

  // Game state
  private score = 0;
  private lives = 3;
  private level = 1;
  private dotsCollected = 0;
  private totalDots = 0;
  private ghostsEatenThisPellet = 0;
  private diedThisLevel = false;

  // Maze
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private dots!: Phaser.Physics.Arcade.StaticGroup;
  private powerPellets!: Phaser.Physics.Arcade.StaticGroup;

  // Agents
  private agents!: Phaser.Physics.Arcade.Group;
  private agentReleaseIndex = 0;
  private nextReleaseTime = 0;

  // Fruit
  private fruit?: Phaser.Physics.Arcade.Sprite;
  private fruitSpawned = [false, false];

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

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
    this.nextReleaseTime = 0;
    this.fruitSpawned = [false, false];
    this.playerDirection = 'LEFT';
    this.nextDirection = 'NONE';
    this.mouthOpen = true;
    this.animTimer = 0;

    // Create groups
    this.walls = this.physics.add.staticGroup();
    this.dots = this.physics.add.staticGroup();
    this.powerPellets = this.physics.add.staticGroup();
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
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update animation
    this.animTimer += delta;
    if (this.animTimer > 100) {
      this.animTimer = 0;
      this.mouthOpen = !this.mouthOpen;
      this.player.setTexture(this.mouthOpen ? 'player_open' : 'player_closed');
    }

    // Handle input
    this.handleInput();

    // Move player
    this.movePlayer(delta);

    // Update mode timing
    this.updateModes(delta);

    // Release agents
    this.releaseAgents(time);

    // Update agents
    this.updateAgents(delta);

    // Check level complete
    this.checkLevelComplete();

    // Update UI
    this.updateUI();
  }

  /**
   * Build maze from layout
   */
  private buildMaze(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    for (let row = 0; row < MAZE_LAYOUT.length; row++) {
      for (let col = 0; col < MAZE_LAYOUT[row].length; col++) {
        const tile = MAZE_LAYOUT[row][col];
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
            // Add pulsing animation
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

  /**
   * Create player
   */
  private createPlayer(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    // Player starts at row 23, col 14 (below ghost house)
    const x = offsetX + 13.5 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const y = offsetY + 23 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    this.player = this.physics.add.sprite(x, y, 'player_open');
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(false);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(GAME_CONFIG.PLAYER.SIZE - 2, GAME_CONFIG.PLAYER.SIZE - 2);
  }

  /**
   * Create all agents
   */
  private createAgents(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;
    const houseX = offsetX + 14 * GAME_CONFIG.TILE_SIZE;
    const houseY = offsetY + 14 * GAME_CONFIG.TILE_SIZE;

    const agentConfigs: Array<{
      type: 'smith' | 'brown' | 'jones' | 'johnson';
      startX: number;
      startY: number;
      scatterTarget: { x: number; y: number };
    }> = [
      { type: 'smith', startX: houseX, startY: houseY - GAME_CONFIG.TILE_SIZE * 3, scatterTarget: { x: 25, y: 0 } },
      { type: 'brown', startX: houseX, startY: houseY, scatterTarget: { x: 2, y: 0 } },
      { type: 'jones', startX: houseX - GAME_CONFIG.TILE_SIZE, startY: houseY, scatterTarget: { x: 27, y: 30 } },
      { type: 'johnson', startX: houseX + GAME_CONFIG.TILE_SIZE, startY: houseY, scatterTarget: { x: 0, y: 30 } },
    ];

    agentConfigs.forEach((config, index) => {
      const agent = this.agents.create(config.startX, config.startY, `agent_${config.type}`) as Agent;
      agent.agentType = config.type;
      agent.state = 'scatter';
      agent.direction = 'LEFT';
      agent.targetTile = { x: 14, y: 11 };
      agent.scatterTarget = config.scatterTarget;
      agent.homePosition = { x: config.startX, y: config.startY };
      agent.isReleased = index === 0; // Only Smith starts released
      agent.frightenedEndTime = 0;
      agent.setDepth(9);

      const body = agent.body as Phaser.Physics.Arcade.Body;
      body.setSize(GAME_CONFIG.PLAYER.SIZE - 2, GAME_CONFIG.PLAYER.SIZE - 2);
    });
  }

  /**
   * Create UI
   */
  private createUI(): void {
    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.PRIMARY_HEX,
    });
    this.scoreText.setDepth(100);

    this.livesText = this.add.text(200, 10, 'LIVES: 3', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.YELLOW_HEX,
    });
    this.livesText.setDepth(100);

    this.levelText = this.add.text(400, 10, 'LEVEL: 1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: MATRIX_COLORS.CYAN_HEX,
    });
    this.levelText.setDepth(100);
  }

  /**
   * Setup input
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
   * Handle input
   */
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

  /**
   * Move player
   */
  private movePlayer(delta: number): void {
    const speed = GAME_CONFIG.PLAYER.SPEED * (delta / 1000);
    const tile = this.getTilePosition(this.player.x, this.player.y);

    // Check if we can turn
    if (this.nextDirection !== 'NONE' && this.canMove(tile.x, tile.y, this.nextDirection)) {
      this.playerDirection = this.nextDirection;
      this.nextDirection = 'NONE';

      // Update rotation
      this.updatePlayerRotation();
    }

    // Move in current direction
    if (this.canMove(tile.x, tile.y, this.playerDirection)) {
      const dir = DIRECTIONS[this.playerDirection];
      this.player.x += dir.x * speed;
      this.player.y += dir.y * speed;
    }

    // Handle tunnel wrap
    this.handleTunnelWrap();
  }

  /**
   * Update player rotation based on direction
   */
  private updatePlayerRotation(): void {
    switch (this.playerDirection) {
      case 'UP': this.player.setAngle(-90); break;
      case 'DOWN': this.player.setAngle(90); break;
      case 'LEFT': this.player.setAngle(180); break;
      case 'RIGHT': this.player.setAngle(0); break;
    }
  }

  /**
   * Handle tunnel wrap around
   */
  private handleTunnelWrap(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;

    if (this.player.x < offsetX - GAME_CONFIG.TILE_SIZE) {
      this.player.x = offsetX + GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE;
    } else if (this.player.x > offsetX + GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE) {
      this.player.x = offsetX;
    }
  }

  /**
   * Setup collisions
   */
  private setupCollisions(): void {
    // Player vs walls
    this.physics.add.collider(this.player, this.walls);

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

    // Player vs agents
    this.physics.add.overlap(
      this.player,
      this.agents,
      (_player, agent) => this.handleAgentCollision(agent as Agent),
      undefined,
      this
    );
  }

  /**
   * Collect dot
   */
  private collectDot(dot: Phaser.Physics.Arcade.Sprite): void {
    dot.destroy();
    this.score += GAME_CONFIG.SCORING.DOT;
    this.dotsCollected++;
    this.playSound('wakaWaka');

    if (this.dotsCollected === 1) {
      this.unlockAchievement(ACHIEVEMENTS.FIRST_DOT);
    }

    this.checkFruitSpawn();
  }

  /**
   * Collect power pellet
   */
  private collectPowerPellet(pellet: Phaser.Physics.Arcade.Sprite): void {
    pellet.destroy();
    this.score += GAME_CONFIG.SCORING.POWER_PELLET;
    this.dotsCollected++;
    this.ghostsEatenThisPellet = 0;
    this.playSound('powerup');

    // Frighten all agents
    const frightenedEndTime = this.time.now + GAME_CONFIG.AGENTS.FRIGHTENED_DURATION;

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

  /**
   * Handle collision with agent
   */
  private handleAgentCollision(agent: Agent): void {
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

  /**
   * Player death
   */
  private playerDeath(): void {
    this.lives--;
    this.diedThisLevel = true;
    this.playSound('hit');

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Reset positions
      this.resetPositions();
    }
  }

  /**
   * Reset player and agent positions
   */
  private resetPositions(): void {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    // Reset player
    this.player.x = offsetX + 13.5 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    this.player.y = offsetY + 23 * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    this.playerDirection = 'LEFT';
    this.nextDirection = 'NONE';
    this.player.setAngle(180);

    // Reset agents
    this.agents.getChildren().forEach((obj, index) => {
      const agent = obj as Agent;
      agent.x = agent.homePosition.x;
      agent.y = agent.homePosition.y;
      agent.state = 'scatter';
      agent.isReleased = index === 0;
      agent.setTexture(`agent_${agent.agentType}`);
    });

    this.agentReleaseIndex = 1;
    this.nextReleaseTime = this.time.now + GAME_CONFIG.AGENTS.RELEASE_INTERVAL;
    this.scatterMode = true;
    this.modePhase = 0;
    this.modeTimer = 0;
  }

  /**
   * Game over
   */
  private gameOver(): void {
    this.reportScore(this.score, this.score);
    this.scene.start(SCENE_KEYS.GAME_OVER, {
      score: this.score,
      highScore: this.score,
      reason: `Level ${this.level}`,
    });
  }

  /**
   * Check if level is complete
   */
  private checkLevelComplete(): void {
    if (this.dotsCollected >= this.totalDots) {
      // Level complete
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

      // Restart level
      this.restartLevel();
    }
  }

  /**
   * Restart level with harder settings
   */
  private restartLevel(): void {
    // Clear existing
    this.dots.clear(true, true);
    this.powerPellets.clear(true, true);
    if (this.fruit) {
      this.fruit.destroy();
      this.fruit = undefined;
    }

    // Rebuild maze dots
    this.dotsCollected = 0;
    this.totalDots = 0;
    this.fruitSpawned = [false, false];
    this.diedThisLevel = false;

    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    for (let row = 0; row < MAZE_LAYOUT.length; row++) {
      for (let col = 0; col < MAZE_LAYOUT[row].length; col++) {
        const tile = MAZE_LAYOUT[row][col];
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

    this.resetPositions();
  }

  /**
   * Check if fruit should spawn
   */
  private checkFruitSpawn(): void {
    if (this.dotsCollected === GAME_CONFIG.FRUIT.FIRST_SPAWN && !this.fruitSpawned[0]) {
      this.spawnFruit();
      this.fruitSpawned[0] = true;
    } else if (this.dotsCollected === GAME_CONFIG.FRUIT.SECOND_SPAWN && !this.fruitSpawned[1]) {
      this.spawnFruit();
      this.fruitSpawned[1] = true;
    }
  }

  /**
   * Spawn fruit
   */
  private spawnFruit(): void {
    if (this.fruit) return;

    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;
    const x = offsetX + 14 * GAME_CONFIG.TILE_SIZE;
    const y = offsetY + 17 * GAME_CONFIG.TILE_SIZE;

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

  /**
   * Collect fruit
   */
  private collectFruit(): void {
    if (!this.fruit) return;

    const fruitIndex = Math.min(this.level - 1, 5);
    this.score += GAME_CONFIG.SCORING.FRUIT[fruitIndex];
    this.playSound('score');
    this.unlockAchievement(ACHIEVEMENTS.COLLECT_FRUIT);

    this.fruit.destroy();
    this.fruit = undefined;
  }

  /**
   * Update scatter/chase mode timing
   */
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
   * Release agents from house
   */
  private releaseAgents(time: number): void {
    if (this.agentReleaseIndex >= 4) return;

    if (time >= this.nextReleaseTime) {
      const agents = this.agents.getChildren() as Agent[];
      if (agents[this.agentReleaseIndex]) {
        agents[this.agentReleaseIndex].isReleased = true;
      }
      this.agentReleaseIndex++;
      this.nextReleaseTime = time + GAME_CONFIG.AGENTS.RELEASE_INTERVAL;
    }
  }

  /**
   * Update all agents
   */
  private updateAgents(delta: number): void {
    this.agents.getChildren().forEach((obj) => {
      const agent = obj as Agent;
      if (!agent.isReleased) return;

      // Check frightened state
      if (agent.state === 'frightened') {
        if (this.time.now >= agent.frightenedEndTime) {
          agent.state = this.scatterMode ? 'scatter' : 'chase';
          agent.setTexture(`agent_${agent.agentType}`);
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
          agent.homePosition.x, agent.homePosition.y - GAME_CONFIG.TILE_SIZE * 3
        );
        if (distToHome < 5) {
          agent.state = this.scatterMode ? 'scatter' : 'chase';
          agent.setTexture(`agent_${agent.agentType}`);
        }
      }

      // Get speed
      let speed = GAME_CONFIG.AGENTS.SPEED_NORMAL;
      if (agent.state === 'frightened') {
        speed = GAME_CONFIG.AGENTS.SPEED_FRIGHTENED;
      } else if (agent.state === 'returning') {
        speed = GAME_CONFIG.AGENTS.SPEED_RETURNING;
      }

      // Move agent
      this.moveAgent(agent, speed * (delta / 1000));
    });
  }

  /**
   * Move agent with AI
   */
  private moveAgent(agent: Agent, speed: number): void {
    const tile = this.getTilePosition(agent.x, agent.y);

    // At tile center, decide next direction
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;
    const tileCenterX = offsetX + tile.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const tileCenterY = offsetY + tile.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    const atCenter = Math.abs(agent.x - tileCenterX) < 2 && Math.abs(agent.y - tileCenterY) < 2;

    if (atCenter) {
      // Snap to center
      agent.x = tileCenterX;
      agent.y = tileCenterY;

      // Get target based on state
      const target = this.getAgentTarget(agent);

      // Find best direction (can't reverse unless at intersection)
      const reverse = this.reverseDirection(agent.direction);
      const directions: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
      let bestDir: Direction = agent.direction;
      let bestDist = Infinity;

      directions.forEach((dir) => {
        if (dir === reverse) return; // Can't reverse
        if (!this.canMove(tile.x, tile.y, dir)) return;

        const nextTile = {
          x: tile.x + DIRECTIONS[dir].x,
          y: tile.y + DIRECTIONS[dir].y,
        };

        const dist = Phaser.Math.Distance.Between(nextTile.x, nextTile.y, target.x, target.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      });

      agent.direction = bestDir;
    }

    // Move in current direction
    const dir = DIRECTIONS[agent.direction];
    agent.x += dir.x * speed;
    agent.y += dir.y * speed;

    // Handle tunnel
    if (agent.x < offsetX - GAME_CONFIG.TILE_SIZE) {
      agent.x = offsetX + GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE;
    } else if (agent.x > offsetX + GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE) {
      agent.x = offsetX;
    }
  }

  /**
   * Get target tile for agent based on state and type
   */
  private getAgentTarget(agent: Agent): { x: number; y: number } {
    if (agent.state === 'scatter') {
      return agent.scatterTarget;
    }

    if (agent.state === 'returning') {
      return { x: 14, y: 11 }; // Ghost house entrance
    }

    if (agent.state === 'frightened') {
      // Random direction
      return {
        x: Phaser.Math.Between(0, 27),
        y: Phaser.Math.Between(0, 30),
      };
    }

    // Chase mode - depends on agent type
    const playerTile = this.getTilePosition(this.player.x, this.player.y);
    const playerDir = DIRECTIONS[this.playerDirection];

    switch (agent.agentType) {
      case 'smith': // Direct chase
        return playerTile;

      case 'brown': // Ambush - target 4 tiles ahead
        return {
          x: playerTile.x + playerDir.x * 4,
          y: playerTile.y + playerDir.y * 4,
        };

      case 'jones': // Patrol - switches between player and scatter
        if (Phaser.Math.Distance.Between(agent.x, agent.y, this.player.x, this.player.y) > 8 * GAME_CONFIG.TILE_SIZE) {
          return playerTile;
        }
        return agent.scatterTarget;

      case 'johnson': { // Flank - target opposite side of player from Smith
        const smithAgent = (this.agents.getChildren() as Agent[]).find((a) => a.agentType === 'smith');
        if (smithAgent) {
          return {
            x: playerTile.x * 2 - this.getTilePosition(smithAgent.x, smithAgent.y).x,
            y: playerTile.y * 2 - this.getTilePosition(smithAgent.x, smithAgent.y).y,
          };
        }
        return playerTile;
      }

      default:
        return playerTile;
    }
  }

  /**
   * Get tile position from world coordinates
   */
  private getTilePosition(x: number, y: number): { x: number; y: number } {
    const offsetX = (GAME_CONFIG.WIDTH - GAME_CONFIG.MAZE_COLS * GAME_CONFIG.TILE_SIZE) / 2;
    const offsetY = 40;

    return {
      x: Math.floor((x - offsetX) / GAME_CONFIG.TILE_SIZE),
      y: Math.floor((y - offsetY) / GAME_CONFIG.TILE_SIZE),
    };
  }

  /**
   * Check if movement in direction is valid
   */
  private canMove(tileX: number, tileY: number, direction: Direction): boolean {
    const dir = DIRECTIONS[direction];
    const nextX = tileX + dir.x;
    const nextY = tileY + dir.y;

    // Bounds check
    if (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS || nextY < 0 || nextY >= MAZE_LAYOUT.length) {
      // Allow tunnel
      if (nextY === 14 && (nextX < 0 || nextX >= GAME_CONFIG.MAZE_COLS)) {
        return true;
      }
      return false;
    }

    // Wall check
    const tile = MAZE_LAYOUT[nextY]?.[nextX];
    return tile !== '1' && tile !== '4';
  }

  /**
   * Get reverse direction
   */
  private reverseDirection(dir: Direction): Direction {
    switch (dir) {
      case 'UP': return 'DOWN';
      case 'DOWN': return 'UP';
      case 'LEFT': return 'RIGHT';
      case 'RIGHT': return 'LEFT';
      default: return dir;
    }
  }

  /**
   * Update UI
   */
  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.levelText.setText(`LEVEL: ${this.level}`);

    if (this.score >= 10000) {
      this.unlockAchievement(ACHIEVEMENTS.SCORE_10000);
    }
  }
}
