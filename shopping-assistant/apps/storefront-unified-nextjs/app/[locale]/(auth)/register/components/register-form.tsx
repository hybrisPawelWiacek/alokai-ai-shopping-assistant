'use client';

import { SfButton, SfCheckbox, SfIconError, SfInput, SfLink } from '@storefront-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSdkRequestError, isSpecificSdkHttpError } from '@vue-storefront/sdk';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Alert from '@/components/ui/alert';
import Form, { FormHelperText, FormLabel, FormSubmit } from '@/components/ui/form';
import Modal from '@/components/ui/modal';
import PasswordInput from '@/components/ui/password-input';
import { Link } from '@/config/navigation';
import { resolveFormData } from '@/helpers/form-data';
import { useSdk } from '@/sdk/alokai-context';
import type { RegisterCustomerArgs } from '@/types';

export default function RegisterForm() {
  const sdk = useSdk();
  const t = useTranslations('RegisterForm');
  const queryClient = useQueryClient();
  const { error, isPending, isSuccess, mutate } = useMutation({
    meta: {
      skipErrorNotification: isSdkRequestError,
    },
    mutationFn: async (data: RegisterCustomerArgs) => sdk.unified.registerCustomer(data),
    onSuccess(data) {
      queryClient.setQueryData(['customer'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    retry: false,
  });

  return (
    <>
      <Form
        className="flex flex-col gap-6 rounded-md border-neutral-200 px-0 md:border md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          mutate(resolveFormData<RegisterCustomerArgs>(event.currentTarget));
        }}
      >
        {isSpecificSdkHttpError(error, { statusCode: 400 }) && (
          <Alert className="mb-4" slotPrefix={<SfIconError className="text-negative-700" />} variant="error">
            {t('requestError')}
          </Alert>
        )}
        <div className="flex flex-col gap-4">
          <label data-testid="first-name-field">
            <FormLabel>{t('firstName')} *</FormLabel>
            <SfInput autoComplete="given-name" data-testid="first-name-input" name="firstName" required size="lg" />
          </label>
          <label data-testid="last-name-field">
            <FormLabel>{t('lastName')} *</FormLabel>
            <SfInput autoComplete="family-name" data-testid="last-name-input" name="lastName" required size="lg" />
          </label>
          <label data-testid="email-field">
            <FormLabel>{t('email')} *</FormLabel>
            <SfInput autoComplete="email" data-testid="email-input" name="email" required size="lg" type="email" />
          </label>
          <label data-testid="password-field">
            <FormLabel>{t('password')} *</FormLabel>
            <PasswordInput
              autoComplete="current-password"
              data-testid="password-input"
              name="password"
              required
              size="lg"
            />
            <FormHelperText>{t('passwordHint')}</FormHelperText>
          </label>
        </div>
        <div className="flex flex-col gap-4">
          <label className="grid cursor-pointer grid-cols-[24px_auto] gap-x-2" data-testid="terms-field">
            <SfCheckbox className="m-[3px]" data-testid="terms-checkbox" name="terms" required />
            <FormLabel className="!text-base !font-normal">
              {t.rich('termsAndConditions', {
                terms: (chunks) => (
                  <SfLink as={Link} href="#" variant="primary">
                    {chunks}
                  </SfLink>
                ),
              })}
            </FormLabel>
          </label>
          {/* Newsletter feature is not implemented by default. You should create it on your own or remove the checkbox */}
          <label className="grid cursor-pointer grid-cols-[24px_auto] gap-x-2" data-testid="subscription-field">
            <SfCheckbox className="m-[3px]" data-testid="newsletter-checkbox" name="newsletter" />
            <FormLabel className="!text-base !font-normal">{t('newsletter')}</FormLabel>
          </label>
        </div>

        <p className="text-neutral-500 typography-text-sm">{t('markRequired')}</p>

        <FormSubmit data-testid="submit-button" pending={isPending} size="lg">
          {t('submit')}
        </FormSubmit>
      </Form>
      {isSuccess && <SuccessModal />}
    </>
  );
}

function SuccessModal() {
  const t = useTranslations('RegisterForm.successModal');

  return (
    <Modal className="max-w-[480px] p-6 md:p-10">
      <Image
        alt="My account"
        className="mx-auto mb-6"
        height={192}
        src="/images/my-account.svg"
        unoptimized
        width={192}
      />
      <h2 className="mb-4 text-center font-headings text-2xl font-semibold">{t('heading')}</h2>
      <div className="mb-6 rounded-md border border-neutral-200 bg-neutral-100 p-4 text-base">
        {t.rich('paragraph', {
          myAccount: (chunks) => (
            <SfLink as={Link} href="/my-account" variant="primary">
              {chunks}
            </SfLink>
          ),
        })}
      </div>
      <SfButton as={Link} className="flex w-full" href="/">
        {t('button')}
      </SfButton>
    </Modal>
  );
}
