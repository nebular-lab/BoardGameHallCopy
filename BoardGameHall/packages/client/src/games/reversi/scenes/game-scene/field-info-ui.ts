import Phaser from 'phaser';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { BLACK_STONE_KEY, DEFAULT_LABEL_COLOR, DIALOG_CONTENT_COLOR, WHITE_STONE_KEY } from '../../const';
import { GAME_UI_WIDTH } from '../../const';
import { NUMBER_OF_COL, StoneColor } from '@board-game-hall/shared/dist/reversi';
import { TitleLabel } from '../../common/title-label';
import { FieldInfo } from '@board-game-hall/shared';
import { countStone } from '../../utils';

export class FieldInfoUI extends Phaser.GameObjects.Container {
  private sizedBlackPlayerName = '';
  private sizedWhitePlayerName = '';
  private blackPlayerText;
  private whitePlayerText;
  private readonly blackNumberText;
  private readonly whiteNumberText;
  private readonly currentPlayerText;
  private readonly PLAYER_NAME_MAX_WIDTH = 115;
  private readonly CURRENT_PLAYER_MAX_WIDTH = 150;

  constructor({
    scene,
    x,
    y,
    squareLength,
    rexUI,
    fontStyle = {
      color: 'white',
      fontSize: '16px',
    },
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    squareLength: number;
    rexUI: UIPlugins;
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  }) {
    super(scene);
    const background = rexUI.add.roundRectangle(x, y, GAME_UI_WIDTH, 212, 20, DIALOG_CONTENT_COLOR);
    background.setOrigin(0.5);
    background.setStrokeStyle(1, DEFAULT_LABEL_COLOR);

    const title = new TitleLabel({ scene, x, y: y - 70, width: GAME_UI_WIDTH - 40, text: '盤面情報', rexUI });

    const blackY = y - 25;
    const whiteY = y + 10;
    const stoneX = x - 70;
    const stoneScale = 0.3;
    const numberX = x + 75;
    const nameLeftX = x - 50;
    const blackStone = scene.add
      .image(stoneX, blackY, BLACK_STONE_KEY)
      .setScale((squareLength / scene.textures.get(BLACK_STONE_KEY).getSourceImage().width) * stoneScale)
      .setOrigin(0.5);
    const whiteStone = scene.add
      .image(stoneX, whiteY, WHITE_STONE_KEY)
      .setScale((squareLength / scene.textures.get(WHITE_STONE_KEY).getSourceImage().width) * stoneScale)
      .setOrigin(0.5);
    this.blackPlayerText = scene.add.text(nameLeftX, blackY, '', fontStyle).setOrigin(0, 0.5);
    this.whitePlayerText = scene.add.text(nameLeftX, whiteY, '', fontStyle).setOrigin(0, 0.5);

    this.blackNumberText = scene.add.text(numberX, blackY, `0`, fontStyle).setOrigin(0.5);
    this.whiteNumberText = scene.add.text(numberX, whiteY, `0`, fontStyle).setOrigin(0.5);

    const currentPlayerHeadingText = scene.add.text(x, y + 50, '現在の手番', fontStyle).setOrigin(0.5);
    this.currentPlayerText = scene.add.text(x, y + 80, '', { ...fontStyle, fontSize: '20px' }).setOrigin(0.5);

    this.currentPlayerText.setText('待機中');

    this.add(background);
    this.add(this.blackNumberText);
    this.add(this.whiteNumberText);
    this.add(title);
    this.add(blackStone);
    this.add(whiteStone);
    this.add(this.blackPlayerText);
    this.add(this.whitePlayerText);
    this.add(currentPlayerHeadingText);
    this.add(this.currentPlayerText);

    scene.add.existing(this);
  }

  private currentPlayerResize() {
    while (this.currentPlayerText.width > this.CURRENT_PLAYER_MAX_WIDTH) {
      const tempStr = this.currentPlayerText.text;
      if (tempStr.slice(-1) !== '…') {
        this.currentPlayerText.setText(`${tempStr.slice(0, -1)}…`);
      } else {
        this.currentPlayerText.setText(`${tempStr.slice(0, -2)}…`);
      }
    }
    return this.currentPlayerText.text;
  }

  public setCurrentPlayerText(currentColor: StoneColor) {
    if (currentColor === 'black') {
      this.currentPlayerText.setText(this.sizedBlackPlayerName);
    } else {
      this.currentPlayerText.setText(this.sizedWhitePlayerName);
    }
  }

  public setCountInformation(fieldInfo: FieldInfo) {
    const stoneCount = countStone(fieldInfo);
    this.blackNumberText.setText(`${stoneCount.black}`);
    this.whiteNumberText.setText(`${stoneCount.white}`);
  }

  public setBlackPlayerName(name: string) {
    this.blackPlayerText.setText(name);
    while (this.blackPlayerText.width > this.PLAYER_NAME_MAX_WIDTH) {
      const tempStr = this.blackPlayerText.text;
      if (tempStr.slice(-1) !== '…') {
        this.blackPlayerText.setText(`${tempStr.slice(0, -1)}…`);
      } else {
        this.blackPlayerText.setText(`${tempStr.slice(0, -2)}…`);
      }
    }

    this.currentPlayerText.setText(name);
    this.sizedBlackPlayerName = this.currentPlayerResize();
    this.currentPlayerText.setText('待機中');
  }

  public setWhitePlayerName(name: string) {
    this.whitePlayerText.setText(name);
    while (this.whitePlayerText.width > this.PLAYER_NAME_MAX_WIDTH) {
      const tempStr = this.whitePlayerText.text;
      if (tempStr.slice(-1) !== '…') {
        this.whitePlayerText.setText(`${tempStr.slice(0, -1)}…`);
      } else {
        this.whitePlayerText.setText(`${tempStr.slice(0, -2)}…`);
      }
    }

    this.currentPlayerText.setText(name);
    this.sizedWhitePlayerName = this.currentPlayerResize();
    this.currentPlayerText.setText('待機中');
  }
}
