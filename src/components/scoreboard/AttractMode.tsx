import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MatrixRainCanvas } from '../ui/MatrixRainCanvas';
import { ScoreTable } from './ScoreTable';
import type { ScoreboardGameId, ScoreEntry } from '../../hooks/useSaveSystem';
import { R84_PRIORITY_TRIO, selectAttractCycle } from './attractCycle';

const IDLE_TIMEOUT_MS = 10_000;
const GAME_DISPLAY_MS = 5_000;

const GAME_LABELS: Record<ScoreboardGameId, string> = {
  snakeClassic: 'Matrix Snake',
  vortexPong: 'Vortex Pong',
  matrixCloud: 'Matrix Bird',
  matrixInvaders: 'Matrix Invaders',
  metris: 'Metris',
  matrixFrogger: 'Matrix Frogger',
  neoJump: 'Neo Jump',
  agentChase: 'Agent Chase',
  rhythmHacker: 'Rhythm Hacker',
  cloudJumper: 'Cloud Jumper',
  codeBreaker: 'Code Breaker',
};

interface AttractModeProps {
  scoreboards: Record<ScoreboardGameId, ScoreEntry[]>;
  lastInitials: string;
  enabled?: boolean;
}

export const AttractMode: React.FC<AttractModeProps> = ({
  scoreboards,
  lastInitials,
  enabled = true,
}) => {
  const cycle = useMemo(() => selectAttractCycle(scoreboards), [scoreboards]);
  const cycleLength = cycle.length;
  const [active, setActive] = useState(false);
  const [gameIndex, setGameIndex] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Attract is purely decorative — skip fades, slides, and the pulse CTA under
  // prefers-reduced-motion. Framer's hook returns `null` on the server / first
  // paint; coerce to a boolean so downstream expressions stay stable.
  const shouldReduceMotion = useReducedMotion() ?? false;
  const overlayDuration = shouldReduceMotion ? 0 : 0.5;
  const slideDuration = shouldReduceMotion ? 0 : 0.4;
  const slideOffset = shouldReduceMotion ? 0 : 20;
  const insertCoinClass = shouldReduceMotion ? 'mt-8' : 'mt-8 animate-pulse';

  const resetIdle = useCallback(() => {
    setActive(false);
    setGameIndex(0);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    cycleTimerRef.current = null;

    if (!enabled) return;
    idleTimerRef.current = setTimeout(() => {
      setActive(true);
      setGameIndex(0);
    }, IDLE_TIMEOUT_MS);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setActive(false);
      return;
    }

    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    const handler = () => resetIdle();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetIdle();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [enabled, resetIdle]);

  useEffect(() => {
    if (!active || cycleLength <= 1) return;
    cycleTimerRef.current = setInterval(() => {
      setGameIndex(prev => (prev + 1) % cycleLength);
    }, GAME_DISPLAY_MS);
    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [active, cycleLength]);

  // Keep gameIndex in range when the cycle shape changes mid-session (a newly
  // achieved score can shrink or grow the populated set).
  useEffect(() => {
    if (cycleLength === 0) return;
    setGameIndex(prev => (prev >= cycleLength ? 0 : prev));
  }, [cycleLength]);

  const currentGame: ScoreboardGameId =
    cycle[gameIndex] ?? cycle[0] ?? R84_PRIORITY_TRIO[0];
  const top5 = (scoreboards[currentGame] || []).slice(0, 5);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: overlayDuration }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ cursor: 'pointer' }}
          onClick={resetIdle}
          data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
        >
          <MatrixRainCanvas opacity={0.3} />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
              mixBlendMode: 'overlay',
              opacity: 0.08,
            }}
          />

          <div className="relative z-10 text-center max-w-lg w-full px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentGame}
                initial={{ opacity: 0, y: slideOffset }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -slideOffset }}
                transition={{ duration: slideDuration }}
              >
                <h2
                  className="text-2xl mb-1"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    color: '#ffff00',
                    textShadow: '0 0 10px #ffff00',
                  }}
                >
                  {GAME_LABELS[currentGame]}
                </h2>
                <p
                  className="text-xs mb-4"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    color: '#00ff00',
                  }}
                >
                  HIGH SCORES
                </p>

                {top5.length > 0 ? (
                  <div className="bg-black/80 border border-green-500/30 rounded p-3">
                    <ScoreTable entries={top5} lastInitials={lastInitials} />
                  </div>
                ) : (
                  <p
                    className="text-green-500/40 mt-8"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                  >
                    NO SCORES YET
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <p
              className={insertCoinClass}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#00ff00',
              }}
            >
              INSERT COIN TO CONTINUE
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
