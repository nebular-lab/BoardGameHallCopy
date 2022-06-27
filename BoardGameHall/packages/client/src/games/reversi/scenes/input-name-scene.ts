import Phaser from 'phaser';
import {
  DEFAULT_LABEL_COLOR,
  GAME_SCENE_KEY,
  INPUT_NAME_SCENE_KEY,
  MATCHING_SCENE_KEY,
  TITLE_SCENE_KEY,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../const';
import { GameSceneData, InputNameSceneData, MatchingSceneData } from '../types';
import { TitleLabel } from '../common/title-label';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { ActionButton } from '../common/action-button';
import { TextEdit } from 'phaser3-rex-plugins/plugins/textedit';
import { createSocket } from '../utils';
import { JoinRoomAck, JoinRoomData, SavedReversiRoom, SOCKET_EVENT_JOIN_ROOM } from '@board-game-hall/shared';

export class InputNameScene extends Phaser.Scene {
  private readonly rexUI!: UIPlugins;
  private sceneTitle!: TitleLabel;
  private backButton!: ActionButton;
  private completeButton!: ActionButton;
  // いずれ登録制にするかも
  private inputText!: Phaser.GameObjects.Text;
  private textEditor!: TextEdit;

  constructor() {
    super({
      key: INPUT_NAME_SCENE_KEY,
    });
  }

  init() {}
  preload() {
    // 参考: https://www.thepolyglotdeveloper.com/2020/09/accept-text-input-user-phaser-game/
    // TODO: これに置き換える https://blog.ourcade.co/posts/2020/dom-element-button-phaser-3-typescript-rxjs-jsx/
    this.load.html('name-form', '/reversi/name-form.html');
    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI',
    );
  }
  create({ invitationParams }: InputNameSceneData) {
    this.sceneTitle = new TitleLabel({
      scene: this,
      x: WINDOW_WIDTH / 2,
      y: 60,
      text: '名前を入力してください',
      rexUI: this.rexUI,
    });
    this.backButton = new ActionButton({
      scene: this,
      x: 520,
      y: 540,
      width: 84,
      text: '戻る',
      rexUI: this.rexUI,
      onPointerdown: () => {
        this.scene.start(TITLE_SCENE_KEY);
      },
    });
    this.completeButton = new ActionButton({
      scene: this,
      x: 620,
      y: 540,
      width: 84,
      text: '決定',
      rexUI: this.rexUI,
      onPointerdown: () => {
        if (this.inputText.text === '') {
          alert('空欄で登録はできません');
          return;
        }
        if (invitationParams) {
          const decodedPassword = atob(invitationParams.token);
          const socket = createSocket({});
          const joinPlayer = {
            id: socket.id,
            name: this.inputText.text,
          };
          const joinRoomData: JoinRoomData = {
            roomId: invitationParams.roomId,
            joinPlayer,
            password: decodedPassword,
          };
          const ack: JoinRoomAck = (res) => {
            if (res.status === 'ok') {
              const roomInfoForSave: SavedReversiRoom = {
                roomId: invitationParams.roomId,
                name: this.inputText.text,
                stoneColor: res.stoneColor,
              };
              const gameSceneData: GameSceneData = {
                multiPlayData: {
                  roomInfoForSave,
                  socket,
                  player: joinPlayer,
                },
              };
              this.scene.start(GAME_SCENE_KEY, gameSceneData);
            } else {
              // TODO: エラーハンドリング
            }
          };
          socket.emit(SOCKET_EVENT_JOIN_ROOM, joinRoomData, ack);
          return;
        }
        const data: MatchingSceneData = {
          playerName: this.inputText.text,
        };
        this.scene.start(MATCHING_SCENE_KEY, data);
      },
    });
    // this.nameInput = this.add.dom(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 3).createFromCache('name-form');
    this.inputText = this.add
      .text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2, '', {
        fixedWidth: 360,
        fixedHeight: 60,
        backgroundColor: `#${DEFAULT_LABEL_COLOR.toString(16)}`,
        padding: {
          left: 10,
          top: 20,
        },
        fontSize: '24px',
      })
      .setOrigin(0.5)
      .setInteractive();
    this.textEditor = new TextEdit(this.inputText);

    this.inputText.on('pointerdown', () => {
      this.textEditor.open({
        style: {
          padding: '0 10px',
        },
        onTextChanged: (textObject, text) => {
          this.inputText.text = text;
        },
      });
    });
  }
  update() {}
}
