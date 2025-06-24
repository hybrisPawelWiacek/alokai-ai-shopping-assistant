'use client';

import { SfButton } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import type { PropsWithChildren } from 'react';

import Address from '@/components/ui/address';
import { assertIsCartAvailable, useSetCartAddress } from '@/hooks/cart';
import { useSfCartState } from '@/sdk/alokai-context';

import CheckoutAddressList from './checkout-address-list';

export default function ShippingAddress({ children }: PropsWithChildren) {
  const t = useTranslations('CheckoutPage.ShippingAddress');
  const [cart] = useSfCartState();
  const [, setModalOpen] = useQueryState('shipping-address', parseAsBoolean);

  assertIsCartAvailable(cart);

  const setShippingAddress = useSetCartAddress();

  const savedAddress = cart.shippingAddress;

  return (
    <div className="px-4 py-6" data-testid="checkout-address">
      <div className="flex items-center justify-between">
        <h2 className="mb-4 font-semibold text-neutral-900 typography-headline-4">{t('heading')}</h2>

        {savedAddress && (
          <SfButton data-testid="edit-button" onClick={() => setModalOpen(true)} size="sm" variant="tertiary">
            {t('change')}
          </SfButton>
        )}
      </div>
      {savedAddress ? (
        <Address address={savedAddress} className="mt-2 not-italic" />
      ) : (
        <div className="w-full md:max-w-[520px]">
          <p>{t('description')}</p>
          <SfButton
            className="mt-4 w-full md:w-auto"
            data-testid="add-button"
            disabled={!cart.customerEmail}
            onClick={() => setModalOpen(true)}
            variant="secondary"
          >
            {t('add')}
          </SfButton>
        </div>
      )}
      <CheckoutAddressList
        heading={t('selectAddressModalHeading')}
        isSubmitting={setShippingAddress.isPending}
        onClose={() => setModalOpen(null)}
        onSubmit={(shippingAddress) =>
          setShippingAddress.mutate(
            { shippingAddress },
            {
              onSuccess: () => setModalOpen(null),
            },
          )
        }
        queryParamTrigger="shipping-address"
        savedAddress={savedAddress}
      />
      {children}
    </div>
  );
}
