import { Dialog } from 'phaser3-rex-plugins/templates/ui/ui-components';
import { DEFAULT_LABEL_COLOR, HOVERED_LABEL_COLOR, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../const';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import Phaser from 'phaser';
import { createLabel } from '../../utils';

class DialogContent extends Phaser.GameObjects.Container {
  private selectedColor: 'black' | 'white' = 'black';
  constructor({
    scene,
    rexUI,
    onChangeColor,
    onChangePassword,
  }: {
    scene: Phaser.Scene;
    rexUI: UIPlugin;
    onChangeColor: (color: 'black' | 'white') => void;
    onChangePassword: (password: string) => void;
  }) {
    super(scene);

    const selectColorText = scene.add
      .text(0, 0, '色を選択', {
        fontSize: '24px',
      })
      .setOrigin(0.5);

    const blackButtonBG = rexUI.add.roundRectangle(-100, 60, 50, 40, 20, DEFAULT_LABEL_COLOR);
    blackButtonBG.setInteractive();
    blackButtonBG.on('pointerover', () => {
      blackButtonBG.setFillStyle(HOVERED_LABEL_COLOR);
    });
    blackButtonBG.on('pointerout', () => {
      blackButtonBG.setFillStyle(DEFAULT_LABEL_COLOR);
    });
    blackButtonBG.setStrokeStyle(2, 0xffffff);

    const blackButton = scene.add
      .text(-100, 60, '黒', {
        fontSize: '24px',
      })
      .setOrigin(0.5);

    const whiteButtonBG = rexUI.add.roundRectangle(100, 60, 50, 40, 20, DEFAULT_LABEL_COLOR);
    whiteButtonBG.setInteractive();
    whiteButtonBG.on('pointerover', () => {
      whiteButtonBG.setFillStyle(HOVERED_LABEL_COLOR);
    });
    whiteButtonBG.on('pointerout', () => {
      whiteButtonBG.setFillStyle(DEFAULT_LABEL_COLOR);
    });

    const whiteButton = scene.add
      .text(100, 60, '白', {
        fontSize: '24px',
      })
      .setOrigin(0.5);

    blackButtonBG.on('pointerdown', () => {
      this.selectedColor = 'black';
      blackButtonBG.setStrokeStyle(2, 0xffffff);
      whiteButtonBG.setStrokeStyle();
      onChangeColor(this.selectedColor);
    });

    whiteButtonBG.on('pointerdown', () => {
      this.selectedColor = 'white';
      blackButtonBG.setStrokeStyle();
      whiteButtonBG.setStrokeStyle(2, 0xffffff);
      onChangeColor(this.selectedColor);
    });

    const passwordInput = scene.add.dom(0, 230).createFromCache('password-form');
    const pswrdInputElement = passwordInput.getChildByName('password');

    const handleInput = (event: any) => {
      onChangePassword(event.target.value);
    };
    pswrdInputElement.addEventListener('input', handleInput);
    this.on('destroy', () => {
      pswrdInputElement.removeEventListener('input', handleInput);
    });
    const inputPasswordText = scene.add
      .text(0, 150, 'パスワードを入力\n※空欄の場合はパスワードなし', {
        fontSize: '24px',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add(blackButtonBG);
    this.add(selectColorText);
    this.add(passwordInput);
    this.add(blackButton);
    this.add(whiteButtonBG);
    this.add(whiteButton);
    this.add(inputPasswordText);

    scene.add.existing(this);
  }
}

export class CreateRoomDialog extends Dialog {
  constructor({
    scene,
    rexUI,
    onChangePassword,
    onChangeColor,
  }: {
    scene: Phaser.Scene;
    rexUI: UIPlugin;
    onChangeColor: (color: 'black' | 'white') => void;
    onChangePassword: (password: string) => void;
  }) {
    const config: Dialog.IConfig = {
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      width: 500,
      background: rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),
      title: rexUI.add.label({
        background: rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: scene.add.text(0, 0, '部屋を作成する', {
          fontSize: '24px',
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      }),
      content: new DialogContent({ scene, rexUI, onChangePassword, onChangeColor }),
      actions: [createLabel('開始する', scene, rexUI), createLabel('戻る', scene, rexUI)],
      space: {
        title: 25,
        content: 300,
        action: 15,

        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },
      align: {
        actions: 'right',
      },
      expand: {
        content: false,
      },
    };
    super(scene, config);

    // これは割としょうがない
    // @ts-ignore
    this.scene.add.existing(this);
  }
}
