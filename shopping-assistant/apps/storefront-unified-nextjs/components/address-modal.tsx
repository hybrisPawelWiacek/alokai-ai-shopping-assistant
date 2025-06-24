'use client';

import { useTranslations } from 'next-intl';

import { resolveFormData } from '@/helpers/form-data';
import type { Maybe, SfAddress, SfCreateAddressBody } from '@/types';

import { AddressFormFields } from './address-form-fields';
import Form, { FormSubmit } from './ui/form';
import type { ModalProps } from './ui/modal';
import Modal, { ModalActions, ModalCancel, ModalClose, ModalHeader } from './ui/modal';

export interface AddressModalProps extends ModalProps {
  /**
   * Address data to prefill the form fields
   */
  address?: Maybe<SfAddress>;
  /**
   * Form heading
   */
  heading?: string;
  /**
   * Loading state of the form
   */
  isLoading?: boolean;
  /**
   * Callback to close the modal
   */
  onClose: () => void;
  /**
   * Callback to submit the form
   */
  onSubmit: (address: SfCreateAddressBody) => void;
}

export default function AddressModal({ address, heading, isLoading, onClose, onSubmit, ...rest }: AddressModalProps) {
  const t = useTranslations('AddressModal');

  const handleSubmit = (formData: SfCreateAddressBody) => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal className="min-h-full w-full md:min-h-fit md:w-[600px]" {...rest}>
      <ModalClose />
      <ModalHeader>{heading}</ModalHeader>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(resolveFormData(event.currentTarget));
        }}
      >
        <AddressFormFields address={address} />
        <ModalActions>
          <ModalCancel>{t('cancel')}</ModalCancel>
          <FormSubmit pending={isLoading}>{t('save')}</FormSubmit>
        </ModalActions>
      </Form>
    </Modal>
  );
}
