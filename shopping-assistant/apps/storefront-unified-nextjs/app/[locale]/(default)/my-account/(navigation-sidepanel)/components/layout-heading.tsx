'use client';

import { SfButton, SfIconArrowBack } from '@storefront-ui/react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useTranslations } from 'next-intl';

import Breadcrumbs from '@/components/ui/breadcrumbs';
import Divider from '@/components/ui/divider';
import { useRouter } from '@/config/navigation';
import type { UnsafeUseTranslations } from '@/types';

export default function LayoutHeading() {
  const currentSegment = useSelectedLayoutSegment();
  const router = useRouter();
  const t = useTranslations('MyAccountLayout') as UnsafeUseTranslations<'MyAccountLayout'>;

  return (
    <>
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
            name: t('heading'),
          },
          ...(currentSegment
            ? [
                {
                  id: currentSegment,
                  link: '#',
                  name: t(`links.${currentSegment}`),
                },
              ]
            : []),
        ]}
        className="my-4 p-4 md:px-0"
      />
      <div className="flex justify-between pb-10 pe-1 md:-me-6 lg:hidden">
        <h1 className="pb-1 ps-4 font-semibold typography-headline-2 md:p-0">
          {currentSegment ? t(`links.${currentSegment}`) : t('heading')}
        </h1>
        {currentSegment && (
          <SfButton onClick={router.back} size="sm" slotPrefix={<SfIconArrowBack size="sm" />} variant="tertiary">
            {t('backButton')}
          </SfButton>
        )}
      </div>
      <Divider className="!w-auto md:-mx-6 lg:mx-0 lg:hidden" />
      <h1 className="mb-10 mt-8 hidden px-4 font-semibold typography-headline-1 md:px-0 lg:block">{t('heading')}</h1>
    </>
  );
}
