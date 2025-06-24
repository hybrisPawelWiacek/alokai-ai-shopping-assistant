'use client';

import { SfIconCreditCard } from '@storefront-ui/react';
import classNames from 'classnames';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren, ReactNode } from 'react';

import applePayImage from '@/public/images/apple-pay.svg';
import googlePayImage from '@/public/images/google-pay.svg';
import payPalImage from '@/public/images/paypal.svg';

export interface CheckoutPaymentProps extends PropsWithChildren {
  /**
   * Active payment name
   */
  activePayment: string;
  /**
   * Slot for billing address
   */
  billingAddressSlot?: ReactNode;
  /**
   * Function to handle payment method change
   * @param paymentMethod {PaymentMethods}
   */
  onPaymentChange: (paymentMethod: PaymentMethods) => void;
}

export enum PaymentMethods {
  ApplePay = 'apple-pay',
  CreditCard = 'credit-card',
  GooglePay = 'google-pay',
  PayPal = 'pay-pal',
}

export default function CheckoutPayment({
  activePayment,
  billingAddressSlot,
  children,
  onPaymentChange,
}: CheckoutPaymentProps) {
  const t = useTranslations('CheckoutPage.CheckoutPayment');

  return (
    <div className="px-4 py-6" data-testid="checkout-payment">
      <h2 className="mb-4 font-semibold text-neutral-900 typography-headline-4">{t('heading')}</h2>
      {billingAddressSlot}
      <div className="grid grid-cols-2 gap-4">
        <PaymentMethod
          active={activePayment === PaymentMethods.CreditCard}
          onClick={() => onPaymentChange(PaymentMethods.CreditCard)}
          value={PaymentMethods.CreditCard}
        >
          <>
            <SfIconCreditCard className="mr-2" />
            <span className="font-medium">{t('creditCard')}</span>
          </>
        </PaymentMethod>

        <PaymentMethod
          active={activePayment === PaymentMethods.PayPal}
          disabled
          onClick={() => onPaymentChange(PaymentMethods.PayPal)}
          value={PaymentMethods.PayPal}
        >
          <div className="flex flex-col items-center justify-center">
            <Image alt={t('paypalIconAlt')} src={payPalImage} unoptimized />
            <span className="text-xs text-neutral-500">{t('comingSoon')}</span>
          </div>
        </PaymentMethod>

        <PaymentMethod
          active={activePayment === PaymentMethods.ApplePay}
          disabled
          onClick={() => onPaymentChange(PaymentMethods.ApplePay)}
          value={PaymentMethods.ApplePay}
        >
          <div className="flex flex-col items-center justify-center">
            <Image alt={t('applePayIconAlt')} src={applePayImage} unoptimized />
            <span className="text-xs text-neutral-500">{t('comingSoon')}</span>
          </div>
        </PaymentMethod>

        <PaymentMethod
          active={activePayment === PaymentMethods.GooglePay}
          disabled
          onClick={() => onPaymentChange(PaymentMethods.GooglePay)}
          value={PaymentMethods.GooglePay}
        >
          <div className="flex flex-col items-center justify-center">
            <Image alt={t('googlePayIconAlt')} src={googlePayImage} unoptimized />
            <span className="text-xs text-neutral-500">{t('comingSoon')}</span>
          </div>
        </PaymentMethod>
      </div>
      {children}
    </div>
  );
}

interface PaymentMethodProps extends PropsWithChildren {
  active?: boolean;
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onClick?: Function;
  value: string;
}

function PaymentMethod({ active, children, disabled, onClick, value }: PaymentMethodProps) {
  return (
    <button
      className={classNames(
        'border-1 flex h-20 items-center justify-center rounded border border-neutral-200 outline-secondary-600 focus:outline focus:outline-2 focus:outline-offset-2 disabled:bg-neutral-100 disabled:opacity-50',
        'hover:bg-primary-100 focus:bg-primary-100 active:bg-primary-200',
        {
          'border-2 border-primary-700': active,
          'hover:border-primary-200 focus:border-primary-200 active:border-primary-300': !active,
        },
      )}
      data-testid="payment-method"
      disabled={disabled}
      onClick={() => typeof onClick === 'function' && onClick(value)}
      type="button"
    >
      {children}
    </button>
  );
}
