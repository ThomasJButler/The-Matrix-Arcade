import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { GAME_REGISTRY } from '../data/gameRegistry';
import {
  REGISTRY_TO_SAVE_KEY,
  SAVE_KEY_TO_REGISTRY,
  getSaveKey,
  type SaveKey,
} from './saveKeys';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Wrapper path convention: src/components/games/phaser/<PascalFolder>/index.tsx
// Folder name derived from the save key (camelCase → PascalCase).
const toPascal = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1);

describe('saveKeys — registry ↔ save-data ID parity (R83.G6 / R85.G2)', () => {
  it('every GAME_REGISTRY entry resolves to a save key', () => {
    for (const entry of GAME_REGISTRY) {
      expect(
        getSaveKey(entry.id),
        `registry id "${entry.id}" (${entry.title}) is missing from REGISTRY_TO_SAVE_KEY — dashbar trophy would show 0`,
      ).toBeDefined();
    }
  });

  it('registry and save-key maps are bijective (no drift in either direction)', () => {
    const registryIds = GAME_REGISTRY.map((g) => g.id).sort();
    const mapIds = Object.keys(REGISTRY_TO_SAVE_KEY).sort();
    expect(mapIds).toEqual(registryIds);

    for (const entry of GAME_REGISTRY) {
      const saveKey = REGISTRY_TO_SAVE_KEY[entry.id as keyof typeof REGISTRY_TO_SAVE_KEY];
      expect(SAVE_KEY_TO_REGISTRY[saveKey]).toBe(entry.id);
    }
  });

  it('getSaveKey returns undefined for unknown IDs', () => {
    expect(getSaveKey('matrix-bird')).toBeUndefined();
    expect(getSaveKey('')).toBeUndefined();
  });

  it('every Phaser wrapper passes gameId matching the registry-to-save-key mapping', () => {
    for (const entry of GAME_REGISTRY) {
      const expectedSaveKey: SaveKey = REGISTRY_TO_SAVE_KEY[entry.id as keyof typeof REGISTRY_TO_SAVE_KEY];
      const folder = toPascal(expectedSaveKey);
      const wrapperPath = resolve(REPO_ROOT, 'src/components/games/phaser', folder, 'index.tsx');
      const source = readFileSync(wrapperPath, 'utf8');
      expect(
        source,
        `${folder}/index.tsx must pass gameId="${expectedSaveKey}" — mismatch breaks write/read parity for the dashbar trophy`,
      ).toContain(`gameId="${expectedSaveKey}"`);
    }
  });
});
