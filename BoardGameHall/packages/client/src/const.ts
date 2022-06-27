import ReversiThumbnail from '../public/reversi/reversi_thumbnail.jpeg';

// 本来はnextで定義されている型だがなぜか import できないので自前で定義する
export type StaticImageData = {
  src: string;
  height: number;
  width: number;
  placeholder?: string;
};

export type BoardGame = {
  title: string;
  path: string;
  thumbnail: StaticImageData;
};

export const GAME_LIST: BoardGame[] = [
  {
    title: 'リバーシ',
    path: '/reversi',
    thumbnail: ReversiThumbnail,
  },
];
