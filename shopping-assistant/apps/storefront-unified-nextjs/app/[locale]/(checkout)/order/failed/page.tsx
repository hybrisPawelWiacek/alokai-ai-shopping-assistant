import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import OrderFailedClientPage from './page.client';

export default function OrderFailedPage() {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, ['OrderPage.Failed'])}>
      <OrderFailedClientPage />
    </NextIntlClientProvider>
  );
}
