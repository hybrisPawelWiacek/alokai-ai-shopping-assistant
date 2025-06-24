'use client';
import { SfButton } from '@storefront-ui/react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Skeleton from '@/components/ui/skeleton';
import { Link } from '@/config/navigation';
import { useFormatter } from '@/hooks';
import { useSdk } from '@/sdk/alokai-context';

export default function MyOrdersPageClient() {
  const t = useTranslations('MyOrdersPage');
  const sdk = useSdk();
  const orders = useQuery({
    queryFn: () => sdk.unified.getOrders(),
    queryKey: ['orders'],
    select: ({ orders }) => orders,
  });
  const { formatDate, formatPrice } = useFormatter();
  const isEmpty = orders.data?.length === 0;

  return (
    <>
      <h2 className="m-4 mt-6 hidden font-semibold typography-headline-4 lg:block">{t('heading')}</h2>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-6 p-6 pt-16 lg:pt-6">
          <Image
            alt={t('empty')}
            className="mx-auto"
            height="192"
            src="/images/empty-cart.svg"
            unoptimized
            width="192"
          />
          <p className="font-semibold typography-headline-2">{t('empty')}</p>
        </div>
      ) : (
        <>
          <div className="my-4 text-sm lg:hidden" data-testid="orders-list">
            {orders.data?.map((order) => (
              <div className="relative flex flex-col gap-y-2 border-b border-neutral-200 p-4" key={order.id}>
                <SfButton
                  as={Link}
                  className="absolute bottom-2.5 right-4"
                  href={{
                    params: { id: order.id },
                    pathname: '/my-account/my-orders/[id]',
                  }}
                  scroll={false}
                  shallow
                  size="sm"
                  variant="tertiary"
                >
                  {t('details')}
                </SfButton>
                <div>
                  <div className="font-medium">{t('orderId')}</div>
                  <span>{order.id}</span>
                </div>
                <div>
                  <div className="font-medium">{t('orderDate')}</div>
                  <span>{formatDate(order.orderDate)}</span>
                </div>
                <div>
                  <div className="font-medium">{t('orderAmount')}</div>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
                <div>
                  <div className="font-medium">{t('status')}</div>
                  <span>{order.status}</span>
                </div>
              </div>
            ))}
          </div>

          <table
            className="mx-4 hidden min-w-full overflow-x-auto text-left text-sm lg:block"
            data-testid="orders-table"
          >
            <thead className="whitespace-nowrap border-b-2 border-neutral-200">
              <tr className="[&>th]:font-medium">
                <th className="w-full min-w-fit p-4">{t('orderId')}</th>
                <th className="min-w-[120px] p-4">{t('orderDate')}</th>
                <th className="min-w-[120px] p-4">{t('orderAmount')}</th>
                <th className="min-w-[120px] p-4">{t('status')}</th>
                <th className="w-14 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.data?.map((order) => (
                <tr
                  className="whitespace-nowrap border-b border-neutral-200"
                  data-testid="orders-table-row"
                  key={order.id}
                >
                  <td className="p-4">{order.id}</td>
                  <td className="p-4">{formatDate(order.orderDate)}</td>
                  <td className="p-4">{formatPrice(order.totalPrice)}</td>
                  <td className="p-4">{order.status}</td>
                  <td className="p-4 py-2.5 text-right">
                    <SfButton
                      as={Link}
                      href={{
                        params: { id: order.id },
                        pathname: '/my-account/my-orders/[id]',
                      }}
                      scroll={false}
                      shallow
                      size="sm"
                      variant="tertiary"
                    >
                      {t('details')}
                    </SfButton>
                  </td>
                </tr>
              ))}
              {orders.isLoading && <SkeletonRows count={3} />}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

interface SkeletonRowsProps {
  count: number;
}

function SkeletonRows({ count }: SkeletonRowsProps) {
  function SkeletonRow() {
    return (
      <tr className="whitespace-nowrap border-b border-neutral-200 [&>td]:p-4">
        <td>
          <Skeleton className="h-5 w-[320px]" />
        </td>
        <td>
          <Skeleton className="h-5 w-20" />
        </td>
        <td>
          <Skeleton className="h-5 w-16" />
        </td>
        <td>
          <Skeleton className="h-5 w-10" />
        </td>
        <td>
          <Skeleton className="h-5 w-16" />
        </td>
      </tr>
    );
  }

  return Array.from({ length: count }).map((_, index) => <SkeletonRow key={index} />);
}
