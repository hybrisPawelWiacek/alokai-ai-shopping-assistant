'use client';

import { SfButton, SfInput } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import type { PropsWithChildren } from 'react';

import Form, { FormHelperText, FormLabel, FormSubmit } from '@/components/ui/form';
import Modal, { ModalActions, ModalCancel, ModalClose, ModalHeader } from '@/components/ui/modal';
import { resolveFormData } from '@/helpers/form-data';
import { useSetCustomerEmail } from '@/hooks/cart';
import { useSfCartState } from '@/sdk/alokai-context';

export interface ContactInformationProps extends PropsWithChildren {
  /**
   * If `true`, the email can be edited.
   */
  isEditable?: boolean;
}
export default function ContactInformation({ children, isEditable }: ContactInformationProps) {
  const t = useTranslations('CheckoutPage.ContactInformation');
  const [cart] = useSfCartState();
  const updateCart = useSetCustomerEmail();
  const [, setModalOpen] = useQueryState('contact-information', parseAsBoolean);

  return (
    <div className="px-4 py-6" data-testid="contact-information">
      <div className="flex items-center justify-between">
        <h2 className="mb-4 font-semibold text-neutral-900 typography-headline-4">{t('heading')}</h2>
        {cart?.customerEmail && isEditable && (
          <SfButton data-testid="edit-button" onClick={() => setModalOpen(true)} size="sm" variant="tertiary">
            {t('change')}
          </SfButton>
        )}
      </div>

      {cart?.customerEmail ? (
        <div className="mt-2 md:w-[520px]">
          <p data-testid="customer-email">{cart?.customerEmail}</p>
        </div>
      ) : (
        <div className="w-full md:max-w-[520px]">
          <p>{t('description')}</p>
          <SfButton
            className="mt-4 w-full md:w-auto"
            data-testid="add-button"
            onClick={() => setModalOpen(true)}
            variant="secondary"
          >
            {t('add')}
          </SfButton>
        </div>
      )}

      <Modal className="min-h-full w-full md:min-h-fit md:w-[600px]" queryParamTrigger="contact-information">
        <ModalClose />
        <ModalHeader>{t('heading')}</ModalHeader>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            updateCart.mutate(resolveFormData(event.currentTarget), { onSuccess: () => setModalOpen(null) });
          }}
        >
          <label data-testid="contact-information-form">
            <FormLabel>{t('form.label')}</FormLabel>
            <SfInput
              autoComplete="email"
              data-testid="email-input"
              defaultValue={cart?.customerEmail || ''}
              disabled={updateCart.isPending}
              name="email"
              required
              type="email"
            />
            {!isEditable && <FormHelperText>{t('form.helpText')}</FormHelperText>}
          </label>
          <ModalActions>
            <ModalCancel>{t('form.cancel')}</ModalCancel>
            <FormSubmit pending={updateCart.isPending}>{t('form.save')}</FormSubmit>
          </ModalActions>
        </Form>
      </Modal>
      {children}
    </div>
  );
}
