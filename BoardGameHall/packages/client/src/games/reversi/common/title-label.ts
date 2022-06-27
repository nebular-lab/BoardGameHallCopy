import Phaser from 'phaser';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { DIALOG_TITLE_COLOR } from '../const';

export class TitleLabel extends Phaser.GameObjects.Container {
  constructor({
    scene,
    x,
    y,
    text,
    rexUI,
    width = 525,
    height = 40,
    fontStyle = {
      color: 'white',
      fontSize: '24px',
    },
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    text: string;
    rexUI: UIPlugins;
    width?: number;
    height?: number;
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  }) {
    super(scene);
    const background = rexUI.add.roundRectangle(x, y, width, height, 20, DIALOG_TITLE_COLOR);
    background.setOrigin(0.5);

    const textObject = scene.add.text(x, y, text, fontStyle).setOrigin(0.5);

    this.add(background);
    this.add(textObject);

    scene.add.existing(this);
  }
}
