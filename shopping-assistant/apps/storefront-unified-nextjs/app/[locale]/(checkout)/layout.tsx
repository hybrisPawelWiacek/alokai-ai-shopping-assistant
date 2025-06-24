import type { PropsWithChildren } from 'react';

import Footer from '@/components/navigations/footer';
import NavbarTop from '@/components/navigations/navbar-top';

interface OrderLayoutProps extends PropsWithChildren {}

export default async function OrderLayout({ children }: OrderLayoutProps) {
  return (
    <>
      <NavbarTop />
      <main>
        <div className="mx-auto max-w-screen-3-extra-large md:px-6 lg:px-10">{children}</div>
      </main>
      <Footer className="mb-[58px] md:mb-0" />
    </>
  );
}
