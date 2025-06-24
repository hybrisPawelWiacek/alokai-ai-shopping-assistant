'use client';

import { SfListItem, SfRadio } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import { useSfCartState } from '@/sdk/alokai-context';

import { usePaymentTypes } from '../hooks';

export default function PaymentTypes({ children }: PropsWithChildren) {
  const t = useTranslations('CheckoutPage.CheckoutPayment');
  const [cart] = useSfCartState();
  const { paymentTypes, setPaymentType } = usePaymentTypes();

  return (
    <div className="my-6 md:px-4" data-testid="payment-types">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-neutral-900 typography-headline-4">{t('heading')}</h2>
      </div>
      <div className="mt-4">
        {paymentTypes.data?.paymentTypes && paymentTypes.data.paymentTypes.length > 0 && (
          <ul className="grid gap-y-4 md:grid-cols-2 md:gap-x-4" role="radiogroup">
            {paymentTypes.data.paymentTypes.map(({ code, displayName }) => (
              <SfListItem
                as="label"
                className="items-start rounded-md border"
                data-testid="payment-type-list-item"
                key={code}
              >
                <div className="flex gap-2">
                  <SfRadio
                    checked={cart?.$custom?.paymentType?.code === code}
                    disabled={paymentTypes.isPending || setPaymentType.isPending}
                    name={displayName}
                    onChange={() => setPaymentType.mutate({ paymentType: code ?? '' })}
                    value={code}
                  />
                  <div>
                    <p>{displayName}</p>
                  </div>
                </div>
              </SfListItem>
            ))}
          </ul>
        )}
      </div>
      {children}
    </div>
  );
}
