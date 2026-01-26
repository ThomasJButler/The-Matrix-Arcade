/**
 * @file MatrixAscension.tsx
 * @description Matrix-themed Doodle Jump game - ascend through simulation layers to reach The Source
 * @author Ralph (AI Agent)
 *
 * A vertical platformer where the player auto-bounces on platforms to climb upward.
 * Features physics-based movement, multiple platform types, enemies, and power-ups.
 *
 * Technical Implementation:
 * - Canvas: 400x600 (portrait)
 * - Physics: gravity, velocity, acceleration
 * - Platform types: normal, moving, breaking, spring, disappearing
 * - Enemies: Agent patrols that can be defeated by shooting or jumping on them
 * - Procedural platform generation based on altitude
 *
 * Controls:
 * - A/D or ←→: Move horizontally
 * - SPACE or ↑: Shoot upward
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
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const PLATFORM_WIDTH = 60;
const PLATFORM_HEIGHT = 12;
const GRAVITY = 0.4;
const JUMP_VELOCITY = -12;
const SPRING_VELOCITY = -18;
const MOVE_SPEED = 6;
const MAX_FALL_SPEED = 15;
const PROJECTILE_SPEED = 10;

// Platform types
type PlatformType = 'normal' | 'moving' | 'breaking' | 'spring' | 'disappearing';

// Power-up types
type PowerUpType = 'jetpack' | 'trampoline' | 'shield' | 'bulletTime';

// Game phase state machine
type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

// Interfaces
interface Platform {
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  broken: boolean;
  opacity: number;
  moveDirection?: 1 | -1;
  moveSpeed?: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1;
  speed: number;
  active: boolean;
}

interface Projectile {
  x: number;
  y: number;
  active: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingLeft: boolean;
}

interface MatrixAscensionProps {
  achievementManager?: {
    unlockAchievement: (gameId: string, achievementId: string) => void;
  };
  isMuted?: boolean;
}

// Matrix characters for background
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

// Platform colour based on type
const getPlatformColour = (type: PlatformType): string => {
  switch (type) {
    case 'normal': return '#00FF00';
    case 'moving': return '#00FFFF';
    case 'breaking': return '#FF6600';
    case 'spring': return '#FFFF00';
    case 'disappearing': return '#FF00FF';
    default: return '#00FF00';
  }
};

export default function MatrixAscension({ achievementManager, isMuted = false }: MatrixAscensionProps) {
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [_altitude, setAltitude] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [maxAltitude, setMaxAltitude] = useState(0);

  // Player state
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    facingLeft: false
  });

  // World state
  const platformsRef = useRef<Platform[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const cameraYRef = useRef(0);
  const [displayAltitude, setDisplayAltitude] = useState(0);

  // Active effects
  const [hasShield, setHasShield] = useState(false);
  const [jetpackFuel, setJetpackFuel] = useState(0);
  const [bulletTimeUntil, setBulletTimeUntil] = useState(0);

  // Input state
  const keysRef = useRef<Set<string>>(new Set());

  // Achievement tracking
  const hasFirstJumpRef = useRef(false);
  const platformComboRef = useRef(0);
  const springCountRef = useRef(0);
  const enemiesKilledRef = useRef(0);
  const shotsFiredRef = useRef(0);

  // Matrix rain
  const matrixDropsRef = useRef<Array<{ x: number; y: number; char: string; speed: number }>>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();
  const { playSFX } = useSoundSystem();
  const { explode, collectFood, render: renderParticles } = useParticleSystem();

  // Sound wrapper pattern
  const playSound = useCallback((sound: string) => {
    if (!isMuted) playSFX(sound);
  }, [isMuted, playSFX]);

  // Achievement unlock pattern (dual-call)
  const unlockGameAchievement = useCallback((achievementId: string) => {
    achievementManager?.unlockAchievement('matrixAscension', achievementId);
    unlockSaveAchievement('matrixAscension', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Load high score
  useEffect(() => {
    if (saveData?.games?.matrixAscension?.highScore) {
      setHighScore(saveData.games.matrixAscension.highScore);
    }
  }, [saveData]);

  // Generate initial platforms
  const generatePlatforms = useCallback((startY: number, count: number, baseAltitude: number): Platform[] => {
    const platforms: Platform[] = [];
    let y = startY;

    for (let i = 0; i < count; i++) {
      // Platform spacing increases with altitude (harder)
      const spacing = 60 + Math.min(baseAltitude / 100, 40);
      y -= spacing + Math.random() * 30;

      // Determine platform type based on altitude
      const typeRoll = Math.random();
      let type: PlatformType;

      if (baseAltitude < 500) {
        type = typeRoll < 0.85 ? 'normal' : typeRoll < 0.95 ? 'spring' : 'moving';
      } else if (baseAltitude < 2000) {
        type = typeRoll < 0.5 ? 'normal' : typeRoll < 0.7 ? 'moving' : typeRoll < 0.85 ? 'breaking' : 'spring';
      } else {
        type = typeRoll < 0.3 ? 'normal' : typeRoll < 0.5 ? 'moving' : typeRoll < 0.7 ? 'breaking' :
               typeRoll < 0.85 ? 'disappearing' : 'spring';
      }

      const width = type === 'spring' ? PLATFORM_WIDTH * 0.8 : PLATFORM_WIDTH + Math.random() * 20;

      platforms.push({
        x: Math.random() * (CANVAS_WIDTH - width),
        y,
        width,
        type,
        broken: false,
        opacity: 1,
        moveDirection: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : undefined,
        moveSpeed: type === 'moving' ? 1 + Math.random() * 2 : undefined
      });

      // Occasionally add enemies at higher altitudes
      if (baseAltitude > 1000 && Math.random() < 0.1) {
        enemiesRef.current.push({
          x: Math.random() * (CANVAS_WIDTH - 30),
          y: y - 30,
          width: 30,
          height: 25,
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 1 + Math.random() * 2,
          active: true
        });
      }

      // Occasionally add power-ups
      if (Math.random() < 0.05) {
        const types: PowerUpType[] = ['jetpack', 'shield', 'bulletTime'];
        powerUpsRef.current.push({
          x: Math.random() * (CANVAS_WIDTH - 20),
          y: y - 40,
          type: types[Math.floor(Math.random() * types.length)],
          collected: false
        });
      }
    }

    return platforms;
  }, []);

  // Initialise game
  const initializeGame = useCallback(() => {
    // Reset player
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      facingLeft: false
    };

    // Reset camera
    cameraYRef.current = 0;

    // Generate initial platforms
    platformsRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    powerUpsRef.current = [];

    // Starting platform under player
    platformsRef.current.push({
      x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      width: PLATFORM_WIDTH,
      type: 'normal',
      broken: false,
      opacity: 1
    });

    // Generate more platforms
    platformsRef.current.push(...generatePlatforms(CANVAS_HEIGHT - 120, 15, 0));

    // Reset state
    setAltitude(0);
    setMaxAltitude(0);
    setDisplayAltitude(0);
    setHasShield(false);
    setJetpackFuel(0);
    setBulletTimeUntil(0);

    // Reset achievement tracking
    hasFirstJumpRef.current = false;
    platformComboRef.current = 0;
    springCountRef.current = 0;
    enemiesKilledRef.current = 0;
    shotsFiredRef.current = 0;

    // Initialise matrix rain
    matrixDropsRef.current = [];
    for (let i = 0; i < 25; i++) {
      matrixDropsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
        speed: 1 + Math.random() * 2
      });
    }
  }, [generatePlatforms]);

  // Shoot projectile
  const shoot = useCallback(() => {
    if (gamePhase !== 'playing') return;

    const player = playerRef.current;
    projectilesRef.current.push({
      x: player.x + PLAYER_WIDTH / 2,
      y: player.y,
      active: true
    });

    shotsFiredRef.current++;
    playSound('jump');
  }, [gamePhase, playSound]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

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
        case ' ':
        case 'arrowup':
          e.preventDefault();
          shoot();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase, initializeGame, shoot]);

  // Main game loop
  useGameLoop((deltaTime) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const now = Date.now();

    // Normalise deltaTime to 60fps (16.67ms per frame)
    const dt = deltaTime / 16.67;

    // Bullet time speed modifier
    const speedMod = (bulletTimeUntil > now ? 0.3 : 1) * dt;

    // Handle input
    if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
      player.vx = -MOVE_SPEED;
      player.facingLeft = true;
    } else if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
      player.vx = MOVE_SPEED;
      player.facingLeft = false;
    } else {
      // Apply friction with deltaTime normalisation
      const frictionPerFrame = Math.pow(0.85, dt);
      player.vx *= frictionPerFrame;
    }

    // Apply jetpack
    if (jetpackFuel > 0 && (keysRef.current.has(' ') || keysRef.current.has('arrowup'))) {
      player.vy = Math.max(player.vy - 1 * dt, -15);
      setJetpackFuel(prev => prev - 1);
    } else {
      // Apply gravity with deltaTime
      player.vy += GRAVITY * speedMod;
      player.vy = Math.min(player.vy, MAX_FALL_SPEED);
    }

    // Update player position
    player.x += player.vx * speedMod;
    player.y += player.vy * speedMod;

    // Screen wrap
    if (player.x > CANVAS_WIDTH) {
      player.x = -PLAYER_WIDTH;
    } else if (player.x + PLAYER_WIDTH < 0) {
      player.x = CANVAS_WIDTH;
    }

    // Platform collision (only when falling)
    if (player.vy > 0) {
      for (const platform of platformsRef.current) {
        if (platform.broken || platform.opacity < 0.3) continue;

        // Check collision
        const playerBottom = player.y + PLAYER_HEIGHT;
        const playerCenterX = player.x + PLAYER_WIDTH / 2;

        if (playerBottom >= platform.y && playerBottom <= platform.y + PLATFORM_HEIGHT + player.vy &&
            playerCenterX > platform.x && playerCenterX < platform.x + platform.width) {

          // Handle platform type
          switch (platform.type) {
            case 'breaking':
              platform.broken = true;
              player.vy = JUMP_VELOCITY * speedMod;
              playSound('hit');
              explode(platform.x + platform.width / 2, platform.y, '#FF6600');
              break;

            case 'spring':
              player.vy = SPRING_VELOCITY * speedMod;
              playSound('powerup');
              collectFood(platform.x + platform.width / 2, platform.y, '#FFFF00');
              springCountRef.current++;
              if (springCountRef.current >= 10) {
                unlockGameAchievement('doodle_spring_10');
              }
              break;

            case 'disappearing':
              player.vy = JUMP_VELOCITY * speedMod;
              platform.opacity = 0.5; // Start fading
              playSound('jump');
              break;

            default:
              player.vy = JUMP_VELOCITY * speedMod;
              playSound('jump');
          }

          // Track first jump achievement
          if (!hasFirstJumpRef.current) {
            hasFirstJumpRef.current = true;
            unlockGameAchievement('doodle_first_jump');
          }

          // Platform combo
          platformComboRef.current++;
          if (platformComboRef.current >= 10) {
            unlockGameAchievement('doodle_combo_platforms');
          }
        }
      }
    }

    // Update camera (follow player upward)
    const targetCameraY = Math.max(cameraYRef.current, CANVAS_HEIGHT / 2 - player.y);
    cameraYRef.current = targetCameraY;

    // Calculate altitude
    const currentAltitude = Math.floor(targetCameraY);
    setAltitude(currentAltitude);
    setDisplayAltitude(currentAltitude);

    // Track max altitude
    if (currentAltitude > maxAltitude) {
      setMaxAltitude(currentAltitude);

      // Altitude achievements
      if (currentAltitude >= 1000) unlockGameAchievement('doodle_1000_altitude');
      if (currentAltitude >= 5000) unlockGameAchievement('doodle_5000_altitude');
      if (currentAltitude >= 10000) unlockGameAchievement('doodle_10000_altitude');

      // Pacifist achievement
      if (currentAltitude >= 2000 && shotsFiredRef.current === 0) {
        unlockGameAchievement('doodle_no_shoot');
      }
    }

    // Generate new platforms as player ascends
    const highestPlatform = Math.min(...platformsRef.current.map(p => p.y));
    if (highestPlatform > -cameraYRef.current - 200) {
      const newPlatforms = generatePlatforms(highestPlatform - 50, 5, currentAltitude);
      platformsRef.current.push(...newPlatforms);
    }

    // Remove off-screen platforms (below camera)
    platformsRef.current = platformsRef.current.filter(p =>
      p.y < CANVAS_HEIGHT + cameraYRef.current + 100
    );

    // Update moving platforms
    platformsRef.current.forEach(platform => {
      if (platform.type === 'moving' && platform.moveSpeed && platform.moveDirection) {
        platform.x += platform.moveSpeed * platform.moveDirection * speedMod;
        if (platform.x <= 0 || platform.x + platform.width >= CANVAS_WIDTH) {
          platform.moveDirection *= -1;
        }
      }
      // Fade disappearing platforms with deltaTime
      if (platform.type === 'disappearing' && platform.opacity < 1) {
        platform.opacity -= 0.02 * dt;
      }
    });

    // Update enemies
    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return;

      enemy.x += enemy.speed * enemy.direction * speedMod;
      if (enemy.x <= 0 || enemy.x + enemy.width >= CANVAS_WIDTH) {
        enemy.direction *= -1;
      }

      // Check player collision with enemy
      const playerCenterX = player.x + PLAYER_WIDTH / 2;
      const enemyScreenY = enemy.y + cameraYRef.current;

      if (Math.abs(playerCenterX - (enemy.x + enemy.width / 2)) < (PLAYER_WIDTH + enemy.width) / 2 &&
          Math.abs((player.y + PLAYER_HEIGHT / 2) - (enemyScreenY + enemy.height / 2)) < (PLAYER_HEIGHT + enemy.height) / 2) {

        // Check if jumping on enemy
        if (player.vy > 0 && player.y + PLAYER_HEIGHT < enemyScreenY + enemy.height / 2) {
          enemy.active = false;
          player.vy = JUMP_VELOCITY * speedMod;
          enemiesKilledRef.current++;
          unlockGameAchievement('doodle_kill_agent');
          playSound('hit');
          explode(enemy.x + enemy.width / 2, enemyScreenY + enemy.height / 2, '#FF0000');
        } else if (!hasShield) {
          // Player dies
          setGamePhase('gameOver');
          playSound('gameOver');
          const newHighScore = Math.max(maxAltitude, highScore);
          setHighScore(newHighScore);
          updateGameSave('matrixAscension', {
            highScore: newHighScore,
            stats: {
              gamesPlayed: (saveData?.games?.matrixAscension?.stats?.gamesPlayed || 0) + 1,
              totalScore: (saveData?.games?.matrixAscension?.stats?.totalScore || 0) + maxAltitude,
            }
          });
          return;
        } else {
          setHasShield(false);
          enemy.active = false;
          playSound('hit');
        }
      }
    });

    // Remove off-screen enemies
    enemiesRef.current = enemiesRef.current.filter(e =>
      e.y < CANVAS_HEIGHT + cameraYRef.current + 100
    );

    // Update projectiles
    projectilesRef.current.forEach(proj => {
      if (!proj.active) return;

      proj.y -= PROJECTILE_SPEED * speedMod;

      // Check collision with enemies
      enemiesRef.current.forEach(enemy => {
        if (!enemy.active) return;

        if (proj.x > enemy.x && proj.x < enemy.x + enemy.width &&
            proj.y > enemy.y && proj.y < enemy.y + enemy.height) {
          proj.active = false;
          enemy.active = false;
          enemiesKilledRef.current++;
          unlockGameAchievement('doodle_kill_agent');
          playSound('hit');
          explode(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF0000');
        }
      });

      // Remove if off screen
      if (proj.y < -cameraYRef.current - 50) {
        proj.active = false;
      }
    });

    projectilesRef.current = projectilesRef.current.filter(p => p.active);

    // Collect power-ups
    powerUpsRef.current.forEach(powerUp => {
      if (powerUp.collected) return;

      const dx = Math.abs((player.x + PLAYER_WIDTH / 2) - (powerUp.x + 10));
      const dy = Math.abs((player.y + PLAYER_HEIGHT / 2) - (powerUp.y + cameraYRef.current + 10));

      if (dx < 25 && dy < 25) {
        powerUp.collected = true;
        playSound('powerup');
        collectFood(powerUp.x, powerUp.y + cameraYRef.current, '#FFD700');

        switch (powerUp.type) {
          case 'jetpack':
            setJetpackFuel(100);
            break;
          case 'shield':
            setHasShield(true);
            break;
          case 'bulletTime':
            setBulletTimeUntil(Date.now() + 5000);
            break;
        }
      }
    });

    // Check for falling death
    if (player.y > CANVAS_HEIGHT + cameraYRef.current + 100) {
      platformComboRef.current = 0; // Reset combo on fall

      setGamePhase('gameOver');
      playSound('gameOver');
      const newHighScore = Math.max(maxAltitude, highScore);
      setHighScore(newHighScore);
      updateGameSave('matrixAscension', {
        highScore: newHighScore,
        stats: {
          gamesPlayed: (saveData?.games?.matrixAscension?.stats?.gamesPlayed || 0) + 1,
          totalScore: (saveData?.games?.matrixAscension?.stats?.totalScore || 0) + maxAltitude,
        }
      });
      return;
    }

    // Update matrix rain with deltaTime
    matrixDropsRef.current.forEach(drop => {
      drop.y += drop.speed * dt;
      if (drop.y > CANVAS_HEIGHT) {
        drop.y = 0;
        drop.x = Math.random() * CANVAS_WIDTH;
        drop.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      }
    });

    // Render
    render(ctx, now);
  });

  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    const player = playerRef.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw matrix rain background
    ctx.font = '14px monospace';
    matrixDropsRef.current.forEach(drop => {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.fillText(drop.char, drop.x, drop.y);
    });

    // Translate for camera
    ctx.save();
    ctx.translate(0, cameraYRef.current);

    // Draw platforms
    platformsRef.current.forEach(platform => {
      if (platform.broken) return;

      ctx.globalAlpha = platform.opacity;
      ctx.fillStyle = getPlatformColour(platform.type);

      // Platform glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = getPlatformColour(platform.type);

      ctx.fillRect(platform.x, platform.y, platform.width, PLATFORM_HEIGHT);

      // Spring indicator
      if (platform.type === 'spring') {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(platform.x + platform.width / 2 - 5, platform.y);
        ctx.lineTo(platform.x + platform.width / 2 + 5, platform.y);
        ctx.lineTo(platform.x + platform.width / 2, platform.y - 8);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw enemies
    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return;

      // Agent body (simplified humanoid)
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#FFFFFF';

      // Body
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 14, 15);
      // Head
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + 6, 6, 0, Math.PI * 2);
      ctx.fill();
      // Sunglasses
      ctx.fillStyle = '#000000';
      ctx.fillRect(enemy.x + 10, enemy.y + 4, 10, 3);

      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUpsRef.current.forEach(powerUp => {
      if (powerUp.collected) return;

      const pulse = Math.sin(timestamp * 0.005) * 0.3 + 0.7;
      const size = 10 * pulse;

      ctx.shadowBlur = 15;

      switch (powerUp.type) {
        case 'jetpack':
          ctx.fillStyle = '#FF6600';
          ctx.shadowColor = '#FF6600';
          break;
        case 'shield':
          ctx.fillStyle = '#00FF00';
          ctx.shadowColor = '#00FF00';
          break;
        case 'bulletTime':
          ctx.fillStyle = '#FFFF00';
          ctx.shadowColor = '#FFFF00';
          break;
        default:
          ctx.fillStyle = '#FFFFFF';
      }

      ctx.beginPath();
      ctx.arc(powerUp.x + 10, powerUp.y + 10, size, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.type[0].toUpperCase(), powerUp.x + 10, powerUp.y + 10);

      ctx.shadowBlur = 0;
    });

    // Draw projectiles
    ctx.fillStyle = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    projectilesRef.current.forEach(proj => {
      if (!proj.active) return;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw player
    ctx.fillStyle = '#00FF00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FF00';

    // Shield effect
    if (hasShield) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, PLAYER_WIDTH, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillRect(player.x + 8, player.y + 12, 14, 20);
    // Head
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_WIDTH / 2, player.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Coat flare (direction based)
    const coatDir = player.facingLeft ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(player.x + PLAYER_WIDTH / 2 + coatDir * 5, player.y + 32);
    ctx.lineTo(player.x + PLAYER_WIDTH / 2, player.y + 15);
    ctx.lineTo(player.x + PLAYER_WIDTH / 2 + coatDir * 12, player.y + 38);
    ctx.fill();

    // Jetpack flames
    if (jetpackFuel > 0 && (keysRef.current.has(' ') || keysRef.current.has('arrowup'))) {
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(player.x + 5, player.y + PLAYER_HEIGHT);
      ctx.lineTo(player.x + 12, player.y + PLAYER_HEIGHT + 15 + Math.random() * 10);
      ctx.lineTo(player.x + 19, player.y + PLAYER_HEIGHT);
      ctx.fill();
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.moveTo(player.x + 8, player.y + PLAYER_HEIGHT);
      ctx.lineTo(player.x + 12, player.y + PLAYER_HEIGHT + 8 + Math.random() * 5);
      ctx.lineTo(player.x + 16, player.y + PLAYER_HEIGHT);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    ctx.restore();

    // Draw particles
    renderParticles(ctx);

    // Bullet time visual effect
    if (bulletTimeUntil > Date.now()) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    }
  }, [hasShield, jetpackFuel, bulletTimeUntil, renderParticles]);

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
            MATRIX ASCENSION
          </h1>
          <p className="text-green-400 mb-2">Reach The Source</p>
          <p className="text-green-300 text-sm mb-8">Jump through simulation layers</p>
          <div className="text-green-500 animate-pulse">Press ENTER to Start</div>
          <div className="mt-8 text-green-600 text-sm">
            <p>A/D or ←→ - Move</p>
            <p>SPACE or ↑ - Shoot</p>
            <p>P - Pause | R - Restart</p>
          </div>
          {highScore > 0 && (
            <p className="mt-4 text-green-400">Best Altitude: {highScore}</p>
          )}
        </div>
      )}

      {/* Paused Overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-green-500 mb-4">PAUSED</h2>
          <p className="text-green-400 mb-2">Altitude: {displayAltitude}</p>
          <p className="text-green-400">Press P to Resume</p>
          <p className="text-green-400">Press R to Restart</p>
        </div>
      )}

      {/* Game Over Overlay */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
          <p className="text-green-400 mb-2">Altitude: {maxAltitude}</p>
          <p className="text-green-400 mb-4">Best: {highScore}</p>
          {maxAltitude >= highScore && maxAltitude > 0 && (
            <p className="text-yellow-400 mb-4 animate-pulse">NEW HIGH SCORE!</p>
          )}
          <div className="text-green-500 animate-pulse">Press ENTER to Play Again</div>
        </div>
      )}

      {/* Altitude Display */}
      {gamePhase === 'playing' && (
        <div className="absolute top-4 left-4 text-green-500">
          <p className="text-lg">Altitude: {displayAltitude}</p>
          <p className="text-sm text-green-600">Best: {highScore}</p>
          {jetpackFuel > 0 && (
            <p className="text-orange-400 text-xs">Jetpack: {jetpackFuel}</p>
          )}
          {hasShield && (
            <p className="text-cyan-400 text-xs animate-pulse">SHIELD</p>
          )}
          {bulletTimeUntil > Date.now() && (
            <p className="text-yellow-400 text-xs animate-pulse">BULLET TIME</p>
          )}
        </div>
      )}

      {/* Footer Controls Hint */}
      <div className="absolute bottom-4 text-green-600 text-xs">
        ←→ or A/D to move • SPACE to shoot • P to pause • ESC to exit
      </div>
    </div>
  );
}
