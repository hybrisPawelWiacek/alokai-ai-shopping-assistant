import { SfButton, SfIconArrowBack } from '@storefront-ui/react';
import { getTranslations } from 'next-intl/server';
import type { PropsWithChildren } from 'react';

import { Link } from '@/config/navigation';

interface DefaultLayoutProps extends PropsWithChildren {}
export default async function DefaultLayout({ children }: DefaultLayoutProps) {
  const t = await getTranslations('CheckoutPage');

  return (
    <>
      <div className="mb-20" data-testid="checkout-layout">
        <div className="mb-10 mt-4 flex justify-between px-4 md:mt-8 md:px-0">
          <h1 className="font-semibold typography-headline-3 md:typography-headline-1">{t('heading')}</h1>
          <SfButton
            as={Link}
            className="flex md:hidden"
            data-testid="back-button-mobile"
            href="/cart"
            size="sm"
            slotPrefix={<SfIconArrowBack />}
            variant="tertiary"
          >
            {t('backButton')}
          </SfButton>
          <SfButton
            as={Link}
            className="hidden md:flex"
            href="/cart"
            slotPrefix={<SfIconArrowBack />}
            variant="tertiary"
          >
            {t('backButton')}
          </SfButton>
        </div>
        {children}
      </div>
    </>
  );
}