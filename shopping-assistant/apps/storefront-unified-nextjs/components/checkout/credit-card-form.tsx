'use client';

import { SfInput, SfSelect } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { FormHTMLAttributes } from 'react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { FormLabel } from '@/components/ui/form';
import { resolveFormData } from '@/helpers/form-data';

import type { PaymentMethods } from './checkout-payment';

export type CreditCardFormProps = FormHTMLAttributes<HTMLFormElement>;

export interface CreditCardPayment {
  /**
   * Credit card details
   */
  payload: {
    /**
     * Expiry month of the credit card
     */
    expiryMonth: string;
    /**
     * Expiry year of the credit card
     */
    expiryYear: string;
    /**
     * Number of the credit card
     */
    number: string;
  };
  /**
   * Payment method
   */
  paymentMethod: PaymentMethods.CreditCard;
}

export interface CreditCardFormRef {
  /**
   * Get the current state of the form
   */
  getFormState(): CreditCardPayment['payload'];
  /**
   * Report the validity of the form
   */
  reportValidity(): boolean;
}

const expiryMonthsOptions = Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, '0'));
const expiryYearsOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

function formatCreditCardNumber(input: string) {
  const cleaned = input.replace(/\D/g, '').substring(0, 16);
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
}

const CreditCardForm = forwardRef<CreditCardFormRef, CreditCardFormProps>(({ className, ...rest }, ref) => {
  const t = useTranslations('CheckoutPage.CreditCard');
  const formRef = useRef<HTMLFormElement>(null);
  const getFormState = () => {
    const formData = resolveFormData(formRef.current!);
    return {
      ...formData,
      number: formData.number.replace(/\s/g, ''),
    };
  };

  useImperativeHandle(ref, () => {
    return {
      getFormState,
      reportValidity: () => formRef.current!.reportValidity(),
    };
  }, []);

  return (
    <form
      {...rest}
      className={classNames(
        'mb-6 flex flex-wrap gap-4 rounded-md border border-neutral-200 p-4 pb-3 pt-2 md:mx-4',
        className,
      )}
      onSubmit={(event) => event.preventDefault()}
      ref={formRef}
    >
      <label className="w-full flex-grow-[2] xl:w-auto">
        <FormLabel>{t('cardNumber')}</FormLabel>
        <SfInput
          autoComplete="cc-number"
          className="tracking-widest"
          data-testid="cc-number"
          name="number"
          onChange={(event) => {
            event.target.value = formatCreditCardNumber(event.target.value);
          }}
          pattern="\d{4}(?:\s\d{4}){3}"
          placeholder="4111 1111 1111 1111"
          required
          title={t('cardNumberPattern')}
        />
      </label>
      <label className="flex-1">
        <FormLabel>{t('expiryMonth')}</FormLabel>
        <SfSelect
          autoComplete="cc-exp-month"
          data-testid="cc-expiry-month"
          name="expiryMonth"
          placeholder="MM"
          required
        >
          {expiryMonthsOptions.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </SfSelect>
      </label>
      <label className="flex-1">
        <FormLabel>{t('expiryYear')}</FormLabel>
        <SfSelect autoComplete="cc-exp-year" data-testid="cc-expiry-year" name="expiryYear" placeholder="YYYY" required>
          {expiryYearsOptions.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </SfSelect>
      </label>
    </form>
  );
});

export default CreditCardForm;
