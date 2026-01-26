/**
 * @file JimmyMatrix.tsx
 * @description Epic Matrix-themed rhythm game - catch code in beat
 * @author Ralph (AI Agent)
 *
 * Features:
 * - 4-lane rhythm game (D, F, J, K keys)
 * - Notes fall in sync with music timing
 * - Timing windows: Perfect (±40ms), Great (±80ms), Good (±120ms), Miss
 * - Combo system with multiplier (max 4x)
 * - Health bar - too many misses = fail
 * - Track selection UI with 5 built-in tracks
 * - Procedural note generation based on BPM
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { useSoundSystem } from '../../hooks/useSoundSystem';
import { useParticleSystem } from '../../hooks/useParticleSystem';

type GamePhase = 'menu' | 'trackSelect' | 'playing' | 'paused' | 'results' | 'gameOver';
type TimingGrade = 'perfect' | 'great' | 'good' | 'miss';

interface Track {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'insane';
  duration: number; // in milliseconds
  notePattern: number[]; // Pattern weights for each lane
}

interface Note {
  id: number;
  lane: number;
  y: number;
  targetTime: number;
  hit: boolean;
  missed: boolean;
  type: 'normal' | 'hold' | 'double';
  holdDuration?: number; // Duration in ms for hold notes
  holdEndY?: number; // End position for hold notes
  pairedLane?: number; // Lane of paired note for double notes
}

interface HitFeedback {
  id: number;
  lane: number;
  grade: TimingGrade;
  time: number;
}

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LANE_COUNT = 4;
const LANE_WIDTH = 80;
const LANE_SPACING = 20;
const TOTAL_LANE_WIDTH = LANE_COUNT * LANE_WIDTH + (LANE_COUNT - 1) * LANE_SPACING;
const LANE_START_X = (CANVAS_WIDTH - TOTAL_LANE_WIDTH) / 2;
const HIT_LINE_Y = CANVAS_HEIGHT - 100;
const NOTE_HEIGHT = 30;
const NOTE_FALL_SPEED = 400; // pixels per second (adjustable by difficulty)
const NOTE_SPAWN_Y = -NOTE_HEIGHT;

// Timing windows (in milliseconds)
const PERFECT_WINDOW = 40;
const GREAT_WINDOW = 80;
const GOOD_WINDOW = 120;
const MISS_WINDOW = 150;

// Scoring
const PERFECT_SCORE = 300;
const GREAT_SCORE = 200;
const GOOD_SCORE = 100;
const MISS_PENALTY = 5; // Health penalty

// Track definitions
const TRACKS: Track[] = [
  {
    id: 'enter_matrix',
    name: 'Enter The Matrix',
    artist: 'System',
    bpm: 120,
    difficulty: 'easy',
    duration: 90000,
    notePattern: [0.25, 0.25, 0.25, 0.25]
  },
  {
    id: 'code_rain',
    name: 'Code Rain',
    artist: 'System',
    bpm: 140,
    difficulty: 'normal',
    duration: 120000,
    notePattern: [0.3, 0.2, 0.2, 0.3]
  },
  {
    id: 'agent_assault',
    name: 'Agent Assault',
    artist: 'System',
    bpm: 160,
    difficulty: 'normal',
    duration: 150000,
    notePattern: [0.2, 0.3, 0.3, 0.2]
  },
  {
    id: 'bullet_time',
    name: 'Bullet Time',
    artist: 'System',
    bpm: 180,
    difficulty: 'hard',
    duration: 180000,
    notePattern: [0.25, 0.3, 0.3, 0.15]
  },
  {
    id: 'the_one',
    name: 'The One',
    artist: 'System',
    bpm: 200,
    difficulty: 'insane',
    duration: 240000,
    notePattern: [0.25, 0.25, 0.25, 0.25]
  },
];

const LANE_KEYS = ['d', 'f', 'j', 'k'];
const LANE_COLOURS = ['#00FF00', '#00FFFF', '#FFFF00', '#FF00FF'];
const DIFFICULTY_COLOURS: Record<string, string> = {
  easy: '#00ff00',
  normal: '#ffff00',
  hard: '#ff8800',
  insane: '#ff0000'
};

interface JimmyMatrixProps {
  achievementManager?: {
    unlockAchievement: (gameId: string, achievementId: string) => void;
  };
  isMuted?: boolean;
}

export default function JimmyMatrix({ achievementManager, isMuted = false }: JimmyMatrixProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [health, setHealth] = useState(100);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [completedTracks, setCompletedTracks] = useState<Set<string>>(new Set());
  const [totalScore, setTotalScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<Note[]>([]);
  const noteIdRef = useRef(0);
  const gameTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const hitFeedbackRef = useRef<HitFeedback[]>([]);
  const feedbackIdRef = useRef(0);
  const nextNoteTimeRef = useRef<number[]>([0, 0, 0, 0]);
  const animationFrameRef = useRef<number>(0);

  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();
  const { playSFX } = useSoundSystem();
  const particles = useParticleSystem();

  // Sound wrapper pattern
  const playSound = useCallback((sound: string) => {
    if (!isMuted) playSFX(sound);
  }, [isMuted, playSFX]);

  // Achievement unlock pattern (dual-call)
  const unlockGameAchievement = useCallback((achievementId: string) => {
    achievementManager?.unlockAchievement('jimmyMatrix', achievementId);
    unlockSaveAchievement('jimmyMatrix', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Load save data
  useEffect(() => {
    if (saveData?.games?.jimmyMatrix) {
      const gameData = saveData.games.jimmyMatrix;
      if (gameData.preferences) {
        const prefs = gameData.preferences as Record<string, unknown>;
        if (prefs.highScores) setHighScores(prefs.highScores as Record<string, number>);
        if (prefs.completedTracks) setCompletedTracks(new Set(prefs.completedTracks as string[]));
        if (typeof prefs.totalScore === 'number') setTotalScore(prefs.totalScore);
      }
    }
  }, [saveData]);

  // Get current track
  const currentTrack = useMemo(() => TRACKS[selectedTrack], [selectedTrack]);

  // Calculate speed multiplier based on difficulty
  const speedMultiplier = useMemo(() => {
    switch (currentTrack.difficulty) {
      case 'easy': return 0.8;
      case 'normal': return 1.0;
      case 'hard': return 1.2;
      case 'insane': return 1.5;
      default: return 1.0;
    }
  }, [currentTrack.difficulty]);

  // Calculate multiplier based on combo
  const multiplier = useMemo(() => {
    return Math.min(4, 1 + Math.floor(combo / 25) * 0.5);
  }, [combo]);

  // Get lane X position
  const getLaneX = useCallback((lane: number) => {
    return LANE_START_X + lane * (LANE_WIDTH + LANE_SPACING);
  }, []);

  // Generate notes based on BPM and pattern
  const generateNote = useCallback((currentTime: number) => {
    const beatInterval = 60000 / currentTrack.bpm; // ms per beat
    const travelTime = (HIT_LINE_Y - NOTE_SPAWN_Y) / (NOTE_FALL_SPEED * speedMultiplier) * 1000;

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (currentTime >= nextNoteTimeRef.current[lane]) {
        // Decide if we should spawn a note
        const chance = currentTrack.notePattern[lane];
        const difficultyBonus = currentTrack.difficulty === 'hard' ? 0.15 :
                                currentTrack.difficulty === 'insane' ? 0.3 : 0;

        if (Math.random() < chance + difficultyBonus) {
          const targetTime = currentTime + travelTime;

          // Determine note type based on difficulty
          // Easy: 100% normal, Normal: 90% normal/10% hold, Hard: 75% normal/15% hold/10% double, Insane: 60% normal/25% hold/15% double
          let noteType: 'normal' | 'hold' | 'double' = 'normal';
          const typeRoll = Math.random();

          if (currentTrack.difficulty === 'insane') {
            if (typeRoll < 0.60) noteType = 'normal';
            else if (typeRoll < 0.85) noteType = 'hold';
            else noteType = 'double';
          } else if (currentTrack.difficulty === 'hard') {
            if (typeRoll < 0.75) noteType = 'normal';
            else if (typeRoll < 0.90) noteType = 'hold';
            else noteType = 'double';
          } else if (currentTrack.difficulty === 'normal') {
            if (typeRoll < 0.90) noteType = 'normal';
            else noteType = 'hold';
          }

          // Create the note
          const note: Note = {
            id: noteIdRef.current++,
            lane,
            y: NOTE_SPAWN_Y,
            targetTime,
            hit: false,
            missed: false,
            type: noteType
          };

          // Add hold duration for hold notes (1-2 beats)
          if (noteType === 'hold') {
            const holdBeats = 1 + Math.floor(Math.random() * 2);
            note.holdDuration = holdBeats * beatInterval;
            note.holdEndY = NOTE_SPAWN_Y - (note.holdDuration / 1000 * NOTE_FALL_SPEED * speedMultiplier);
          }

          // For double notes, create a paired note in an adjacent lane
          if (noteType === 'double') {
            // Find an adjacent lane that isn't the same
            const adjacentLanes = [lane - 1, lane + 1].filter(l => l >= 0 && l < LANE_COUNT);
            if (adjacentLanes.length > 0) {
              const pairedLane = adjacentLanes[Math.floor(Math.random() * adjacentLanes.length)];
              note.pairedLane = pairedLane;

              // Create the paired note
              notesRef.current.push({
                id: noteIdRef.current++,
                lane: pairedLane,
                y: NOTE_SPAWN_Y,
                targetTime,
                hit: false,
                missed: false,
                type: 'double',
                pairedLane: lane
              });

              // Skip the paired lane's next note
              nextNoteTimeRef.current[pairedLane] = currentTime + beatInterval * 2;
            }
          }

          notesRef.current.push(note);
        }

        // Schedule next potential note for this lane
        // Add some randomness to timing for variety
        const variation = beatInterval * 0.1 * (Math.random() - 0.5);
        nextNoteTimeRef.current[lane] = currentTime + beatInterval + variation;
      }
    }
  }, [currentTrack, speedMultiplier]);

  // Check timing grade (used for timing calculations)
  const _getTimingGrade = useCallback((timeDiff: number): TimingGrade | null => {
    const absDiff = Math.abs(timeDiff);
    if (absDiff <= PERFECT_WINDOW) return 'perfect';
    if (absDiff <= GREAT_WINDOW) return 'great';
    if (absDiff <= GOOD_WINDOW) return 'good';
    if (absDiff <= MISS_WINDOW) return null; // Can still try
    return 'miss';
  }, []);

  // Handle note hit
  const tryHitNote = useCallback((lane: number) => {
    const currentTime = gameTimeRef.current;
    const travelTime = (HIT_LINE_Y - NOTE_SPAWN_Y) / (NOTE_FALL_SPEED * speedMultiplier) * 1000;

    // Find closest unhit note in this lane
    let closestNote: Note | null = null;
    let closestDiff = Infinity;

    for (const note of notesRef.current) {
      if (note.lane === lane && !note.hit && !note.missed) {
        const _timeDiff = currentTime - (note.targetTime - travelTime + (note.y - NOTE_SPAWN_Y) / (NOTE_FALL_SPEED * speedMultiplier) * 1000);
        const expectedY = NOTE_SPAWN_Y + (currentTime - (note.targetTime - travelTime)) / 1000 * NOTE_FALL_SPEED * speedMultiplier;
        const yDiff = Math.abs(expectedY - HIT_LINE_Y);
        const timeFromHit = yDiff / (NOTE_FALL_SPEED * speedMultiplier) * 1000;

        if (timeFromHit < closestDiff && timeFromHit <= MISS_WINDOW) {
          closestDiff = timeFromHit;
          closestNote = note;
        }
      }
    }

    if (closestNote) {
      const grade = closestDiff <= PERFECT_WINDOW ? 'perfect' :
                   closestDiff <= GREAT_WINDOW ? 'great' :
                   closestDiff <= GOOD_WINDOW ? 'good' : null;

      if (grade) {
        closestNote.hit = true;

        // Add feedback
        hitFeedbackRef.current.push({
          id: feedbackIdRef.current++,
          lane,
          grade,
          time: performance.now()
        });

        // Emit particles at hit position
        const laneX = getLaneX(lane) + LANE_WIDTH / 2;
        particles.emit({
          x: laneX,
          y: HIT_LINE_Y,
          count: grade === 'perfect' ? 20 : grade === 'great' ? 15 : 10,
          type: 'food',
          color: LANE_COLOURS[lane],
          spread: Math.PI,
          speed: 3,
          life: 0.5
        });

        // Update score and combo
        let points = 0;
        switch (grade) {
          case 'perfect':
            points = PERFECT_SCORE;
            setPerfectCount(c => c + 1);
            playSound('rhythmPerfect');
            break;
          case 'great':
            points = GREAT_SCORE;
            setGreatCount(c => c + 1);
            playSound('score');
            break;
          case 'good':
            points = GOOD_SCORE;
            setGoodCount(c => c + 1);
            playSound('rhythmGood');
            break;
        }

        setScore(s => s + Math.floor(points * multiplier));
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(m => Math.max(m, newCombo));
          return newCombo;
        });

        return grade;
      }
    }

    return null;
  }, [speedMultiplier, getLaneX, particles, multiplier, playSound]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(100);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    notesRef.current = [];
    noteIdRef.current = 0;
    gameTimeRef.current = 0;
    lastUpdateRef.current = performance.now();
    hitFeedbackRef.current = [];
    nextNoteTimeRef.current = [0, 0, 0, 0];
    particles.clear();
    setGamePhase('playing');
    playSound('levelUp');
  }, [playSound, particles]);

  // End track
  const endTrack = useCallback((success: boolean) => {
    if (success) {
      setGamePhase('results');
      playSound('victory');

      // Update completed tracks
      const newCompleted = new Set(completedTracks);
      newCompleted.add(currentTrack.id);
      setCompletedTracks(newCompleted);

      // Check achievements
      unlockGameAchievement('rhythm_track_complete');
      if (missCount === 0) unlockGameAchievement('rhythm_full_combo');
      if (currentTrack.id === 'the_one') unlockGameAchievement('rhythm_the_one');
      if (newCompleted.size >= 5) unlockGameAchievement('rhythm_all_tracks');

      const newTotalScore = totalScore + score;
      setTotalScore(newTotalScore);
      if (newTotalScore >= 100000) unlockGameAchievement('rhythm_score_100k');

      // Update high scores
      const newHighScores = { ...highScores };
      if (!newHighScores[currentTrack.id] || score > newHighScores[currentTrack.id]) {
        newHighScores[currentTrack.id] = score;
        setHighScores(newHighScores);
      }

      // Save progress
      updateGameSave('jimmyMatrix', {
        highScore: Math.max(saveData?.games?.jimmyMatrix?.highScore || 0, score),
        stats: {
          gamesPlayed: (saveData?.games?.jimmyMatrix?.stats?.gamesPlayed || 0) + 1,
          totalScore: newTotalScore,
          bestCombo: Math.max(saveData?.games?.jimmyMatrix?.stats?.bestCombo || 0, maxCombo),
        },
        preferences: {
          highScores: newHighScores,
          completedTracks: Array.from(newCompleted),
          totalScore: newTotalScore
        }
      });
    } else {
      setGamePhase('gameOver');
      playSound('death');
    }
  }, [completedTracks, currentTrack, missCount, totalScore, score, highScores, maxCombo, playSound, unlockGameAchievement, updateGameSave, saveData]);

  // Game loop
  useEffect(() => {
    if (gamePhase !== 'playing') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateRef.current;
      lastUpdateRef.current = timestamp;
      gameTimeRef.current += deltaTime;

      // Check if track is complete
      if (gameTimeRef.current >= currentTrack.duration) {
        endTrack(true);
        return;
      }

      // Calculate time remaining for track-ending warning
      const timeRemaining = currentTrack.duration - gameTimeRef.current;
      const isTrackEnding = timeRemaining < 10000 && timeRemaining > 0;

      // Generate new notes
      generateNote(gameTimeRef.current);

      // Update notes
      const speed = NOTE_FALL_SPEED * speedMultiplier * (deltaTime / 1000);

      for (const note of notesRef.current) {
        if (!note.hit && !note.missed) {
          note.y += speed;

          // Check if note is missed (passed hit line by too much)
          if (note.y > HIT_LINE_Y + MISS_WINDOW * speedMultiplier * 0.5) {
            note.missed = true;
            setMissCount(m => m + 1);
            setCombo(0);
            playSound('rhythmMiss');
            setHealth(h => {
              const newHealth = Math.max(0, h - MISS_PENALTY);
              if (newHealth <= 0) {
                endTrack(false);
              }
              return newHealth;
            });

            // Add miss feedback
            hitFeedbackRef.current.push({
              id: feedbackIdRef.current++,
              lane: note.lane,
              grade: 'miss',
              time: performance.now()
            });
          }
        }
      }

      // Remove old notes and feedback
      notesRef.current = notesRef.current.filter(n => n.y < CANVAS_HEIGHT + NOTE_HEIGHT);
      hitFeedbackRef.current = hitFeedbackRef.current.filter(f =>
        performance.now() - f.time < 500
      );

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw matrix rain background
      ctx.fillStyle = 'rgba(0, 255, 0, 0.03)';
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(timestamp * 0.001 + i * 0.5) + 1) * CANVAS_WIDTH / 2;
        const y = ((timestamp * 0.05 + i * 20) % (CANVAS_HEIGHT + 100)) - 50;
        ctx.font = '14px monospace';
        ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
      }

      // Draw lanes
      for (let i = 0; i < LANE_COUNT; i++) {
        const laneX = getLaneX(i);

        // Lane background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.fillRect(laneX, 0, LANE_WIDTH, CANVAS_HEIGHT);

        // Lane borders
        ctx.strokeStyle = LANE_COLOURS[i] + '40';
        ctx.lineWidth = 2;
        ctx.strokeRect(laneX, 0, LANE_WIDTH, CANVAS_HEIGHT);
      }

      // Draw hit line
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(LANE_START_X - 20, HIT_LINE_Y);
      ctx.lineTo(LANE_START_X + TOTAL_LANE_WIDTH + 20, HIT_LINE_Y);
      ctx.stroke();

      // Draw hit zones
      for (let i = 0; i < LANE_COUNT; i++) {
        const laneX = getLaneX(i);
        const isPressed = keysPressed.current.has(LANE_KEYS[i]);

        // Hit zone glow
        ctx.fillStyle = isPressed ? LANE_COLOURS[i] + '60' : LANE_COLOURS[i] + '20';
        ctx.fillRect(laneX, HIT_LINE_Y - 20, LANE_WIDTH, 40);

        // Hit zone border
        ctx.strokeStyle = isPressed ? LANE_COLOURS[i] : LANE_COLOURS[i] + '80';
        ctx.lineWidth = isPressed ? 3 : 2;
        ctx.strokeRect(laneX, HIT_LINE_Y - 20, LANE_WIDTH, 40);

        // Key indicator
        ctx.fillStyle = isPressed ? '#ffffff' : LANE_COLOURS[i];
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(LANE_KEYS[i].toUpperCase(), laneX + LANE_WIDTH / 2, HIT_LINE_Y + 60);
      }

      // Draw notes
      for (const note of notesRef.current) {
        if (note.hit || note.missed) continue;

        const laneX = getLaneX(note.lane);
        const noteY = note.y;

        // Note glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = LANE_COLOURS[note.lane];

        // Draw based on note type
        if (note.type === 'hold' && note.holdEndY !== undefined) {
          // Draw hold note tail (the held portion)
          const tailStartY = noteY + NOTE_HEIGHT;
          const tailEndY = noteY - (note.holdDuration! / 1000 * NOTE_FALL_SPEED * speedMultiplier);

          // Tail body
          ctx.fillStyle = LANE_COLOURS[note.lane] + '60';
          ctx.fillRect(laneX + 15, tailEndY, LANE_WIDTH - 30, tailStartY - tailEndY);

          // Tail border
          ctx.strokeStyle = LANE_COLOURS[note.lane] + '80';
          ctx.lineWidth = 2;
          ctx.strokeRect(laneX + 15, tailEndY, LANE_WIDTH - 30, tailStartY - tailEndY);

          // Draw the head (start of hold)
          const gradient = ctx.createLinearGradient(laneX, noteY, laneX + LANE_WIDTH, noteY);
          gradient.addColorStop(0, LANE_COLOURS[note.lane] + 'cc');
          gradient.addColorStop(0.5, LANE_COLOURS[note.lane]);
          gradient.addColorStop(1, LANE_COLOURS[note.lane] + 'cc');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(laneX + 5, noteY, LANE_WIDTH - 10, NOTE_HEIGHT, 5);
          ctx.fill();

          // Note border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Hold indicator text
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('H', laneX + LANE_WIDTH / 2, noteY + NOTE_HEIGHT / 2 + 5);
        } else if (note.type === 'double') {
          // Double note - draw with special styling
          const gradient = ctx.createLinearGradient(laneX, noteY, laneX + LANE_WIDTH, noteY);
          gradient.addColorStop(0, '#FFD700cc');
          gradient.addColorStop(0.5, '#FFD700');
          gradient.addColorStop(1, '#FFD700cc');

          ctx.shadowColor = '#FFD700';
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(laneX + 5, noteY, LANE_WIDTH - 10, NOTE_HEIGHT, 5);
          ctx.fill();

          // Double note border (thicker)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Double indicator
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('2', laneX + LANE_WIDTH / 2, noteY + NOTE_HEIGHT / 2 + 5);
        } else {
          // Normal note
          const gradient = ctx.createLinearGradient(laneX, noteY, laneX + LANE_WIDTH, noteY);
          gradient.addColorStop(0, LANE_COLOURS[note.lane] + 'cc');
          gradient.addColorStop(0.5, LANE_COLOURS[note.lane]);
          gradient.addColorStop(1, LANE_COLOURS[note.lane] + 'cc');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(laneX + 5, noteY, LANE_WIDTH - 10, NOTE_HEIGHT, 5);
          ctx.fill();

          // Note border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
      }

      // Draw hit feedback
      for (const feedback of hitFeedbackRef.current) {
        const elapsed = performance.now() - feedback.time;
        const alpha = Math.max(0, 1 - elapsed / 500);
        const yOffset = -elapsed * 0.1;

        let text = '';
        let color = '';
        switch (feedback.grade) {
          case 'perfect':
            text = 'PERFECT!';
            color = `rgba(255, 215, 0, ${alpha})`;
            break;
          case 'great':
            text = 'GREAT!';
            color = `rgba(0, 255, 255, ${alpha})`;
            break;
          case 'good':
            text = 'GOOD';
            color = `rgba(0, 255, 0, ${alpha})`;
            break;
          case 'miss':
            text = 'MISS';
            color = `rgba(255, 0, 0, ${alpha})`;
            break;
        }

        const laneX = getLaneX(feedback.lane) + LANE_WIDTH / 2;
        ctx.fillStyle = color;
        ctx.font = feedback.grade === 'perfect' ? 'bold 28px monospace' : 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, laneX, HIT_LINE_Y - 50 + yOffset);
      }

      // Draw particles
      particles.render(ctx);

      // Draw progress bar with track-ending warning
      const progress = gameTimeRef.current / currentTrack.duration;
      ctx.fillStyle = '#333333';
      ctx.fillRect(50, 20, CANVAS_WIDTH - 100, 10);

      // Flash progress bar when track is ending (<10 seconds)
      if (isTrackEnding) {
        const flashIntensity = Math.floor(timestamp / 200) % 2 === 0;
        ctx.fillStyle = flashIntensity ? '#ffff00' : '#ff6600';
        // Draw warning border around entire canvas
        ctx.strokeStyle = flashIntensity ? '#ffff00' : '#ff6600';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
      } else {
        ctx.fillStyle = '#00ff00';
      }
      ctx.fillRect(50, 20, (CANVAS_WIDTH - 100) * progress, 10);
      ctx.strokeStyle = isTrackEnding ? '#ffff00' : '#00ff00';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 20, CANVAS_WIDTH - 100, 10);

      // Draw countdown timer when track is ending
      if (isTrackEnding) {
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        ctx.fillStyle = Math.floor(timestamp / 200) % 2 === 0 ? '#ffff00' : '#ff6600';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(secondsLeft.toString(), CANVAS_WIDTH / 2, 150);
        ctx.font = '18px monospace';
        ctx.fillText('FINISH!', CANVAS_WIDTH / 2, 180);
      }

      // Draw score
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(score.toLocaleString(), 30, 70);

      // Draw combo
      if (combo > 0) {
        ctx.fillStyle = combo >= 100 ? '#ffd700' : combo >= 50 ? '#00ffff' : '#00ff00';
        ctx.font = combo >= 50 ? 'bold 28px monospace' : '24px monospace';
        ctx.fillText(`${combo} COMBO`, 30, 100);

        // Draw multiplier
        ctx.fillStyle = '#ffff00';
        ctx.font = '18px monospace';
        ctx.fillText(`${multiplier.toFixed(1)}x`, 30, 125);
      }

      // Draw health bar
      ctx.fillStyle = '#333333';
      ctx.fillRect(CANVAS_WIDTH - 180, 50, 150, 20);
      ctx.fillStyle = health > 50 ? '#00ff00' : health > 25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(CANVAS_WIDTH - 180, 50, 150 * (health / 100), 20);
      ctx.strokeStyle = '#00ff00';
      ctx.strokeRect(CANVAS_WIDTH - 180, 50, 150, 20);
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('HEALTH', CANVAS_WIDTH - 30, 45);

      // Draw track info
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentTrack.name} - ${currentTrack.bpm} BPM`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gamePhase, currentTrack, speedMultiplier, getLaneX, generateNote, endTrack, particles, score, combo, multiplier, health]);

  // Check combo achievements and play milestone sounds
  useEffect(() => {
    // Play combo milestone sounds at 50, 100, and 500
    if (combo === 50 || combo === 100 || combo === 500) {
      playSound('rhythmCombo');
    }
    if (combo >= 100) unlockGameAchievement('rhythm_100_combo');
    if (combo >= 500) unlockGameAchievement('rhythm_500_combo');
  }, [combo, unlockGameAchievement, playSound]);

  // Check perfect achievement
  useEffect(() => {
    if (perfectCount === 1) unlockGameAchievement('rhythm_first_perfect');
  }, [perfectCount, unlockGameAchievement]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Prevent default for game keys
      if (LANE_KEYS.includes(key) || ['p', ' ', 'escape', 'enter', 'arrowup', 'arrowdown', 'w', 's', 'r'].includes(key)) {
        e.preventDefault();
      }

      switch (gamePhase) {
        case 'menu':
          if (key === 'enter') {
            setGamePhase('trackSelect');
            playSound('menu');
          }
          break;

        case 'trackSelect':
          if (key === 'arrowup' || key === 'w') {
            setSelectedTrack(prev => (prev - 1 + TRACKS.length) % TRACKS.length);
            playSound('menu');
          } else if (key === 'arrowdown' || key === 's') {
            setSelectedTrack(prev => (prev + 1) % TRACKS.length);
            playSound('menu');
          } else if (key === 'enter') {
            startGame();
          } else if (key === 'escape') {
            setGamePhase('menu');
          }
          break;

        case 'playing':
          if (LANE_KEYS.includes(key) && !keysPressed.current.has(key)) {
            keysPressed.current.add(key);
            const lane = LANE_KEYS.indexOf(key);
            tryHitNote(lane);
          } else if (key === 'p' || key === ' ') {
            setGamePhase('paused');
          } else if (key === 'escape') {
            setGamePhase('trackSelect');
          }
          break;

        case 'paused':
          if (key === 'p' || key === ' ' || key === 'enter') {
            setGamePhase('playing');
            lastUpdateRef.current = performance.now();
          } else if (key === 'r') {
            startGame();
          } else if (key === 'escape') {
            setGamePhase('trackSelect');
          }
          break;

        case 'results':
        case 'gameOver':
          if (key === 'enter') {
            setGamePhase('trackSelect');
          } else if (key === 'r') {
            startGame();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase, playSound, startGame, tryHitNote]);

  // Animated matrix rain for non-playing screens
  const menuRainRef = useRef<Array<{ x: number; y: number; char: string; speed: number }>>([]);
  const menuAnimationRef = useRef<number>(0);

  // Initialise menu rain drops
  useEffect(() => {
    if (menuRainRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        menuRainRef.current.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
          speed: 1 + Math.random() * 3
        });
      }
    }
  }, []);

  // Draw non-playing screens on canvas with animated matrix rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gamePhase === 'playing') {
      if (menuAnimationRef.current) {
        cancelAnimationFrame(menuAnimationRef.current);
        menuAnimationRef.current = 0;
      }
      return;
    }

    const drawMenuScreen = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw animated matrix rain background
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.font = '14px monospace';
      menuRainRef.current.forEach(drop => {
        ctx.fillText(drop.char, drop.x, drop.y);
        // Update position for next frame
        drop.y += drop.speed;
        if (drop.y > CANVAS_HEIGHT) {
          drop.y = 0;
          drop.x = Math.random() * CANVAS_WIDTH;
          drop.char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        }
      });

      ctx.textAlign = 'center';

      if (gamePhase === 'menu') {
      // Title
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#00ff00';
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 64px monospace';
      ctx.fillText('JIMMY MATRIX', CANVAS_WIDTH / 2, 150);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#00cc00';
      ctx.font = '24px monospace';
      ctx.fillText('Epic Matrix Rhythm Game', CANVAS_WIDTH / 2, 200);

      ctx.font = '18px monospace';
      ctx.fillText('Catch the code in beat', CANVAS_WIDTH / 2, 240);

      // Lane key display
      const keyStartX = CANVAS_WIDTH / 2 - (LANE_COUNT * 70) / 2;
      for (let i = 0; i < LANE_COUNT; i++) {
        const x = keyStartX + i * 70 + 35;

        ctx.strokeStyle = LANE_COLOURS[i];
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 25, 300, 50, 50);

        ctx.fillStyle = LANE_COLOURS[i];
        ctx.font = 'bold 28px monospace';
        ctx.fillText(LANE_KEYS[i].toUpperCase(), x, 335);
      }

      // Instructions
      ctx.fillStyle = '#00ff00';
      ctx.font = '20px monospace';
      ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 450);

      ctx.fillStyle = '#00aa00';
      ctx.font = '14px monospace';
      ctx.fillText('Hit the falling notes as they reach the line', CANVAS_WIDTH / 2, 500);
      ctx.fillText('Perfect timing = Maximum points!', CANVAS_WIDTH / 2, 525);
    } else if (gamePhase === 'trackSelect') {
      // Title
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('SELECT TRACK', CANVAS_WIDTH / 2, 60);

      // Track list
      const trackStartY = 100;
      const trackHeight = 80;

      for (let i = 0; i < TRACKS.length; i++) {
        const track = TRACKS[i];
        const y = trackStartY + i * trackHeight;
        const isSelected = i === selectedTrack;
        const isCompleted = completedTracks.has(track.id);

        // Background
        if (isSelected) {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
          ctx.fillRect(100, y, CANVAS_WIDTH - 200, trackHeight - 10);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(100, y, CANVAS_WIDTH - 200, trackHeight - 10);
        }

        // Track name
        ctx.fillStyle = isSelected ? '#ffffff' : '#00cc00';
        ctx.font = isSelected ? 'bold 24px monospace' : '22px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(track.name, 130, y + 30);

        // Artist and BPM
        ctx.fillStyle = '#008800';
        ctx.font = '14px monospace';
        ctx.fillText(`${track.artist} • ${track.bpm} BPM • ${track.duration / 1000}s`, 130, y + 52);

        // Difficulty
        ctx.fillStyle = DIFFICULTY_COLOURS[track.difficulty];
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(track.difficulty.toUpperCase(), CANVAS_WIDTH - 130, y + 30);

        // High score
        if (highScores[track.id]) {
          ctx.fillStyle = '#00aa00';
          ctx.font = '14px monospace';
          ctx.fillText(`Best: ${highScores[track.id].toLocaleString()}`, CANVAS_WIDTH - 130, y + 52);
        }

        // Completed indicator
        if (isCompleted) {
          ctx.fillStyle = '#ffd700';
          ctx.font = '20px monospace';
          ctx.fillText('★', CANVAS_WIDTH - 130, y + 52);
        }
      }

      // Instructions
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('↑↓ Select • ENTER Start • ESC Back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    } else if (gamePhase === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

      ctx.font = '20px monospace';
      ctx.fillText('SPACE / P - Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('R - Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('ESC - Quit', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    } else if (gamePhase === 'results') {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('TRACK COMPLETE!', CANVAS_WIDTH / 2, 80);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 56px monospace';
      ctx.fillText(score.toLocaleString(), CANVAS_WIDTH / 2, 160);
      ctx.font = '20px monospace';
      ctx.fillText('POINTS', CANVAS_WIDTH / 2, 190);

      // Stats
      const statsY = 250;
      ctx.font = '24px monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText('PERFECT:', CANVAS_WIDTH / 2 - 20, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(perfectCount.toString(), CANVAS_WIDTH / 2 + 20, statsY);

      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'right';
      ctx.fillText('GREAT:', CANVAS_WIDTH / 2 - 20, statsY + 35);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(greatCount.toString(), CANVAS_WIDTH / 2 + 20, statsY + 35);

      ctx.fillStyle = '#00ff00';
      ctx.textAlign = 'right';
      ctx.fillText('GOOD:', CANVAS_WIDTH / 2 - 20, statsY + 70);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(goodCount.toString(), CANVAS_WIDTH / 2 + 20, statsY + 70);

      ctx.fillStyle = '#ff0000';
      ctx.textAlign = 'right';
      ctx.fillText('MISS:', CANVAS_WIDTH / 2 - 20, statsY + 105);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(missCount.toString(), CANVAS_WIDTH / 2 + 20, statsY + 105);

      // Max combo
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ffff';
      ctx.font = '28px monospace';
      ctx.fillText(`MAX COMBO: ${maxCombo}`, CANVAS_WIDTH / 2, statsY + 160);

      // Full combo bonus
      if (missCount === 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('★ FULL COMBO! ★', CANVAS_WIDTH / 2, statsY + 210);
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#00ff00';
      ctx.font = '20px monospace';
      ctx.fillText('Press ENTER to continue • R to retry', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    } else if (gamePhase === 'gameOver') {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 56px monospace';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 150);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 40px monospace';
      ctx.fillText(score.toLocaleString(), CANVAS_WIDTH / 2, 230);
      ctx.font = '20px monospace';
      ctx.fillText('POINTS', CANVAS_WIDTH / 2, 260);

      ctx.fillStyle = '#00ffff';
      ctx.font = '24px monospace';
      ctx.fillText(`Max Combo: ${maxCombo}`, CANVAS_WIDTH / 2, 320);

      ctx.fillStyle = '#888888';
      ctx.font = '18px monospace';
      ctx.fillText('Too many misses...', CANVAS_WIDTH / 2, 380);

      ctx.fillStyle = '#00ff00';
      ctx.font = '20px monospace';
      ctx.fillText('Press ENTER to continue • R to retry', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }

      // Continue animation loop for non-playing screens
      menuAnimationRef.current = requestAnimationFrame(drawMenuScreen);
    };

    // Start the animation loop
    drawMenuScreen();

    return () => {
      if (menuAnimationRef.current) {
        cancelAnimationFrame(menuAnimationRef.current);
        menuAnimationRef.current = 0;
      }
    };
  }, [gamePhase, selectedTrack, highScores, completedTracks, score, perfectCount, greatCount, goodCount, missCount, maxCombo]);

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
        style={{
          boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />

      {/* Footer instructions */}
      <div className="absolute bottom-4 right-4 text-green-600 text-xs">
        D F J K - Hit Notes • SPACE - Pause • ESC to exit
      </div>
    </div>
  );
}
