import './globals.scss';
import classNames from 'classnames';
import { pick } from 'lodash-es';
import type { Metadata, Viewport } from 'next';
// eslint-disable-next-line no-restricted-imports
import { redirect as redirect_next, RedirectType } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PublicEnvProvider } from 'next-runtime-env';
import { type PropsWithChildren } from 'react';

import Providers from '@/components/providers';
import { fontBody, fontHeadings } from '@/config/fonts';
import { locales } from '@/i18n';
import { getSdk } from '@/sdk';
import { getSdkOptions } from '@/sdk/options';

export const metadata: Metadata = {
  description: 'Alokai - the best storefront for composable commerce.',
  openGraph: {
    description: 'Alokai - the best storefront for composable commerce.',
    siteName: 'Alokai Storefront',
    title: 'Alokai Storefront',
    type: 'website',
  },
  title: {
    default: 'Alokai Storefront',
    template: '%s | Alokai Storefront',
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Alokai - the best storefront for composable commerce.',
    site: '@useAlokai',
    title: 'Alokai Storefront',
  },
};
export const viewport: Viewport = {
  themeColor: '#018937',
};

interface RootLayoutProps extends PropsWithChildren {
  params: {
    locale: string;
  };
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  /*
   * This is a special case when using the `next-intl` `localePrefix="as-needed"` option, where app should be redirected back to a valid locale
   * page from a path where locale is not resolved correctly, e.g. static files that does not exist in the app.
   *
   * Related Issue: https://github.com/vercel/next.js/discussions/36308
   * This redirect has to be done before i18n locale is used by client providers, otherwise the app will crash due to invalid locale.
   * Check out other `localePrefix` options in the `next-intl` documentation: https://next-intl-docs.vercel.app/docs/routing#locale-prefix
   */
  if (!locales.includes(locale)) {
    redirect_next('/404', RedirectType.replace);
  }
  const sdk = getSdk();
  const currencies = await sdk.unified.getCurrencies();
  const sdkConfig = getSdkOptions();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link href="res.cloudinary.com" rel="preconnect" />
      </head>
      <body className={classNames(fontHeadings.variable, fontBody.variable, 'font-body')}>
        <NextIntlClientProvider messages={pick(messages, 'Notifications.NotificationAlert')}>
          <PublicEnvProvider>
            <Providers initialCurrency={currencies} sdkOptions={sdkConfig}>
              {children}
            </Providers>
          </PublicEnvProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
