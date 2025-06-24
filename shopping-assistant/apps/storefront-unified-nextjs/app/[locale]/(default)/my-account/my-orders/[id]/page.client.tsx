'use client';
import type { SfButtonProps } from '@storefront-ui/react';
import {
  SfButton,
  SfIconArrowBack,
  SfIconEmail,
  SfIconError,
  SfIconShoppingCart,
  SfIconStar,
} from '@storefront-ui/react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';

import AddToCartButton from '@/components/add-to-cart-button';
import ImageWithPlaceholder from '@/components/image-with-placeholder';
import Address from '@/components/ui/address';
import Divider from '@/components/ui/divider';
import Skeleton from '@/components/ui/skeleton';
import { addDaysToDate } from '@/helpers/date';
import { useFormatter } from '@/hooks';
import { useSdk } from '@/sdk/alokai-context';
import type { SfOrderLineItem } from '@/types';

interface OrderDetailsPageClientProps {
  id: string;
}

export default function OrderDetailsPageClient({ id }: OrderDetailsPageClientProps) {
  const sdk = useSdk();
  const t = useTranslations('OrderDetailsPage');
  const order = useQuery({
    queryFn: () => sdk.unified.getOrderDetails({ id }),
    queryKey: ['order', id],
  });
  const { formatDateTime, formatPrice } = useFormatter();

  if (order.isLoading) {
    return <PageSkeleton />;
  }

  if (!order.data) {
    return notFound();
  }

  const {
    billingAddress,
    lineItems,
    orderDate,
    paymentMethod,
    shippingAddress,
    shippingMethod,
    status,
    subtotalPrice,
    totalPrice,
    totalShippingPrice,
    totalTax,
  } = order.data;

  const rateUntil = addDaysToDate(orderDate, 30);
  const returnUntil = addDaysToDate(orderDate, 30);
  const reportUntil = addDaysToDate(orderDate, 180);

  return (
    <div className="flex flex-col gap-10 xl:flex-row" data-testid="order-details-body">
      <section className="flex-1 border-b border-neutral-200 max-lg:px-4">
        <div className="flex flex-col rounded-md bg-neutral-100">
          <div className="flex items-center gap-4 p-4">
            <div>
              <div className="font-medium">{t('status')}</div>
              <div>{status}</div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:gap-10">
            <div>
              <div className="font-medium">{t('orderId')}</div>
              <div>{id}</div>
            </div>
            <div>
              <div className="font-medium">{t('orderDate')}</div>
              <div>{formatDateTime(orderDate)}</div>
            </div>
            <div>
              <div className="font-medium">{t('paymentAmount')}</div>
              <div>{formatPrice(totalPrice)}</div>
            </div>
          </div>
        </div>

        <div className="lg:px-4">
          <h2 className="my-6 font-semibold typography-headline-4">{t('lineItemsHeading')}</h2>
        </div>

        <LineItemsList lineItems={lineItems} />

        <div className="mt-4 flex flex-col gap-2 lg:px-4">
          <div className="flex justify-between">
            <div>{t('itemsSubtotal')}</div>
            <div>{formatPrice(subtotalPrice)}</div>
          </div>
          <div className="flex justify-between">
            <div>{t('shippingPrice')}</div>
            <div>{formatPrice(totalShippingPrice)}</div>
          </div>
          <div className="flex justify-between">
            <div>{t('totalTax')}</div>
            <div>{formatPrice(totalTax)}</div>
          </div>
          <Divider className="my-2" />
          <div className="flex justify-between text-lg font-medium">
            <div>{t('totalPrice')}</div>
            <div>{formatPrice(totalPrice)}</div>
          </div>
          <Divider className="mt-2" />
        </div>

        <div className="my-6 grid gap-x-6 gap-y-4 md:grid-cols-2 lg:p-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('billingAddress')}</div>
            {billingAddress ? <Address address={billingAddress} className="not-italic" /> : '-'}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('shippingAddress')}</div>
            <Address address={shippingAddress} className="not-italic" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('paymentMethod')}</div>
            <div>{paymentMethod}</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('shippingDetails')}</div>
            <div>{shippingMethod.description ?? '-'}</div>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-2 px-4 lg:w-[412px] lg:px-0">
        <AsideButton hint={t('aside.ratePurchaseHint', { rateUntil: formatDateTime(rateUntil) })} icon={SfIconStar}>
          {t('aside.ratePurchase')}
        </AsideButton>
        <AsideButton icon={SfIconShoppingCart}>{t('aside.reorder')}</AsideButton>
        <AsideButton hint={t('aside.returnHint', { returnUntil: formatDateTime(returnUntil) })} icon={SfIconArrowBack}>
          {t('aside.return')}
        </AsideButton>
        <AsideButton icon={SfIconEmail}>{t('aside.contact')}</AsideButton>
        <AsideButton
          hint={t('aside.reportHint', { maxDaysToReport: 180, reportUntil: formatDateTime(reportUntil) })}
          icon={SfIconError}
        >
          {t('aside.report')}
        </AsideButton>
      </aside>
    </div>
  );
}

