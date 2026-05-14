// R86.A1+ safety-net — useSaveSystem singleton structural invariants +
// SCOREBOARD_GAME_IDS public contract.
//
// The cross-instance-sync suite covers BEHAVIOUR (writes from one hook instance
// propagate to another). This file covers STRUCTURE — the shape of the module
// that makes the behaviour possible. The distinction matters because the A1
// singleton pattern (module-level `let` + `useSyncExternalStore` + a Set of
// subscribers) is non-idiomatic React and a common "cleanup" refactor is to
// pull it back inside the hook as per-instance `useState`. Such a refactor
// would pass the existing cross-instance tests if the refactor kept a shared
// module Context + a single provider high enough in the tree — but
// PhaserGame.tsx + App.tsx do NOT share a provider, so the Scoreboard modal
// staleness Tom flagged on 2026-04-22 would silently return in production.
//
// These tests fail on the kind of "modernisation" refactor the singleton is
// exposed to, before the runtime symptom reaches Tom's playtest. Also locks
// the SCOREBOARD_GAME_IDS public contract so a scoreboard-tab regression (add
// ctrlSWorld, drop a game, reorder) fails the gate instead of silently
// breaking the Scoreboard modal's tab bar.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  SCOREBOARD_GAME_IDS,
  MAX_BOARD_SIZE,
  __resetSaveSystemForTest,
  type ScoreboardGameId,
} from './useSaveSystem';

const readHookSource = (): string =>
  readFileSync(resolve(__dirname, 'useSaveSystem.ts'), 'utf8');

