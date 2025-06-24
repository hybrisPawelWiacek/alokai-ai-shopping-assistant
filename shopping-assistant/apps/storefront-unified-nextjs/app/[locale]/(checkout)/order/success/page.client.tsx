'use client';

import { SfButton, SfLink, SfLoaderCircular } from '@storefront-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import Address from '@/components/ui/address';
import DescriptionList, { DescriptionItemDetails, DescriptionItemTerm } from '@/components/ui/description-list';
import { Link, useRouter } from '@/config/navigation';
import { useFormatter } from '@/hooks';
import orderSuccessImage from '@/public/images/order-success.svg';
import { useSfCustomerState } from '@/sdk/alokai-context';
import type { SfOrder } from '@/types';

export default function OrderSuccessClientPage() {
  const t = useTranslations('OrderPage.Success');
  const { replace } = useRouter();
  const queryClient = useQueryClient();
  const order = queryClient.getQueryData<SfOrder>(['order', 'confirmation']);

  const [customer] = useSfCustomerState();
  const { formatPrice } = useFormatter();

  useEffect(() => {
    if (!order) {
      replace('/');
    }
  }, [order, replace]);

  return (
    <div className="px-4 md:px-0" data-testid="order-success-page">
      {order ? (
        <div className="border-1 mx-auto mb-20 mt-10 flex max-w-2xl flex-col items-center rounded border border-neutral-200 p-4 md:p-6">
          <Image alt={t('orderSuccessfulImageAlt')} src={orderSuccessImage} unoptimized />
          <div className="text-center">
            {customer
              ? t.rich('successInfo', {
                  h1: (chunks) => <h1 className="mb-1 mt-6 font-semibold typography-headline-3">{chunks}</h1>,
                  sflink: (chunks) => (
                    <SfLink href="/my-account/my-orders" variant="primary">
                      {chunks}
                    </SfLink>
                  ),
                  span: (chunks) => <span className="font-medium">{chunks}</span>,
                  value: order.id,
                })
              : t.rich('successInfoNotLoggedIn', {
                  h1: (chunks) => <h1 className="mb-1 mt-6 font-semibold typography-headline-3">{chunks}</h1>,
                  span: (chunks) => <span className="font-medium">{chunks}</span>,
                  value: order.id,
                })}
          </div>

          <DescriptionList className="my-4 flex w-full flex-col gap-y-4 rounded border border-neutral-200 bg-neutral-100 p-4 text-sm">
            <div>
              <DescriptionItemTerm className="!font-body !text-base !font-medium">{t('shipTo')}</DescriptionItemTerm>
              <DescriptionItemDetails>
                <Address address={order.shippingAddress} className="not-italic" />
              </DescriptionItemDetails>
            </div>

            {order.shippingMethod?.estimatedDelivery && (
              <div>
                <DescriptionItemTerm className="!font-body !text-base !font-medium">
                  {t('etaDelivery')}
                </DescriptionItemTerm>
                <DescriptionItemDetails>{order.shippingMethod.estimatedDelivery}</DescriptionItemDetails>
              </div>
            )}

            <div>
              <DescriptionItemTerm className="!font-body !text-base !font-medium">
                {t('shippingDetails')}
              </DescriptionItemTerm>
              <DescriptionItemDetails>{order.shippingMethod.name}</DescriptionItemDetails>
            </div>
          </DescriptionList>

          <div className="mb-6 flex w-full flex-col gap-1 text-left text-sm" data-testid="success-order-details">
            <div>
              <span className="font-medium">{t('orderTitle')}</span>: {order.id}
            </div>
            <div>
              <span className="font-medium">{t('orderDate')}</span>: {order.orderDate}
            </div>
            <div>
              <span className="font-medium">{t('paymentAmount')}</span>: {formatPrice(order.totalPrice)}
            </div>
            <div>
              <span className="font-medium">{t('paymentMethod')}</span>: {order.paymentMethod}
            </div>
            {order?.billingAddress && (
              <div className="flex flex-wrap whitespace-pre-wrap">
                <span className="font-medium">{t('billingAddress')}</span>:{' '}
                <Address address={order.billingAddress!} className="flex flex-wrap not-italic" />
              </div>
            )}
          </div>

          <SfButton as={Link} className="mt-4 !ring-[#E4E4E7] max-md:w-full" href="/" replace variant="secondary">
            {t('continueShopping')}
          </SfButton>
        </div>
      ) : (
        <span className="my-40 flex h-24 justify-center">
          <SfLoaderCircular size="3xl" />
        </span>
      )}
    </div>
  );
}
