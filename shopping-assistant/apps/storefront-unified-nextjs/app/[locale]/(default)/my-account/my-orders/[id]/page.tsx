import { pick } from 'lodash-es';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import OrderDetailsPageClient from './page.client';

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params: { id } }: OrderDetailsPageProps) {
  return {
    title: id,
  };
}

export default function OrderDetailsPage({ params: { id } }: OrderDetailsPageProps) {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={pick(messages, 'OrderDetailsPage')}>
      <OrderDetailsPageClient id={id} />
    </NextIntlClientProvider>
  );
}
