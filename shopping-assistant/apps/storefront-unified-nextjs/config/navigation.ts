import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';
import type { Pathnames } from 'next-intl/routing';
import type { ComponentProps } from 'react';

import { localePrefix, locales } from '@/i18n';

export const pathnames = {
  '/': '/',
  '/cart': '/cart',
  '/category': '/category',
  '/category/[[...slugs]]': '/category/[[...slugs]]',
  '/login': '/login',
  '/my-account': '/my-account',
  '/my-account/my-orders': '/my-account/my-orders',
  '/my-account/my-orders/[id]': '/my-account/my-orders/[id]',
  '/my-account/personal-data': '/my-account/personal-data',
  '/my-account/returns': '/my-account/returns',
  '/my-account/shipping-details': '/my-account/shipping-details',
  '/order/failed': '/order/failed',
  '/order/success': '/order/success',
  '/product/[slug]/[id]': '/product/[slug]/[id]',
  '/register': '/register',
  '/search': '/search',
} satisfies Pathnames<typeof locales>;

export const { Link, redirect, usePathname, useRouter } = createLocalizedPathnamesNavigation({
  localePrefix,
  locales,
  pathnames: pathnames as Record<{} & string, string> & typeof pathnames,
});

export type LinkHref = ComponentProps<typeof Link>['href'];
