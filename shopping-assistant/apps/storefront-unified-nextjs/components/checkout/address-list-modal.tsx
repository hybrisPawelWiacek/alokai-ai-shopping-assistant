'use client';

import { type PropsWithStyle, SfListItem, SfRadio } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';

import Address from '@/components/ui/address';
import { FormSubmit } from '@/components/ui/form';
import type { ModalProps } from '@/components/ui/modal';
import Modal, { ModalActions, ModalCancel, ModalClose, ModalHeader } from '@/components/ui/modal';
import type { SfCustomerAddress } from '@/types';

interface AddressListModalProps extends ModalProps {
  heading?: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
  submitDisabled?: boolean;
}

export default function AddressListModal({
  children,
  className,
  heading,
  isSubmitting,
  onSubmit,
  submitDisabled,
  ...rest
}: AddressListModalProps) {
  const t = useTranslations('CheckoutPage.ShippingAddress');

  return (
    <Modal
      {...rest}
      className={classNames(
        'm-auto flex h-full w-full flex-col overflow-hidden md:h-fit md:max-h-[calc(100%-80px)] md:w-fit md:max-w-[calc(100%-80px)]',
        className,
      )}
      data-testid="address-list-modal"
      disableClickAway
    >
      <ModalClose />
      <ModalHeader>{heading}</ModalHeader>
      <div className="inher relative flex h-full flex-col overflow-hidden max-md:pb-4 md:h-auto">{children}</div>
      <ModalActions>
        <ModalCancel>{t('form.cancel')}</ModalCancel>
        <FormSubmit disabled={submitDisabled} onClick={onSubmit} pending={isSubmitting}>
          {t('form.save')}
        </FormSubmit>
      </ModalActions>
    </Modal>
  );
}

interface AddressListProps extends PropsWithStyle {
  addresses: SfCustomerAddress[];
  isLoading?: boolean;
  onSelect: (address: SfCustomerAddress) => void;
  selected?: string;
}

export function AddressList({ addresses, className, isLoading, onSelect, selected, ...rest }: AddressListProps) {
  return (
    <div className={className} data-testid="address-list" {...rest}>
      <ul className="flex flex-col gap-4" role="radiogroup">
        {addresses.map((address) => (
          <SfListItem
            as="label"
            className="items-start rounded-md border"
            data-testid="address-list-item"
            key={address.id}
          >
            <div className="flex gap-2">
              <SfRadio
                checked={selected === address.id}
                disabled={isLoading}
                name={address.id}
                onChange={() => onSelect(address)}
                value={address.id}
              />
              <Address address={address} className="not-italic" />
            </div>
          </SfListItem>
        ))}
      </ul>
    </div>
  );
}
