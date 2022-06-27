import Phaser from 'phaser';

export class TextObject extends Phaser.GameObjects.Container {
  constructor({
    scene,
    x,
    y,
    text,
    fontStyle = { color: 'black', fontSize: '48px' },
    onPointerdown,
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    text: string;
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
    onPointerdown?: () => void;
  }) {
    super(scene);
    this.scene = scene;

    const textObject = this.scene.add.text(x, y, text, fontStyle).setOrigin(0.5);

    this.add(textObject);

    if (onPointerdown) {
      textObject.setInteractive();
      textObject.on('pointerdown', onPointerdown);
    }
    this.scene.add.existing(this);
  }
}
