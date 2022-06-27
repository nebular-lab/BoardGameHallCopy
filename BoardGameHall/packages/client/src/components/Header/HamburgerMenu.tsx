import Link from 'next/link';
import { slide as Menu } from 'react-burger-menu';
import { GAME_LIST } from '../../const';
import { useState } from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../tailwind.config';

const resolvedTailwindConfig = resolveConfig(tailwindConfig);

// @ts-ignore
const blandColor = resolvedTailwindConfig.theme.colors['bland'];

const styles = {
  bmBurgerButton: {
    position: 'absolute',
    width: '36px',
    height: '30px',
    top: '0',
    bottom: '0',
    right: '8px',
    margin: 'auto',
  },
  bmBurgerBars: {
    background: blandColor,
  },
  bmBurgerBarsHover: {
    background: '#a90000',
  },
  bmCrossButton: {
    height: '24px',
    width: '24px',
  },
  bmCross: {
    background: '#bdc3c7',
  },
  bmMenuWrap: {
    position: 'fixed',
    height: '100%',
  },
  bmMenu: {
    background: blandColor,
    padding: '2.5em 0 0',
    fontSize: '1.15em',
  },
  bmMorphShape: {
    fill: '#373a47',
  },
  bmItemList: {
    color: '#bdc3c7',
    padding: '0.8em 0',
  },
  bmItem: {
    display: 'block',
  },
  bmOverlay: {
    background: 'rgba(0, 0, 0, 0.3)',
    left: '0',
  },
};

const HamburgerButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button type="button" className="block space-y-2" onClick={onClick}>
      <div className="w-8 h-1 bg-bland"></div>
      <div className="w-8 h-1 bg-bland"></div>
      <div className="w-8 h-1 bg-bland"></div>
    </button>
  );
};

export const HamburgerMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleClose = () => setIsMenuOpen(false);
  const gameList = GAME_LIST.map((game) => (
    <Link key={game.title} href={game.path}>
      <a className="block pb-2 text-center hover:text-white" onClick={handleClose}>
        {game.title}
      </a>
    </Link>
  ));
  return (
    <div id="menu-container" className="flex">
      <HamburgerButton onClick={() => setIsMenuOpen(true)} />
      <Menu
        styles={styles}
        isOpen={isMenuOpen}
        onClose={handleClose}
        pageWrapId="menu-page-wrap"
        outerContainerId="menu-container"
        customBurgerIcon={false}
        right
      >
        <Link href="/">
          <a className="block pb-2 text-center hover:text-white" onClick={handleClose}>
            ホーム
          </a>
        </Link>
        {gameList}
        <a
          className="block text-center hover:text-white"
          onClick={handleClose}
          href="https://docs.google.com/forms/d/e/1FAIpQLSetxpL_Sx_YzGsbmP5yPS29UW8xj3Mv0niT3Fy7dxiY0lwzmw/viewform?usp=sf_link"
          target="_blank"
          rel="noreferrer noopener"
        >
          お問い合わせ
        </a>
      </Menu>
    </div>
  );
};
