'use client';
import { type PropsWithStyle, SfBadge, SfButton, type SfButtonProps, SfIconShoppingCart } from '@storefront-ui/react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { Link } from '@/config/navigation';
import { useSfCartState } from '@/sdk/alokai-context';

export type NavCartButtonProps = PropsWithChildren & PropsWithStyle & SfButtonProps;

export default function NavCartButton({ children, className, ...rest }: NavCartButtonProps) {
  const pathname = usePathname();
  const [cart] = useSfCartState();
  const cartTotalItems = cart?.totalItems || 0;

  return (
    <SfButton
      as={Link}
      className={classNames(
        className,
        'bg-primary-700 text-xs leading-4 text-white hover:bg-primary-800 hover:text-white active:bg-primary-900 active:text-white',
        { 'max-md:bg-primary-900 max-md:text-white': pathname === '/cart' },
      )}
      href="/cart"
      size="sm"
      slotPrefix={
        <div className="relative">
          <SfIconShoppingCart />
          {!!cartTotalItems && (
            <SfBadge
              className="absolute translate-x-[25%] translate-y-[-25%] bg-white !text-neutral-900 outline outline-primary-700 group-hover:outline-primary-800 group-active:outline-primary-900"
              content={cartTotalItems}
              data-testid="cart-badge"
            />
          )}
        </div>
      }
      variant="tertiary"
      {...rest}
    >
      {children}
    </SfButton>
  );
}
