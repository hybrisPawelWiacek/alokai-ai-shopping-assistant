import { SfButton, SfIconArrowBack } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Link } from '@/config/navigation';

type OrderDetailsLayoutProps = PropsWithChildren;

export default function OrderDetailsLayout({ children }: OrderDetailsLayoutProps) {
  const t = useTranslations('OrderDetailsPage');

  return (
    <div className="mb-20">
      <Breadcrumbs
        breadcrumbs={[
          {
            id: 'home',
            link: '/',
            name: t('homeBreadcrumb'),
          },
          {
            id: 'my-account',
            link: '/my-account',
            name: t('myAccountBreadcrumb'),
          },
          {
            id: 'my-orders',
            link: '/my-account/my-orders',
            name: t('myOrdersBreadcrumb'),
          },
          {
            id: 'order-details',
            link: '#',
            name: t('heading'),
          },
        ]}
        className="my-4 p-4 md:px-0"
      />
      <div className="mb-10 mt-4 flex justify-between max-lg:pe-1 max-lg:ps-4 lg:mt-8">
        <h1 className="font-semibold typography-headline-2 lg:typography-headline-1">{t('heading')}</h1>
        <SfButton as={Link} href="/my-account/my-orders" slotPrefix={<SfIconArrowBack />} variant="tertiary">
          <span className="lg:hidden">{t('backMobile')}</span>
          <span className="max-lg:hidden">{t('back')}</span>
        </SfButton>
      </div>
      {children}
    </div>
  );
}
