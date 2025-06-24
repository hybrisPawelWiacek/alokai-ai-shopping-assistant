'use client';

import { SfButton, SfLoaderCircular } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

import AddressModal from '@/components/address-modal';
import { compareAddresses, findAddress } from '@/helpers/find-address';
import { useCustomer, useCustomerAddresses } from '@/hooks';
import { useSfCustomerState } from '@/sdk/alokai-context';
import type { Maybe, SfAddress, SfCreateAddressBody, SfCustomerAddress } from '@/types';

import AddressListModal, { AddressList } from './address-list-modal';

interface CheckoutAddressListProps {
  heading: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (address: SfCreateAddressBody | SfCustomerAddress) => void;
  queryParamTrigger: string;
  savedAddress?: Maybe<SfAddress>;
}

export default function CheckoutAddressList({
  heading,
  isSubmitting,
  onClose,
  onSubmit,
  queryParamTrigger,
  savedAddress,
}: CheckoutAddressListProps) {
  const [customer] = useSfCustomerState();
  const { isPending } = useCustomer();

  if (isPending) {
    return null;
  }

  return (
    <>
      {customer ? (
        <CheckoutAddressListAuth
          heading={heading}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
          queryParamTrigger={queryParamTrigger}
          savedAddress={savedAddress}
        />
      ) : (
        <AddressModal
          address={savedAddress}
          heading={heading}
          isLoading={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
          queryParamTrigger={queryParamTrigger}
        />
      )}
    </>
  );
}

function CheckoutAddressListAuth({
  heading,
  isSubmitting,
  onClose,
  onSubmit,
  queryParamTrigger,
  savedAddress,
}: CheckoutAddressListProps) {
  const t = useTranslations('CheckoutPage.CheckoutAddressList');
  const { create, list } = useCustomerAddresses();
  const [customer] = useSfCustomerState();
  const addresses = useMemo(() => list.data || [], [list.data]);
  const [selectedAddress, setSelectedAddress] = useState<null | SfCustomerAddress>();
  const [, setAddAddress] = useQueryState(`${queryParamTrigger}-add`, parseAsBoolean);

  useEffect(() => {
    if (!selectedAddress) {
      setSelectedAddress(findAddress(addresses, savedAddress));
    }
  }, [addresses, selectedAddress, savedAddress]);

  useEffect(() => {
    if (customer && !list.data) {
      list.refetch();
    }
  }, [customer, list]);

  const isCurrentAddress = selectedAddress && compareAddresses(savedAddress, selectedAddress);

  return (
    <>
      <AddressListModal
        heading={heading}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={() => !isCurrentAddress && selectedAddress && onSubmit(selectedAddress)}
        queryParamTrigger={queryParamTrigger}
        submitDisabled={isSubmitting || isCurrentAddress || !selectedAddress}
      >
        <div className="flex overflow-y-auto overscroll-contain md:mt-2 md:max-h-96">
          <div className="flex w-screen min-w-0 max-w-[750px] flex-col">
            {list.isLoading && (
              <span className="m-auto flex h-24 justify-center overflow-hidden">
                <SfLoaderCircular size="3xl" />
              </span>
            )}
            {!list.isLoading && addresses.length > 0 && (
              <AddressList
                addresses={addresses}
                className="w-full"
                onSelect={setSelectedAddress}
                selected={selectedAddress?.id}
              />
            )}
            {!list.isLoading && !addresses.length && <h4>{t('emptyAddressList')}</h4>}
          </div>
        </div>
        <SfButton
          className="mt-4 self-start"
          data-testid="add-new-address"
          onClick={() => setAddAddress(true)}
          variant="tertiary"
        >
          {t('addNewAddress')}
        </SfButton>
      </AddressListModal>
      <AddressModal
        heading={t('newAddressModalHeading')}
        isLoading={create.isPending}
        onClose={() => setAddAddress(null)}
        onSubmit={(address) =>
          create.mutate(
            { address },
            {
              onSuccess(data) {
                setSelectedAddress(data.address);
              },
            },
          )
        }
        queryParamTrigger={`${queryParamTrigger}-add`}
      />
    </>
  );
}
