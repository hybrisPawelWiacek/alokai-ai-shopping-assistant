'use client';

import { SfButton, SfCheckbox, SfLink, SfLoaderCircular } from '@storefront-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';

import BillingAddress from '@/components/checkout/billing-address';
import ContactInformation from '@/components/checkout/contact-information';
import CreditCardForm, { type CreditCardFormRef } from '@/components/checkout/credit-card-form';
import ShippingAddress from '@/components/checkout/shipping-address';
import ShippingMethod from '@/components/checkout/shipping-method';
import OrderSummary from '@/components/order-summary';
import Alert from '@/components/ui/alert';
import Divider from '@/components/ui/divider';
import { Link } from '@/config/navigation';
import { assertIsCartAvailable, useCartShippingMethods } from '@/hooks';
import { useSfCartState } from '@/sdk/alokai-context';
import type { SfAddress, SfCreateAddressBody, SfCustomerAddress, UnsafeUseTranslations } from '@/types';

import { usePlaceOrder } from '../hooks';
import AccountShippingAddress from './account-shipping-address';
import PaymentTypes from './payment-types';

export default function Checkout() {
  const [cart] = useSfCartState();
  assertIsCartAvailable(cart);
  const t = useTranslations('CheckoutPage') as UnsafeUseTranslations<'CheckoutPage'>;
  const { shippingMethods } = useCartShippingMethods();
  const queryClient = useQueryClient();

  const [isAccountPaymentType, setIsAccountPaymentType] = useState<boolean>(false);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [termsAndConditions, setTermsAndConditions] = useState<boolean>(false);
  const paymentRef = useRef<CreditCardFormRef>(null);
  const [billingAddress, setBillingAddress] = useState<SfAddress | SfCreateAddressBody>();
  const placeOrder = usePlaceOrder();

  const formValidationMessages = useMemo(() => {
    const elements = {
      billingAddress: !isAccountPaymentType && !billingAddress,
      customerEmail: !cart.customerEmail,
      paymentType: !cart.$custom?.paymentType?.code,
      shippingAddress: !cart.shippingAddress,
      shippingMethod: !cart.shippingMethod,
      termsAndConditions: !termsAndConditions,
    };

    return {
      elements,
      get isValid() {
        return Object.values(elements).every((element) => !element);
      },
    };
  }, [cart, termsAndConditions, billingAddress, isAccountPaymentType]);

  const onSaveBillingAddress = (address: SfCreateAddressBody | SfCustomerAddress) => {
    setBillingAddress(address as SfCreateAddressBody);
  };

  useEffect(() => {
    if (isAccountPaymentType) {
      setBillingAddress(undefined);
    } else if (!billingAddress && cart.shippingAddress) {
      setBillingAddress(cart.shippingAddress);
    }
  }, [cart, billingAddress, isAccountPaymentType]);

  useEffect(() => {
    if (shippingMethods.data && !cart.shippingAddress) {
      queryClient.resetQueries({
        queryKey: ['shippingMethods'],
      });
    }
  }, [cart.shippingAddress, queryClient, shippingMethods.data]);

  useEffect(() => {
    setIsAccountPaymentType(cart.$custom?.paymentType?.code === 'ACCOUNT');
  }, [cart.$custom?.paymentType?.code]);

  const createAccountOrder = () => {
    placeOrder.mutate({
      termsChecked: termsAndConditions,
    });
  };

  const createCardOrder = () => {
    const isPaymentValid = paymentRef.current?.reportValidity();

    if (!paymentRef.current || !isPaymentValid) {
      return;
    }
    const payload = paymentRef.current.getFormState();

    placeOrder.mutate({
      paymentDetails: {
        billingAddress: billingAddress as SfCreateAddressBody,
        payload,
      },
      termsChecked: termsAndConditions,
    });
  };
  const makeOrder = async () => {
    setIsValidated(true);

    if (formValidationMessages.isValid) {
      if (isAccountPaymentType) {
        createAccountOrder();
      } else {
        createCardOrder();
      }
    }
  };

  const onTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTermsAndConditions(event.target.checked);
  };

  return (
    <div className="md:grid md:grid-cols-12 md:gap-x-6" data-testid="checkout-page">
      <div className="col-span-7 mb-10 md:mb-0">
        <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
        <ContactInformation>
          {isValidated && formValidationMessages.elements.customerEmail && (
            <ValidationMessage data-testid="checkout-checkbox-terms-error">
              {t('validation.missingEmail')}
            </ValidationMessage>
          )}
        </ContactInformation>
        <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
        <PaymentTypes>
          {isValidated && formValidationMessages.elements.paymentType && (
            <ValidationMessage data-testid="checkout-checkbox-terms-error">
              {t('validation.missingPaymentMethod')}
            </ValidationMessage>
          )}
        </PaymentTypes>
        <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
        {isAccountPaymentType ? (
          <AccountShippingAddress>
            {isValidated && formValidationMessages.elements.shippingAddress && (
              <ValidationMessage data-testid="checkout-checkbox-terms-error">
                {t('validation.missingShippingAddress')}
              </ValidationMessage>
            )}
          </AccountShippingAddress>
        ) : (
          <ShippingAddress>
            {isValidated && formValidationMessages.elements.shippingAddress && (
              <ValidationMessage data-testid="checkout-checkbox-terms-error">
                {t('validation.missingShippingAddress')}
              </ValidationMessage>
            )}
          </ShippingAddress>
        )}
        <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
        <ShippingMethod>
          {isValidated && formValidationMessages.elements.shippingMethod && (
            <ValidationMessage data-testid="checkout-checkbox-terms-error">
              {t('validation.missingShippingDetails')}
            </ValidationMessage>
          )}
        </ShippingMethod>
        {!isAccountPaymentType && (
          <>
            <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
            <div className="py-6 md:px-4" data-testid="b2b-card-payment">
              <h2 className="mb-4 font-bold text-neutral-900 typography-headline-4">{t('CheckoutPayment.heading')}</h2>
              <BillingAddress onSave={onSaveBillingAddress} savedAddress={billingAddress} />
              <h3 className="mb-1 font-bold text-neutral-900 typography-headline-5">
                {t('CheckoutPayment.creditCard')}
              </h3>
              <CreditCardForm className="!mx-0" ref={paymentRef} />
            </div>
          </>
        )}
        <Divider className="-mx-4 w-screen md:mx-0 md:w-auto" />
      </div>
      <OrderSummary className="col-span-5 h-fit md:sticky md:top-20">
        <>
          {isValidated && !formValidationMessages.isValid && (
            <Alert className="mb-4" data-testid="checkout-validation-alert" variant="error">
              {t('validation.heading')}
            </Alert>
          )}
          <SfButton
            className="mb-4 w-full md:mb-0"
            data-testid="place-order"
            disabled={placeOrder.isPending}
            onClick={makeOrder}
            size="lg"
          >
            {placeOrder.isPending ? (
              <SfLoaderCircular className="flex items-center justify-center" size="sm" />
            ) : (
              t('placeOrder')
            )}
          </SfButton>
          <label className="mt-4 flex pb-4 text-sm md:pb-0">
            <span className="mr-2 block px-[3px]">
              <SfCheckbox
                data-testid="checkout-checkbox-terms"
                invalid={isValidated && !termsAndConditions}
                onChange={onTermsChange}
              />
            </span>
            <span>
              <span className="mb-0.5 block">
                {t.rich('termsAndConditions', {
                  link: (chunk) => (
                    <SfLink
                      as={Link}
                      className="rounded outline-secondary-600 focus:outline focus:outline-2 focus:outline-offset-2"
                      href="#"
                    >
                      {chunk}
                    </SfLink>
                  ),
                })}
              </span>
              {isValidated && formValidationMessages.elements.termsAndConditions && (
                <ValidationMessage data-testid="checkout-checkbox-terms-error">
                  {t('validation.missingTermsAndConditions')}
                </ValidationMessage>
              )}
            </span>
          </label>
        </>
      </OrderSummary>
    </div>
  );
}

function ValidationMessage({ children, ...rest }: PropsWithChildren) {
  return (
    <div className="mt-2 text-sm font-medium text-negative-700" {...rest}>
      {children}
    </div>
  );
}
