import { EXPIRE_HOURS, REVERSI_ROOM_KEY } from './const';
import { ReversiRoomRedis } from '@board-game-hall/shared';
import Redis from 'ioredis';

export const checkExpiration = async (redis: Redis) => {
  const reversiRoomsData = await redis.hvals(REVERSI_ROOM_KEY);
  const reversiRooms = reversiRoomsData.map((room) => {
    return JSON.parse(room) as ReversiRoomRedis;
  });

  const now = Date.now();

  const roomIdsToBeRemoved = reversiRooms
    .filter((room) => {
      const elapsedTime_ms = now - room.createdAt;
      return elapsedTime_ms / 1000 /* s */ / 60 /* m */ / 60 /* h */ > EXPIRE_HOURS;
    })
    .map((room) => room.id);
  if (roomIdsToBeRemoved.length > 0) {
    await redis.hdel(REVERSI_ROOM_KEY, ...roomIdsToBeRemoved);
  }
};
