'use client';

import type { SfListItemProps } from '@storefront-ui/react';
import { SfListItem } from '@storefront-ui/react';
import classNames from 'classnames';
import type { MouseEventHandler, PropsWithChildren } from 'react';

import type { LinkHref } from '@/config/navigation';
import { Link, usePathname } from '@/config/navigation';
import { useLogoutCustomer } from '@/hooks';

/**
 * Component which hides the sidepanel on mobile when not on the my-account page.
 */
export default function NavigationSidepanelContainer({ children, ...rest }: PropsWithChildren) {
  const pathname = usePathname();

  return pathname === '/my-account' ? (
    children
  ) : (
    <div className="max-lg:hidden" {...rest}>
      {children}
    </div>
  );
}

export interface NavigationSidepanelLinkProps extends SfListItemProps {
  /**
   * The URL to navigate to.
   */
  href: LinkHref;
  /**
   * onClick handler.
   */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function NavigationSidepanelLink({ children, href, ...rest }: NavigationSidepanelLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SfListItem
      aria-current={isActive ? 'page' : undefined}
      as={Link}
      className={classNames('max-lg:py-4', isActive && 'bg-primary-100 font-medium')}
      href={href}
      selected={isActive}
      slotPrefix={<IconPlaceholder />}
      {...rest}
    >
      {children}
    </SfListItem>
  );
}

export interface NavigationSidepanelGroupProps extends SfListItemProps {}

export function NavigationSidepanelGroup({ children, ...rest }: NavigationSidepanelGroupProps) {
  return (
    <SfListItem as="div" className="!cursor-default !bg-transparent font-medium max-lg:py-4" {...rest}>
      {children}
    </SfListItem>
  );
}

export interface NavigationSidepanelLogoutItemProps extends SfListItemProps {}

export function NavigationSidepanelLogoutItem({ children, ...rest }: NavigationSidepanelLogoutItemProps) {
  const { isPending, mutate } = useLogoutCustomer();

  return (
    <NavigationSidepanelLink
      data-testid="navigation-item-logout"
      disabled={isPending}
      href={`/logout`}
      onClick={(e) => {
        e.preventDefault();
        mutate();
      }}
      {...rest}
    >
      {children}
    </NavigationSidepanelLink>
  );
}

function IconPlaceholder() {
  return <div className="h-6 w-6"></div>;
}
