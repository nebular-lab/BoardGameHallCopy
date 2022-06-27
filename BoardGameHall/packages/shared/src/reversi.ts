import * as rfdc from 'rfdc';
export const SOCKET_EVENT_GET_ROOM_BY_ID = 'room_by_id';
export const SOCKET_EVENT_GET_ROOM_LIST = 'room_list';
export const SOCKET_EVENT_JOIN_ROOM = 'join_room';
export const SOCKET_EVENT_NOTIFY_GUEST_JOINED = 'guest_joined';
export const SOCKET_EVENT_CREATE_ROOM = 'create_room';
export const SOCKET_EVENT_REENTRY_ROOM = 'reentry_room';
export const SOCKET_EVENT_REENTRY_NOTIFICATION = 'reentry_notification';
export const SOCKET_EVENT_PLAYER_LEAVE_NOTIFICATION = 'leave_notification';
export const SOCKET_EVENT_PUT_STONE = 'put_stone';
export const SOCKET_EVENT_UPDATED_FIELD = 'updated_field';
export const SOCKET_EVENT_INITIAL_FIELD = 'initial_field';
export const SOCKET_EVENT_POST_MESSAGE = 'post_message';
export const SOCKET_EVENT_MULTICAST_MESSAGE = 'multicast_message';

const clone = rfdc();

export type Player = {
  id: string;
  name: string;
};
export const NUMBER_OF_COL = 8;
export type StoneColor = 'black' | 'white';
export type PlayerType = 'human' | 'cpu';
export type CPULevel = '普通';
export type ReversiRoomCommon = {
  id: string;
  blackPlayer: Player | null;
  whitePlayer: Player | null;
  // TODO: 作成時以外でも更新できるようにする
  createdAt: number;
};
// Redisにはパスワードを保存する
export type ReversiRoomRedis = ReversiRoomCommon & {
  password: string;
  fieldInfo: FieldInfo;
};
// レスポンスにはパスワードで保護されているかどうかの情報のみを返す
export type ReversiRoomResponse = ReversiRoomCommon & {
  hasPassword: boolean;
};

export type PostMessageData = {
  roomId: string;
  playerName: string;
  message: string;
};

export type MulticastedData = {
  playerName: string;
  message: string;
};

export type JoinRoomData = {
  roomId: string;
  joinPlayer: Player;
  password?: string;
};

export type CreateRoomData = {
  createPlayer: Player;
  stoneColor: StoneColor;
  password: string;
};

export type JoinedNotificationData = {
  joinedPlayer: Player;
};

export type PutStoneData = {
  row: number;
  col: number;
  color: StoneColor;
  roomId: string;
};
export type UpdatedFieldData = {
  fieldInfo: FieldInfo;
  puttedRow: number;
  puttedCol: number;
};
export type InitFieldNotificationData = {
  roomId: string;
};

export type SavedReversiRoom = {
  roomId: string;
  name: string;
  stoneColor: StoneColor;
};

export type Direction = {
  dirX: -1 | 0 | 1;
  dirY: -1 | 0 | 1;
};

// TODO: 8x8に指定できるならする
// 1は黒、-1は白、0は何も置いていない。
export type FieldInfo = (-1 | 0 | 1)[][];

