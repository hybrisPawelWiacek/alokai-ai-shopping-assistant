import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import PersonalDataPageClient from './page.client';

export async function generateMetadata() {
  const t = await getTranslations('PersonalDataPage');

  return {
    title: t('metaTitle'),
  };
}

export default function PersonalDataPage() {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, 'PersonalDataPage')}>
      <PersonalDataPageClient />
    </NextIntlClientProvider>
  );
}
