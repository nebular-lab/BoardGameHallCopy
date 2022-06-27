import * as express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  CreateRoomData,
  JoinedNotificationData,
  JoinRoomData,
  Player,
  SavedReversiRoom,
  SOCKET_EVENT_CREATE_ROOM,
  SOCKET_EVENT_GET_ROOM_BY_ID,
  SOCKET_EVENT_GET_ROOM_LIST,
  SOCKET_EVENT_JOIN_ROOM,
  SOCKET_EVENT_NOTIFY_GUEST_JOINED,
  SOCKET_EVENT_PLAYER_LEAVE_NOTIFICATION,
  SOCKET_EVENT_REENTRY_NOTIFICATION,
  SOCKET_EVENT_REENTRY_ROOM,
  SOCKET_EVENT_PUT_STONE,
  SOCKET_EVENT_UPDATED_FIELD,
  SOCKET_EVENT_INITIAL_FIELD,
  CreateRoomAck,
  JoinRoomAck,
  ReentryRoomAck,
  GetRoomListAck,
  GetRoomByIdAck,
  ReversiRoomRedis,
  StoneColor,
  PutStoneData,
  canPutStoneOneSquare,
  reverseStones,
  UpdatedFieldData,
  INITIAL_FIELD_INFO,
  InitFieldNotificationData,
  NUMBER_OF_COL,
  SOCKET_EVENT_POST_MESSAGE,
  PostMessageData,
  SOCKET_EVENT_MULTICAST_MESSAGE,
  MulticastedData,
} from '@board-game-hall/shared';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { EXPIRE_HOURS, MAX_ROOM_NUMBER, REVERSI_ROOM_KEY } from './const';
import { checkExpiration } from './utils';

dotenv.config();

const redisURL = process.env.REDIS_URL || 'redis://redis:6379';
const redis = new Redis(redisURL);

const serverPort = process.env.PORT || 9001;
const app = express();
app.set('port', serverPort);

const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: process.env.CLIENT_HOST,
  },
});

const leaveRoom = async (socket: any) => {
  // 部屋を探索
  const reversiRoomsData = await redis.hvals(REVERSI_ROOM_KEY);
  const reversiRooms = reversiRoomsData.map((room) => {
    return JSON.parse(room) as ReversiRoomRedis;
  });
  const room = reversiRooms.find((room) => {
    return (
      (room.blackPlayer && room.blackPlayer.id === socket.id) || (room.whitePlayer && room.whitePlayer.id === socket.id)
    );
  });

  if (!room) {
    // TODO: 見つからなかった場合のエラーハンドリング
    return;
  }

  // 両方いる場合は片方を削除
  if (room.blackPlayer && room.whitePlayer) {
    let leftPlayer: Player | null = null;
    // 消えたPlayerをnullに設定
    if (room.blackPlayer.id === socket.id) {
      leftPlayer = room.blackPlayer;
      room.blackPlayer = null;
    } else if (room.whitePlayer.id === socket.id) {
      leftPlayer = room.whitePlayer;
      room.whitePlayer = null;
    }
    if (!leftPlayer) return;
    socket.to(room.id).emit(SOCKET_EVENT_PLAYER_LEAVE_NOTIFICATION, leftPlayer);
    await redis.hset(REVERSI_ROOM_KEY, room.id, JSON.stringify(room));
  }
  // 片方しかいない場合は部屋を削除
  else {
    await redis.hdel(REVERSI_ROOM_KEY, room.id);
  }
};

