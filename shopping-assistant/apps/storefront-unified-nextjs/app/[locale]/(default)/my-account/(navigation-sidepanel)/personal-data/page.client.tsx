'use client';
import { SfButton, SfIconWarning, SfInput } from '@storefront-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSpecificSdkHttpError } from '@vue-storefront/sdk';
import { useTranslations } from 'next-intl';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import Alert from '@/components/ui/alert';
import DescriptionList, {
  DescriptionItem,
  DescriptionItemDetails,
  DescriptionItemTerm,
} from '@/components/ui/description-list';
import Form, { FormLabel, FormSubmit } from '@/components/ui/form';
import Modal, { ModalActions, ModalCancel, ModalClose, ModalHeader } from '@/components/ui/modal';
import PasswordInput from '@/components/ui/password-input';
import Skeleton from '@/components/ui/skeleton';
import { resolveFormData } from '@/helpers/form-data';
import { useCustomerKey } from '@/hooks';
import { useSdk, useSfCustomerState } from '@/sdk/alokai-context';

type ModalType = 'changePassword' | 'editEmail' | 'editName';

export default function PersonalDataPageClient() {
  const [customer] = useSfCustomerState();
  const t = useTranslations('PersonalDataPage');
  const [modal, setModal] = useQueryState(
    'modal',
    parseAsStringEnum<ModalType>(['editName', 'editEmail', 'changePassword']),
  );

  return (
    <>
      <DescriptionList>
        <DescriptionItem data-testid="account-data-name">
          <DescriptionItemTerm className="flex items-baseline justify-between gap-3">
            {t('name')}
            <SfButton className="font-body" onClick={() => setModal('editName')} size="sm" variant="tertiary">
              {t('edit')}
            </SfButton>
          </DescriptionItemTerm>
          <DescriptionItemDetails>
            {customer ? [customer.firstName, customer.lastName].join(' ') : <Skeleton className="h-6 w-32" />}
          </DescriptionItemDetails>
        </DescriptionItem>
        <DescriptionItem data-testid="account-data-email">
          <DescriptionItemTerm className="flex items-baseline justify-between gap-3">
            {t('contactInformation')}
            <SfButton className="font-body" onClick={() => setModal('editEmail')} size="sm" variant="tertiary">
              {t('edit')}
            </SfButton>
          </DescriptionItemTerm>
          <DescriptionItemDetails>
            {customer ? customer.email : <Skeleton className="h-6 w-40" />}
          </DescriptionItemDetails>
        </DescriptionItem>
        <DescriptionItem data-testid="account-data-password">
          <DescriptionItemTerm className="flex items-baseline justify-between gap-3">
            {t('password')}
            <SfButton className="font-body" onClick={() => setModal('changePassword')} size="sm" variant="tertiary">
              {t('change')}
            </SfButton>
          </DescriptionItemTerm>
          <DescriptionItemDetails>******</DescriptionItemDetails>
        </DescriptionItem>
      </DescriptionList>

      {modal && customer && (
        <Modal className="min-h-full w-full md:min-h-fit md:w-[600px]" queryParamTrigger="modal">
          <ModalClose />
          <ModalHeader>{t(`${modal}.heading`)}</ModalHeader>

          {modal === 'changePassword' ? (
            <ChangePasswordForm onSuccess={() => setModal(null)} />
          ) : (
            <EditCustomerForm onSuccess={() => setModal(null)} type={modal} />
          )}
        </Modal>
      )}
    </>
  );
}

interface EditCustomerFormProps {
  onSuccess: () => void;
  type: Exclude<ModalType, 'changePassword'>;
}

function EditCustomerForm({ onSuccess, type }: EditCustomerFormProps) {
  const [customer] = useSfCustomerState();
  const t = useTranslations('PersonalDataPage');
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation({
    mutationFn: sdk.unified.updateCustomer,
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(useCustomerKey, updatedCustomer);
      onSuccess();
    },
  });

  return (
    <Form
      data-testid={type === 'editName' ? 'account-forms-name' : 'contact-information-form'}
      onSubmit={(event) => {
        event.preventDefault();
        mutate(resolveFormData(event.currentTarget));
      }}
    >
      {type === 'editName' && (
        <div className="flex flex-col gap-4 md:flex-row">
          <label className="flex-1">
            <FormLabel>{t('editName.firstName')}</FormLabel>
            <SfInput
              autoComplete="given-name"
              data-testid="first-name-input"
              defaultValue={customer?.firstName}
              name="firstName"
              required
            />
          </label>
          <label className="flex-1">
            <FormLabel>{t('editName.lastName')}</FormLabel>
            <SfInput
              autoComplete="family-name"
              data-testid="last-name-input"
              defaultValue={customer?.lastName}
              name="lastName"
              required
            />
          </label>
        </div>
      )}
      {type === 'editEmail' && (
        <label>
          <FormLabel>{t('editEmail.email')}</FormLabel>
          <SfInput
            autoComplete="email"
            data-testid="email-input"
            defaultValue={customer?.email}
            name="email"
            required
            type="email"
          />
        </label>
      )}
      <ModalActions>
        <ModalCancel>{t(`${type}.cancel`)}</ModalCancel>
        <FormSubmit className="min-w-[120px]" data-testid="save" pending={isPending}>
          {t(`${type}.submit`)}
        </FormSubmit>
      </ModalActions>
    </Form>
  );
}

interface ChangePasswordFormProps {
  onSuccess: () => void;
}

function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const t = useTranslations('PersonalDataPage.changePassword');
  const sdk = useSdk();
  const { error, mutate } = useMutation({
    meta: { notificationKey: 'passwordChanged', skipErrorNotification: () => true },
    mutationFn: sdk.unified.changeCustomerPassword,
    onSuccess,
    retry: false,
  });

  return (
    <Form
      data-testid="account-forms-password"
      onSubmit={(event) => {
        event.preventDefault();
        mutate(resolveFormData(event.currentTarget));
      }}
    >
      {error && (
        <Alert
          className="mb-4"
          data-testid="password-reset-error-alert"
          slotPrefix={<SfIconWarning className="shrink-0 text-red-700" />}
          variant="error"
        >
          {isSpecificSdkHttpError(error, { statusCode: 422 })
            ? t('errors.passwordComplexity')
            : t('errors.wrongPassword')}
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <label>
          <FormLabel>{t('currentPassword')}</FormLabel>
          <PasswordInput
            autoComplete="current-password"
            data-testid="current-password-input"
            name="currentPassword"
            pattern={undefined}
            required
          />
        </label>
        <label>
          <FormLabel>{t('newPassword')}</FormLabel>
          <PasswordInput autoComplete="new-password" data-testid="new-password-input" name="newPassword" required />
          <div className="flex justify-between">
            <p className="mt-0.5 text-xs text-neutral-500">{t('passwordHint')}</p>
          </div>
        </label>
        <label>
          <FormLabel>{t('confirmPassword')}</FormLabel>
          <PasswordInput
            autoComplete="new-password"
            data-testid="confirm-password-input"
            name="confirmPassword"
            required
          />
        </label>
      </div>
      <ModalActions>
        <ModalCancel>{t('cancel')}</ModalCancel>
        <FormSubmit className="min-w-[120px]" data-testid="save">
          {t('submit')}
        </FormSubmit>
      </ModalActions>
    </Form>
  );
}
