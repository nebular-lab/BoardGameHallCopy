import { Socket } from 'socket.io-client';
import { CPULevel, Player, SavedReversiRoom, StoneColor } from '@board-game-hall/shared';

export type GameSceneData = {
  multiPlayData?: {
    socket: Socket;
    player: Player;
    roomInfoForSave: SavedReversiRoom;
    password?: string;
  };
  singlePlayData?: {
    stoneColor: StoneColor;
    selectedLevel: CPULevel;
  };
};

export type MatchingSceneData = {
  playerName: string;
};

export type InputNameSceneData = {
  invitationParams?: {
    roomId: string;
    token: string;
  };
};
