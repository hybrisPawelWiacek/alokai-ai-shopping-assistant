'use client';

import { type PropsWithStyle, SfButton, SfInput } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import { resolveFormData } from '@/helpers/form-data';
import { useCartCoupon, useFormatter } from '@/hooks';
import { useSfCartState } from '@/sdk/alokai-context';
import type { ApplyCouponToCartArgs } from '@/types';

import Divider from './ui/divider';
import Form from './ui/form';
import Tag from './ui/tag';

export interface OrderSummaryProps extends PropsWithStyle, PropsWithChildren {}

export default function OrderSummary({ children, className, style }: OrderSummaryProps) {
  const t = useTranslations('OrderSummary');
  const [cart] = useSfCartState();
  const { formatPrice } = useFormatter();
  const { applyCartCoupon, removeCartCoupon } = useCartCoupon();

  const handleRemovePromoCode = (): void => {
    const couponId = cart?.appliedCoupons[0]?.id;

    if (typeof couponId === 'string') {
      removeCartCoupon.mutate({ couponId });
    }
  };

  if (!cart) return null;

  const discountAmount =
    cart.subtotalRegularPrice.amount - cart.subtotalDiscountedPrice.amount + cart.totalCouponDiscounts.amount;
  const isDiscounted = discountAmount > 0;

  return (
    <div
      className={classNames([className, 'md:rounded-md md:border md:border-neutral-100 md:shadow-lg'])}
      data-testid="order-summary"
      style={style}
    >
      <div className="flex items-end justify-between bg-neutral-100 px-4 py-2 md:bg-transparent md:px-6 md:pb-4 md:pt-6">
        <p className="font-semibold typography-headline-4 md:typography-headline-2">{t('heading')}</p>
        <p className="font-medium typography-text-base" data-testid="total-in-cart">
          {t('itemsInCart', { count: cart.totalItems })}
        </p>
      </div>
      <div className="mt-4 px-4 pb-4 md:mt-0 md:px-6 md:pb-6">
        <div className="flex justify-between">
          <p>{t('subtotal')}</p>
          <p data-testid="special-price">
            {formatPrice({
              amount: cart.subtotalDiscountedPrice.amount - cart.totalCouponDiscounts.amount,
              currency: cart.subtotalDiscountedPrice.currency,
            })}
          </p>
        </div>
        {isDiscounted && (
          <>
            <div className="flex justify-between">
              <p className="text-neutral-500 typography-text-xs">{t('originalPrice')}</p>
              <p className="text-neutral-500 typography-text-xs" data-testid="regular-price">
                {formatPrice(cart.subtotalRegularPrice)}
              </p>
            </div>
            <div className="flex justify-between text-secondary-700">
              <p className="typography-text-xs">{t('savings')}</p>
              <p className="typography-text-xs" data-testid="regular-saving">
                -
                {formatPrice({
                  amount: discountAmount,
                  currency: cart.subtotalRegularPrice.currency,
                })}
              </p>
            </div>
          </>
        )}
        <div className="my-2 flex justify-between">
          <p>{t('delivery')}</p>
          <p data-testid="delivery-cost">
            {cart.totalShippingPrice?.amount ? formatPrice(cart.totalShippingPrice) : '--'}
          </p>
        </div>
        <div className="my-2 flex justify-between">
          <p>{t('estimatedTax')}</p>
          <p data-testid="tax">{formatPrice(cart.totalTax)}</p>
        </div>
        <Divider className="my-4 w-auto" />
        {cart?.appliedCoupons.length ? (
          <div className="flex items-center justify-between">
            <p>{t('promoCode.label')}</p>
            <div className="flex items-center">
              <SfButton
                className="mr-2"
                data-testid="removePromoCode"
                disabled={removeCartCoupon.isPending || !cart?.appliedCoupons.length}
                onClick={handleRemovePromoCode}
                size="base"
                variant="tertiary"
              >
                {t('promoCode.remove')}
              </SfButton>
              <p data-testid="specialSavings">-{formatPrice(cart.totalCouponDiscounts)}</p>
            </div>
          </div>
        ) : (
          <Form
            className="flex items-center justify-between gap-2"
            data-testid="applyPromoCode"
            onSubmit={(event) => {
              event.preventDefault();
              applyCartCoupon.mutate(resolveFormData<ApplyCouponToCartArgs>(event.currentTarget));
            }}
          >
            <SfInput
              data-testid="promo-code-input"
              name="couponCode"
              placeholder={t('promoCode.inputPlaceholder')}
              required
              size="base"
              wrapperClassName="flex-1"
            />
            <SfButton disabled={applyCartCoupon.isPending} size="base" type="submit" variant="secondary">
              {t('promoCode.apply')}
            </SfButton>
          </Form>
        )}
        <Divider className="my-4 w-auto" />
        {isDiscounted && (
          <Tag className="mb-4 w-full" data-testid="savings-tag" variant="secondary">
            {t('savingsTag', {
              amount: `${formatPrice({
                amount: discountAmount,
                currency: cart.totalCouponDiscounts.currency,
              })}`,
            })}
          </Tag>
        )}
        <div className="mb-4 flex justify-between font-semibold typography-headline-4 md:typography-headline-2">
          <p>{t('total')}</p>
          <p data-testid="total">{formatPrice(cart.totalPrice)}</p>
        </div>
        <Divider className="my-4 w-auto" />
        {children}
      </div>
    </div>
  );
}
