import type { PropsWithChildren } from 'react';

import Footer from '@/components/navigations/footer';
import NavbarTop from '@/components/navigations/navbar-top';

interface AuthLayoutProps extends PropsWithChildren {}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <NavbarTop />
      <main>
        <div className="mx-auto max-w-[630px] px-4 pb-10 pt-4 md:px-0 md:pb-14 md:pt-9">{children}</div>
      </main>
      <Footer className="mb-[58px] md:mb-0" />
    </>
  );
}
