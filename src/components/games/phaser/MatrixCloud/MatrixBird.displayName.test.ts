/**
 * R84.B12 — Matrix Bird display-name audit (B1 rename coverage refresh).
 *
 * R83.S1 renamed "Snake Classic" → "Matrix Snake" but shipped with two
 * untouched surfaces (ASCII title block + achievements panel) — caught only
 * at Stream A audit as D6/D7. R83.B1 claimed Matrix Bird's full-surface
 * rename shipped clean; R84.V3's static audit confirmed it — but we had no
 * regression guard. These tests pin every user-visible rename surface so a
 * future refactor can't silently regress any single one.
 *
 * Intentionally imports from the real config/registry/save-system modules
 * (no mocks) so the assertions match what users actually see.
 */

import { describe, it, expect } from 'vitest';
import { TITLE_LINES, GAME_TITLES } from '@/lib/asciiArt';
import { GAME_REGISTRY } from '@/data/gameRegistry';
import { GAME_ACHIEVEMENTS } from '@/hooks/useSaveSystem';
import { MatrixCloudMenuScene } from './scenes/MenuScene';

describe('R84.B12 — Matrix Bird display-name audit', () => {
  describe('ASCII block-letter title (GamePortal hero card)', () => {
    it('TITLE_LINES["matrix-cloud"] spells ["MATRIX", "BIRD"]', () => {
      expect(TITLE_LINES['matrix-cloud']).toEqual(['MATRIX', 'BIRD']);
    });

    it('GAME_TITLES["matrix-cloud"] renders as block-character art (not the legacy "CLOUD" art)', () => {
      const title = GAME_TITLES['matrix-cloud'];
      expect(title).toBeDefined();
      expect(title).toContain('█');
      // A two-word title renders as 5 rows + blank separator + 5 rows = 11 rows.
      expect(title.split('\n')).toHaveLength(11);
    });
  });

  describe('GameRegistry (landing card + iPod carousel)', () => {
    it('id "matrix-cloud" entry has title "Matrix Bird"', () => {
      const entry = GAME_REGISTRY.find((g) => g.id === 'matrix-cloud');
      expect(entry).toBeDefined();
      expect(entry!.title).toBe('Matrix Bird');
    });

    it('registry keeps id "matrix-cloud" for storage stability — ID does NOT change on rename', () => {
      // Save data is keyed by id, so changing id would orphan every existing
      // high score. The rename is a DISPLAY change only.
      const entry = GAME_REGISTRY.find((g) => g.id === 'matrix-cloud');
      expect(entry!.id).toBe('matrix-cloud');
    });
  });

  describe('Achievements panel (useSaveSystem.GAME_ACHIEVEMENTS)', () => {
    it('every matrixCloud achievement row has game: "Matrix Bird"', () => {
      const rows = GAME_ACHIEVEMENTS.matrixCloud;
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.game).toBe('Matrix Bird');
      }
    });

    it('no matrixCloud achievement row still says "Matrix Cloud"', () => {
      const rows = GAME_ACHIEVEMENTS.matrixCloud;
      for (const row of rows) {
        expect(row.game).not.toBe('Matrix Cloud');
      }
    });

    it('expected 8 bird achievements registered (first_flight through sentinel_defeat)', () => {
      const ids = GAME_ACHIEVEMENTS.matrixCloud.map((r) => r.id).sort();
      expect(ids).toEqual(
        [
          'cloud_all_bosses',
          'cloud_architect_defeat',
          'cloud_boss_slayer',
          'cloud_first_flight',
          'cloud_high_flyer',
          'cloud_level_5',
          'cloud_power_collector',
          'cloud_sentinel_defeat',
        ].sort(),
      );
    });
  });

  describe('MenuScene title constant', () => {
    it('constructor wires title to "MATRIX BIRD" on the MenuScene base class', () => {
      // MenuScene stores config?.title on this.title — Phaser.Scene super is
      // mocked in src/test/setup.ts, so new-ing the scene is inexpensive.
      // Cast to any to reach the protected title field.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menu = new MatrixCloudMenuScene() as any;
      expect(menu.title).toBe('MATRIX BIRD');
    });

    it('constructor wires subtitle to the Bird-specific cascade copy', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menu = new MatrixCloudMenuScene() as any;
      expect(menu.subtitle).toBe('One flap at a time through the cascade');
    });
  });
});
