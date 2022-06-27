import Phaser from 'phaser';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import {
  DEFAULT_LABEL_COLOR,
  DIALOG_CONTENT_COLOR,
  DIALOG_TITLE_COLOR,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../const';
import { GAME_UI_WIDTH } from '../../const';
import { TitleLabel } from '../../common/title-label';
import FixWidthSizer from 'phaser3-rex-plugins/templates/ui/fixwidthsizer/FixWidthSizer';
import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import { TextEdit } from 'phaser3-rex-plugins/plugins/textedit';
import { Socket } from 'socket.io-client';
import {
  MulticastedData,
  PostMessageData,
  SOCKET_EVENT_MULTICAST_MESSAGE,
  SOCKET_EVENT_POST_MESSAGE,
} from '@board-game-hall/shared';

export class LogBox extends Phaser.GameObjects.Container {
  private logContent!: FixWidthSizer;
  private logPanel!: ScrollablePanel;

  constructor({
    scene,
    x,
    y,
    isCPU,
    rexUI,
    multiData,
    fontStyle = {
      color: 'white',
      fontSize: '24px',
    },
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    isCPU: boolean;
    rexUI: UIPlugins;
    multiData?: {
      roomId: string;
      socket: Socket;
      playerName: string;
    };
    fontStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  }) {
    super(scene);
    const background = rexUI.add.roundRectangle(x, y, GAME_UI_WIDTH, 275, 20, DIALOG_CONTENT_COLOR);
    background.setOrigin(0.5);
    background.setStrokeStyle(1, DEFAULT_LABEL_COLOR);

    const title = new TitleLabel({ scene, x, y: y - 275 / 2 + 36, width: GAME_UI_WIDTH - 40, text: 'ログ', rexUI });

    const graphic = scene.add.graphics();
    this.logContent = rexUI.add
      .fixWidthSizer({ width: GAME_UI_WIDTH - 40 })
      .drawBounds(graphic, 0xff0000)
      .layout();

    const track = rexUI.add.roundRectangle(0, 0, 10, 10, 5, DIALOG_TITLE_COLOR);
    const thumb = rexUI.add.roundRectangle(0, 0, 0, 0, 6.5, DEFAULT_LABEL_COLOR);

    this.logPanel = rexUI.add
      .scrollablePanel({
        x,
        y: isCPU ? y + 25 : y,
        width: GAME_UI_WIDTH - 20,
        height: isCPU ? 200 : 150,
        slider: {
          track,
          thumb,
        },
        panel: {
          child: this.logContent,
        },
        mouseWheelScroller: {
          focus: true,
        },
        space: {},
      })
      .layout();

    this.add(background);
    if (!isCPU) {
      const inputText = scene.add
        .text(x, y + 110, '', {
          fixedWidth: GAME_UI_WIDTH - 20,
          fixedHeight: 30,
          backgroundColor: `#${DEFAULT_LABEL_COLOR.toString(16)}`,
          padding: {
            left: 10,
            top: 10,
          },
          fontSize: '16px',
        })
        .setOrigin(0.5)
        .setInteractive();
      const textEditor = new TextEdit(inputText);

      inputText.on('pointerdown', () => {
        textEditor.open({
          style: {
            padding: '0 10px',
          },
          onTextChanged: (textObject, text) => {
            inputText.text = text;
          },
          onClose: (textObject) => {
            // TODO: サーバーにメッセージを送信
            if (multiData) {
              const postData: PostMessageData = {
                roomId: multiData.roomId,
                playerName: multiData.playerName,
                message: inputText.text,
              };
              multiData.socket.emit(SOCKET_EVENT_POST_MESSAGE, postData);
            }
            // this.addLogText(inputText.text);
            inputText.text = '';
          },
        });
      });
      this.add(inputText);
    }

    this.add(title);
    // this.add(this.logPanel);
    // this.add(this.logContent);
    this.add(track);
    this.add(thumb);

    if (multiData) {
      multiData.socket.on(SOCKET_EVENT_MULTICAST_MESSAGE, ({ playerName, message }: MulticastedData) => {
        this.addLogText(`${playerName}：${message}`);
      });
    }

    scene.add.existing(this);
  }

  public addLogText(logText: string) {
    this.logContent.add(
      this.scene.add.text(0, 0, logText, {
        fixedWidth: GAME_UI_WIDTH - 40,
        wordWrap: { width: GAME_UI_WIDTH - 40, useAdvancedWrap: true },
        fontSize: '12px',
      }),
      {
        padding: {
          top: 2,
          bottom: 2,
        },
      },
    );
    this.logContent.layout();
    this.logPanel.layout();
    this.logPanel.scrollToBottom();
  }
}
