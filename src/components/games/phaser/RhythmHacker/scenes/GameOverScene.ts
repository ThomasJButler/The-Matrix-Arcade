/**
 * Rhythm Hacker - Game Over Scene
 *
 * R87.RH1 — branches the title on `reason` so the natural-end-of-track win
 * path reads as a celebration instead of a death. Tom 2026-04-23 finished a
 * track and saw the default red "GAME OVER" title, which contradicted the
 * "TRACK COMPLETE" banner painted by the GameScene right before transition.
 * Overriding the base's new `getTitleText()` / `getTitleColor()` hooks swaps
 * to green "TRACK COMPLETE" copy when `reason === 'TRACK COMPLETE'` (the
 * sentinel value trackComplete() now passes through gameOver).
 */
import { GameOverScene } from '../../../../../lib/phaser/scenes/GameOverScene';
import { SCENE_KEYS, MATRIX_COLORS } from '../../../../../lib/phaser/types';

export const TRACK_COMPLETE_REASON = 'TRACK COMPLETE';

export class RhythmHackerGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER,
      gameScene: SCENE_KEYS.GAME,
      menuScene: SCENE_KEYS.MENU,
    });
  }

  protected override getTitleText(): string {
    return this.reason === TRACK_COMPLETE_REASON ? 'TRACK COMPLETE' : 'GAME OVER';
  }

  protected override getTitleColor(): string {
    return this.reason === TRACK_COMPLETE_REASON ? MATRIX_COLORS.PRIMARY_HEX : MATRIX_COLORS.RED_HEX;
  }
}
