import { describe, it, expect } from 'vitest';
import { generateChart, TRACK_CHARTS } from './charts';
import { GAME_CONFIG } from './config';

describe('RhythmHacker Charts', () => {
  describe('generateChart', () => {
    it('returns notes sorted by time', () => {
      const chart = generateChart(120, 60, 'normal', 42);
      for (let i = 1; i < chart.length; i++) {
        expect(chart[i].time).toBeGreaterThanOrEqual(chart[i - 1].time);
      }
    });

    it('produces deterministic output for the same seed', () => {
      const a = generateChart(120, 60, 'normal', 42);
      const b = generateChart(120, 60, 'normal', 42);
      expect(a).toEqual(b);
    });

    it('produces different output for different seeds', () => {
      const a = generateChart(120, 60, 'normal', 42);
      const b = generateChart(120, 60, 'normal', 99);
      expect(a).not.toEqual(b);
    });

    it('all notes have valid lanes (0-3)', () => {
      const chart = generateChart(140, 120, 'hard', 256);
      for (const note of chart) {
        expect(note.lane).toBeGreaterThanOrEqual(0);
        expect(note.lane).toBeLessThanOrEqual(3);
      }
    });

    it('hold notes have holdDuration', () => {
      const chart = generateChart(140, 120, 'hard', 256);
      const holds = chart.filter(n => n.type === 'hold');
      expect(holds.length).toBeGreaterThan(0);
      for (const h of holds) {
        expect(h.holdDuration).toBeDefined();
        expect(h.holdDuration).toBeGreaterThan(0);
      }
    });

    it('double notes have pairedLane different from lane', () => {
      const chart = generateChart(140, 120, 'hard', 256);
      const doubles = chart.filter(n => n.type === 'double');
      expect(doubles.length).toBeGreaterThan(0);
      for (const d of doubles) {
        expect(d.pairedLane).toBeDefined();
        expect(d.pairedLane).not.toBe(d.lane);
      }
    });

    it('easy charts have no holds or doubles', () => {
      const chart = generateChart(100, 120, 'easy', 42);
      expect(chart.filter(n => n.type === 'hold').length).toBe(0);
      expect(chart.filter(n => n.type === 'double').length).toBe(0);
    });

    it('insane charts are denser than easy charts of the same duration', () => {
      const easy = generateChart(120, 60, 'easy', 42);
      const insane = generateChart(120, 60, 'insane', 42);
      expect(insane.length).toBeGreaterThan(easy.length);
    });

    it('no notes before beat 4', () => {
      const chart = generateChart(120, 60, 'normal', 42);
      const beatMs = 60000 / 120;
      const minTime = 4 * beatMs;
      for (const note of chart) {
        expect(note.time).toBeGreaterThanOrEqual(minTime);
      }
    });

    it('note times stay within track duration', () => {
      const duration = 60;
      const chart = generateChart(120, duration, 'normal', 42);
      for (const note of chart) {
        expect(note.time).toBeLessThanOrEqual(duration * 1000);
      }
    });
  });

  describe('TRACK_CHARTS', () => {
    it('has one chart per configured track', () => {
      expect(TRACK_CHARTS.length).toBe(GAME_CONFIG.TRACKS.length);
    });

    it('each chart contains notes', () => {
      for (const chart of TRACK_CHARTS) {
        expect(chart.length).toBeGreaterThan(0);
      }
    });

    it('charts scale in note count with difficulty', () => {
      const easy = TRACK_CHARTS[0]; // In The Moonlight (easy, 228s)
      const normal = TRACK_CHARTS[1]; // Cyberpunkin' (normal, 200s)
      const hard = TRACK_CHARTS[2]; // Cyberpsychotic (hard, 148s)

      const easyRate = easy.length / GAME_CONFIG.TRACKS[0].duration;
      const normalRate = normal.length / GAME_CONFIG.TRACKS[1].duration;
      const hardRate = hard.length / GAME_CONFIG.TRACKS[2].duration;

      expect(normalRate).toBeGreaterThan(easyRate);
      expect(hardRate).toBeGreaterThan(normalRate);
    });

    it('insane tracks include hold and double notes', () => {
      const insane = TRACK_CHARTS[3]; // Enhancements (insane)
      expect(insane.some(n => n.type === 'hold')).toBe(true);
      expect(insane.some(n => n.type === 'double')).toBe(true);
    });
  });
});
