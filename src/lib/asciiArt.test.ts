import { describe, it, expect } from 'vitest';
import { generateGameTitle, GAME_TITLES } from './asciiArt';

describe('asciiArt', () => {
  describe('generateGameTitle', () => {
    it('returns uppercase game ID for unknown games', () => {
      expect(generateGameTitle('unknown-game')).toBe('UNKNOWN-GAME');
    });

    it('generates 5-row titles for single-word games', () => {
      const title = generateGameTitle('metris');
      const rows = title.split('\n');
      expect(rows).toHaveLength(5);
    });

    it('generates 11-row titles for two-word games (5 + blank + 5)', () => {
      const title = generateGameTitle('neo-jump');
      const rows = title.split('\n');
      expect(rows).toHaveLength(11);
      expect(rows[5]).toBe('');
    });

    it('uses block characters in output', () => {
      const title = generateGameTitle('metris');
      expect(title).toContain('█');
    });

    it('centres shorter lines relative to longer ones', () => {
      const title = generateGameTitle('neo-jump');
      const rows = title.split('\n');
      const topLine = rows[0];
      const bottomLine = rows[6];
      expect(topLine.startsWith(' ')).toBe(true);
      expect(bottomLine.startsWith('█') || bottomLine.startsWith(' ')).toBe(true);
    });

    it('renders all rows within a block at consistent max width', () => {
      const title = generateGameTitle('matrix-cloud');
      const rows = title.split('\n').filter(r => r !== '');
      const trimmedWidths = rows.map(r => r.trimEnd().length);
      const maxWidth = Math.max(...trimmedWidths);
      for (const row of rows) {
        expect(row.length).toBeLessThanOrEqual(maxWidth + 1);
      }
    });
  });

  describe('GAME_TITLES', () => {
    it('has pre-computed titles for all 12 games', () => {
      const expectedIds = [
        'ctrl-s-world', 'snake-classic', 'vortex-pong', 'matrix-cloud',
        'matrix-invaders', 'metris', 'matrix-frogger', 'neo-jump',
        'agent-chase', 'rhythm-hacker', 'cloud-jumper', 'code-breaker',
      ];
      for (const id of expectedIds) {
        expect(GAME_TITLES[id]).toBeDefined();
        expect(GAME_TITLES[id].length).toBeGreaterThan(0);
      }
    });

    it('all titles contain block characters', () => {
      for (const title of Object.values(GAME_TITLES)) {
        expect(title).toContain('█');
      }
    });

    it('no title exceeds 60 characters per row', () => {
      for (const [id, title] of Object.entries(GAME_TITLES)) {
        const rows = title.split('\n');
        for (const row of rows) {
          expect(row.length, `${id} has row wider than 60 chars`).toBeLessThanOrEqual(60);
        }
      }
    });
  });
});
