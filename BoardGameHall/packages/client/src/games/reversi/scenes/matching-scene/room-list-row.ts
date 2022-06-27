import {
  JoinRoomAck,
  JoinRoomData,
  Player,
  ReversiRoomResponse,
  SavedReversiRoom,
  SOCKET_EVENT_JOIN_ROOM,
} from '@board-game-hall/shared';
import Phaser from 'phaser';
import { Dialog, Sizer } from 'phaser3-rex-plugins/templates/ui/ui-components';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { Socket } from 'socket.io-client';
import { ActionButton } from '../../common/action-button';
import { GAME_SCENE_KEY, LOCK_IMAGE_KEY, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../const';
import { GameSceneData } from '../../types';
import { createLabel } from '../../utils';

class DialogContent extends Phaser.GameObjects.Container {
  constructor({ scene, onChangePassword }: { scene: Phaser.Scene; onChangePassword: (password: string) => void }) {
    super(scene);

    const inputPasswordText = scene.add
      .text(0, 10, 'パスワードを入力してください', {
        fontSize: '24px',
        align: 'center',
      })
      .setOrigin(0.5);

    const passwordInput = scene.add.dom(0, 80).createFromCache('password-form');
    const pswrdInputElement = passwordInput.getChildByName('password');

    const handleInput = (event: any) => {
      onChangePassword(event.target.value);
    };
    pswrdInputElement.addEventListener('input', handleInput);
    this.on('destroy', () => {
      pswrdInputElement.removeEventListener('input', handleInput);
    });

    this.add(passwordInput);
    this.add(inputPasswordText);

    scene.add.existing(this);
  }
}

const ROW_WIDTH = 470;

export class RoomListRow extends Sizer {
  private passwordInputDialog!: Dialog;
  private joinPassword = '';
  private socket!: Socket;
  private readonly dialogTitleSpace = {
    left: 15,
    right: 15,
    top: 10,
    bottom: 10,
  };
  private readonly dialogSpace = {
    title: 25,
    content: 140,
    action: 15,

    left: 20,
    right: 20,
    top: 20,
    bottom: 20,
  };

  constructor({
    scene,
    x,
    y,
    playerName,
    room,
    rexUI,
    socket,
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    room: ReversiRoomResponse;
    rexUI: UIPlugins;
    socket: Socket;
    playerName: string;
  }) {
    super(scene, x, y, ROW_WIDTH, 40, 'left-to-right');
    this.socket = socket;
    const RoomTitleText = scene.add.text(0, 0, room.id.substring(0, 5), {
      fontSize: '24px',
      color: 'white',
    });

    const joinPlayer: Player = {
      id: socket.id,
      name: playerName,
    };

    const ack: JoinRoomAck = (res) => {
      if (res.status === 'ok') {
        const roomInfoForSave: SavedReversiRoom = {
          roomId: room.id,
          name: playerName,
          stoneColor: res.stoneColor,
        };

        const gameSceneData: GameSceneData = {
          multiPlayData: {
            roomInfoForSave,
            socket,
            player: joinPlayer,
          },
        };
        this.scene.scene.start(GAME_SCENE_KEY, gameSceneData);
        this.passwordInputDialog && this.passwordInputDialog.emit('modal.requestClose');
      } else {
        alert('パスワードが違います');
      }
    };

    const onJoinButtonClick = () => {
      const JoinRoomData: JoinRoomData = {
        roomId: room.id,
        joinPlayer,
      };
      if (room.hasPassword) {
        // パスワード入力画面を表示
        this.passwordInputDialog = rexUI.add
          .dialog(this.dialogConfig(scene, rexUI))
          .layout()
          .setOrigin(0.5)
          .popUp(1000);
        this.passwordInputDialog.on('button.click', (_: any, groupName: string, index: number) => {
          if (index == 0) {
            const dataWithPassword: JoinRoomData = {
              ...JoinRoomData,
              password: this.joinPassword,
            };
            this.socket.emit(SOCKET_EVENT_JOIN_ROOM, dataWithPassword, ack);
          } else {
            this.passwordInputDialog.emit('modal.requestClose', { index });
          }
        });
        rexUI.modalPromise(this.passwordInputDialog, {
          manualClose: true,
        });
      } else {
        // パスワードが設定されてない場合はそのまま参加
        this.socket.emit(SOCKET_EVENT_JOIN_ROOM, JoinRoomData, ack);
      }
    };

    const joinButton = new ActionButton({
      scene,
      x: ROW_WIDTH - 43 - RoomTitleText.width,
      y: 0,
      text: '参加',
      rexUI,
      width: 86,
      onPointerdown: onJoinButtonClick,
    });
    this.add(RoomTitleText, 0, 'left');
    this.add(joinButton, 0, 'right');
    if (room.hasPassword) {
      const roomLockImage = scene.add.image(0, 0, LOCK_IMAGE_KEY).setScale(0.04);
      this.add(roomLockImage, 0, 'left');
    }
    this.layout();

    scene.add.existing(this);
  }
  private dialogConfig(scene: Phaser.Scene, rexUI: UIPlugins): Dialog.IConfig {
    return {
      x: WINDOW_WIDTH / 2,
      y: WINDOW_HEIGHT / 2,
      background: rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),
      title: rexUI.add.label({
        background: rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: scene.add.text(0, 0, 'パスワードが掛けられています', {
          fontSize: '24px',
        }),
        space: this.dialogTitleSpace,
      }),
      content: new DialogContent({
        scene,
        onChangePassword: (password) => {
          this.joinPassword = password;
        },
      }),
      actions: [createLabel('参加する', scene, rexUI), createLabel('戻る', scene, rexUI)],
      space: this.dialogSpace,
      align: {
        actions: 'right',
      },
      expand: {
        content: false,
      },
    };
  }
}
