import { Header } from './Header';
import { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Header />
      <div id="menu-page-wrap" className="container px-2 mx-auto mt-8">
        {children}
      </div>
    </>
  );
};
