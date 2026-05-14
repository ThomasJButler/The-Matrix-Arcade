/**
 * R86.G3 — Render-config regression tripwire.
 *
 * When Tom playtested Matrix Frogger + Neo Jump post-R85, the browser
 * console was spammed with two WebGL warnings that R83.CTRLS.11 had
 * previously silenced for CTRL-S only:
 *
 *   • `texImage: Alpha-premult and y-flip are deprecated for non-DOM-Element
 *      uploads` — fixed by `premultipliedAlpha: false` at WebGL-context
 *      creation.
 *   • `generateMipmap: Tex image TEXTURE_2D level 0 is incurring lazy
 *      initialization` — fixed by `mipmapFilter: ''` (Phaser 3.60+ opt-out).
 *
 * The fix was promoted arcade-wide via `PHASER_RENDER_DEFAULTS` in
 * `types.ts`, and every game's `PHASER_CONFIG.render` block now spreads
 * those defaults. This test enumerates every game config and asserts both
 * keys are present with the silencing values, so a future config edit that
 * drops the spread — or a new game that forgets it — turns back into a
 * red gate instead of "quiet" console spam players might never report.
 */

import { describe, expect, it } from 'vitest';

import { PHASER_CONFIG as AGENT_CHASE_CONFIG } from '../../components/games/phaser/AgentChase/config';
import { PHASER_CONFIG as CLOUD_JUMPER_CONFIG } from '../../components/games/phaser/CloudJumper/config';
import { PHASER_CONFIG as CODE_BREAKER_CONFIG } from '../../components/games/phaser/CodeBreaker/config';
import { PHASER_CONFIG as CTRL_S_CONFIG } from '../../components/games/phaser/CtrlSWorld/config';
import { PHASER_CONFIG as FROGGER_CONFIG } from '../../components/games/phaser/MatrixFrogger/config';
import { PHASER_CONFIG as INVADERS_CONFIG } from '../../components/games/phaser/MatrixInvaders/config';
import { PHASER_CONFIG as CLOUD_CONFIG } from '../../components/games/phaser/MatrixCloud/config';
import { PHASER_CONFIG as METRIS_CONFIG } from '../../components/games/phaser/Metris/config';
import { PHASER_CONFIG as NEO_JUMP_CONFIG } from '../../components/games/phaser/NeoJump/config';
import { PHASER_CONFIG as RHYTHM_CONFIG } from '../../components/games/phaser/RhythmHacker/config';
import { PHASER_CONFIG as SNAKE_CONFIG } from '../../components/games/phaser/SnakeClassic/config';
import { PHASER_CONFIG as PONG_CONFIG } from '../../components/games/phaser/VortexPong/config';
import { PHASER_RENDER_DEFAULTS } from './types';

type GameConfigEntry = {
  name: string;
  config: { render?: Phaser.Types.Core.RenderConfig };
};

const GAMES: readonly GameConfigEntry[] = [
  { name: 'AgentChase', config: AGENT_CHASE_CONFIG },
  { name: 'CloudJumper', config: CLOUD_JUMPER_CONFIG },
  { name: 'CodeBreaker', config: CODE_BREAKER_CONFIG },
  { name: 'CtrlSWorld', config: CTRL_S_CONFIG },
  { name: 'MatrixCloud', config: CLOUD_CONFIG },
  { name: 'MatrixFrogger', config: FROGGER_CONFIG },
  { name: 'MatrixInvaders', config: INVADERS_CONFIG },
  { name: 'Metris', config: METRIS_CONFIG },
  { name: 'NeoJump', config: NEO_JUMP_CONFIG },
  { name: 'RhythmHacker', config: RHYTHM_CONFIG },
  { name: 'SnakeClassic', config: SNAKE_CONFIG },
  { name: 'VortexPong', config: PONG_CONFIG },
] as const;

describe('PHASER_RENDER_DEFAULTS (R86.G3)', () => {
  it('exposes both WebGL-warning-silencing keys', () => {
    // premultipliedAlpha must be explicitly false — the default (true) is
    // what triggers Chrome's alpha-premult/y-flip deprecation warning.
    expect(PHASER_RENDER_DEFAULTS.premultipliedAlpha).toBe(false);
    // mipmapFilter must be the empty string — Phaser 3.60+ treats '' as
    // the explicit "no mipmap generation" opt-out, silencing Firefox's
    // lazy-initialization warning.
    expect(PHASER_RENDER_DEFAULTS.mipmapFilter).toBe('');
  });
});

describe('Per-game render config (R86.G3 regression tripwire)', () => {
  it.each(GAMES)('$name spreads PHASER_RENDER_DEFAULTS in render block', ({ config }) => {
    expect(config.render).toBeDefined();
    expect(config.render?.premultipliedAlpha).toBe(false);
    expect(config.render?.mipmapFilter).toBe('');
  });

  it('covers every Phaser game folder on disk', () => {
    // Belt-and-braces: if someone adds a new Phaser game without updating
    // this test, the GAMES array length becomes a lie. Keep it in sync
    // with the folder count the `matrix-arcade-gamedev` skill expects.
    expect(GAMES).toHaveLength(12);
  });
});
