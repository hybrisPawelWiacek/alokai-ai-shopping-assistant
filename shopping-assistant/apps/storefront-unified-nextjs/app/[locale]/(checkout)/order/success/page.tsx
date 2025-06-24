import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import OrderSuccessClientPage from './page.client';

export default function OrderSuccessPage() {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, ['OrderPage.Success'])}>
      <OrderSuccessClientPage />
    </NextIntlClientProvider>
  );
}
