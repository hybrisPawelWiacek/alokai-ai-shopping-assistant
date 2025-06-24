import { SfInput, SfSelect } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';

import { countries, states, titleCodes } from '@/config/address-data';
import type { Maybe, SfAddress } from '@/types';

import { FormHelperText, FormLabel } from './ui/form';

export interface AddressFormFieldsProps {
  /**
   * Address data to prefill the form fields
   */
  address?: Maybe<SfAddress>;
}

const nonNullableAddressFields = (address: SfAddress) =>
  Object.fromEntries(Object.entries(address || {}).filter(([_, value]) => value !== null));

export function AddressFormFields({ address }: AddressFormFieldsProps) {
  const t = useTranslations('AddressFormFields');
  const defaultValues = address ? nonNullableAddressFields(address) : {};

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[50%_1fr_120px]" data-testid="address-form">
      <label className="md:col-span-3">
        <FormLabel>{t('title')}</FormLabel>
        <SfSelect
          autoComplete="honorific-prefix"
          data-testid="title-select"
          defaultValue={defaultValues.titleCode}
          name="titleCode"
          placeholder={t('selectPlaceholder')}
          required
        >
          {titleCodes.map((titleCode) => (
            <option key={titleCode.value} value={titleCode.value}>
              {titleCode.label}
            </option>
          ))}
        </SfSelect>
      </label>
      <label>
        <FormLabel>{t('firstName')}</FormLabel>
        <SfInput
          autoComplete="given-name"
          data-testid="first-name-input"
          defaultValue={defaultValues.firstName}
          name="firstName"
          required
        />
      </label>
      <label className="md:col-span-2">
        <FormLabel>{t('lastName')}</FormLabel>
        <SfInput
          autoComplete="family-name"
          data-testid="last-name-input"
          defaultValue={defaultValues.lastName}
          name="lastName"
          required
        />
      </label>
      <label className="md:col-span-3">
        <FormLabel>{t('phone')}</FormLabel>
        <SfInput
          autoComplete="tel"
          data-testid="phone-input"
          defaultValue={defaultValues.phoneNumber}
          name="phoneNumber"
          required
          type="tel"
        />
      </label>
      <label className="md:col-span-3">
        <FormLabel>{t('country')}</FormLabel>
        <SfSelect
          autoComplete="country-name"
          data-testid="country-select"
          defaultValue={defaultValues.country}
          name="country"
          placeholder={t('selectPlaceholder')}
          required
        >
          {countries.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </SfSelect>
      </label>
      <label className="md:col-span-2">
        <FormLabel>{t('streetName')}</FormLabel>
        <SfInput
          autoComplete="address-line1"
          data-testid="street-name-input"
          defaultValue={defaultValues.address1}
          name="address1"
          required
        />
        <FormHelperText>{t('streetNameHint')}</FormHelperText>
      </label>
      <label>
        <FormLabel>{t('address2')}</FormLabel>
        <SfInput data-testid="street-number-input" defaultValue={defaultValues.address2} name="address2" />
        <FormHelperText>{t('address2Hint')}</FormHelperText>
      </label>
      <label className="md:col-span-3">
        <FormLabel>{t('city')}</FormLabel>
        <SfInput
          autoComplete="address-level2"
          data-testid="city-input"
          defaultValue={defaultValues.city}
          name="city"
          required
        />
      </label>
      <label className="md:col-span-2">
        <FormLabel>{t('state')}</FormLabel>
        <SfSelect
          autoComplete="address-level1"
          data-testid="state-select"
          defaultValue={defaultValues.state}
          name="state"
          placeholder={t('selectPlaceholder')}
          required
        >
          {states.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </SfSelect>
      </label>
      <label>
        <FormLabel>{t('postalCode')}</FormLabel>
        <SfInput
          autoComplete="postal-code"
          data-testid="postal-code-input"
          defaultValue={defaultValues.postalCode}
          name="postalCode"
          required
        />
      </label>
    </div>
  );
}
