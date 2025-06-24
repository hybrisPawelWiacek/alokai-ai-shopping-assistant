import { SfButton, SfIconAddShoppingCart, SfIconRemoveShoppingCart } from '@storefront-ui/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/config/navigation';
import type { UnsafeUseTranslations } from '@/types';

import BaseAlert from './base-alert';
import type { NotificationAlertProps } from './notification-alert';

export default function AddToCartAlert({ item: { dismiss, text, variant }, ...rest }: NotificationAlertProps) {
  const t = useTranslations('Notifications.AddToCartAlert') as UnsafeUseTranslations<'Notifications.AddToCartAlert'>;

  return (
    <BaseAlert
      slotPrefix={
        variant === 'positive' ? (
          <SfIconAddShoppingCart className="text-positive-700" />
        ) : (
          <SfIconRemoveShoppingCart className="text-negative-700" />
        )
      }
      slotSuffix={
        variant === 'positive' && (
          <SfButton
            as={Link}
            className="whitespace-nowrap !text-positive-700 hover:!bg-positive-200 hover:!text-positive-800 active:!bg-positive-300 active:!text-positive-900"
            href="/cart"
            onClick={dismiss}
            variant="tertiary"
          >
            {t('viewCart')}
          </SfButton>
        )
      }
      variant={variant}
      {...rest}
    >
      {text}
    </BaseAlert>
  );
}
