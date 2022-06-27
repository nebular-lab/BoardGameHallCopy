import Phaser from 'phaser';
import { GAME_SCENE_KEY, LEVEL_SELECT_SCENE_KEY, TITLE_SCENE_KEY, WINDOW_HEIGHT, WINDOW_WIDTH } from '../const';
import { CPULevel, StoneColor } from '@board-game-hall/shared';
import { GameSceneData } from '../types';
import { TitleLabel } from '../common/title-label';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { ActionButton } from '../common/action-button';

export class LevelSelectScene extends Phaser.Scene {
  private readonly LEVEL_BUTTON_WIDTH = 280;
  private isColorSelect = false;
  private rexUI!: UIPlugins;
  private backButton!: ActionButton;
  private startButton!: ActionButton;
  private sceneTitle!: TitleLabel;
  private normalButton!: ActionButton;
  private blackButton!: ActionButton;
  private whiteButton!: ActionButton;
  private selectedLevel: CPULevel = '普通';

  constructor() {
    super({
      key: LEVEL_SELECT_SCENE_KEY,
    });
  }
  preload() {
    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI',
    );
  }
  create() {
    this.sceneTitle = new TitleLabel({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: 60,
      text: 'CPUのレベル・色を選択',
      rexUI: this.rexUI,
    });
    this.backButton = new ActionButton({
      scene: this,
      x: 661,
      y: 540,
      text: '戻る',
      rexUI: this.rexUI,
      width: 86,
      onPointerdown: () => {
        if (this.isColorSelect) {
          this.isColorSelect = false;
          this.setActive(this.normalButton, true);
          this.setActive(this.blackButton, false);
          this.setActive(this.whiteButton, false);
          return;
        }
        this.scene.start(TITLE_SCENE_KEY);
      },
    });
    this.normalButton = new ActionButton({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      text: '普通',
      rexUI: this.rexUI,
      width: this.LEVEL_BUTTON_WIDTH,
      onPointerdown: () => {
        this.setActive(this.normalButton, false);
        this.setActive(this.blackButton, true);
        this.setActive(this.whiteButton, true);
        this.isColorSelect = true;
        this.selectedLevel = '普通';
      },
    });
    const stoneButtonWidth = 50;
    this.blackButton = new ActionButton({
      scene: this,
      x: WINDOW_WIDTH / 3,
      y: WINDOW_HEIGHT / 2,
      text: '黒',
      rexUI: this.rexUI,
      width: stoneButtonWidth,
      onPointerdown: () => {
        const data: GameSceneData = {
          singlePlayData: {
            stoneColor: 'black',
            selectedLevel: this.selectedLevel,
          },
        };
        this.scene.start(GAME_SCENE_KEY, data);
      },
    });
    this.whiteButton = new ActionButton({
      scene: this,
      x: (WINDOW_WIDTH * 2) / 3,
      y: WINDOW_HEIGHT / 2,
      text: '白',
      rexUI: this.rexUI,
      width: stoneButtonWidth,
      onPointerdown: () => {
        const data: GameSceneData = {
          singlePlayData: {
            stoneColor: 'white',
            selectedLevel: this.selectedLevel,
          },
        };
        this.scene.start(GAME_SCENE_KEY, data);
      },
    });
    this.setActive(this.blackButton, false);
    this.setActive(this.whiteButton, false);
  }

  private setActive(button: ActionButton, isActive = true) {
    button.background.setInteractive(isActive);
    button.setVisible(isActive);
  }
}
