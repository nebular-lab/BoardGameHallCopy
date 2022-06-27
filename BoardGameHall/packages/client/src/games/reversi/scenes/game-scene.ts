import Phaser from 'phaser';
import { GameSceneData } from '../types';
import { Socket } from 'socket.io-client';
import {
  canPutStoneOneSquare,
  canPutStoneFullSquare,
  FieldInfo,
  JoinedNotificationData,
  Player,
  StoneColor,
  reverseStones,
  SOCKET_EVENT_NOTIFY_GUEST_JOINED,
  SOCKET_EVENT_PLAYER_LEAVE_NOTIFICATION,
  SOCKET_EVENT_REENTRY_NOTIFICATION,
  SOCKET_EVENT_PUT_STONE,
  PutStoneData,
  SOCKET_EVENT_UPDATED_FIELD,
  UpdatedFieldData,
  SOCKET_EVENT_INITIAL_FIELD,
  InitFieldNotificationData,
  NUMBER_OF_COL,
} from '@board-game-hall/shared';
import {
  BLACK_STONE_KEY,
  GAME_SCENE_KEY,
  LEVEL_SELECT_SCENE_KEY,
  ROOM_STORAGE_KEY,
  TITLE_SCENE_KEY,
  WHITE_STONE_KEY,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../const';
import { depthSearch } from '../algorithms/nega-max';
import { RoomTitle } from './game-scene/room-title';
import UIPlugins from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { FieldInfoUI } from './game-scene/field-info-ui';
import { LogBox } from './game-scene/log-box';
import { countStone } from '../utils';
export class GameScene extends Phaser.Scene {
  private socket: null | Socket = null;
  private squares: Phaser.GameObjects.Image[][] = [];
  private blackStone: Phaser.GameObjects.Image[][] = [];
  private whiteStone: Phaser.GameObjects.Image[][] = [];
  private grayStone: Phaser.GameObjects.Image[][] = [];
  private redCross: Phaser.GameObjects.Image[][] = [];
  private blackSquare: Phaser.GameObjects.Image[][] = [];
  private reverseSound?: Phaser.Sound.BaseSound;
  private hoverSound?: Phaser.Sound.BaseSound;
  private currentPlayerColor: StoneColor = 'black'; //今のターンの色。
  private currentPlayerCanPutSquare: number[][] = [];
  private waitingFlag: boolean[] = [true, false]; //waitingFlag[0]は黒が、[1]は白が、クリックしたら置ける。どっちも置けないというシチュエーションが無ければ、配列にしなくても良い。
  private restartButtonFlag = true;
  private restartMultiPlayData?: GameSceneData; //マルチプレイデータの保存用。再スタート時にこのデータを渡す。
  private singlePlayData?: GameSceneData;
  private humanOrCPU: {
    black: 'human' | 'cpu';
    white: 'human' | 'cpu';
  } = {
    black: 'cpu',
    white: 'cpu',
  };
  private resetTimeoutObject = setTimeout(() => {}); //SetTimeoutをリセットするために必要。
  private squareScale = 0; //ここは変える
  private readonly windowOffset = 16; //ウィンドウからオセロ盤までの長さ
  private readonly tableOffset = 8; //ウィンドウからオセロ版を置くテーブルまでの長さ
  private readonly charaOffset = 32; //1,2,3...a,b,c...などの文字の表示のためのギャップ
  private squareSpaceLength = 0;
  private tableSpaceLength = 0;
  public readonly cpuTimeThinkingMillisecond = 1000;
  private readonly cpuSearchDepth = 4;
  private readonly fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    color: 'black',
    fontSize: '48px',
    backgroundColor: 'white',
  };
  private roomId = '';
  private fieldInfo: FieldInfo = [[]]; //1は黒、-1は白、0は何も置いていない。3つの値を取るのでbooleanに出来ない。
  private myColor: StoneColor = 'black';
  private opponentColor: StoneColor = 'white';
  private lastRedCross: number[] = [0, 0]; //最後に赤いクロスを置いた場所。
  private readonly SQUARE_KEY = 'square';
  private readonly GRAY_STONE_KEY = 'gray_circle';
  private readonly RED_SQUARE_KEY = 'cross';
  private readonly BLACK_SQUARE_KEY = 'black_square';
  private readonly REVERSE_SOUND_KEY = 'reverse_sound';
  private readonly HOVER_SOUND_KEY = 'hover_sound';
  private isInitialized = false;
  private rexUI!: UIPlugins;
  private roomTitle!: RoomTitle;
  private fieldInfoUI!: FieldInfoUI;
  private logBox!: LogBox;

  constructor() {
    super({
      key: GAME_SCENE_KEY,
    });
  }

  init({ multiPlayData, singlePlayData }: GameSceneData) {
    this.humanOrCPU = { black: 'cpu', white: 'cpu' };
    if (multiPlayData) {
      this.humanOrCPU = { black: 'human', white: 'human' };
      this.myColor = multiPlayData.roomInfoForSave.stoneColor;
    }
    if (singlePlayData) {
      this.myColor = singlePlayData.stoneColor;
      this.humanOrCPU[this.myColor] = 'human';
    }
    this.squares.splice(0);
    this.blackStone.splice(0);
    this.whiteStone.splice(0);
    this.grayStone.splice(0);
    this.redCross.splice(0);
    this.blackSquare.splice(0);
    this.currentPlayerColor = 'black';
    this.waitingFlag = [true, false];
    this.restartButtonFlag = true;
    this.fieldInfo.splice(0);
    this.lastRedCross = [0, 0];
    clearTimeout(this.resetTimeoutObject);
  }

  preload() {
    this.load.image(this.SQUARE_KEY, '/reversi/square.png');
    this.load.image(WHITE_STONE_KEY, '/reversi/circle_white.png');
    this.load.image(BLACK_STONE_KEY, '/reversi/circle_black.png');
    this.load.image(this.GRAY_STONE_KEY, '/reversi/circle_black.png');
    this.load.image(this.RED_SQUARE_KEY, '/reversi/square_red.png');
    this.load.image(this.BLACK_SQUARE_KEY, '/reversi/square_black.png');
    this.load.audio(this.REVERSE_SOUND_KEY, '/reversi/sound/reverse_sound2.mp3');
    this.load.audio(this.HOVER_SOUND_KEY, '/reversi/sound/pon.mp3');
    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI',
    );
  }
  create({ multiPlayData, singlePlayData }: GameSceneData) {
    this.scene.scene.cameras.main.setBackgroundColor('#404040');
    //マス目の配置
    this.squareSpaceLength = WINDOW_HEIGHT - this.windowOffset * 2;
    this.tableSpaceLength = WINDOW_HEIGHT - this.tableOffset * 2;
    this.squareScale = (this.squareSpaceLength - this.charaOffset) / NUMBER_OF_COL;
    //オセロ盤を置くテーブルの配置
    // this.add
    //   .rectangle(this.tableOffset, this.tableOffset, this.tableSpaceLength, this.tableSpaceLength, 0x005050)
    //   .setOrigin(0, 0);
    //インデックスの配置
    this.drawIndex();
    //マス目の配置
    for (let row = 0; row < NUMBER_OF_COL; row++) {
      let column: Phaser.GameObjects.Image[] = [];
      for (let col = 0; col < NUMBER_OF_COL; col++) {
        column.push(
          this.add
            .image(
              this.windowOffset + this.charaOffset + row * this.squareScale,
              this.windowOffset + this.charaOffset + col * this.squareScale,
              'square',
            )
            .setOrigin(0, 0)
            .setScale(this.squareScale / this.textures.get(this.SQUARE_KEY).getSourceImage().width),
        );
        column[col].setInteractive();
        column[col].on('pointerdown', () => {
          if (
            (this.currentPlayerColor === 'black' && this.myColor === 'black' && this.waitingFlag[0]) ||
            (this.currentPlayerColor === 'white' && this.myColor === 'white' && this.waitingFlag[1])
          ) {
            this.buttonAction(row, col);
          }
        });
        column[col].on('pointerover', () => {
          this.blackSquare[row][col].setVisible(true);
          this.hoverSound?.play();
        });
        column[col].on('pointerout', () => {
          this.blackSquare[row][col].setVisible(false);
        });
      }
      this.squares.push(column);
    }

    //黒白灰色の石と赤色のクロスを配置
    for (let row = 0; row < NUMBER_OF_COL; row++) {
      let grayStoneColumn: Phaser.GameObjects.Image[] = [];
      let blackStoneColumn: Phaser.GameObjects.Image[] = [];
      let whiteStoneColumn: Phaser.GameObjects.Image[] = [];
      let redCrossColumn: Phaser.GameObjects.Image[] = [];
      let blackSquareColumn: Phaser.GameObjects.Image[] = [];
      for (let col = 0; col < NUMBER_OF_COL; col++) {
        this.pushStone(redCrossColumn, row, col, this.RED_SQUARE_KEY, 0.7, 0.96);
        this.pushStone(grayStoneColumn, row, col, this.GRAY_STONE_KEY, 0.3, 0.4);
        this.pushStone(blackSquareColumn, row, col, this.BLACK_SQUARE_KEY, 0.5, 0.96);
        this.pushStone(blackStoneColumn, row, col, BLACK_STONE_KEY, 1, 0.8);
        this.pushStone(whiteStoneColumn, row, col, WHITE_STONE_KEY, 1, 0.8);
      }
      this.redCross.push(redCrossColumn);
      this.grayStone.push(grayStoneColumn);
      this.blackStone.push(blackStoneColumn);
      this.whiteStone.push(whiteStoneColumn);
      this.blackSquare.push(blackSquareColumn);
    }
    //4つの黒いポチの配置
    this.drawBullet(2, 2);
    this.drawBullet(2, 6);
    this.drawBullet(6, 2);
    this.drawBullet(6, 6);

    for (let row = 0; row < NUMBER_OF_COL; row++) {
      let fieldColumn: (-1 | 0 | 1)[] = [];
      for (let col = 0; col < NUMBER_OF_COL; col++) {
        fieldColumn.push(0);
      }
      this.fieldInfo.push(fieldColumn);
    }
    //this.fieldInfo=INITIAL_FIELD_INFO;
    //初期4マスの配置
    this.drawStone(3, 3, 'white');
    this.drawStone(4, 4, 'white');
    this.drawStone(3, 4, 'black');
    this.drawStone(4, 3, 'black');
    this.fieldInfo[3][3] = -1;
    this.fieldInfo[4][4] = -1;
    this.fieldInfo[3][4] = 1;
    this.fieldInfo[4][3] = 1;

    //UIの配置

    this.fieldInfoUI = new FieldInfoUI({
      scene: this,
      x: 688,
      y: 182,
      squareLength: this.squareScale,
      rexUI: this.rexUI,
    });

    //最初の4マスを置いた後に必要な処理
    let firstPlayerCanPutField = canPutStoneFullSquare('black', this.fieldInfo);
    this.drawGrayStone(firstPlayerCanPutField);
    if (this.humanOrCPU.black === 'cpu') {
      //黒番がCPUだったら
      let firstPlayerCanPutMatrix = firstPlayerCanPutField[Math.floor(Math.random() * firstPlayerCanPutField.length)]; //CPUが実際に置く場所。(3,5)なら[3,5]
      this.buttonAction(firstPlayerCanPutMatrix[0], firstPlayerCanPutMatrix[1]);
    }

    if (multiPlayData) {
      const { roomInfoForSave, player, socket } = multiPlayData;
      // TODO: マッチングが完了していない場合は元の部屋に返す必要がないため、保存はゲームの開始時に行う。このコメントは残す。
      this.roomId = roomInfoForSave.roomId;
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomInfoForSave));
      this.socket = socket;
      if (!this.isInitialized) {
        this.isInitialized = true;
        this.socket.on(SOCKET_EVENT_NOTIFY_GUEST_JOINED, ({ joinedPlayer }: JoinedNotificationData) => {
          this.fieldInfoUI.setCurrentPlayerText(this.currentPlayerColor);
        });
        this.socket.on(SOCKET_EVENT_PLAYER_LEAVE_NOTIFICATION, (leftPlayer: Player) => {
          //new ToastMessage({ scene: this, x: 600, y: 150, message: `${leftPlayer.name}さんが退室しました` });
        });
        this.socket.on(SOCKET_EVENT_REENTRY_NOTIFICATION, (reEntryPlayer: Player) => {
          //new ToastMessage({ scene: this, x: 600, y: 150, message: `${reEntryPlayer.name}さんが再入室しました` });
        });
        this.socket.on(SOCKET_EVENT_UPDATED_FIELD, ({ fieldInfo, puttedRow, puttedCol }: UpdatedFieldData) => {
          for (let row = 0; row < NUMBER_OF_COL; row++) {
            for (let col = 0; col < NUMBER_OF_COL; col++) {
              if (fieldInfo[row][col] === 1) {
                this.fieldInfo[row][col] = 1;
                this.drawStone(row, col, 'black');
              } else if (fieldInfo[row][col] === -1) {
                this.fieldInfo[row][col] = -1;
                this.drawStone(row, col, 'white');
              }
            }
          }
          this.drawRedCross(puttedRow, puttedCol); //置いた場所に赤いクロスを置く
          this.afterReverse(this.currentPlayerColor);
        });
      }
      // TODO: ゲーム終了時に localStorageの room データを削除
    }

    //UIの設定

    if (multiPlayData) {
      this.fieldInfoUI.setBlackPlayerName(
        multiPlayData.roomInfoForSave.stoneColor === 'black' ? multiPlayData.player.name : 'waiting...',
      );
      this.fieldInfoUI.setWhitePlayerName(
        multiPlayData.roomInfoForSave.stoneColor === 'white' ? multiPlayData.player.name : 'waiting...',
      );
      this.fieldInfoUI.setCountInformation(this.fieldInfo);
      //this.fieldInfoUI.setCurrentPlayerText(this.currentPlayerColor);
    } else {
      this.fieldInfoUI.setBlackPlayerName(singlePlayData?.stoneColor === 'black' ? 'You' : 'CPU');
      this.fieldInfoUI.setWhitePlayerName(singlePlayData?.stoneColor === 'white' ? 'You' : 'CPU');
      this.fieldInfoUI.setCountInformation(this.fieldInfo);
      this.fieldInfoUI.setCurrentPlayerText(this.currentPlayerColor);
    }

    this.logBox = new LogBox({
      scene: this,
      x: 688,
      y: 304 + 275 / 2,
      rexUI: this.rexUI,
      isCPU: !multiPlayData,
      multiData: multiPlayData
        ? {
            playerName: multiPlayData.player.name,
            roomId: multiPlayData.roomInfoForSave.roomId,
            socket: multiPlayData.socket,
          }
        : undefined,
    });
    this.roomTitle = new RoomTitle({
      scene: this,
      x: 688,
      y: 38,
      isCPU: !multiPlayData,
      rexUI: this.rexUI,
      onInvitationLinkCopy: () => {
        if (multiPlayData?.password !== undefined) {
          // TODO: CPU対戦の時は消す 環境に応じてURLを切り替える
          const encodedPassword = window.btoa(multiPlayData.password);
          navigator.clipboard.writeText(
            `http://localhost:3000/reversi?roomId=${multiPlayData.roomInfoForSave.roomId}${
              encodedPassword !== '' ? `&token=${encodedPassword}` : ''
            }`,
          );
          this.logBox.addLogText('招待リンクをコピーしました');
        }
      },
      socket: multiPlayData ? multiPlayData.socket : undefined,
    });
    this.reverseSound = this.sound.add(this.REVERSE_SOUND_KEY);
    this.hoverSound = this.sound.add(this.HOVER_SOUND_KEY);
  }
  update() {}
  private pushStone(
    stoneColumn: Phaser.GameObjects.Image[],
    row: number,
    col: number,
    key: string,
    alpha: number,
    scale: number,
  ) {
    stoneColumn.push(
      this.add
        .image(
          this.windowOffset + this.charaOffset + row * this.squareScale + this.squareScale / 2,
          this.windowOffset + this.charaOffset + col * this.squareScale + this.squareScale / 2,
          key,
        )
        .setScale((this.squareScale / this.textures.get(key).getSourceImage().width) * scale)
        .setAlpha(alpha)
        .setVisible(false),
    );
  }

  //row行col列に色(color)を指定して石を描画+情報の書き換え
  private drawStone(targetRow: number, targetCol: number, color: StoneColor) {
    this.reverseSound?.play();
    if (color === 'black') {
      this.blackStone[targetRow][targetCol].setVisible(true);
      this.whiteStone[targetRow][targetCol].setVisible(false);
    } else {
      this.blackStone[targetRow][targetCol].setVisible(false);
      this.whiteStone[targetRow][targetCol].setVisible(true);
    }
  }
  //盤面の4つの黒いポチを描画
  private drawBullet(x: number, y: number) {
    this.add
      .image(
        this.windowOffset + this.charaOffset + this.squareScale * x,
        this.windowOffset + this.charaOffset + this.squareScale * y,
        BLACK_STONE_KEY,
      )
      .setScale((this.squareScale / this.textures.get(BLACK_STONE_KEY).getSourceImage().width) * 0.15);
  }
  //例えばcanPutSquareが[[2,3],[3,4]]なら、2行3列と3行4列に灰色の石を描画する。そこ以外のマスの灰色の描画は消す
  private drawGrayStone(canPutSquare: number[][]) {
    for (let row = 0; row < NUMBER_OF_COL; row++) {
      for (let col = 0; col < NUMBER_OF_COL; col++) {
        let canPutThisSquare = false;
        canPutSquare.forEach((Element) => {
          if (Element[0] === row && Element[1] === col) {
            canPutThisSquare = true;
          }
        });
        if (canPutThisSquare) {
          this.grayStone[row][col].setVisible(true);
        } else {
          this.grayStone[row][col].setVisible(false);
        }
      }
    }
  }
  private drawRedCross(row: number, col: number) {
    //すでに置かれた赤いクロスを消し、新しく(row,col)に赤いクロスを置く
    this.redCross[this.lastRedCross[0]][this.lastRedCross[1]].setVisible(false);
    this.lastRedCross[0] = row;
    this.lastRedCross[1] = col;
    this.redCross[row][col].setVisible(true);
  }

  private finishWindow() {
    this.fieldInfoUI.setCountInformation(this.fieldInfo);
    this.add.text(WINDOW_WIDTH / 2, (WINDOW_HEIGHT * 3) / 5, 'GAME SET', this.fontStyle).setOrigin(0.5, 0.5);
    let blackScore, whiteScore;
    let winnerText;
    blackScore = countStone(this.fieldInfo).black;
    whiteScore = countStone(this.fieldInfo).white;
    if (blackScore > whiteScore) {
      winnerText = 'で黒の勝ち';
    } else if (blackScore < whiteScore) {
      winnerText = 'で白の勝ち';
    } else if (blackScore === whiteScore) {
      winnerText = 'で引き分け';
    }
    this.add
      .text(
        WINDOW_WIDTH / 2,
        (WINDOW_HEIGHT * 4) / 5,
        '黒:' + blackScore + '対' + '白:' + whiteScore + winnerText,
        this.fontStyle,
      )
      .setOrigin(0.5, 0.5);
    this.add
      .text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 3, 'もう一度', this.fontStyle)
      .setInteractive()
      .setOrigin(0.5, 0.5)
      .on('pointerdown', () => {
        if (this.restartButtonFlag) {
          this.restartButtonFlag = false;
          this.currentPlayerColor = 'black';
          for (let row = 0; row < NUMBER_OF_COL; row++) {
            for (let col = 0; col < NUMBER_OF_COL; col++) {
              this.fieldInfo[row][col] = 0;
            }
          }
          this.scene.restart();
        }
      });
    this.add
      .text(WINDOW_WIDTH / 2, (WINDOW_HEIGHT / 3) * 2, '難易度選択', this.fontStyle)
      .setInteractive()
      .setOrigin(0.5, 0.5)
      .on('pointerdown', () => {
        this.scene.start(LEVEL_SELECT_SCENE_KEY);
      });
  }

  private cpuAction(color: StoneColor) {
    let cpuPutMatrix: number[] = [];
    cpuPutMatrix = depthSearch(color, this.fieldInfo, this.cpuSearchDepth); //depthSearchでどこに置くのかを決める。
    let canPutDirs = canPutStoneOneSquare(cpuPutMatrix[0], cpuPutMatrix[1], color, this.fieldInfo);
    this.fieldInfo = reverseStones(
      canPutDirs,
      this.fieldInfo,
      cpuPutMatrix[0],
      cpuPutMatrix[1],
      color,
      (returnRow: number, returnCol: number, returnColor: StoneColor) =>
        this.drawStone(returnRow, returnCol, returnColor),
    );
    this.drawRedCross(cpuPutMatrix[0], cpuPutMatrix[1]); //置いた場所に赤いクロスを置く
  }
  private buttonAction(row: number, col: number) {
    //playerが(row,col)を押したとして、実行されること。
    //そこに置けるか
    let canPutDirs = canPutStoneOneSquare(row, col, this.currentPlayerColor, this.fieldInfo);
    if (canPutDirs.length > 0) {
      //置けるかどうかの判定
      this.waitingFlag = [false, false]; //ターンチェンジまで、一旦双方置けなくする。ダブルクリックによってbuttonActionが2回連続で呼ばれることを防ぐ。
      if (this.socket) {
        //オンライン対戦ならば、今置いた座標と色とroomIdを送る
        const putStoneData: PutStoneData = { row: row, col: col, color: this.currentPlayerColor, roomId: this.roomId };
        this.socket.emit(SOCKET_EVENT_PUT_STONE, putStoneData);
        return; //オンライン対戦ならこの関数は終了。onで受け取る場所で以下の処理を行う。
      }
      //もしそこに置くとひっくり返せるなら、引っくり返す。
      this.fieldInfo = reverseStones(
        canPutDirs,
        this.fieldInfo,
        row,
        col,
        this.currentPlayerColor,
        (returnRow: number, returnCol: number, returnColor: StoneColor) =>
          this.drawStone(returnRow, returnCol, returnColor),
      );
      this.drawRedCross(row, col); //置いた場所に赤いクロスを置く
      this.afterReverse(this.currentPlayerColor);
    }
  }
  //'color'色のplayerがひっくり返した後の処理
  //colorがplayer Aの色とする
  private afterReverse(color: StoneColor) {
    let myCanPutSquares: number[][];
    let OpponentCanPutSquares: number[][];

    if (color === 'black') {
      this.opponentColor = 'white';
    } else if (color === 'white') {
      this.opponentColor = 'black';
    }
    OpponentCanPutSquares = canPutStoneFullSquare(this.opponentColor, this.fieldInfo);
    myCanPutSquares = canPutStoneFullSquare(color, this.fieldInfo);
    if (OpponentCanPutSquares.length > 0) {
      this.currentPlayerCanPutSquare = OpponentCanPutSquares;
      this.drawGrayStone(OpponentCanPutSquares);
      this.fieldInfoUI.setCountInformation(this.fieldInfo);
      this.fieldInfoUI.setCurrentPlayerText(this.opponentColor);
      if (
        (this.opponentColor === 'black' && this.humanOrCPU.black === 'cpu') ||
        (this.opponentColor === 'white' && this.humanOrCPU.white === 'cpu')
      ) {
        //playerBが先攻かつ先攻がCPU または playerBが後攻かつ後攻がCPU
        if (color === 'black') {
          this.waitingFlag[0] = false;
        } else if (color === 'white') {
          this.waitingFlag[1] = false;
        }
        this.resetTimeoutObject = setTimeout(() => {
          this.cpuAction(this.opponentColor);
          this.turnChange();
          this.afterReverse(this.opponentColor);
        }, this.cpuTimeThinkingMillisecond);
      } else {
        this.turnChange();
        return;
      }
    } else if (myCanPutSquares.length > 0) {
      this.currentPlayerCanPutSquare = myCanPutSquares;
      this.drawGrayStone(myCanPutSquares);
      this.fieldInfoUI.setCountInformation(this.fieldInfo);
      this.fieldInfoUI.setCurrentPlayerText(this.currentPlayerColor);
      if (
        (color === 'black' && this.humanOrCPU.black === 'cpu') ||
        (color === 'white' && this.humanOrCPU.white === 'cpu')
      ) {
        //playerAが先攻かつ先攻がCPU または playerAが後攻かつ後攻がCPU
        if (color === 'black') {
          this.waitingFlag[1] = false;
        } else if (color === 'white') {
          this.waitingFlag[0] = false;
        }
        this.resetTimeoutObject = setTimeout(() => {
          this.cpuAction(color);
          this.afterReverse(color);
        }, this.cpuTimeThinkingMillisecond);
      } else {
        this.stayTurn();
      }
    } else {
      if (this.socket) {
        this.waitingFlag = [true, false]; //init関数内で上手く初期化出来ないからここでやる。
        //オンライン対戦ならば、roomIdを送る
        const initFieldNotificationData: InitFieldNotificationData = { roomId: this.roomId };
        this.socket.emit(SOCKET_EVENT_INITIAL_FIELD, initFieldNotificationData);
      }
      this.finishWindow();
      //終了
    }
  }
  private turnChange() {
    if (this.currentPlayerColor === 'black') {
      this.currentPlayerColor = 'white';
      this.waitingFlag = [false, true];
    } else if (this.currentPlayerColor === 'white') {
      this.currentPlayerColor = 'black';
      this.waitingFlag = [true, false];
    }
  }
  private stayTurn() {
    if (this.currentPlayerColor === 'black') {
      this.waitingFlag = [true, false];
    } else if (this.currentPlayerColor === 'white') {
      this.waitingFlag = [false, true];
    }
  }
  private drawIndex() {
    for (let row = 0; row < NUMBER_OF_COL; row++) {
      this.add
        .text(
          this.windowOffset + this.charaOffset / 2,
          this.windowOffset + this.charaOffset + this.squareScale / 2 + this.squareScale * row,
          String(row + 1),
        )
        .setOrigin(0.5, 0.5);
    }
    let label = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let col = 0; col < NUMBER_OF_COL; col++) {
      this.add
        .text(
          this.windowOffset + this.charaOffset + this.squareScale / 2 + this.squareScale * col,
          this.windowOffset + this.charaOffset / 2,
          label[col],
        )
        .setOrigin(0.5, 0.5);
    }
  }
}
