import Phaser from 'phaser';
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { DEFAULT_LABEL_COLOR, HOVERED_LABEL_COLOR } from '../const';

export class ActionButton extends Phaser.GameObjects.Container {
  public background!: RoundRectangle;
  public text!: Phaser.GameObjects.Text;

  constructor({
    scene,
    x,
    y,
    text,
    rexUI,
    onPointerdown,
    width,
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
    onPointerdown: () => void;
    width: number;
    height?: number;
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  }) {
    super(scene);
    this.background = rexUI.add.roundRectangle(x, y, width, height, 20, DEFAULT_LABEL_COLOR);
    this.background.setOrigin(0.5);
    this.background.setInteractive();
    this.background.on('pointerover', () => {
      this.background.setFillStyle(HOVERED_LABEL_COLOR);
    });
    this.background.on('pointerout', () => {
      this.background.setFillStyle(DEFAULT_LABEL_COLOR);
    });
    this.background.on('pointerdown', onPointerdown);

    this.text = scene.add.text(x, y, text, fontStyle).setOrigin(0.5);

    this.add(this.background);
    this.add(this.text);

    scene.add.existing(this);
  }
}
