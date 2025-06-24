import { SfSelect } from '@storefront-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { FormLabel, FormSubmit } from '@/components/ui/form';
import Modal, { ModalClose } from '@/components/ui/modal';
import { createCurrencyFormatter, createLanguageFormatter } from '@/helpers/label-formatters';
import { locales } from '@/i18n';
import type { GetCurrencies } from '@/types';

import UserSettingsForm from './user-settings-form';

export interface UserSettingsModalProps {
  /**
   * The currency data to be displayed in the modal.
   */
  initialCurrency: Awaited<ReturnType<GetCurrencies>>;
}

export default function UserSettingsModal({ initialCurrency }: UserSettingsModalProps) {
  const t = useTranslations('LocationSelectorsModal');
  const locale = useLocale();
  const { currencies, currentCurrency } = initialCurrency;
  const languageFormatter = createLanguageFormatter(locale);
  const currencyFormatter = createCurrencyFormatter(locale);

  return (
    <Modal
      className="flex w-full max-w-[calc(100%-2rem)] flex-col gap-y-6 overflow-auto sm:max-w-[480px] md:h-fit"
      data-testid="region-modal"
      queryParamTrigger="user-settings-modal"
    >
      <ModalClose />
      <UserSettingsForm className="flex flex-col gap-y-4">
        <header>
          <h3 className="font-semibold text-neutral-900 typography-headline-4 md:typography-headline-3">
            {t('heading')}
          </h3>
        </header>
        <label>
          <FormLabel>{t('languageLabel')}</FormLabel>
          <SfSelect data-testid="language-select" defaultValue={locale} name="language" required>
            {locales.map((value) => (
              <option data-testid="language-option" key={value} value={value}>
                {languageFormatter(value)}
              </option>
            ))}
          </SfSelect>
        </label>
        <label>
          <FormLabel>{t('currencyLabel')}</FormLabel>
          <SfSelect data-testid="currency-select" defaultValue={currentCurrency} name="currency" required>
            {currencies.map((value) => (
              <option data-testid="currency-option" key={value} value={value}>
                {currencyFormatter(value, true)}
              </option>
            ))}
          </SfSelect>
        </label>
        <FormSubmit className="w-full capitalize" data-testid="region-save-button">
          {t('submit')}
        </FormSubmit>
      </UserSettingsForm>
    </Modal>
  );
}
