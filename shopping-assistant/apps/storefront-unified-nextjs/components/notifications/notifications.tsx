'use client';

import { TransitionGroup } from 'react-transition-group';

import { useNotification } from '@/hooks';

import NotificationFactory from './notification-factory';

export default function Notifications() {
  const { notifications } = useNotification();

  return (
    <div
      className="absolute inset-x-2 top-14 z-10 mt-2 w-auto font-normal text-neutral-900 md:left-auto md:right-6 md:top-20 md:max-w-lg lg:right-10"
      data-testid="notifications"
    >
      <TransitionGroup className="flex flex-col items-end gap-2">
        {notifications.map((item) => (
          <NotificationFactory item={item} key={item.id} />
        ))}
      </TransitionGroup>
    </div>
  );
}