interface AsideButtonProps extends SfButtonProps {
  hint?: ReactNode;
  icon: JSX.ElementType;
}

function AsideButton({ children, hint, icon: Icon, ...rest }: AsideButtonProps) {
  return (
    <SfButton
      className="!justify-start border border-neutral-200 text-left max-lg:p-4"
      slotPrefix={<Icon className="shrink-0" />}
      variant="tertiary"
      {...rest}
    >
      <span className="flex flex-col items-start">
        <span>{children}</span>
        {hint && <span className="text-xs font-normal text-neutral-500">{hint}</span>}
      </span>
    </SfButton>
  );
}

interface LineItemsListProps {
  lineItems: SfOrderLineItem[];
}

function LineItemsList({ lineItems }: LineItemsListProps) {
  const t = useTranslations('OrderDetailsPage');
  const { formatPrice } = useFormatter();

  return (
    <div className="grid grid-cols-3 gap-4 lg:grid-cols-[minmax(300px,_1fr)_100px_100px_100px_0px] lg:px-4">
      <div className="hidden whitespace-nowrap font-medium lg:block">{t('product')}</div>
      <div className="hidden whitespace-nowrap font-medium lg:block">{t('quantity')}</div>
      <div className="hidden whitespace-nowrap font-medium lg:block">{t('unitPrice')}</div>
      <div className="hidden whitespace-nowrap text-right font-medium lg:col-span-2 lg:block">{t('subtotal')}</div>
      <Divider className="col-span-full hidden h-0.5 lg:block" />

      {lineItems.map((lineItem) => (
        <Fragment key={lineItem.id}>
          <div className="col-span-full mb-4 flex items-start gap-4 lg:col-span-1 lg:mb-0">
            <ImageWithPlaceholder
              alt={lineItem.image?.alt || lineItem.productName}
              className="flex w-[92px] shrink-0 overflow-hidden rounded-md border border-neutral-200"
              data-testid="image-slot"
              height="92"
              nextImageClassName="object-contain aspect-square"
              placeholder="/images/placeholder-300.webp"
              src={lineItem.image?.url}
              unoptimized={!lineItem.image}
              width="92"
            />
            <div className="flex flex-col gap-1">
              <p className="font-medium">{lineItem.id}</p>
              <p>{lineItem.productName}</p>
              {lineItem.attributes.map((attribute) => (
                <p className="text-sm" key={attribute.value}>
                  {attribute.label}: <span className="font-medium">{attribute.valueLabel}</span>
                </p>
              ))}
            </div>
          </div>
          <div>
            <div className="lg:hidden">{t('quantity')}</div>
            <div>{lineItem.quantity}</div>
          </div>
          <div>
            <div className="lg:hidden">{t('unitPrice')}</div>
            <div>{formatPrice(lineItem.unitPrice)}</div>
          </div>
          <div className="relative text-right lg:-me-4">
            <div className="lg:hidden">{t('subtotal')}</div>
            <div>{formatPrice(lineItem.totalPrice)}</div>
          </div>
          <div className="relative max-lg:col-span-full">
            <AddToCartButton
              className="w-full whitespace-nowrap lg:absolute lg:bottom-0 lg:right-0 lg:w-auto"
              productId={lineItem.productId}
              sku={lineItem.sku}
              variant="secondary"
            >
              {t('addToCart')}
            </AddToCartButton>
          </div>
          <Divider className="col-span-full" />
        </Fragment>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-10 max-lg:px-4 xl:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-[296px] lg:h-40" />
        <Skeleton className="h-6" />
        <Skeleton className="h-12" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="flex flex-col gap-2 px-4 lg:w-[412px] lg:px-0">
        <Skeleton className="h-14" />
        <Skeleton className="h-10" />
        <Skeleton className="h-14" />
        <Skeleton className="h-10" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}
