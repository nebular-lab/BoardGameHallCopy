import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import {
  DEFAULT_LABEL_COLOR,
  DIALOG_TITLE_COLOR,
  GAME_SCENE_KEY,
  LOCK_IMAGE_KEY,
  MATCHING_SCENE_KEY,
  TITLE_SCENE_KEY,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../const';
import {
  CreateRoomData,
  SavedReversiRoom,
  SOCKET_EVENT_CREATE_ROOM,
  SOCKET_EVENT_GET_ROOM_LIST,
  ReversiRoomResponse,
  CreateRoomAck,
  GetRoomListAck,
  StoneColor,
} from '@board-game-hall/shared';
import { GameSceneData, MatchingSceneData } from '../types';
import { createSocket } from '../utils';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { Dialog, ScrollablePanel, Sizer } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import { CreateRoomDialog } from './matching-scene/create-room-dialog';
import { TitleLabel } from '../common/title-label';
import { ActionButton } from '../common/action-button';
import { RoomListRow } from './matching-scene/room-list-row';

export class MatchingScene extends Phaser.Scene {
  private readonly rexUI!: UIPlugin;
  private socket!: Socket;
  private rooms: RoomListRow[] = [];
  private playerName = '';
  private createRoomDialog!: Dialog;
  private selectedColor: StoneColor = 'black';
  private password = '';
  private sceneTitle!: TitleLabel;
  private createRoomButton!: ActionButton;
  private refreshButton!: ActionButton;
  private backButton!: ActionButton;
  private panelContent!: Sizer;
  private roomListPanel!: ScrollablePanel;

  constructor() {
    super({
      key: MATCHING_SCENE_KEY,
    });
  }

  init() {}
  preload() {
    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI',
    );

    // 参考: https://www.thepolyglotdeveloper.com/2020/09/accept-text-input-user-phaser-game/
    // TODO: これに置き換える https://blog.ourcade.co/posts/2020/dom-element-button-phaser-3-typescript-rxjs-jsx/
    this.load.html('password-form', '/reversi/password-form.html');
    this.load.image(LOCK_IMAGE_KEY, '/reversi/lock.png');
  }
  create({ playerName }: MatchingSceneData) {
    this.socket = createSocket({});
    this.playerName = playerName;

    this.sceneTitle = new TitleLabel({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: 60,
      text: '部屋を選択・作成',
      rexUI: this.rexUI,
    });

    this.createRoomButton = new ActionButton({
      scene: this,
      x: 216,
      y: 540,
      text: '新しく部屋を作成',
      width: 243,
      rexUI: this.rexUI,
      onPointerdown: () => {
        this.createRoomDialog = new CreateRoomDialog({
          scene: this,
          rexUI: this.rexUI,
          onChangeColor: (color: StoneColor) => {
            this.selectedColor = color;
          },
          onChangePassword: (password: string) => {
            this.password = password;
          },
        });
        this.createRoomDialog.layout().setOrigin(0.5).popUp(1000);
        this.createRoomDialog.on('button.click', (_: any, groupName: string, index: number) => {
          this.createRoomDialog.emit('modal.requestClose', { index });
        });
        this.rexUI
          .modalPromise(this.createRoomDialog, {
            manualClose: true,
          })
          .then(this.onModalCloseCallback(playerName));
      },
    });

    this.panelContent = this.rexUI.add.sizer(0, 0, {
      orientation: 'top-to-bottom',
    });

    // 部屋一覧を取得したらそれを表示
    this.generateNewRoomList();
    this.refreshButton = new ActionButton({
      scene: this,
      x: 478,
      y: 540,
      text: '部屋情報を更新',
      width: 210,
      rexUI: this.rexUI,
      onPointerdown: () => {
        this.generateNewRoomList();
      },
    });

    this.backButton = new ActionButton({
      scene: this,
      x: 661,
      y: 540,
      text: '戻る',
      width: 84,
      rexUI: this.rexUI,
      onPointerdown: () => {
        this.socket.close();
        this.scene.start(TITLE_SCENE_KEY);
      },
    });

    this.roomListPanel = this.rexUI.add
      .scrollablePanel({
        x: WINDOW_WIDTH / 2 + 30,
        y: 300,
        width: 510,
        height: 400,
        panel: {
          child: this.panelContent,
        },
        slider: {
          track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, DIALOG_TITLE_COLOR),
          thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, DEFAULT_LABEL_COLOR),
        },
        mouseWheelScroller: {
          focus: true,
        },
        space: {
          panel: {
            right: 30,
          },
        },
      })
      .layout();
  }
  update() {}

  // 既存の部屋の削除も同時に行う
  private generateNewRoomList() {
    this.rooms.forEach((room) => {
      this.panelContent.remove(room, true);
    });

    const ack: GetRoomListAck = (roomList: ReversiRoomResponse[]) => {
      this.rooms = roomList.map((room, index) => {
        const roomRow = new RoomListRow({
          scene: this,
          x: 0,
          y: 0,
          playerName: this.playerName,
          room,
          rexUI: this.rexUI,
          socket: this.socket,
        });
        this.panelContent.add(roomRow, {
          proportion: 0,
          align: 'center',
          padding: {
            top: 10,
            bottom: 10,
          },
        });
        return roomRow;
      });
      this.panelContent.layout();
      this.roomListPanel.layout();
    };
    this.socket.emit(SOCKET_EVENT_GET_ROOM_LIST, ack);
  }

  private onModalCloseCallback(playerName: string) {
    return ({ index }: any) => {
      // 部屋を作成する
      if (index === 0) {
        const newRoomData: CreateRoomData = {
          createPlayer: { id: this.socket.id, name: playerName },
          stoneColor: this.selectedColor,
          password: this.password,
        };

        const ack: CreateRoomAck = (roomInfoForSave: SavedReversiRoom) => {
          const data: GameSceneData = {
            multiPlayData: {
              socket: this.socket,
              player: newRoomData.createPlayer,
              roomInfoForSave,
              password: this.password,
            },
          };
          this.scene.start(GAME_SCENE_KEY, data);
          // TODO: エラーハンドリング
        };
        this.socket.emit(SOCKET_EVENT_CREATE_ROOM, newRoomData, ack);
      }
    };
  }
}
