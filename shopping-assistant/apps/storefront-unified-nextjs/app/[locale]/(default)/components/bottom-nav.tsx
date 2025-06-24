import { SfIconHome, SfIconMenu, SfIconPerson } from '@storefront-ui/react';
import type { NestedKeyOf } from 'next-intl';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { LinkHref } from '@/config/navigation';

import BottomNavButton from './bottom-nav-button';
import NavCartButton from './nav-cart-button';

export interface ButtonItem {
  /**
   * The route to navigate to.
   */
  href: LinkHref;
  /**
   * The icon to display.
   */
  icon?: ReactNode;
  /**
   * The label to display.
   */
  label: NestedKeyOf<IntlMessages['BottomNav']>;
}

const buttonItems: ButtonItem[] = [
  {
    href: '/',
    icon: <SfIconHome />,
    label: 'home',
  },
  {
    href: '/category',
    icon: <SfIconMenu />,
    label: 'products',
  },
  {
    href: '/cart',
    label: 'cart',
  },
  {
    href: '/my-account',
    icon: <SfIconPerson />,
    label: 'account',
  },
];

export default function BottomNav() {
  const t = useTranslations('BottomNav');

  return (
    <nav className="fixed bottom-0 left-0 flex w-full flex-row items-stretch md:hidden" data-testid="navbar-bottom">
      {buttonItems.map(({ href, icon, label }) =>
        href === '/cart' ? (
          <NavCartButton className="flex h-full w-full flex-col !gap-0.5 rounded-none !py-0 !pb-1 !pt-3" key={label}>
            {t(label)}
          </NavCartButton>
        ) : (
          <BottomNavButton href={href} icon={icon} key={label}>
            {t(label)}
          </BottomNavButton>
        ),
      )}
    </nav>
  );
}
