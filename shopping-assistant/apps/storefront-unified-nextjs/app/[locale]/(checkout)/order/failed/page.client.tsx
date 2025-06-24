'use client';

import { SfButton, SfIconArrowBack } from '@storefront-ui/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/config/navigation';
import somethingWentWrongImage from '@/public/images/something-went-wrong.svg';

export default function OrderFailedClientPage() {
  const t = useTranslations('OrderPage.Failed');

  return (
    <div className="px-4 md:px-0" data-testid="order-failed-page">
      <div className="border-1 mx-auto mb-20 mt-10 flex max-w-2xl flex-col items-center rounded border border-neutral-200 p-4 md:p-6">
        <Image alt={t('somethingWentWrongImageAlt')} src={somethingWentWrongImage} unoptimized />

        {t.rich('failedInfo', {
          h1: (chunks) => <h1 className="mb-1 mt-6 font-semibold typography-headline-3">{chunks}</h1>,
          span: (chunks) => <span>{chunks}</span>,
        })}

        <div
          className="border-1 my-4 w-full rounded border border-neutral-200 bg-neutral-100 p-4 text-sm"
          data-testid="orderError"
        >
          {t('orderErrorMessage')}
        </div>
        <SfButton
          as={Link}
          className="!ring-[#E4E4E7] max-md:w-full"
          href="/checkout"
          slotPrefix={<SfIconArrowBack />}
          variant="secondary"
        >
          {t('backToCheckout')}
        </SfButton>
        <SfButton as={Link} className="mt-4 max-md:w-full" href="/" variant="tertiary">
          {t('continueShopping')}
        </SfButton>
      </div>
    </div>
  );
}
