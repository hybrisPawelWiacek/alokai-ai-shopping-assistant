'use client';

import type { Notification } from '@/hooks';

import AddToCartAlert from './add-to-cart-alert';
import NotificationAlert from './notification-alert';

export interface NotificationFactoryProps {
  /**
   * Notification item
   */
  item: Notification;
}

export default function NotificationFactory({ item, ...rest }: NotificationFactoryProps) {
  switch (item.key) {
    case 'cart.addToCart':
      return <AddToCartAlert item={item} {...rest} />;
    default:
      return <NotificationAlert item={item} {...rest} />;
  }
}
