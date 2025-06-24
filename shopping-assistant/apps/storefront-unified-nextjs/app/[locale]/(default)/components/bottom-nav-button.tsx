'use client';
import type { SfButtonProps } from '@storefront-ui/react';
import { SfButton } from '@storefront-ui/react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren, ReactNode } from 'react';

import type { LinkHref } from '@/config/navigation';
import { Link } from '@/config/navigation';

export interface BottomNavButtonProps extends PropsWithChildren, SfButtonProps {
  /**
   * The route to navigate to.
   */
  href: LinkHref;
  /**
   * The icon to display.
   */
  icon: ReactNode;
}

export default function BottomNavButton({ children, href, icon, ...rest }: BottomNavButtonProps) {
  const pathname = usePathname();
  const hrefPathname = typeof href === 'string' ? href : href.pathname;
  const isActive = href === '/' ? pathname === href : pathname.startsWith(hrefPathname);

  return (
    <SfButton
      as={Link}
      className={classNames(
        'flex h-full w-full flex-col !gap-0.5 rounded-none bg-primary-700 !py-0 !pb-1 !pt-3 text-xs leading-4 text-white hover:bg-primary-800 hover:text-white active:bg-primary-900 active:text-white',
        { 'bg-primary-900 text-white': isActive },
      )}
      href={href}
      size="sm"
      slotPrefix={icon}
      variant="tertiary"
      {...rest}
    >
      {children}
    </SfButton>
  );
}