describe('useSaveSystem — R86.A1+ safety-net: singleton module invariants', () => {
  describe('Module-level singleton structural locks (static source)', () => {
    it('declares sharedSaveData at module scope with `let` (not const, not hook-local)', () => {
      // `let` is required because setSharedSaveData reassigns the binding on
      // every mutation. A const would force an immutable Map/WeakMap pattern
      // that adds indirection without solving anything. A hook-local useState
      // re-introduces the original A1 bug.
      const src = readHookSource();
      const matches = src.match(/^let\s+sharedSaveData\s*:/gm) ?? [];
      expect(matches.length).toBe(1);
    });

    it('imports and uses useSyncExternalStore as the subscription mechanism', () => {
      // `useSyncExternalStore` is the React-18-sanctioned hook for bridging
      // external stores into Concurrent Mode. A refactor back to `useState +
      // useEffect(subscribe)` would tear on concurrent renders. The static
      // lock fails before the tear manifests as a flicker in the Scoreboard.
      const src = readHookSource();
      expect(src).toMatch(/useSyncExternalStore/);
      expect(src).toMatch(/useSyncExternalStore\s*\(/);
    });

    it('backs the subscriber list with a Set (not an Array) for dedup semantics', () => {
      // A Set guarantees each subscriber is registered at most once. An Array
      // would allow duplicate callbacks if a component re-subscribed across
      // an unmount/remount race, producing double-renders and subtle React
      // warnings.
      const src = readHookSource();
      expect(src).toMatch(/new Set<\(\)\s*=>\s*void>\(\)/);
    });

    it('does NOT reintroduce `useState<GlobalSaveData>` (the pre-A1 pattern)', () => {
      // The bug R86.A1 fixed was ONE line of code: `const [saveData,
      // setSaveData] = useState<GlobalSaveData>(...)`. Any refactor that
      // restores that exact shape re-breaks cross-instance propagation. Lock
      // its absence directly.
      const src = readHookSource();
      expect(src).not.toMatch(/useState<GlobalSaveData>/);
    });

    it('exports __resetSaveSystemForTest so vitest can drain the singleton between tests', () => {
      // Without this, test isolation breaks: state bleeds across tests in a
      // single file. `__resetSaveSystemForTest` must stay exported or all
      // A1 behaviour tests turn red on the next save-data write.
      const src = readHookSource();
      expect(src).toMatch(/export\s+function\s+__resetSaveSystemForTest\s*\(/);
      // And the runtime symbol must actually be importable (this import at
      // file top would have failed if it weren't — explicit identity check):
      expect(typeof __resetSaveSystemForTest).toBe('function');
    });
  });

  describe('Write funnel completeness (static source)', () => {
    it('sharedSaveData is re-assigned in exactly 2 well-known lines (setter + reset)', () => {
      // The declaration is locked separately by the `let sharedSaveData` test
      // above. This test locks the MUTATION sites: the binding is
      // re-assigned exactly twice — (a) inside setSharedSaveData when a
      // write has a new reference, (b) inside __resetSaveSystemForTest for
      // test isolation. A 3rd mutation is a smell — either a stray write
      // bypassing the subscriber notification or a new write path that
      // needs its own review. `(?!=)` excludes `===` false positives; the
      // regex requires a statement-starting position so the declaration's
      // `let sharedSaveData: GlobalSaveData = ...` (which has a type
      // annotation between the name and `=`) doesn't count here.
      const src = readHookSource();
      const matches = src.match(/^\s*sharedSaveData\s*=(?!=)/gm) ?? [];
      expect(matches.length).toBe(2);
    });

    it('setSharedSaveData notifies every subscriber on every write', () => {
      // The notify call (`saveDataSubscribers.forEach(fn => fn())`) is what
      // actually makes cross-instance propagation happen. Lock its presence
      // so a refactor that "optimises" away the iteration (e.g. only
      // notifying if a specific slice changed) doesn't silently break the
      // Scoreboard / HighScore cards that don't know to re-check.
      const src = readHookSource();
      expect(src).toMatch(/saveDataSubscribers\.forEach\s*\(/);
    });

    it('hook body uses setSharedSaveData (≥8 call sites) rather than a local setter', () => {
      // Floor rather than exact count — new setters can land. But a refactor
      // that replaced the funnel with a per-instance setter would drop ALL
      // call sites at once. Any count <8 means most setters are bypassing
      // the singleton.
      const src = readHookSource();
      const matches = src.match(/setSharedSaveData\s*\(/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(8);
    });

    it('does not contain a stray `setSaveData(` setter name (the pre-A1 pattern)', () => {
      // Before A1, the hook destructured `[saveData, setSaveData] =
      // useState(...)` and peppered setSaveData(...) calls throughout. A
      // refactor restoring that name signals the singleton has been
      // partially unwound. Lock the absence of the legacy identifier.
      const src = readHookSource();
      // Allow setSharedSaveData (which contains "setS..aveData" as a
      // substring) — the regex requires a word boundary before `setSaveData`.
      expect(src).not.toMatch(/\bsetSaveData\s*\(/);
    });
  });

  describe('SCOREBOARD_GAME_IDS public contract', () => {
    it('contains exactly 11 score-eligible game IDs', () => {
      // 11 is the arcade's current scoreboard-eligible set: 6 React-canvas
      // games + 5 Phaser games. The Scoreboard modal renders a tab per ID —
      // a drift to 10 orphans scores for a game; a drift to 12 adds an
      // empty-column ghost tab.
      expect(SCOREBOARD_GAME_IDS.length).toBe(11);
    });

    it('does NOT include ctrlSWorld (story game, no score)', () => {
      // CTRL-S World is explicitly a narrative story game with no score
      // mechanic. If it leaks into the list, the Scoreboard modal grows a
      // permanently-empty tab. Negative test: this should NEVER be true.
      expect((SCOREBOARD_GAME_IDS as readonly string[])).not.toContain('ctrlSWorld');
    });

    it('lists all entries uniquely (no accidental duplicates)', () => {
      const uniqueCount = new Set(SCOREBOARD_GAME_IDS).size;
      expect(uniqueCount).toBe(SCOREBOARD_GAME_IDS.length);
    });

    it('pins the order-contract default-tab anchors (snakeClassic first, codeBreaker last)', () => {
      // Scoreboard.tsx uses `useState<ScoreboardGameId>(SCOREBOARD_GAME_IDS[0])`
      // for the default active tab. A reorder changes the first tab users
      // see, which is a UX regression Tom would flag as "why does the
      // scoreboard default to X now?". Lock the two anchors without
      // over-pinning the middle positions.
      expect(SCOREBOARD_GAME_IDS[0]).toBe('snakeClassic');
      expect(SCOREBOARD_GAME_IDS[SCOREBOARD_GAME_IDS.length - 1]).toBe('codeBreaker');
    });

    it('contains every scoreboard-eligible arcade game by literal ID', () => {
      // Anti-regression: explicit membership check catches a "rename" refactor
      // (e.g. matrixCloud → matrixBird) that would silently break the
      // scoreboard for that game.
      const expected: ScoreboardGameId[] = [
        'snakeClassic', 'vortexPong', 'matrixCloud',
        'matrixInvaders', 'metris', 'matrixFrogger',
        'neoJump', 'agentChase', 'rhythmHacker',
        'cloudJumper', 'codeBreaker',
      ];
      for (const id of expected) {
        expect(SCOREBOARD_GAME_IDS).toContain(id);
      }
    });
  });

  describe('MAX_BOARD_SIZE anchor', () => {
    it('locks MAX_BOARD_SIZE at 25 (Scoreboard modal pagination contract)', () => {
      // 25 is the per-game entry cap the Scoreboard modal is designed around
      // (single scrollable column, no pagination controls). A drift to 100
      // breaks the modal layout; a drift to 10 truncates legitimate history.
      expect(MAX_BOARD_SIZE).toBe(25);
    });
  });
});
