import Phaser from 'phaser';
import {
  GAME_SCENE_KEY,
  INPUT_NAME_SCENE_KEY,
  LEVEL_SELECT_SCENE_KEY,
  ROOM_STORAGE_KEY,
  TITLE_SCENE_KEY,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../const';
import { Dialog } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import {
  GetRoomByIdAck,
  Player,
  ReversiRoomResponse,
  SavedReversiRoom,
  SOCKET_EVENT_GET_ROOM_BY_ID,
  SOCKET_EVENT_REENTRY_ROOM,
} from '@board-game-hall/shared';
import { createLabel, createSocket } from '../utils';
import { GameSceneData, InputNameSceneData } from '../types';
import { Socket } from 'socket.io-client';
import { ActionButton } from '../common/action-button';

export class TitleScene extends Phaser.Scene {
  private readonly rexUI!: UIPlugin;
  private titleImage!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private singlePlayText!: ActionButton;
  private multiPlayText!: ActionButton;
  private reentryDialog?: Dialog;
  private showDialog = false;
  private readonly TITLE_IMAGE_KEY = 'title-image';
  private readonly BUTTON_WIDTH = 280;
  private readonly dialogTitleSpace = {
    left: 15,
    right: 15,
    top: 10,
    bottom: 10,
  };
  private readonly dialogSpace = {
    title: 25,
    content: 25,
    action: 15,
    left: 20,
    right: 20,
    top: 20,
    bottom: 20,
  };

  constructor() {
    super({
      key: TITLE_SCENE_KEY,
    });
  }

  init() {}

  preload() {
    // TODO: 毎回プラグインからロードしてたら重たくならないか調べる
    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI',
    );
    this.load.image(this.TITLE_IMAGE_KEY, '/reversi/reversi-title.png');
  }

  create() {
    const url = new URL(window.location.href);
    const roomId = url.searchParams.get('roomId');
    const token = url.searchParams.get('token');
    if (roomId) {
      const data: InputNameSceneData = {
        invitationParams: {
          roomId,
          token: token ?? '',
        },
      };
      this.scene.start(INPUT_NAME_SCENE_KEY, data);
    }
    this.titleText = this.add
      .text(WINDOW_WIDTH / 2, 100, 'リバーシ', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: 'black',
      })
      .setOrigin(0.5)
      .setPadding(0, 4, 0, 0);
    this.titleText.setShadow(0, 4, 'rgba(0,0,0,0.25)', 4);

    this.multiPlayText = new ActionButton({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: 490,
      width: this.BUTTON_WIDTH,
      text: '誰かと対戦',
      rexUI: this.rexUI,
      onPointerdown: () => {
        if (!this.showDialog) {
          this.scene.start(INPUT_NAME_SCENE_KEY);
        }
      },
    });

    this.singlePlayText = new ActionButton({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: 390,
      width: this.BUTTON_WIDTH,
      text: 'CPU対戦',
      rexUI: this.rexUI,
      onPointerdown: () => {
        if (!this.showDialog) {
          this.scene.start(LEVEL_SELECT_SCENE_KEY);
        }
      },
    });

    this.titleImage = this.add
      .image(WINDOW_WIDTH / 2, 230, this.TITLE_IMAGE_KEY)
      .setOrigin(0.5)
      .setScale(0.7);

    // LocalStorageに部屋があったら ダイアログを表示.
    const strRoom = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!strRoom) return;

    const savedRoom: SavedReversiRoom = JSON.parse(strRoom);
    const socket = createSocket({});
    const getRoomAck: GetRoomByIdAck = (foundRoom: ReversiRoomResponse | null) => {
      // 部屋が存在していたらダイアログを表示
      if (foundRoom) {
        this.showDialog = true;
        this.reentryDialog = this.rexUI.add.dialog(this.dialogConfig()).layout().setOrigin(0.5).popUp(1000);
        this.reentryDialog.on('button.click', (_: any, groupName: string, index: number) => {
          this.reentryDialog?.emit('modal.requestClose', { index });
        });
        this.rexUI
          .modalPromise(this.reentryDialog, {
            manualClose: true,
          })
          .then(this.onModalCloseCallback(socket, savedRoom));
      } else {
        // 存在していなかったら部屋情報を削除
        localStorage.removeItem(ROOM_STORAGE_KEY);
      }
    };
    socket.emit(SOCKET_EVENT_GET_ROOM_BY_ID, savedRoom.roomId, getRoomAck);
  }

  private dialogConfig(): Dialog.IConfig {
    return {
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),
      title: this.rexUI.add.label({
        background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: this.add.text(0, 0, 'まだ終了していないゲームがあります', {
          fontSize: '24px',
        }),
        space: this.dialogTitleSpace,
      }),
      content: this.add.text(0, 0, 'ゲームを再開しますか？', {
        fontSize: '24px',
      }),
      actions: [createLabel('再開する', this, this.rexUI), createLabel('再開しない', this, this.rexUI)],
      space: this.dialogSpace,
      align: {
        actions: 'right',
      },
      expand: {
        content: false,
      },
    };
  }

  private onModalCloseCallback(socket: Socket, savedRoom: SavedReversiRoom) {
    return ({ index }: any) => {
      // 再開する
      if (index === 0) {
        // ルーム再接続をemit
        const ack = (player: Player) => {
          const gameSceneData: GameSceneData = {
            multiPlayData: {
              socket,
              player,
              roomInfoForSave: savedRoom,
            },
          };
          this.scene.start(GAME_SCENE_KEY, gameSceneData);
        };
        socket.emit(SOCKET_EVENT_REENTRY_ROOM, savedRoom, ack);
      }
      // 再開しない
      else {
        // Dialogを閉じる
        this.showDialog = false;
        // 保存していたWebStorageを削除
        localStorage.removeItem(ROOM_STORAGE_KEY);
      }
    };
  }
}
