import { useEffect } from 'react';
import { Reversi } from './main';

export const ReversiGameScreen = () => {
  useEffect(() => {
    const reversi = new Reversi();

    return () => {
      reversi.destroy(true, false);
    };
  }, []);
  return <div id="reversi" />;
};
