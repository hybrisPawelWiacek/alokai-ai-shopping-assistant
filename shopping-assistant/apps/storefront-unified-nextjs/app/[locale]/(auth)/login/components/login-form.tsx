'use client';

import { SfButton, SfCheckbox, SfIconError, SfInput } from '@storefront-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSpecificSdkHttpError } from '@vue-storefront/sdk';
import { useTranslations } from 'next-intl';

import Alert from '@/components/ui/alert';
import Form, { FormLabel, FormSubmit } from '@/components/ui/form';
import PasswordInput from '@/components/ui/password-input';
import { useRouter } from '@/config/navigation';
import { resolveFormData } from '@/helpers/form-data';
import { useSdk } from '@/sdk/alokai-context';
import type { LoginCustomerArgs, RegisterCustomerArgs } from '@/types';

export default function LoginForm() {
  const sdk = useSdk();
  const t = useTranslations('LoginForm');
  const isUnauthorized = (error: unknown) =>
    isSpecificSdkHttpError(error, {
      statusCode: (code) => code === 401 || code === 403,
    });
  const queryClient = useQueryClient();
  const router = useRouter();
  const { error, isPending, mutate } = useMutation({
    meta: {
      skipErrorNotification: isUnauthorized,
    },
    mutationFn: async (data: LoginCustomerArgs) => sdk.unified.loginCustomer(data),
    onSuccess(data) {
      queryClient.setQueryData(['customer'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push('/my-account/personal-data');
    },
    retry: false,
  });

  return (
    <Form
      className="flex flex-col gap-4 rounded-md border-neutral-200 px-0 md:border md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutate(resolveFormData<RegisterCustomerArgs>(event.currentTarget));
      }}
    >
      {isUnauthorized(error) && (
        <Alert className="mb-4" slotPrefix={<SfIconError className="text-negative-700" />} variant="error">
          {t('error')}
        </Alert>
      )}
      <label data-testid="email-field">
        <FormLabel>{t('email')}</FormLabel>
        <SfInput autoComplete="email" data-testid="email-input" name="email" required size="lg" type="email" />
      </label>
      <label data-testid="password-field">
        <FormLabel>{t('password')}</FormLabel>
        <PasswordInput
          autoComplete="current-password"
          data-testid="password-input"
          name="password"
          pattern={undefined}
          required
          size="lg"
        />
      </label>
      {/* Remember me feature is not implemented by default. You should create it on your own or remove the checkbox */}
      <label className="my-2 grid cursor-pointer grid-cols-[24px_auto] gap-x-2" data-testid="remember-me-field">
        <SfCheckbox className="m-[3px]" data-testid="newsletter-checkbox" name="newsletter" />
        <FormLabel className="!text-base !font-normal">{t('rememberMe')}</FormLabel>
      </label>

      <FormSubmit data-testid="submit-button" pending={isPending} size="lg">
        {t('submit')}
      </FormSubmit>
      {/* Forgot password feature is not implemented by default. You should create it on your own or remove the button */}
      <SfButton className="flex w-full" data-testid="forgot-password-button" variant="tertiary">
        {t('forgotPassword')}
      </SfButton>
    </Form>
  );
}
