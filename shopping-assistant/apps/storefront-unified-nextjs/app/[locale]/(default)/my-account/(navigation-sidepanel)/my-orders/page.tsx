import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import MyOrdersPageClient from './page.client';

export async function generateMetadata() {
  const t = await getTranslations('MyOrdersPage');

  return {
    title: t('metaTitle'),
  };
}

export default function MyOrdersPage() {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, 'MyOrdersPage')}>
      <MyOrdersPageClient />
    </NextIntlClientProvider>
  );
}
