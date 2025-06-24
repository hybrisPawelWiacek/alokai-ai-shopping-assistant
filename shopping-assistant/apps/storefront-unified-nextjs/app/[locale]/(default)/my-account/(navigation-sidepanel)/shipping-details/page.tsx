import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import ShippingDetailsPageClient from './page.client';

export async function generateMetadata() {
  const t = await getTranslations('ShippingDetailsPage');

  return {
    title: t('metaTitle'),
  };
}

export default function ShippingDetailsPage() {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, 'ShippingDetailsPage', 'AddressFormFields')}>
      <ShippingDetailsPageClient />
    </NextIntlClientProvider>
  );
}
