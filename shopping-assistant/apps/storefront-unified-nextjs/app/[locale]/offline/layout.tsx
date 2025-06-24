import type { PropsWithChildren } from 'react';

import Footer from '@/components/navigations/footer';
import NavbarTop from '@/components/navigations/navbar-top';

export default async function OfflineLayout({ children }: PropsWithChildren) {
  return (
    <>
      <NavbarTop filled />
      <main>{children}</main>
      <Footer className="mb-[58px] md:mb-0" />
    </>
  );
}