io.of('/reversi').on('connection', (socket) => {
  socket.on(SOCKET_EVENT_GET_ROOM_LIST, async (ack: GetRoomListAck) => {
    const reversiRoomsData = await redis.hvals(REVERSI_ROOM_KEY);
    const reversiRooms = reversiRoomsData.map((roomData) => {
      const room = JSON.parse(roomData) as ReversiRoomRedis;
      const { password, ...elseValues } = room;
      return {
        ...elseValues,
        hasPassword: password !== '',
      };
    });
    ack(reversiRooms);
  });

  socket.on(SOCKET_EVENT_GET_ROOM_BY_ID, async (roomId: string, ack: GetRoomByIdAck) => {
    const foundRoomData = await redis.hget(REVERSI_ROOM_KEY, roomId);
    // stringはから文字列がfalsyだから一応厳密にnullチェック
    const foundRoomRedis = foundRoomData !== null ? (JSON.parse(foundRoomData) as ReversiRoomRedis) : null;

    let foundRoom = null;
    if (foundRoomRedis) {
      const { password, ...elseValues } = foundRoomRedis;
      foundRoom = {
        ...elseValues,
        hasPassword: password !== '',
      };
    }
    ack(foundRoom);
  });

  socket.on(SOCKET_EVENT_REENTRY_ROOM, async (savedRoom: SavedReversiRoom, toGameScene: ReentryRoomAck) => {
    // 何らかの原因で再接続することになった時
    // 部屋が存在しているかどうかを確認
    const roomData = await redis.hget(REVERSI_ROOM_KEY, savedRoom.roomId);
    if (!roomData) {
      // TODO: 部屋が存在していなかった場合のエラーハンドリング
      return;
    }

    // TODO: role を廃止して black と whiteで管理する
    const room: ReversiRoomRedis = JSON.parse(roomData);
    // 存在していたらその部屋に入室
    const reEntryPlayer: Player = {
      id: socket.id,
      name: savedRoom.name,
    };

    // TODO: 満席だった場合のエラーハンドリング
    if (room.blackPlayer && room.whitePlayer) {
      return;
    }

    socket.join(room.id);

    // 部屋情報を保存
    if (savedRoom.stoneColor === 'black') {
      room.blackPlayer = reEntryPlayer;
    } else {
      room.whitePlayer = reEntryPlayer;
    }

    await redis.hset(REVERSI_ROOM_KEY, room.id, JSON.stringify(room));

    toGameScene(reEntryPlayer);

    // すでに部屋にいる人たちに参加したことを送信
    socket.to(room.id).emit(SOCKET_EVENT_REENTRY_NOTIFICATION, reEntryPlayer);
  });

  socket.on(
    SOCKET_EVENT_JOIN_ROOM,
    async ({ roomId, joinPlayer, password }: JoinRoomData, acknowledgement: JoinRoomAck) => {
      const roomData = await redis.hget(REVERSI_ROOM_KEY, roomId);
      if (!roomData) {
        // TODO: 見つからなかった場合のエラーハンドリング
        return;
      }

      const room: ReversiRoomRedis = JSON.parse(roomData);
      // パスワードが掛けられていて、なおかつパスワードが違っていたらエラーを表示
      if (room.password !== '' && room.password !== password) {
        acknowledgement({ status: 'password_error' });
        return;
      }

      // パスワードはあっているが、他のプレイヤーが先に入室していたらエラーを表示
      if (room.blackPlayer && room.whitePlayer) {
        acknowledgement({ status: 'room_is_full' });
        return;
      }

      const stoneColor: StoneColor = room.blackPlayer ? 'white' : 'black';
      if (room.blackPlayer === null) {
        room.blackPlayer = joinPlayer;
      } else {
        room.whitePlayer = joinPlayer;
      }

      room.whitePlayer = joinPlayer;
      socket.join(roomId);
      await redis.hset(REVERSI_ROOM_KEY, room.id, JSON.stringify(room));

      // 部屋に参加したことを room の参加者に通知
      const joinedNotificationData: JoinedNotificationData = {
        joinedPlayer: joinPlayer,
      };
      socket.to(roomId).emit(SOCKET_EVENT_NOTIFY_GUEST_JOINED, joinedNotificationData);

      acknowledgement({ status: 'ok', stoneColor });
    },
  );

  socket.on(
    SOCKET_EVENT_CREATE_ROOM,
    async ({ createPlayer, stoneColor, password }: CreateRoomData, toGameScene: CreateRoomAck) => {
      // 部屋の最大数を超えていないかの確認
      const reversiRoomsData = await redis.hvals(REVERSI_ROOM_KEY);
      if (reversiRoomsData.length >= MAX_ROOM_NUMBER) {
        // TODO: 部屋の作成は不可能であることを通知 そもそもいる？
        return;
      }
      // 部屋を作成
      const uid = uuidv4();
      const newRoom: ReversiRoomRedis = {
        id: uid,
        blackPlayer: stoneColor === 'black' ? createPlayer : null,
        whitePlayer: stoneColor === 'black' ? null : createPlayer,
        password,
        createdAt: Date.now(),
        fieldInfo: INITIAL_FIELD_INFO,
      };
      await redis.hset(REVERSI_ROOM_KEY, uid, JSON.stringify(newRoom));
      socket.join(uid);

      const roomInfoForSave: SavedReversiRoom = {
        roomId: uid,
        name: createPlayer.name,
        stoneColor: stoneColor,
      };
      toGameScene(roomInfoForSave);
    },
  );

  socket.on(SOCKET_EVENT_PUT_STONE, async ({ row, col, color, roomId }: PutStoneData) => {
    //roomIdでredisからroomを取り出す
    const roomData = await redis.hget(REVERSI_ROOM_KEY, roomId);
    if (!roomData) {
      // TODO: 部屋が存在していなかった場合のエラーハンドリング
      return;
    }
    const room: ReversiRoomRedis = JSON.parse(roomData);
    //roomから盤面情報を取り出す
    const filedInfo = room.fieldInfo;

    //入力情報のエラーチェック開始
    if (!Number.isInteger(row) || !(0 <= row && row <= 7)) {
      console.log('row情報に誤りがあります');
      console.log('フィールド入力情報に誤りがあります');
      return;
    }
    if (!Number.isInteger(col) || !(0 <= col && col <= 7)) {
      console.log('フィールド入力情報に誤りがあります');
      return;
    }
    if (!(color === 'black' || color === 'white')) {
      console.log('colorの情報に誤りがあります。');
      return;
    }
    if (!(room.blackPlayer && room.whitePlayer)) {
      console.log('部屋に二人いません');
      return;
    }

    if (filedInfo.length !== 8) {
      console.log('フィールド情報の誤りがあります');
    }
    for (let row_index = 0; row_index < NUMBER_OF_COL; row_index++) {
      if (filedInfo[row_index].length !== 8) {
        console.log('フィールド情報に誤りがあります');
      }
    }

    const canPutDirs = canPutStoneOneSquare(row, col, color, filedInfo);
    if (canPutDirs.length === 0) {
      //置けなかったらエラーを返す
      return;
    }
    //置けたら盤面情報を更新
    const reversedFiledInfo = reverseStones(canPutDirs, filedInfo, row, col, color);
    room.fieldInfo = reversedFiledInfo;
    await redis.hset(REVERSI_ROOM_KEY, room.id, JSON.stringify(room));
    //部屋にいる人に盤面情報を返す
    const updateFieldData: UpdatedFieldData = { fieldInfo: reversedFiledInfo, puttedRow: row, puttedCol: col };
    io.of('/reversi').to(roomId).emit(SOCKET_EVENT_UPDATED_FIELD, updateFieldData);
  });
  socket.on(SOCKET_EVENT_INITIAL_FIELD, async ({ roomId }: InitFieldNotificationData) => {
    const roomData = await redis.hget(REVERSI_ROOM_KEY, roomId);
    if (!roomData) {
      // TODO: 部屋が存在していなかった場合のエラーハンドリング
      return;
    }
    const room: ReversiRoomRedis = JSON.parse(roomData);
    //room.fieldInfo.splice(0); ちょっと不安だから備忘録で残しておく。
    room.fieldInfo = INITIAL_FIELD_INFO;
    await redis.hset(REVERSI_ROOM_KEY, room.id, JSON.stringify(room));
  });

  socket.on(SOCKET_EVENT_POST_MESSAGE, ({ roomId, message, playerName }: PostMessageData) => {
    const data: MulticastedData = {
      playerName,
      message,
    };
    io.of('/reversi').to(roomId).emit(SOCKET_EVENT_MULTICAST_MESSAGE, data);
  });

  socket.on('disconnect', async () => {
    await leaveRoom(socket);
  });
});

http.listen(serverPort, () => {
  checkExpiration(redis);
  setInterval(checkExpiration, 1000 * 60 * 60);
});
