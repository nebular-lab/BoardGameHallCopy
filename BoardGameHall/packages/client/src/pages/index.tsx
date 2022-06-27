import type { NextPage } from 'next';
import { GameCard } from '../components/GameCard';
import { GAME_LIST } from '../const';

const Home: NextPage = () => {
  const gameCards = GAME_LIST.map((game) => (
    <div className="w-1/2 md:w-1/4" key={game.title}>
      <GameCard title={game.title} path={game.path} thumbnail={game.thumbnail} />
    </div>
  ));
  return (
    <div>
      <h1 className="pb-2 pl-2 text-2xl font-bold border-b border-black">ゲーム一覧</h1>
      <div className="flex flex-row px-2 mt-4 space-2">{gameCards}</div>
    </div>
  );
};

export default Home;
