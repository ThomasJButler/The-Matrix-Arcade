// R85.G1 regression guard: locks down the end-to-end "play → die → confirm
// initials → refresh browser → still see score" user journey for both the
// scoreboards slice (what the Scoreboard modal + AttractMode read) and the
// per-game games[id].highScore field (what GameHighScores modal + iPod card
// surfaces read). Without this test, either side of the save system can
// silently drift out of the other and the regression Tom flagged on Invaders
// and Metris reappears.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSaveSystem, type ScoreEntry, type ScoreboardGameId } from './useSaveSystem';

const STORAGE_KEY = 'matrix-arcade-save-data';

const makeEntry = (score: number, initials = 'TOM'): ScoreEntry => ({
  initials,
  score,
  level: 3,
  durationMs: 60000,
  date: new Date().toISOString(),
});

describe('useSaveSystem — R85.G1 persistence roundtrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('scoreboard entry survives a fresh hook mount (simulating browser refresh)', async () => {
    // Session 1: add a score
    const session1 = renderHook(() => useSaveSystem());
    await waitFor(() => expect(session1.result.current.isLoading).toBe(false));

    act(() => {
      session1.result.current.addScore('metris', makeEntry(1000));
    });

    expect(session1.result.current.saveData.scoreboards.metris).toHaveLength(1);
    session1.unmount();

    // Session 2: re-mount, verify the entry survives
    const session2 = renderHook(() => useSaveSystem());
    await waitFor(() => expect(session2.result.current.isLoading).toBe(false));

    expect(session2.result.current.saveData.scoreboards.metris).toHaveLength(1);
    expect(session2.result.current.saveData.scoreboards.metris[0].score).toBe(1000);
    expect(session2.result.current.saveData.scoreboards.metris[0].initials).toBe('TOM');
  });

  it('games[id].highScore is updated when addScore writes a new best', async () => {
    // This is the half of R85.G1 that was actually broken: most Phaser games
    // do not call updateGameSave with a highScore, so games[id].highScore
    // stays at 0 even though scoreboards[id] has entries. GameHighScores
    // modal and per-game card surfaces read games[id].highScore, so they
    // showed 0 after refresh even though the scoreboards slice had the data.
    const { result } = renderHook(() => useSaveSystem());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addScore('matrixInvaders', makeEntry(5000));
    });

    expect(result.current.saveData.games.matrixInvaders.highScore).toBe(5000);
  });

  it('games[id].highScore tracks the top score after multiple addScore calls', async () => {
    const { result } = renderHook(() => useSaveSystem());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addScore('matrixInvaders', makeEntry(300));
      result.current.addScore('matrixInvaders', makeEntry(1500));
      result.current.addScore('matrixInvaders', makeEntry(800));
    });

    // Top score across all three is 1500
    expect(result.current.saveData.games.matrixInvaders.highScore).toBe(1500);
  });

  it('games[id].highScore does NOT downgrade when a lower score is added later', async () => {
    const { result } = renderHook(() => useSaveSystem());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addScore('matrixInvaders', makeEntry(2000));
    });
    expect(result.current.saveData.games.matrixInvaders.highScore).toBe(2000);

    act(() => {
      result.current.addScore('matrixInvaders', makeEntry(500));
    });
    // Still 2000 — addScore must never lower the high score watermark.
    expect(result.current.saveData.games.matrixInvaders.highScore).toBe(2000);
  });

  it('games[id].highScore + scoreboard both persist across refresh', async () => {
    const session1 = renderHook(() => useSaveSystem());
    await waitFor(() => expect(session1.result.current.isLoading).toBe(false));

    act(() => {
      session1.result.current.addScore('matrixInvaders', makeEntry(7500));
    });

    session1.unmount();

    const session2 = renderHook(() => useSaveSystem());
    await waitFor(() => expect(session2.result.current.isLoading).toBe(false));

    // Both surfaces have to reflect the new score after the refresh.
    expect(session2.result.current.saveData.games.matrixInvaders.highScore).toBe(7500);
    expect(session2.result.current.saveData.scoreboards.matrixInvaders[0].score).toBe(7500);
  });

  it('localStorage snapshot contains both scoreboards entry and games[id].highScore', async () => {
    const { result } = renderHook(() => useSaveSystem());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addScore('vortexPong', makeEntry(4242));
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!);
    expect(stored.scoreboards.vortexPong[0].score).toBe(4242);
    expect(stored.games.vortexPong.highScore).toBe(4242);
  });

  it('every scoreboard game ID keeps high-score + scoreboard in sync', async () => {
    const { result } = renderHook(() => useSaveSystem());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const games: ScoreboardGameId[] = [
      'snakeClassic', 'vortexPong', 'matrixCloud', 'matrixInvaders', 'metris',
      'matrixFrogger', 'neoJump', 'agentChase', 'rhythmHacker',
      'cloudJumper', 'codeBreaker',
    ];

    act(() => {
      games.forEach((gameId, i) => {
        result.current.addScore(gameId, makeEntry((i + 1) * 1000));
      });
    });

    games.forEach((gameId, i) => {
      expect(result.current.saveData.games[gameId].highScore).toBe((i + 1) * 1000);
      expect(result.current.saveData.scoreboards[gameId][0].score).toBe((i + 1) * 1000);
    });
  });
});