export const INITIAL_FIELD_INFO: FieldInfo = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, -1, 1, 0, 0, 0],
  [0, 0, 0, 1, -1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// TODO: カラーがtrue falseだとわかりづらいのでなんとかする
//変数：置きたい場所(targetRow,targetCol)、置きたい色(color)、盤面情報(fieldInfo[8][8])、
//返り値：置ける方向
export const canPutStoneOneSquare = (
  targetRow: number,
  targetCol: number,
  color: StoneColor,
  fieldInfo: FieldInfo,
): Direction[] => {
  const canPutDirs: Direction[] = [];
  const directionSet: Direction[] = [
    { dirX: -1, dirY: -1 },
    { dirX: -1, dirY: 0 },
    { dirX: -1, dirY: 1 },
    { dirX: 0, dirY: -1 },
    { dirX: 0, dirY: 1 },
    { dirX: 1, dirY: -1 },
    { dirX: 1, dirY: 0 },
    { dirX: 1, dirY: 1 },
  ];

  if (fieldInfo[targetRow][targetCol] !== 0) return canPutDirs; //そこに石がある場合なにもせずに空の配列を返す
  directionSet.forEach((element) => {
    if (searchOneDirection(targetRow, targetCol, element.dirX, element.dirY, color, fieldInfo)) {
      canPutDirs.push(element);
    }
  });
  return canPutDirs;
};
const searchOneDirection = (
  targetRow: number,
  targetCol: number,
  searchDirX: -1 | 0 | 1,
  searchDirY: -1 | 0 | 1,
  color: StoneColor,
  fieldInfo: FieldInfo,
) => {
  //(targetRow,targetCol)から(searchDirX,searchDirY)方向への探索
  //例:(4,6)から(+1,-1)方向への探索
  //reverseがtrueなら(targetRow,targetCol)に石を置いてさらにひっくり返す処理
  let flag = false;
  const colorNumber = color == 'black' ? 1 : -1;
  for (
    let row = targetRow + searchDirX, col = targetCol + searchDirY;
    row >= 0 && col >= 0 && row < 8 && col < 8; //this.NUMBER_OF_COLを使えない
    row += searchDirX, col += searchDirY
  ) {
    if (fieldInfo[row][col] === 0) {
      //何も無い
      break;
    }
    if (fieldInfo[row][col] * colorNumber === 1 && !flag) {
      //自分と同じでフラグが立っていない
      break;
    }
    if (fieldInfo[row][col] * colorNumber === 1 && flag) {
      //自分と同じでフラグが立っている

      //プレイヤーが置ける場所の表示と終了条件
      return true;
    }
    if (fieldInfo[row][col] * colorNumber === -1) {
      //自分と違っている
      flag = true;
    }
  }
  return false;
};

export const reverseStones = (
  dirs: Direction[],
  fieldInfoInput: FieldInfo,
  targetRow: number,
  targetCol: number,
  color: StoneColor,
  draw?: (row: number, col: number, returnColor: StoneColor) => void,
) => {
  const colorNumber = color == 'black' ? 1 : -1;
  const fieldInfoOutput = clone(fieldInfoInput);

  //置きたい場所に置く
  fieldInfoOutput[targetRow][targetCol] = colorNumber;
  draw && draw(targetRow, targetCol, color);
  //引っくり返す

  dirs.forEach((element) => {
    let reverseRow = targetRow + element.dirX;
    let reverseCol = targetCol + element.dirY;
    while (fieldInfoOutput[reverseRow][reverseCol] * colorNumber !== 1) {
      //自分と同じ色ではないときに以下を実行
      fieldInfoOutput[reverseRow][reverseCol] = colorNumber; //フィールド情報の書き換え
      draw && draw(reverseRow, reverseCol, color); //描画
      reverseRow += element.dirX;
      reverseCol += element.dirY;
    }
  });
  return fieldInfoOutput;
};
export const canPutStoneFullSquare = (color: StoneColor, fieldInfoInput: FieldInfo) => {
  //color色の石をどこに置けるかを返す
  const fieldInfoOutput = fieldInfoInput;
  const canPutSquare = [];
  for (let row = 0; row < NUMBER_OF_COL; row++) {
    for (let col = 0; col < NUMBER_OF_COL; col++) {
      if (canPutStoneOneSquare(row, col, color, fieldInfoOutput).length > 0) {
        canPutSquare.push([row, col]);
      }
    }
  }
  return canPutSquare;
};

export type CreateRoomAck = (roomInfoForSave: SavedReversiRoom) => void;

export type JoinRoomAck = (
  res: { status: 'ok'; stoneColor: StoneColor } | { status: 'password_error' } | { status: 'room_is_full' },
) => void;

export type ReentryRoomAck = (reentryPlayer: Player) => void;

export type GetRoomByIdAck = (room: ReversiRoomResponse | null) => void;

export type GetRoomListAck = (rooms: ReversiRoomResponse[]) => void;
