/**
 * Canonical mapping between registry IDs and save-data keys.
 *
 * Registry IDs (kebab-case, used in `GAME_REGISTRY` and the URL/UI layer) must
 * map bijectively to `GlobalSaveData['games']` keys (camelCase, used by every
 * read/write path in `useSaveSystem`). A drift here silently routes the
 * dashbar trophy to `undefined.highScore ?? 0` — visually indistinguishable
 * from "never played" (see R83.G6 / R85.G2).
 *
 * One source of truth + a regression test (`saveKeys.test.ts`) keeps the
 * twelve wrapper `gameId=` props, the save schema, and the modal in lockstep.
 */
import type { GlobalSaveData } from '../hooks/useSaveSystem';

export type SaveKey = keyof GlobalSaveData['games'];

export const REGISTRY_TO_SAVE_KEY = {
  'ctrl-s-world': 'ctrlSWorld',
  'snake-classic': 'snakeClassic',
  'vortex-pong': 'vortexPong',
  'matrix-cloud': 'matrixCloud',
  'matrix-invaders': 'matrixInvaders',
  'metris': 'metris',
  'matrix-frogger': 'matrixFrogger',
  'neo-jump': 'neoJump',
  'agent-chase': 'agentChase',
  'rhythm-hacker': 'rhythmHacker',
  'cloud-jumper': 'cloudJumper',
  'code-breaker': 'codeBreaker',
} as const satisfies Record<string, SaveKey>;

export type RegistryId = keyof typeof REGISTRY_TO_SAVE_KEY;

export const SAVE_KEY_TO_REGISTRY: Record<SaveKey, RegistryId | undefined> = (() => {
  const inverse = {} as Record<SaveKey, RegistryId | undefined>;
  for (const [registryId, saveKey] of Object.entries(REGISTRY_TO_SAVE_KEY) as Array<[RegistryId, SaveKey]>) {
    inverse[saveKey] = registryId;
  }
  return inverse;
})();

export function getSaveKey(registryId: string): SaveKey | undefined {
  return (REGISTRY_TO_SAVE_KEY as Record<string, SaveKey>)[registryId];
}
