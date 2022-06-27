import { GameScene } from '../scenes/game-scene';
import { canPutStoneOneSquare, Direction, FieldInfo, NUMBER_OF_COL, reverseStones } from '@board-game-hall/shared';
import { StoneColor } from '@board-game-hall/shared/dist/reversi';

const evaluate = (color: StoneColor, fieldInfo: number[][]) => {
  //現在の盤面情報(fieldInfo)と予め用意した重み付け盤面(weightOfSquare)から評価値を計算する。
  // (その手番の石が置かれているところのマスの重みの合計)-(その手番でない方の石が置かれているところのマスの重みの合計)を評価値とする。
  let weightOfSquare = [
    [30, -12, 0, -1, -1, 0, -12, 30],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [30, -12, 0, -1, -1, 0, -12, 30],
  ];
  const colorNumber = color === 'black' ? 1 : -1;
  let myScore = 0;
  let opponentScore = 0;
  for (let row = 0; row < 8; row++) {
    //GameScene.NUMBER_OF_COLでアクセス出来ない
    for (let col = 0; col < 8; col++) {
      if (fieldInfo[row][col] * colorNumber === 1) {
        myScore += weightOfSquare[row][col];
      } else if (fieldInfo[row][col] * colorNumber === -1) {
        opponentScore += weightOfSquare[row][col];
      }
    }
  }
  return myScore - opponentScore;
};
const negaMax = (fieldInfo: FieldInfo, depth: number, passed: boolean, color: StoneColor): number => {
  //color色の手番の時、深さdepthまで読んだときの評価の値を返す。
  let maxScore = -Infinity;
  let preliminaryFieldInfo: FieldInfo;
  let canPutDirs: Direction[] = [];
  if (depth === 0) {
    return evaluate(color, fieldInfo);
  }
  let cpuCanPutField = searchCPUCanPutMatrix(color, fieldInfo); //CPUが置ける場所。(1,2)と(3,5)に置けるなら[[1,2],[3,5]]
  cpuCanPutField.forEach((element) => {
    canPutDirs = canPutStoneOneSquare(element[0], element[1], color, fieldInfo); //fieldInfoは書き換えられない。
    preliminaryFieldInfo = reverseStones(canPutDirs, fieldInfo, element[0], element[1], color);
    let opponentColor: StoneColor;
    if (color === 'black') {
      opponentColor = 'white';
    } else {
      opponentColor = 'black';
    }
    maxScore = Math.max(maxScore, -negaMax(preliminaryFieldInfo, depth - 1, false, opponentColor));
  });

  if (maxScore === -Infinity) {
    //maxScoreが書き換わっていない。つまり、どこにも置けなかった。
    if (passed) {
      return evaluate(color, fieldInfo);
    }
    let opponentColor: StoneColor;
    if (color === 'black') {
      opponentColor = 'white';
    } else {
      opponentColor = 'black';
    }
    return -negaMax(fieldInfo, depth, true, opponentColor);
  }
  return maxScore;
};
export const depthSearch = (color: StoneColor, fieldInfo: FieldInfo, depth: number) => {
  // colorは自分の色。今自分が打てる場所のうち、そこに打ったときに最も高い評価値になるマス目を返す。
  // 例えば、(1,2)と(3,4)に置けるとして、(1,2)に打ってひっくり返したときの評価値が1と(3,4)に打ってひっくり返したときの評価値が0のとき
  // (1.2)を返す。
  let previousEvaluateScore = -Infinity;
  let nowEvaluateScore = -Infinity;
  let maxMatrix: number[] = []; //TODO 置ける場所がなかったときにどうするのか
  let preliminaryFieldInfo: FieldInfo;
  let canPutDirs: Direction[] = [];
  let cpuCanPutField = searchCPUCanPutMatrix(color, fieldInfo); //CPUが置ける場所。(1,2)と(3,5)に置けるなら[[1,2],[3,5]]
  cpuCanPutField.forEach((element) => {
    canPutDirs = canPutStoneOneSquare(element[0], element[1], color, fieldInfo); //fieldInfoは書き換えられない。
    preliminaryFieldInfo = reverseStones(canPutDirs, fieldInfo, element[0], element[1], color);
    nowEvaluateScore = negaMax(preliminaryFieldInfo, depth - 1, false, color);
    if (previousEvaluateScore < nowEvaluateScore) {
      previousEvaluateScore = nowEvaluateScore;
      maxMatrix = element;
    }
  });
  return maxMatrix;
};
const searchCPUCanPutMatrix = (color: StoneColor, fieldInfo: FieldInfo) => {
  let cpuCanPutField: number[][] = []; //CPUが置ける場所。(1,2)と(3,5)に置けるなら[[1,2],[3,5]]
  for (let row = 0; row < NUMBER_OF_COL; row++) {
    for (let col = 0; col < NUMBER_OF_COL; col++) {
      if (canPutStoneOneSquare(row, col, color, fieldInfo).length > 0) {
        cpuCanPutField.push([row, col]);
      }
    }
  }
  return cpuCanPutField;
};
