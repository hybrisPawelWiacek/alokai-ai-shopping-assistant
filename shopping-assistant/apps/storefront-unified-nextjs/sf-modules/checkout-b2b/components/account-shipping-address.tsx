'use client';

import { SfButton, SfLoaderCircular } from '@storefront-ui/react';
import { useIsFetching } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { type PropsWithChildren, useEffect, useState } from 'react';

import AddressListModal, { AddressList } from '@/components/checkout/address-list-modal';
import Address from '@/components/ui/address';
import { compareAddresses, findAddress } from '@/helpers/find-address';
import { useIsCartMutating } from '@/hooks';
import { assertIsCartAvailable, useSetCartAddress } from '@/hooks/cart';
import { useSfCartState } from '@/sdk/alokai-context';
import type { SfCustomerAddress } from '@/types';

import { useCostCenterAddresses } from '../hooks';
import CostCenterSelect from './cost-center-select';

export default function AccountShippingAddress({ children }: PropsWithChildren) {
  const t = useTranslations('CheckoutPage.ShippingAddress');
  const checkoutB2BTranslate = useTranslations('CheckoutB2B');
  const [cart] = useSfCartState();
  const { costCenterAddresses } = useCostCenterAddresses();

  assertIsCartAvailable(cart);

  const setShippingAddress = useSetCartAddress();
  const [selectedAddress, setSelectedAddress] = useState<SfCustomerAddress | null>();
  const isCostCentersLoading = useIsFetching({ queryKey: ['costCenters'] });
  const isCostCenterUpdating = useIsCartMutating({ mutationKey: ['main', 'setCostCenter'] });
  const isAddressListLoading = useIsFetching({ queryKey: ['costCentersAddresses'] });
  const isPending = !!(isCostCentersLoading || isCostCenterUpdating || isAddressListLoading);
  const addresses = costCenterAddresses.data || [];
  const isCurrentAddress = selectedAddress && compareAddresses(cart.shippingAddress ?? undefined, selectedAddress);
  const [isOpen, setModalOpen] = useQueryState('shipping-address', parseAsBoolean);

  useEffect(() => {
    if (isOpen && !costCenterAddresses.data) {
      costCenterAddresses.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && cart.$custom?.costCenter?.code) {
      costCenterAddresses.refetch();
      setSelectedAddress(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.$custom?.costCenter?.code]);

  useEffect(() => {
    if (!selectedAddress && cart.shippingAddress && costCenterAddresses.data) {
      setSelectedAddress(findAddress(costCenterAddresses.data, cart.shippingAddress));
    }
  }, [cart.shippingAddress, costCenterAddresses.data, selectedAddress]);

  return (
    <div className="px-4 py-6" data-testid="checkout-address">
      <div className="flex items-center justify-between">
        <h2 className="mb-4 font-semibold text-neutral-900 typography-headline-4">{t('heading')}</h2>

        {cart.shippingAddress && (
          <SfButton data-testid="edit-button" onClick={() => setModalOpen(true)} size="sm" variant="tertiary">
            {t('change')}
          </SfButton>
        )}
      </div>
      {cart.shippingAddress ? (
        <>
          {cart?.$custom?.costCenter && (
            <div className="mb-5 text-neutral-900" data-testid="current-cost-center">
              <span className="block font-medium">{checkoutB2BTranslate('costCenter')}</span>
              <span className="block">{cart?.$custom?.costCenter.name}</span>
            </div>
          )}
          {cart?.shippingAddress && (
            <div data-testid="current-shipping-address">
              <span className="font-medium text-neutral-900">{t('heading')}</span>
              <Address address={cart.shippingAddress} className="mt-2 not-italic" />
            </div>
          )}
        </>
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
      <AddressListModal
        heading={t('selectAddressModalHeading')}
        isSubmitting={setShippingAddress.isPending}
        onClose={close}
        onSubmit={() =>
          !isCurrentAddress &&
          selectedAddress &&
          setShippingAddress.mutate(
            { shippingAddress: selectedAddress },
            {
              onSuccess: () => setModalOpen(null),
            },
          )
        }
        queryParamTrigger="shipping-address"
        submitDisabled={isCurrentAddress || setShippingAddress.isPending || !selectedAddress}
      >
        <div className="flex overflow-y-auto overscroll-contain md:mt-2 md:max-h-96 md:min-h-[250px]">
          <div className="flex w-screen min-w-0 max-w-[750px] flex-col">
            <span className="mb-6">{checkoutB2BTranslate('header')}</span>
            <CostCenterSelect data-testid="cost-center-component" />
            {isPending && (
              <span className="m-auto flex h-24 justify-center overflow-hidden">
                <SfLoaderCircular size="3xl" />
              </span>
            )}
            {!isPending && addresses.length > 0 && (
              <>
                <span className="text-sm font-medium text-neutral-900">{checkoutB2BTranslate('addresses')}</span>
                <AddressList
                  addresses={addresses}
                  className="w-full"
                  onSelect={setSelectedAddress}
                  selected={selectedAddress?.id}
                />
              </>
            )}
          </div>
        </div>
      </AddressListModal>
      {children}
    </div>
  );
}
