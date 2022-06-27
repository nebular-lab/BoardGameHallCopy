import Image from 'next/image';
import Link from 'next/link';
import { BoardGame } from '../const';

export const GameCard = ({ title, path, thumbnail }: BoardGame) => {
  return (
    <div className="overflow-hidden bg-gray-300 rounded-lg shadow-md">
      <Link href={path}>
        <a className="block bg-white border-gray-200 hover:opacity-75 transition-opacity duration-200">
          <Image src={thumbnail} width={200} height={200} layout="responsive" />
          <div className="p-2">
            <h2 className="text-lg">{title}</h2>
          </div>
        </a>
      </Link>
    </div>
  );
};
