'use client';

import { SfIconBlock, SfListItem, SfRadio } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import { useFormatter } from '@/hooks';
import { assertIsCartAvailable, useCartShippingMethods } from '@/hooks/cart';
import { useSfCartState } from '@/sdk/alokai-context';
import type { SfShippingMethod } from '@/types';

export default function ShippingMethod({ children }: PropsWithChildren) {
  const t = useTranslations('CheckoutPage.ShippingMethod');
  const [cart] = useSfCartState();
  const { setShippingMethod, shippingMethods } = useCartShippingMethods();
  const { formatPrice } = useFormatter();

  assertIsCartAvailable(cart);

  const filteredShippingMethods = shippingMethods.data?.methods.filter(({ id }: SfShippingMethod) => id !== 'collect');

  return (
    <div className="px-4 py-6" data-testid="shipping-method">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900 typography-headline-4">{t('heading')}</h2>
      </div>
      <div className="mt-4">
        {filteredShippingMethods ? (
          <ul className="grid gap-y-4 md:grid-cols-2 md:gap-x-4" role="radiogroup">
            {filteredShippingMethods.map((method) => (
              <SfListItem
                as="label"
                className="items-start rounded-md border"
                data-testid="shippingMethod"
                key={method.id}
              >
                <div className="flex gap-2">
                  <SfRadio
                    checked={cart.shippingMethod?.id === method.id}
                    disabled={setShippingMethod.isPending}
                    name={method.name}
                    onChange={(event) => setShippingMethod.mutate({ shippingMethodId: event.target.value })}
                    value={method.id}
                  />
                  <div>
                    <p>{method.name}</p>
                    {method.estimatedDelivery && <p className="text-xs text-neutral-500">{method.estimatedDelivery}</p>}
                  </div>
                  <p className="ml-auto">{formatPrice(method.price)}</p>
                </div>
              </SfListItem>
            ))}
          </ul>
        ) : (
          <div className="mb-6 flex">
            <SfIconBlock className="mr-2 text-neutral-500" />
            <p>{t('description')}</p>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
