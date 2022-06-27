import Phaser from 'phaser';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import {
  DEFAULT_LABEL_COLOR,
  DIALOG_CONTENT_COLOR,
  DIALOG_TITLE_COLOR,
  HOVERED_LABEL_COLOR,
  TITLE_SCENE_KEY,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../const';
import { GAME_UI_WIDTH } from '../../const';
import { Dialog } from 'phaser3-rex-plugins/templates/ui/ui-components';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { createLabel } from '../../utils';
import { Socket } from 'socket.io-client';

class MenuDialog extends Dialog {
  constructor({ scene, rexUI }: { scene: Phaser.Scene; rexUI: UIPlugin }) {
    const config: Dialog.IConfig = {
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      width: 500,
      background: rexUI.add.roundRectangle(0, 0, 100, 100, 20, DIALOG_CONTENT_COLOR),
      title: rexUI.add.label({
        background: rexUI.add.roundRectangle(0, 0, 100, 40, 20, DIALOG_TITLE_COLOR),
        text: scene.add.text(0, 0, 'メニュー', {
          fontSize: '24px',
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      }),
      // ここにボタンを並べるのもあり
      content: scene.add.text(0, 0, '', {
        fontSize: '24px',
      }),
      actions: [createLabel('招待リンクをコピー', scene, rexUI), createLabel('戻る', scene, rexUI)],
      space: {
        title: 30,
        content: 30,
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

class LeaveRoomDialog extends Dialog {
  constructor({ scene, rexUI }: { scene: Phaser.Scene; rexUI: UIPlugin }) {
    const config: Dialog.IConfig = {
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      width: 500,
      background: rexUI.add.roundRectangle(0, 0, 100, 100, 20, DIALOG_CONTENT_COLOR),
      title: rexUI.add.label({
        background: rexUI.add.roundRectangle(0, 0, 100, 40, 20, DIALOG_TITLE_COLOR),
        text: scene.add.text(0, 0, '部屋から退出', {
          fontSize: '24px',
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      }),
      content: scene.add.text(0, 0, 'ゲームを終了しますか？', {
        fontSize: '24px',
      }),
      actions: [createLabel('終了する', scene, rexUI), createLabel('戻る', scene, rexUI)],
      space: {
        title: 30,
        content: 30,
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

export class RoomTitle extends Phaser.GameObjects.Container {
  private menuDialog!: MenuDialog;
  private leaveRoomDialog!: LeaveRoomDialog;
  constructor({
    scene,
    x,
    y,
    isCPU,
    socket,
    rexUI,
    onInvitationLinkCopy,
    fontStyle = {
      color: 'white',
      fontSize: '24px',
    },
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    socket?: Socket;
    isCPU: boolean;
    rexUI: UIPlugins;
    onInvitationLinkCopy: () => void;
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  }) {
    super(scene);
    const background = rexUI.add.roundRectangle(x, y, GAME_UI_WIDTH, 44, 20, DIALOG_CONTENT_COLOR);
    background.setOrigin(0.5);
    background.setStrokeStyle(1, DEFAULT_LABEL_COLOR);

    const textObject = scene.add
      .text(isCPU ? x - 80 : x - 85, y, isCPU ? 'CPU対戦' : 'ネット対戦', fontStyle)
      .setOrigin(0, 0.5);

    const greenCircle = rexUI.add
      .roundRectangle(x + 50, y, 20, 20, 10, 0x29c83f)
      .setOrigin(0.5)
      .setInteractive();
    const iconBarTop = rexUI.add.roundRectangle(x + 50, y - 4, 10, 2, 1, 0x006200);
    const iconBarMiddle = rexUI.add.roundRectangle(x + 50, y, 10, 2, 1, 0x006200);
    const iconBarBottom = rexUI.add.roundRectangle(x + 50, y + 4, 10, 2, 1, 0x006200);
    greenCircle.on('pointerover', () => {
      greenCircle.setFillStyle(0x4ad85d);
      iconBarTop.setFillStyle(0x009300);
      iconBarMiddle.setFillStyle(0x009300);
      iconBarBottom.setFillStyle(0x009300);
    });
    greenCircle.on('pointerout', () => {
      greenCircle.setFillStyle(0x29c83f);
      iconBarTop.setFillStyle(0x006200);
      iconBarMiddle.setFillStyle(0x006200);
      iconBarBottom.setFillStyle(0x006200);
    });
    greenCircle.on('pointerup', () => {
      this.menuDialog = new MenuDialog({ scene, rexUI }).layout().setOrigin(0.5).popUp(1000);
      this.menuDialog.on('button.click', (_: any, groupName: string, index: number) => {
        this.menuDialog.emit('modal.requestClose', { index });
      });
      rexUI
        .modalPromise(this.menuDialog, {
          manualClose: true,
        })
        .then(({ index }: any) => {
          if (index === 0) {
            onInvitationLinkCopy();
          }
        });
    });

    const buttonX = x + 75;
    const redCircle = rexUI.add.roundRectangle(buttonX, y, 20, 20, 10, 0xfd5e57).setOrigin(0.5).setInteractive();
    const closeText = scene.add.text(buttonX, y, '×', { fontSize: '20px', color: '#E70B03' }).setOrigin(0.5);
    redCircle.on('pointerover', () => {
      redCircle.setFillStyle(0xfd8a86);
      closeText.setColor('#fd5e57');
    });
    redCircle.on('pointerout', () => {
      redCircle.setFillStyle(0xfd5e57);
      closeText.setColor('#E70B03');
    });
    redCircle.on('pointerup', () => {
      this.leaveRoomDialog = new LeaveRoomDialog({ scene, rexUI }).layout().setOrigin(0.5).popUp(1000);
      this.leaveRoomDialog.on('button.click', (_: any, groupName: string, index: number) => {
        this.leaveRoomDialog.emit('modal.requestClose', { index });
      });
      rexUI
        .modalPromise(this.leaveRoomDialog, {
          manualClose: true,
        })
        .then(({ index }: any) => {
          if (index === 0) {
            if (!isCPU && socket) {
              socket.close();
            }
            scene.scene.start(TITLE_SCENE_KEY);
          }
        });
    });

    this.add(background);
    this.add(textObject);
    this.add(redCircle);
    this.add(closeText);
    this.add(greenCircle);
    this.add(iconBarTop);
    this.add(iconBarMiddle);
    this.add(iconBarBottom);

    scene.add.existing(this);
  }
}
