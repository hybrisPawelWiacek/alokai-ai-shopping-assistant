import { SfButton, SfIconChevronRight } from '@storefront-ui/react';
import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Link } from '@/config/navigation';

import CartPageClient from './page.client';

export async function generateMetadata() {
  const t = await getTranslations('CartPage');

  return {
    title: t('metaTitle'),
  };
}

export default function CartPage() {
  const messages = useMessages();
  const t = useTranslations('CartPage');

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          {
            id: 'home',
            link: '/',
            name: t('homeBreadcrumb'),
          },
          {
            id: 'my-account',
            link: '#',
            name: t('heading'),
          },
        ]}
        className="p-4 md:px-0"
      />
      <div className="mb-10 mt-4 flex justify-between md:mt-8" data-testid="cart-header">
        <h1 className="pe-1 ps-4 font-semibold typography-headline-2 md:ps-0 md:typography-headline-1">
          {t('heading')}
        </h1>
        <SfButton
          as={Link}
          className="md:hidden"
          data-testid="back-button-mobile"
          href="/category"
          size="sm"
          slotSuffix={<SfIconChevronRight />}
          variant="tertiary"
        >
          {t('backButton')}
        </SfButton>
        <SfButton
          as={Link}
          className="hidden md:block"
          href="/category"
          size="base"
          slotSuffix={<SfIconChevronRight />}
          variant="tertiary"
        >
          {t('backButton')}
        </SfButton>
      </div>
      <NextIntlClientProvider
        messages={pick(messages, ['CartPage', 'OrderSummary', 'CartProductCard', 'QuantitySelector'])}
      >
        <CartPageClient />
      </NextIntlClientProvider>
    </>
  );
}
