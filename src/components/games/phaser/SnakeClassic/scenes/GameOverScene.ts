import { GameOverScene } from '@/lib/phaser/scenes/GameOverScene';
import { SCENE_KEYS } from '@/lib/phaser/types';

export class SnakeGameOverScene extends GameOverScene {
  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER,
      gameScene: SCENE_KEYS.GAME,
      menuScene: SCENE_KEYS.MENU,
    });
  }
}
