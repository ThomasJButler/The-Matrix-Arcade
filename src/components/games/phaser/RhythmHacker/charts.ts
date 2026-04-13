/**
 * Rhythm Hacker — Beat-locked note charts
 *
 * Generates deterministic, musically-structured charts for each track.
 * Notes land on exact beat subdivisions (no random jitter) so the
 * player's key presses feel tied to the backing music.
 */

import { GAME_CONFIG } from './config';

type NoteType = 'normal' | 'hold' | 'double';

export interface ChartNote {
  time: number;
  lane: number;
  type: NoteType;
  holdDuration?: number;
  pairedLane?: number;
}

/** Mulberry32 seeded PRNG — same seed always produces the same chart */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Section structure ──────────────────────────────────────────────

type SectionKind = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';

interface Section {
  kind: SectionKind;
  startBeat: number;
  endBeat: number;
}

function buildSections(totalBeats: number): Section[] {
  const layout: [SectionKind, number][] = [
    ['intro', 0.08],
    ['verse', 0.22],
    ['chorus', 0.18],
    ['verse', 0.15],
    ['chorus', 0.18],
    ['bridge', 0.10],
    ['outro', 0.09],
  ];

  const sections: Section[] = [];
  let beat = 0;

  for (const [kind, proportion] of layout) {
    const beats = Math.floor(totalBeats * proportion);
    if (beats > 0) {
      sections.push({ kind, startBeat: beat, endBeat: beat + beats });
      beat += beats;
    }
  }

  if (beat < totalBeats && sections.length > 0) {
    sections[sections.length - 1].endBeat = totalBeats;
  }

  return sections;
}

// ── Lane patterns ──────────────────────────────────────────────────

const PATTERNS: number[][] = [
  [0, 1, 2, 3],  // cascade
  [3, 2, 1, 0],  // reverse cascade
  [0, 3, 1, 2],  // zigzag
  [0, 2, 0, 2],  // outer bounce
  [1, 2, 1, 2],  // inner bounce
  [0, 1, 3, 2],  // outer-in
  [2, 3, 0, 1],  // cross
  [0, 0, 3, 3],  // split
];

const SECTION_PATTERN_POOL: Record<SectionKind, number[]> = {
  intro: [0, 3],
  verse: [0, 1, 2, 5],
  chorus: [2, 4, 6, 7],
  bridge: [3, 4, 5],
  outro: [0, 1, 3],
};

// ── Difficulty profiles ────────────────────────────────────────────

interface DifficultyProfile {
  gridSubdivision: number;
  noteProbability: Record<SectionKind, number>;
  holdChance: number;
  doubleChance: number;
  holdDurationBeats: [number, number];
}

const PROFILES: Record<string, DifficultyProfile> = {
  easy: {
    gridSubdivision: 1,
    noteProbability: { intro: 0.5, verse: 0.7, chorus: 0.85, bridge: 0.6, outro: 0.5 },
    holdChance: 0,
    doubleChance: 0,
    holdDurationBeats: [1, 2],
  },
  normal: {
    gridSubdivision: 1,
    noteProbability: { intro: 0.55, verse: 0.8, chorus: 0.92, bridge: 0.65, outro: 0.55 },
    holdChance: 0.08,
    doubleChance: 0,
    holdDurationBeats: [1, 3],
  },
  hard: {
    gridSubdivision: 0.5,
    noteProbability: { intro: 0.35, verse: 0.55, chorus: 0.7, bridge: 0.45, outro: 0.3 },
    holdChance: 0.1,
    doubleChance: 0.07,
    holdDurationBeats: [1, 3],
  },
  insane: {
    gridSubdivision: 0.5,
    noteProbability: { intro: 0.45, verse: 0.65, chorus: 0.8, bridge: 0.55, outro: 0.4 },
    holdChance: 0.12,
    doubleChance: 0.1,
    holdDurationBeats: [1, 4],
  },
};

// ── Chart generator ────────────────────────────────────────────────

export function generateChart(
  bpm: number,
  durationSeconds: number,
  difficulty: string,
  seed: number,
): ChartNote[] {
  const rng = mulberry32(seed);
  const profile = PROFILES[difficulty] ?? PROFILES.normal;
  const beatMs = 60000 / bpm;
  const totalBeats = Math.floor(durationSeconds * bpm / 60);
  const sections = buildSections(totalBeats);
  const notes: ChartNote[] = [];

  const minBeat = 4;

  let patternPos = 0;
  let currentPattern = PATTERNS[0];
  let beatsInBlock = 0;

  for (const section of sections) {
    const pool = SECTION_PATTERN_POOL[section.kind];
    currentPattern = PATTERNS[pool[Math.floor(rng() * pool.length)]];
    beatsInBlock = 0;
    patternPos = 0;

    const prob = profile.noteProbability[section.kind];
    const step = profile.gridSubdivision;

    for (let beat = section.startBeat; beat < section.endBeat; beat += step) {
      if (beat < minBeat) {
        patternPos++;
        continue;
      }

      beatsInBlock += step;
      if (beatsInBlock >= 16) {
        currentPattern = PATTERNS[pool[Math.floor(rng() * pool.length)]];
        beatsInBlock = 0;
      }

      if (rng() > prob) {
        patternPos++;
        continue;
      }

      const time = Math.round(beat * beatMs);
      const lane = currentPattern[patternPos % currentPattern.length];
      patternPos++;

      const typeRoll = rng();
      let type: NoteType = 'normal';
      let holdDuration: number | undefined;
      let pairedLane: number | undefined;

      if (typeRoll < profile.doubleChance) {
        type = 'double';
        const available = [0, 1, 2, 3].filter(l => l !== lane);
        pairedLane = available[Math.floor(rng() * available.length)];
      } else if (typeRoll < profile.doubleChance + profile.holdChance) {
        type = 'hold';
        const [minB, maxB] = profile.holdDurationBeats;
        holdDuration = Math.round(beatMs * (minB + rng() * (maxB - minB)));
      }

      const note: ChartNote = { time, lane, type };
      if (holdDuration !== undefined) note.holdDuration = holdDuration;
      if (pairedLane !== undefined) note.pairedLane = pairedLane;
      notes.push(note);
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

/** Pre-generated charts — one per track, matching GAME_CONFIG.TRACKS order */
export const TRACK_CHARTS: ChartNote[][] = GAME_CONFIG.TRACKS.map((track, i) =>
  generateChart(
    track.bpm,
    track.duration,
    track.difficulty,
    42 + i * 97,
  ),
);
