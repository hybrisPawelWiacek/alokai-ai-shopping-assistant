'use client';

import { SfButton } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import Address from '@/components/ui/address';
import { compareAddresses } from '@/helpers/find-address';
import { assertIsCartAvailable } from '@/hooks';
import { useSfCartState } from '@/sdk/alokai-context';
import type { SfAddress, SfCreateAddressBody, SfCustomerAddress } from '@/types';

import CheckoutAddressList from './checkout-address-list';

export interface BillingAddressProps {
  /**
   * Callback when new address details are given
   */
  onSave: (address: SfCreateAddressBody | SfCustomerAddress) => void;
  /**
   * Address comming from outside
   */
  savedAddress?: SfAddress | SfCreateAddressBody;
}

export default function BillingAddress({ onSave, savedAddress }: BillingAddressProps) {
  const t = useTranslations('CheckoutPage.BillingAddress');
  const [cart] = useSfCartState();

  assertIsCartAvailable(cart);

  const savedAddressInternal = savedAddress || cart.billingAddress;

  const [, setModalOpen] = useQueryState('billing-address', parseAsBoolean);
  const [isSameAddress, setIsSameAddress] = useState(true);

  useEffect(() => {
    if (cart?.shippingAddress && savedAddressInternal) {
      setIsSameAddress(compareAddresses(cart.shippingAddress, savedAddressInternal));
    }
  }, [cart, savedAddressInternal]);

  return (
    <div className="mb-4" data-testid="billing-address">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 typography-headline-5">{t('heading')}</h3>
        <SfButton data-testid="edit-button" onClick={() => setModalOpen(true)} size="sm" variant="tertiary">
          {t('change')}
        </SfButton>
      </div>
      {isSameAddress && (
        <p className="text-neutral-900" data-testid="billing-address-same-address">
          {t('sameAddress')}
        </p>
      )}
      {savedAddressInternal && !isSameAddress && (
        <Address address={savedAddressInternal} className="mt-2 not-italic md:w-[520px]" />
      )}
      <CheckoutAddressList
        heading={t('selectAddressModalHeading')}
        onClose={() => setModalOpen(null)}
        onSubmit={(address) => {
          onSave(address);
          setModalOpen(null);
          setIsSameAddress(compareAddresses(savedAddressInternal, address));
        }}
        queryParamTrigger="billing-address"
        savedAddress={savedAddressInternal}
      />
    </div>
  );
}
