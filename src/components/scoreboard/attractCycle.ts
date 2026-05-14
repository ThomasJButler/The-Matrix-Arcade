import {
  SCOREBOARD_GAME_IDS,
  type ScoreEntry,
  type ScoreboardGameId,
} from '../../hooks/useSaveSystem';

// R84 polish trio — Matrix Snake, Vortex Pong, Matrix Bird. Order matches
// SCOREBOARD_GAME_IDS so a populated cycle keeps the trio's natural position
// when everything has scores; when only a subset has scores the trio still
// leads the cycle, and an empty arcade falls back to the trio so the attract
// screen never collapses to a single placeholder slide.
export const R84_PRIORITY_TRIO: readonly ScoreboardGameId[] = [
  'snakeClassic',
  'vortexPong',
  'matrixCloud',
] as const;

export function selectAttractCycle(
  scoreboards: Record<ScoreboardGameId, ScoreEntry[]>,
): ScoreboardGameId[] {
  const hasScores = (id: ScoreboardGameId) => (scoreboards[id]?.length ?? 0) > 0;
  const trioSet = new Set<ScoreboardGameId>(R84_PRIORITY_TRIO);
  const trioInCycle = R84_PRIORITY_TRIO.filter(hasScores);
  const otherInCycle = SCOREBOARD_GAME_IDS.filter((id) => !trioSet.has(id) && hasScores(id));
  const populated = [...trioInCycle, ...otherInCycle];
  return populated.length > 0 ? populated : [...R84_PRIORITY_TRIO];
}
