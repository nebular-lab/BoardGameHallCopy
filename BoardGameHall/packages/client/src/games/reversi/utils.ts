import { io } from 'socket.io-client';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import Phaser from 'phaser';
import { DEFAULT_LABEL_COLOR, HOVERED_LABEL_COLOR } from './const';
import { FieldInfo, NUMBER_OF_COL } from '@board-game-hall/shared';

export const createLabel = (
  text: string,
  scene: Phaser.Scene,
  rexUI: UIPlugin,
  bgColor: number = DEFAULT_LABEL_COLOR,
) => {
  const background = rexUI.add.roundRectangle(0, 0, 0, 0, 20, bgColor);
  const label = rexUI.add.label({
    background,

    text: scene.add.text(0, 0, text, {
      fontSize: '24px',
    }),

    space: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 10,
    },
  });
  label.on('pointerover', () => {
    background.setFillStyle(HOVERED_LABEL_COLOR);
  });
  label.on('pointerout', () => {
    background.setFillStyle(DEFAULT_LABEL_COLOR);
  });
  return label;
};

export const createSocket = ({ query, onConnect }: { query?: Object; onConnect?: () => void }) => {
  const socket = io(`${process.env.NEXT_PUBLIC_SERVER_HOST}/reversi`, query);

  socket.on('connect', () => {
    onConnect && onConnect();
  });
  return socket;
};

export const countStone = (fieldInfo: FieldInfo) => {
  const stoneCount = {
    black: 0,
    white: 0,
  };
  for (let row = 0; row < NUMBER_OF_COL; row++) {
    for (let col = 0; col < NUMBER_OF_COL; col++) {
      if (fieldInfo[row][col] === 1) {
        stoneCount.black++;
      } else if (fieldInfo[row][col] === -1) {
        stoneCount.white++;
      }
    }
  }
  return stoneCount;
};
