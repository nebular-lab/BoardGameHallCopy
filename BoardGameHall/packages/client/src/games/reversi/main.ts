import * as Phaser from 'phaser';
import { TitleScene } from './scenes/title-scene';
import { GameScene } from './scenes/game-scene';
import { DIALOG_CONTENT_COLOR, FPS, MAIN_COLOR, WINDOW_HEIGHT, WINDOW_WIDTH } from './const';
import { MatchingScene } from './scenes/matching-scene';
import { LevelSelectScene } from './scenes/level-select-scene';
import { InputNameScene } from './scenes/input-name-scene';

export class Reversi extends Phaser.Game {
  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      backgroundColor: DIALOG_CONTENT_COLOR,
      fps: {
        target: FPS,
      },
      input: {
        touch: {
          capture: false,
        },
      },
      scale: {
        mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
      },
      parent: 'reversi',
      dom: {
        createContainer: true,
      },
      scene: [TitleScene, GameScene, MatchingScene, LevelSelectScene, InputNameScene],
    };
    super(config);
  }
}
