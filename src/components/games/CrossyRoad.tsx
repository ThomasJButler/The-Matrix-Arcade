/**
 * @file CrossyRoad.tsx
 * @description Matrix-themed Crossy Road game - escape through digital highways
 * @author Ralph (AI Agent)
 *
 * A lane-based endless runner where players hop through obstacles to score distance.
 * Features Matrix-themed visuals including Agents, Sentinels, code debris, and data streams.
 *
 * Technical Implementation:
 * - Canvas: 400x600 (portrait)
 * - Lane-based grid movement system (20px cells)
 * - Scrolling obstacles at varying speeds per lane
 * - Power-ups: Bullet Time, Ghost Mode, Magnet, Shield
 * - Matrix rain background effect at 30fps
 *
 * Controls:
 * - WASD/Arrows: Hop in direction
 * - SPACE: Activate Bullet Time (when available)
 * - P: Pause | R: Restart | Enter: Start
 * - ESC: Exit (handled by App.tsx)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useParticleSystem } from '../../hooks/useParticleSystem';

// Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 20;
const GRID_COLS = CANVAS_WIDTH / CELL_SIZE; // 20
const GRID_ROWS = CANVAS_HEIGHT / CELL_SIZE; // 30
const PLAYER_START_ROW = Math.floor(GRID_ROWS * 0.85); // Start near bottom
const FRAME_TIME = 1000 / 60;
const MATRIX_RAIN_FRAME_TIME = 1000 / 30;

// Lane types
type LaneType = 'safe' | 'road' | 'water' | 'train' | 'data';

// Obstacle types
type ObstacleType = 'agent' | 'sentinel' | 'debris' | 'stream' | 'train';

// Power-up types
type PowerUpType = 'bulletTime' | 'ghost' | 'magnet' | 'shield';

// Game phase state machine
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

// Interfaces
interface Position {
  x: number;
  y: number;
}

interface Lane {
  type: LaneType;
  speed: number;
  direction: 1 | -1;
  obstacles: Obstacle[];
  colour: string;
}

interface Obstacle {
  x: number;
  width: number;
  type: ObstacleType;
  colour: string;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

interface RedPill {
  x: number;
  y: number;
  collected: boolean;
}

interface MatrixDrop {
  x: number;
  y: number;
  char: string;
  speed: number;
  opacity: number;
}

interface ActivePowerUps {
  bulletTime: number;
  ghost: number;
  magnet: number;
  shield: boolean;
}

interface CrossyRoadProps {
  achievementManager?: {
    unlockAchievement: (gameId: string, achievementId: string) => void;
  };
  isMuted?: boolean;
}

// Generate lane configuration based on distance from start
const generateLane = (rowIndex: number, distance: number): Lane => {
  // Safe zones at regular intervals
  if (rowIndex === PLAYER_START_ROW || rowIndex % 8 === 0) {
    return {
      type: 'safe',
      speed: 0,
      direction: 1,
      obstacles: [],
      colour: '#001100'
    };
  }

  // Increase difficulty with distance
  const difficultyMultiplier = 1 + (distance / 200);
  const baseSpeed = 1 + Math.random() * 2 * difficultyMultiplier;
  const direction = Math.random() > 0.5 ? 1 : -1;

  // Random lane type weighted by distance
  const rand = Math.random();
  let type: LaneType;
  let colour: string;
  let obstacleType: ObstacleType;

  if (rand < 0.35) {
    type = 'road';
    colour = '#0a0a0a';
    obstacleType = 'agent';
  } else if (rand < 0.55) {
    type = 'data';
    colour = '#000808';
    obstacleType = 'stream';
  } else if (rand < 0.75) {
    type = 'road';
    colour = '#080808';
    obstacleType = 'debris';
  } else if (rand < 0.9) {
    type = 'water';
    colour = '#000505';
    obstacleType = 'sentinel';
  } else {
    type = 'train';
    colour = '#050000';
    obstacleType = 'train';
  }

  // Generate obstacles for lane - count increases with distance for progressive difficulty
  // Base: 2-4 obstacles, scaling to 3-6 at distance 500+
  const difficultyTier = Math.min(Math.floor(distance / 200), 3); // 0-3 tiers
  const baseCount = 2 + difficultyTier;
  const obstacleCount = baseCount + Math.floor(Math.random() * (2 + difficultyTier));
  const obstacles: Obstacle[] = [];
  const minGap = Math.max(50, 80 - difficultyTier * 10); // Tighter gaps at higher difficulty

  for (let i = 0; i < obstacleCount; i++) {
    const width = obstacleType === 'train' ? 120 : (20 + Math.random() * 40);
    obstacles.push({
      x: i * (CANVAS_WIDTH / obstacleCount) + Math.random() * minGap,
      width,
      type: obstacleType,
      colour: getObstacleColour(obstacleType)
    });
  }

  return {
    type,
    speed: baseSpeed,
    direction: direction as 1 | -1,
    obstacles,
    colour
  };
};

const getObstacleColour = (type: ObstacleType): string => {
  switch (type) {
    case 'agent': return '#FFFFFF';
    case 'sentinel': return '#FF0000';
    case 'debris': return '#444444';
    case 'stream': return '#00FFFF';
    case 'train': return '#FF4400';
    default: return '#00FF00';
  }
};

const getPowerUpColour = (type: PowerUpType): string => {
  switch (type) {
    case 'bulletTime': return '#FFFF00';
    case 'ghost': return '#00FFFF';
    case 'magnet': return '#FF00FF';
    case 'shield': return '#00FF00';
    default: return '#FFFFFF';
  }
};

export default function CrossyRoad({ achievementManager, isMuted = false }: CrossyRoadProps) {
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(1);

  // Player state
  const [playerPos, setPlayerPos] = useState<Position>({ x: Math.floor(GRID_COLS / 2), y: PLAYER_START_ROW });
  const [isHopping, setIsHopping] = useState(false);

  // World state
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [redPills, setRedPills] = useState<RedPill[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [matrixDrops, setMatrixDrops] = useState<MatrixDrop[]>([]);
  const [cameraOffset, setCameraOffset] = useState(0);

  // Active power-ups
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUps>({
    bulletTime: 0,
    ghost: 0,
    magnet: 0,
    shield: false
  });

  // Achievement tracking refs
  const maxDistanceRef = useRef(0);
  const redPillsCollectedRef = useRef(0);
  const dodgeCountRef = useRef(0);
  const bulletTimeUsedRef = useRef(0);
  const hasFirstHopRef = useRef(false);
  const deathCountRef = useRef(0);

  // Timing refs
  const lastMatrixRainRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();
  const { playSFX } = useSoundSystem();
  const { explode, createTrail, render: renderParticles } = useParticleSystem();

  // Sound wrapper pattern
  const playSound = useCallback((sound: string) => {
    if (!isMuted) playSFX(sound);
  }, [isMuted, playSFX]);

  // Achievement unlock pattern (dual-call)
  const unlockGameAchievement = useCallback((achievementId: string) => {
    achievementManager?.unlockAchievement('crossyRoad', achievementId);
    unlockSaveAchievement('crossyRoad', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Load high score
  useEffect(() => {
    if (saveData?.games?.crossyRoad?.highScore) {
      setHighScore(saveData.games.crossyRoad.highScore);
    }
  }, [saveData]);

  // Initialise game world
  const initializeGame = useCallback(() => {
    // Generate initial lanes
    const newLanes: Lane[] = [];
    for (let i = 0; i < GRID_ROWS + 10; i++) {
      newLanes.push(generateLane(i, 0));
    }
    setLanes(newLanes);

    // Reset player
    setPlayerPos({ x: Math.floor(GRID_COLS / 2), y: PLAYER_START_ROW });
    setCameraOffset(0);
    setScore(0);
    setLives(1);
    setRedPills([]);
    setPowerUps([]);
    setIsHopping(false);

    // Reset power-ups
    setActivePowerUps({
      bulletTime: 0,
      ghost: 0,
      magnet: 0,
      shield: false
    });

    // Reset achievement tracking
    maxDistanceRef.current = 0;
    redPillsCollectedRef.current = 0;
    dodgeCountRef.current = 0;
    bulletTimeUsedRef.current = 0;
    hasFirstHopRef.current = false;
    deathCountRef.current = 0;

    // Initialise matrix rain
    const drops: MatrixDrop[] = [];
    for (let i = 0; i < 30; i++) {
      drops.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
        speed: 1 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.3
      });
    }
    setMatrixDrops(drops);
  }, []);

  // Handle player hop
  const hop = useCallback((dx: number, dy: number) => {
    if (gamePhase !== 'playing' || isHopping) return;

    setIsHopping(true);

    setPlayerPos(prev => {
      const newX = Math.max(0, Math.min(GRID_COLS - 1, prev.x + dx));
      const newY = Math.max(0, Math.min(GRID_ROWS - 1, prev.y + dy));

      // Track first hop achievement
      if (!hasFirstHopRef.current) {
        hasFirstHopRef.current = true;
        unlockGameAchievement('crossy_first_hop');
      }

      // Track forward progress
      if (dy < 0) {
        const distance = PLAYER_START_ROW - newY + Math.floor(cameraOffset / CELL_SIZE);
        if (distance > maxDistanceRef.current) {
          maxDistanceRef.current = distance;
          setScore(distance);

          // Distance achievements
          if (distance >= 100) unlockGameAchievement('crossy_100_distance');
          if (distance >= 500) unlockGameAchievement('crossy_500_distance');

          // No death achievement check
          if (distance >= 50 && deathCountRef.current === 0) {
            unlockGameAchievement('crossy_no_death_50');
          }
        }
      }

      return { x: newX, y: newY };
    });

    playSound('jump');
    createTrail(playerPos.x * CELL_SIZE + CELL_SIZE / 2, playerPos.y * CELL_SIZE + CELL_SIZE / 2, '#00FF00');

    // Reset hopping state after animation
    setTimeout(() => setIsHopping(false), 100);
  }, [gamePhase, isHopping, playSound, createTrail, playerPos, cameraOffset, unlockGameAchievement]);

  // Activate bullet time power-up
  const activateBulletTime = useCallback(() => {
    if (gamePhase !== 'playing') return;

    setActivePowerUps(prev => ({
      ...prev,
      bulletTime: Date.now() + 5000 // 5 second duration
    }));

    bulletTimeUsedRef.current++;
    if (bulletTimeUsedRef.current >= 5) {
      unlockGameAchievement('crossy_bullet_time');
    }

    playSound('powerupBulletTime');
  }, [gamePhase, playSound, unlockGameAchievement]);

  // Handle player death
  const handleDeath = useCallback(() => {
    if (activePowerUps.shield) {
      setActivePowerUps(prev => ({ ...prev, shield: false }));
      playSound('hit');
      // Shield break visual feedback - green particle burst around player
      explode(playerPos.x * CELL_SIZE + CELL_SIZE / 2, playerPos.y * CELL_SIZE + CELL_SIZE / 2, '#00FF00');
      return;
    }

    if (activePowerUps.ghost > Date.now()) {
      return; // Ghost mode active, ignore collision
    }

    deathCountRef.current++;
    setLives(prev => prev - 1);
    playSound('hit');
    explode(playerPos.x * CELL_SIZE + CELL_SIZE / 2, playerPos.y * CELL_SIZE + CELL_SIZE / 2, '#FF0000');

    if (lives <= 1) {
      setGamePhase('gameOver');
      playSound('gameOver');

      // Save score
      const newHighScore = Math.max(score, highScore);
      setHighScore(newHighScore);
      updateGameSave('crossyRoad', {
        highScore: newHighScore,
        stats: {
          gamesPlayed: (saveData?.games?.crossyRoad?.stats?.gamesPlayed || 0) + 1,
          totalScore: (saveData?.games?.crossyRoad?.stats?.totalScore || 0) + score,
        }
      });
    }
  }, [activePowerUps, lives, playerPos, playSound, explode, score, highScore, updateGameSave, saveData]);

  // Check collision with obstacles
  const checkCollision = useCallback((playerX: number, playerY: number): boolean => {
    const worldY = playerY + Math.floor(cameraOffset / CELL_SIZE);
    if (worldY < 0 || worldY >= lanes.length) return false;

    const lane = lanes[worldY];
    if (!lane || lane.type === 'safe') return false;

    const playerLeft = playerX * CELL_SIZE + 2;
    const playerRight = (playerX + 1) * CELL_SIZE - 2;

    for (const obstacle of lane.obstacles) {
      const obsLeft = obstacle.x;
      const obsRight = obstacle.x + obstacle.width;

      // Check for actual collision
      if (playerRight > obsLeft && playerLeft < obsRight) {
        return true;
      }

      // Near miss tracking for dodge achievement - player narrowly avoided obstacle
      // Check if player just passed by obstacle edge (within 15px) without colliding
      const nearMissLeft = playerRight > obsLeft - 15 && playerRight <= obsLeft;
      const nearMissRight = playerLeft < obsRight + 15 && playerLeft >= obsRight;

      if (nearMissLeft || nearMissRight) {
        dodgeCountRef.current++;
        if (dodgeCountRef.current >= 10) {
          unlockGameAchievement('crossy_dodge_10');
        }
      }
    }

    return false;
  }, [lanes, cameraOffset, unlockGameAchievement]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      switch (key) {
        case 'enter':
          if (gamePhase === 'menu' || gamePhase === 'gameOver') {
            initializeGame();
            setGamePhase('playing');
          }
          break;
        case 'p':
          if (gamePhase === 'playing') {
            setGamePhase('paused');
          } else if (gamePhase === 'paused') {
            setGamePhase('playing');
          }
          break;
        case 'r':
          if (gamePhase === 'gameOver' || gamePhase === 'paused') {
            initializeGame();
            setGamePhase('playing');
          }
          break;
        case 'w':
        case 'arrowup':
          e.preventDefault();
          hop(0, -1);
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          hop(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          hop(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          hop(1, 0);
          break;
        case ' ':
          e.preventDefault();
          activateBulletTime();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, hop, initializeGame, activateBulletTime]);

  // Main game loop
  useGameLoop((deltaTime) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();

    // Calculate speed modifier from bullet time
    const speedModifier = activePowerUps.bulletTime > Date.now() ? 0.3 : 1;
    const normalizedDelta = (deltaTime / FRAME_TIME) * speedModifier;

    // Update lane obstacles
    setLanes(prevLanes => {
      return prevLanes.map(lane => {
        if (lane.type === 'safe') return lane;

        const updatedObstacles = lane.obstacles.map(obs => {
          let newX = obs.x + lane.speed * lane.direction * normalizedDelta;

          // Wrap around screen
          if (lane.direction === 1 && newX > CANVAS_WIDTH) {
            newX = -obs.width;
          } else if (lane.direction === -1 && newX + obs.width < 0) {
            newX = CANVAS_WIDTH;
          }

          return { ...obs, x: newX };
        });

        return { ...lane, obstacles: updatedObstacles };
      });
    });

    // Update camera when player approaches top
    if (playerPos.y < Math.floor(GRID_ROWS * 0.4)) {
      const targetOffset = cameraOffset + CELL_SIZE * 0.5;
      setCameraOffset(targetOffset);

      // Move player down visually
      setPlayerPos(prev => ({
        ...prev,
        y: prev.y + 0.5
      }));

      // Generate new lanes at top
      setLanes(prevLanes => {
        const newLanes = [...prevLanes];
        newLanes.shift(); // Remove bottom lane
        newLanes.push(generateLane(newLanes.length, maxDistanceRef.current)); // Add new top lane
        return newLanes;
      });

      // Occasionally spawn red pills
      if (Math.random() < 0.3) {
        setRedPills(prev => [...prev, {
          x: Math.floor(Math.random() * GRID_COLS),
          y: 2,
          collected: false
        }]);
      }

      // Occasionally spawn power-ups
      if (Math.random() < 0.1) {
        const types: PowerUpType[] = ['bulletTime', 'ghost', 'magnet', 'shield'];
        setPowerUps(prev => [...prev, {
          x: Math.floor(Math.random() * GRID_COLS),
          y: 3,
          type: types[Math.floor(Math.random() * types.length)],
          collected: false
        }]);
      }
    }

    // Check collision
    if (checkCollision(playerPos.x, Math.floor(playerPos.y))) {
      handleDeath();
    }

    // Apply magnet effect - attract red pills toward player
    if (activePowerUps.magnet > Date.now()) {
      setRedPills(prev => {
        return prev.map(pill => {
          if (pill.collected) return pill;

          // Calculate distance to player
          const dx = playerPos.x - pill.x;
          const dy = playerPos.y - pill.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Attract pills within range (8 cells)
          if (distance < 8 && distance > 0.5) {
            const attractionSpeed = 0.15 * normalizedDelta;
            return {
              ...pill,
              x: pill.x + (dx / distance) * attractionSpeed,
              y: pill.y + (dy / distance) * attractionSpeed
            };
          }
          return pill;
        });
      });
    }

    // Collect red pills
    setRedPills(prev => {
      return prev.map(pill => {
        if (!pill.collected &&
            Math.abs(pill.x - playerPos.x) < 1 &&
            Math.abs(pill.y - playerPos.y) < 1) {
          redPillsCollectedRef.current++;
          setScore(s => s + 5);
          playSound('score');

          if (redPillsCollectedRef.current >= 10) {
            unlockGameAchievement('crossy_red_pills_10');
          }

          return { ...pill, collected: true };
        }
        return pill;
      }).filter(pill => !pill.collected);
    });

    // Collect power-ups
    setPowerUps(prev => {
      return prev.map(powerUp => {
        if (!powerUp.collected &&
            Math.abs(powerUp.x - playerPos.x) < 1 &&
            Math.abs(powerUp.y - playerPos.y) < 1) {
          // Play distinct sound per power-up type
          switch (powerUp.type) {
            case 'bulletTime':
              playSound('powerupBulletTime');
              setActivePowerUps(p => ({ ...p, bulletTime: Date.now() + 5000 }));
              break;
            case 'ghost':
              playSound('powerupGhost');
              setActivePowerUps(p => ({ ...p, ghost: Date.now() + 3000 }));
              break;
            case 'shield':
              playSound('powerupShield');
              setActivePowerUps(p => ({ ...p, shield: true }));
              break;
            case 'magnet':
              playSound('powerupMagnet');
              setActivePowerUps(p => ({ ...p, magnet: Date.now() + 5000 }));
              break;
          }

          return { ...powerUp, collected: true };
        }
        return powerUp;
      }).filter(p => !p.collected);
    });

    // Update matrix rain (throttled to 30fps)
    if (now - lastMatrixRainRef.current >= MATRIX_RAIN_FRAME_TIME) {
      lastMatrixRainRef.current = now;

      setMatrixDrops(prev => prev.map(drop => {
        const newY = drop.y + drop.speed;
        if (newY > CANVAS_HEIGHT) {
          return {
            x: Math.random() * CANVAS_WIDTH,
            y: 0,
            char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
            speed: 1 + Math.random() * 3,
            opacity: 0.1 + Math.random() * 0.3
          };
        }
        return { ...drop, y: newY };
      }));
    }

    // Render
    render(ctx, now);
  });

  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw matrix rain background
    ctx.font = '12px monospace';
    matrixDrops.forEach(drop => {
      ctx.fillStyle = `rgba(0, 255, 0, ${drop.opacity})`;
      ctx.fillText(drop.char, drop.x, drop.y);
    });

    // Draw lanes
    lanes.forEach((lane, index) => {
      const y = index * CELL_SIZE;

      // Lane background
      ctx.fillStyle = lane.colour;
      ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);

      // Lane markings for roads
      if (lane.type === 'road') {
        ctx.strokeStyle = '#003300';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, y + CELL_SIZE / 2);
        ctx.lineTo(CANVAS_WIDTH, y + CELL_SIZE / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw obstacles
      lane.obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.colour;

        // Different shapes for different obstacle types
        if (obstacle.type === 'agent') {
          // Agent: humanoid shape
          ctx.fillRect(obstacle.x + 5, y + 2, obstacle.width - 10, CELL_SIZE - 4);
          ctx.fillStyle = '#000000';
          // Animated blinking eyes - blink for 100ms every 2-3 seconds (randomised per agent)
          const blinkCycle = 2500 + ((obstacle.x * 17) % 1000); // Pseudo-random blink timing per agent
          const blinkPhase = timestamp % blinkCycle;
          const isBlinking = blinkPhase < 100;
          const eyeHeight = isBlinking ? 1 : 3;
          const eyeY = isBlinking ? y + 5 : y + 4;
          ctx.fillRect(obstacle.x + 8, eyeY, 3, eyeHeight); // Left eye
          ctx.fillRect(obstacle.x + obstacle.width - 15, eyeY, 3, eyeHeight); // Right eye
        } else if (obstacle.type === 'sentinel') {
          // Sentinel: mechanical spider shape
          ctx.beginPath();
          ctx.arc(obstacle.x + obstacle.width / 2, y + CELL_SIZE / 2, obstacle.width / 4, 0, Math.PI * 2);
          ctx.fill();
          // Tentacles
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + timestamp * 0.001;
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width / 2, y + CELL_SIZE / 2);
            ctx.lineTo(
              obstacle.x + obstacle.width / 2 + Math.cos(angle) * obstacle.width / 2,
              y + CELL_SIZE / 2 + Math.sin(angle) * CELL_SIZE / 2
            );
            ctx.strokeStyle = obstacle.colour;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else if (obstacle.type === 'stream') {
          // Data stream: flowing lines
          ctx.strokeStyle = obstacle.colour;
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, y + 5 + i * 5);
            ctx.lineTo(obstacle.x + obstacle.width, y + 5 + i * 5);
            ctx.stroke();
          }
        } else if (obstacle.type === 'train') {
          // Train: long vehicle
          ctx.fillRect(obstacle.x, y + 2, obstacle.width, CELL_SIZE - 4);
          ctx.fillStyle = '#FFFF00';
          ctx.fillRect(obstacle.x + 5, y + 5, 5, 5); // Window
          ctx.fillRect(obstacle.x + obstacle.width - 15, y + 5, 5, 5); // Window
        } else {
          // Debris: scattered blocks
          ctx.fillRect(obstacle.x, y + 4, obstacle.width, CELL_SIZE - 8);
        }
      });
    });

    // Draw red pills
    redPills.forEach(pill => {
      const x = pill.x * CELL_SIZE + CELL_SIZE / 2;
      const y = pill.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const x = powerUp.x * CELL_SIZE + CELL_SIZE / 2;
      const y = powerUp.y * CELL_SIZE + CELL_SIZE / 2;
      const colour = getPowerUpColour(powerUp.type);

      ctx.shadowBlur = 15;
      ctx.shadowColor = colour;
      ctx.fillStyle = colour;

      // Pulsing effect
      const pulse = Math.sin(timestamp * 0.005) * 0.3 + 0.7;
      const size = 8 * pulse;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.type[0].toUpperCase(), x, y);

      ctx.shadowBlur = 0;
    });

    // Draw player
    const playerX = playerPos.x * CELL_SIZE;
    const playerY = playerPos.y * CELL_SIZE;

    // Ghost effect
    if (activePowerUps.ghost > Date.now()) {
      ctx.globalAlpha = 0.5;
    }

    // Shield effect
    if (activePowerUps.shield) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00FF00';
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerX + CELL_SIZE / 2, playerY + CELL_SIZE / 2, CELL_SIZE, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Player body (Neo silhouette)
    ctx.fillStyle = '#00FF00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FF00';

    // Body
    ctx.fillRect(playerX + 6, playerY + 4, 8, 12);
    // Head
    ctx.beginPath();
    ctx.arc(playerX + CELL_SIZE / 2, playerY + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // Coat flare
    ctx.beginPath();
    ctx.moveTo(playerX + 4, playerY + 16);
    ctx.lineTo(playerX + 10, playerY + 8);
    ctx.lineTo(playerX + 10, playerY + 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(playerX + 16, playerY + 16);
    ctx.lineTo(playerX + 10, playerY + 8);
    ctx.lineTo(playerX + 10, playerY + 16);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Draw particles
    renderParticles(ctx);

    // Bullet time visual effect
    if (activePowerUps.bulletTime > Date.now()) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    }
  }, [lanes, playerPos, redPills, powerUps, matrixDrops, activePowerUps, renderParticles]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black flex flex-col items-center justify-center font-mono"
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-green-500"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}
      />

      {/* Menu Overlay */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h1 className="text-4xl font-bold text-green-500 mb-4" style={{ textShadow: '0 0 10px #00ff00' }}>
            CROSSY ROAD
          </h1>
          <p className="text-green-400 mb-2">Escape the Matrix</p>
          <p className="text-green-300 text-sm mb-8">Dodge Agents and Sentinels</p>
          <div className="text-green-500 animate-pulse">Press ENTER to Start</div>
          <div className="mt-8 text-green-600 text-sm">
            <p>WASD or Arrows - Move</p>
            <p>SPACE - Bullet Time</p>
            <p>P - Pause | R - Restart</p>
          </div>
          {highScore > 0 && (
            <p className="mt-4 text-green-400">High Score: {highScore}</p>
          )}
        </div>
      )}

      {/* Paused Overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-green-500 mb-4">PAUSED</h2>
          <p className="text-green-400 mb-2">Score: {score}</p>
          <p className="text-green-400">Press P to Resume</p>
          <p className="text-green-400">Press R to Restart</p>
        </div>
      )}

      {/* Game Over Overlay */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
          <p className="text-green-400 mb-2">Distance: {score}</p>
          <p className="text-green-400 mb-2">Red Pills: {redPillsCollectedRef.current}</p>
          <p className="text-green-400 mb-4">High Score: {highScore}</p>
          {score >= highScore && score > 0 && (
            <p className="text-yellow-400 mb-4 animate-pulse">NEW HIGH SCORE!</p>
          )}
          <div className="text-green-500 animate-pulse">Press ENTER to Play Again</div>
        </div>
      )}

      {/* Score Display */}
      {gamePhase === 'playing' && (
        <div className="absolute top-4 left-4 text-green-500">
          <p className="text-lg">Distance: {score}</p>
          <p className="text-sm text-green-600">High: {highScore}</p>
          {activePowerUps.bulletTime > Date.now() && (
            <p className="text-yellow-400 text-xs animate-pulse">BULLET TIME</p>
          )}
          {activePowerUps.ghost > Date.now() && (
            <p className="text-cyan-400 text-xs animate-pulse">GHOST MODE</p>
          )}
          {activePowerUps.shield && (
            <p className="text-green-400 text-xs animate-pulse">SHIELD</p>
          )}
          {activePowerUps.magnet > Date.now() && (
            <p className="text-fuchsia-400 text-xs animate-pulse">MAGNET</p>
          )}
        </div>
      )}

      {/* Footer Controls Hint */}
      <div className="absolute bottom-4 text-green-600 text-xs">
        ↑↓←→ or WASD to move • SPACE for bullet time • P to pause • ESC to exit
      </div>
    </div>
  );
}
