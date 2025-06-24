import { SfButton } from '@storefront-ui/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/config/navigation';
import emptyCartImage from '@/public/images/empty-cart.svg';

export default function Empty() {
  const t = useTranslations('CartPage');

  return (
    <div className="flex flex-col items-center justify-center px-8" data-testid="empty-cart-logo">
      <Image alt={t('emptyCartImgAlt')} src={emptyCartImage} unoptimized />
      <h2 className="mt-4 text-lg font-medium">{t('emptyCart')}</h2>
      <p className="my-4">{t('emptyCartMessage')}</p>
      <SfButton as={Link} className="w-full sm:max-w-sm" href="/">
        {t('emptyCartBackButton')}
      </SfButton>
    </div>
  );
}
