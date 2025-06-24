import { CheckoutClient } from '@sf-modules/checkout-b2b';
import { pick } from 'lodash-es';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('CheckoutPage');

  return {
    title: t('heading'),
  };
}

export default async function CheckoutPage() {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={pick(messages, [
        'CheckoutPage',
        'AddressModal',
        'OrderSummary',
        'AddressModal',
        'AddressFormFields',
        'CheckoutB2B',
      ])}
    >
      <CheckoutClient />
    </NextIntlClientProvider>
  );
}