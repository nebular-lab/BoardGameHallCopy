import Link from 'next/link';
import Image from 'next/image';
import LogoImage from '../../public/rook_bland.svg';
import { HamburgerMenu } from './Header/HamburgerMenu';

export const Header = () => {
  return (
    <header className="bg-white border-b h-header">
      <div className="container flex relative justify-between px-2 mx-auto">
        <Link href="/">
          <a className="flex p-2 text-2xl font-bold text-bland">
            <Image src={LogoImage} width={25} height={31} layout="fixed" quality={100} />
            <div>ボードゲームの館</div>
            <Image src={LogoImage} width={25} height={31} layout="fixed" quality={100} />
          </a>
        </Link>
        <HamburgerMenu />
      </div>
    </header>
  );
};
