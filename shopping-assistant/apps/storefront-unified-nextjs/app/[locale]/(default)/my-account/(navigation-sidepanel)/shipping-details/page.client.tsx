'use client';
import { SfButton } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';

import { AddressFormFields } from '@/components/address-form-fields';
import { ConfirmationModal } from '@/components/confirmation-modal';
import Address from '@/components/ui/address';
import DescriptionList, { DescriptionItem, DescriptionItemDetails } from '@/components/ui/description-list';
import Form, { FormSubmit } from '@/components/ui/form';
import Modal, { ModalActions, ModalCancel, ModalClose, ModalHeader } from '@/components/ui/modal';
import Skeleton from '@/components/ui/skeleton';
import { resolveFormData } from '@/helpers/form-data';
import { useCustomerAddresses } from '@/hooks';

export default function ShippingDetailsPageClient() {
  const t = useTranslations('ShippingDetailsPage');
  const { create, list, remove, update } = useCustomerAddresses();
  const isEmpty = list.data?.length === 0;
  const [editedAddressId, setEditedAddressId] = useQueryState('edit');
  const [, setAddModalOpen] = useQueryState('add', parseAsBoolean);
  const addressToEdit = list.data?.find((address) => address.id === editedAddressId);

  if (list.isLoading) {
    return <PageSkeleton />;
  }

  return (
    <>
      {isEmpty ? (
        <DescriptionList data-testid="addresses-list">
          <DescriptionItem>
            <DescriptionItemDetails>
              <p className="mb-4">{t('empty.paragraph')}</p>
              <SfButton
                className="-mb-2 sm:mb-0"
                data-testid="add-address-button"
                onClick={() => setAddModalOpen(true)}
                variant="secondary"
              >
                {t('empty.addAddress')}
              </SfButton>
            </DescriptionItemDetails>
          </DescriptionItem>
        </DescriptionList>
      ) : (
        <>
          <DescriptionList data-testid="addresses-list">
            {list.data?.map((address) => (
              <DescriptionItem className="md:flex-row" data-testid="addresses-item" key={address.id}>
                <Address address={address} className="not-italic" />
                <div className="ml-auto flex items-start gap-3">
                  <ConfirmationModal
                    cancelLabel={t('deleteModal.cancel')}
                    confirmLabel={t('delete')}
                    data-testid="confirmation-modal"
                    onConfirm={() => remove.mutateAsync({ id: address.id })}
                    trigger={
                      <SfButton data-testid="delete-address" size="sm" variant="tertiary">
                        {t('delete')}
                      </SfButton>
                    }
                  >
                    <p className="font-medium" data-testid="delete-address-heading">
                      {t('deleteModal.heading')}
                    </p>
                    <p data-testid="delete-address-body">{t('deleteModal.paragraph')}</p>
                  </ConfirmationModal>
                  <SfButton
                    className="font-body"
                    data-testid="edit-address"
                    onClick={() => setEditedAddressId(address.id)}
                    size="sm"
                    variant="tertiary"
                  >
                    {t('edit')}
                  </SfButton>
                </div>
              </DescriptionItem>
            ))}
            <DescriptionItem className="sm:items-start">
              <SfButton
                className="-my-2 w-full sm:my-0 sm:w-auto"
                data-testid="add-address-button"
                onClick={() => setAddModalOpen(true)}
                variant="secondary"
              >
                {t('empty.addAddress')}
              </SfButton>
            </DescriptionItem>
          </DescriptionList>

          <Modal
            className="min-h-full w-full md:min-h-fit md:w-[600px]"
            data-testid="address-modal"
            queryParamTrigger="edit"
          >
            <ModalClose />
            <ModalHeader>{t('editAddressModal.heading')}</ModalHeader>
            <Form
              onSubmit={async (event) => {
                event.preventDefault();
                update.mutate(
                  { address: resolveFormData(event.currentTarget), id: editedAddressId! },
                  { onSuccess: () => setEditedAddressId(null) },
                );
              }}
            >
              <AddressFormFields address={addressToEdit} />
              <ModalActions>
                <ModalCancel>{t('editAddressModal.cancel')}</ModalCancel>
                <FormSubmit pending={update.isPending}>{t('editAddressModal.submit')}</FormSubmit>
              </ModalActions>
            </Form>
          </Modal>
        </>
      )}

      <Modal
        className="min-h-full w-full md:min-h-fit md:w-[600px]"
        data-testid="address-modal"
        queryParamTrigger="add"
      >
        <ModalClose />
        <ModalHeader>{t('addAddressModal.heading')}</ModalHeader>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              { address: resolveFormData(event.currentTarget) },
              { onSuccess: () => setAddModalOpen(null) },
            );
          }}
        >
          <AddressFormFields />
          <ModalActions>
            <ModalCancel>{t('addAddressModal.cancel')}</ModalCancel>
            <FormSubmit pending={create.isPending}>{t('addAddressModal.submit')}</FormSubmit>
          </ModalActions>
        </Form>
      </Modal>
    </>
  );
}

function AddressSkeleton() {
  return (
    <DescriptionItem className="flex flex-col md:flex-row">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="ml-auto flex gap-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-12" />
      </div>
    </DescriptionItem>
  );
}

function PageSkeleton() {
  return (
    <>
      <DescriptionList>
        <AddressSkeleton />
        <AddressSkeleton />
        <AddressSkeleton />
        <AddressSkeleton />
      </DescriptionList>
    </>
  );
}
