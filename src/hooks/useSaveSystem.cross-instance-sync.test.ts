// R86.A1 regression guard: locks the cross-instance state-sharing contract.
//
// Before the shared-singleton fix, every `useSaveSystem()` call produced its
// own `useState` bucket. App.tsx's copy fed the Scoreboard + AttractMode
// modals; PhaserGame.tsx's copy received all game-end writes. In-memory the
// two copies never saw each other — only a page refresh re-synced them via
// localStorage. Tom hit this on 2026-04-22: *"scores DO persist (refresh
// proves it), but the Scoreboard modal shows stale data mid-session"*.
//
// These tests fail on the pre-fix code and pass after the module-level
// singleton (sharedSaveData + useSyncExternalStore). If this file goes red,
// the fix has been undone and the Scoreboard modal is stale again.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useSaveSystem,
  __resetSaveSystemForTest,
  type ScoreEntry,
} from './useSaveSystem';

const makeEntry = (score: number, initials = 'TOM'): ScoreEntry => ({
  initials,
  score,
  level: 3,
  durationMs: 60000,
  date: new Date().toISOString(),
});

describe('useSaveSystem — R86.A1 cross-instance shared state', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetSaveSystemForTest();
  });

  afterEach(() => {
    localStorage.clear();
    __resetSaveSystemForTest();
  });

  it('two concurrent instances observe the same saveData reference', async () => {
    // Simulates App.tsx + PhaserGame.tsx each calling useSaveSystem().
    const appSide = renderHook(() => useSaveSystem());
    const gameSide = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(appSide.result.current.isLoading).toBe(false);
      expect(gameSide.result.current.isLoading).toBe(false);
    });

    // Both instances must point at the SAME saveData snapshot. A per-instance
    // useState would return two distinct objects.
    expect(appSide.result.current.saveData).toBe(gameSide.result.current.saveData);
  });

  it('addScore on instance B propagates to instance A without a remount', async () => {
    // This is the direct R86.A1 repro. App.tsx holds `appSide` and renders
    // Scoreboard from its saveData. PhaserGame.tsx holds `gameSide` and
    // fires addScore on game-over. The modal has to see the new entry on
    // the next render — not after F5.
    const appSide = renderHook(() => useSaveSystem());
    const gameSide = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(appSide.result.current.isLoading).toBe(false);
      expect(gameSide.result.current.isLoading).toBe(false);
    });

    act(() => {
      gameSide.result.current.addScore('agentChase', makeEntry(8500, 'NEO'));
    });

    // Both instances must observe the write immediately.
    expect(appSide.result.current.saveData.scoreboards.agentChase).toHaveLength(1);
    expect(appSide.result.current.saveData.scoreboards.agentChase[0].score).toBe(8500);
    expect(appSide.result.current.saveData.scoreboards.agentChase[0].initials).toBe('NEO');
    expect(appSide.result.current.saveData.games.agentChase.highScore).toBe(8500);
    expect(appSide.result.current.saveData.lastInitials).toBe('NEO');

    // Cross-check: gameSide sees the same values.
    expect(gameSide.result.current.saveData.scoreboards.agentChase).toEqual(
      appSide.result.current.saveData.scoreboards.agentChase,
    );
  });

  it('updateGameSave on instance B propagates to instance A without a remount', async () => {
    // Mirror of the addScore test for the non-scoreboard write path (the
    // defensive write the R86.G1 / R86.A1 sub-commit pattern uses in
    // Neo Jump / Metris / Agent Chase playerDeath).
    const appSide = renderHook(() => useSaveSystem());
    const gameSide = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(appSide.result.current.isLoading).toBe(false);
      expect(gameSide.result.current.isLoading).toBe(false);
    });

    act(() => {
      gameSide.result.current.updateGameSave('neoJump', {
        highScore: 12000,
        level: 5,
        stats: { gamesPlayed: 3, totalScore: 25000 },
      });
    });

    expect(appSide.result.current.saveData.games.neoJump.highScore).toBe(12000);
    expect(appSide.result.current.saveData.games.neoJump.level).toBe(5);
    expect(appSide.result.current.saveData.games.neoJump.stats.gamesPlayed).toBe(3);
  });

  it('unlockAchievement on instance B propagates to instance A without a remount', async () => {
    const appSide = renderHook(() => useSaveSystem());
    const gameSide = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(appSide.result.current.isLoading).toBe(false);
      expect(gameSide.result.current.isLoading).toBe(false);
    });

    act(() => {
      gameSide.result.current.unlockAchievement('matrixFrogger', 'frogger_first_cross');
    });

    expect(appSide.result.current.saveData.games.matrixFrogger.achievements).toContain(
      'frogger_first_cross',
    );
  });

  it('unmounting one instance does not break broadcasts to the remaining instance', async () => {
    // Subscriber cleanup contract: when one hook unmounts, its subscriber is
    // removed, but the rest keep receiving updates. A leak here would either
    // crash (stale setState on unmounted component) or make the remaining
    // instance miss updates.
    const session1 = renderHook(() => useSaveSystem());
    const session2 = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(session1.result.current.isLoading).toBe(false);
      expect(session2.result.current.isLoading).toBe(false);
    });

    session1.unmount();

    act(() => {
      session2.result.current.addScore('metris', makeEntry(4200));
    });

    expect(session2.result.current.saveData.scoreboards.metris[0].score).toBe(4200);
  });

  it('subscriber list is fully drained by __resetSaveSystemForTest', async () => {
    // Contract for test-isolation — a stray subscriber across tests could
    // call setState on a torn-down component and surface as false-positive
    // "React state update on an unmounted component" warnings.
    const first = renderHook(() => useSaveSystem());
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    __resetSaveSystemForTest();

    // After reset, shared state is back to defaults AND the subscriber set
    // is empty, so a fresh mount starts from a clean slate.
    const second = renderHook(() => useSaveSystem());
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(second.result.current.saveData.scoreboards.metris).toEqual([]);
    expect(second.result.current.saveData.lastInitials).toBe('AAA');
  });

  it('clearBoard from instance B is observed by instance A', async () => {
    // Wipe path — the Scoreboard modal's RESET button triggers this from
    // App's instance. If it had been triggered from a different subtree
    // (e.g. a devtools surface), the main scoreboard modal must see the
    // wipe without a refresh.
    const appSide = renderHook(() => useSaveSystem());
    const otherSide = renderHook(() => useSaveSystem());

    await waitFor(() => {
      expect(appSide.result.current.isLoading).toBe(false);
      expect(otherSide.result.current.isLoading).toBe(false);
    });

    act(() => {
      otherSide.result.current.addScore('rhythmHacker', makeEntry(9999));
    });
    expect(appSide.result.current.saveData.scoreboards.rhythmHacker).toHaveLength(1);

    act(() => {
      otherSide.result.current.clearBoard('rhythmHacker');
    });
    expect(appSide.result.current.saveData.scoreboards.rhythmHacker).toEqual([]);
  });
});
