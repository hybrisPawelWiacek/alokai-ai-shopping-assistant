import { uniqueId } from 'lodash-es';
import { createGlobalState } from 'react-use';

import type { AlertVariant } from '@/components/ui/alert';

enum NotificationType {
  persistent = 'persistent',
  temporary = 'temporary',
}

export type Notification = {
  /**
   * A function to dismiss the notification.
   */
  dismiss: () => void;
  /**
   * The unique identifier for the notification.
   */
  id: string;
  /**
   * An optional key for the notification.
   */
  key?: string;
  /**
   * The text content of the notification.
   */
  text: string;
  /**
   * The type of the notification, can be either 'persistent' or 'temporary'.
   */
  type?: `${NotificationType}`;
  /**
   * The variant of the notification, can be either 'error', 'positive', or 'warning'.
   */
  variant?: `${Exclude<AlertVariant, AlertVariant.neutral>}`;
};

export type AddNotificationParams = Pick<Notification, 'key' | 'text' | 'type' | 'variant'>;

export interface UseNotification {
  /**
   * @descripton Adds a new notification to the list of notifications.
   *
   * @param params - The parameters for the new notification.
   */
  addNotification: (params: AddNotificationParams) => () => void;

  /**
   * @description Adds a new error notification to the list of notifications.
   *
   * @param text - The text content of the notification.
   *
   * @param key - An optional key for the notification.
   */
  error: (text: string, key?: string) => () => void;

  /**
   * The current list of notifications.
   */
  notifications: Notification[];

  /**
   * @description Adds a new success notification to the list of notifications.
   *
   * @param text - The text content of the notification.
   *
   * @param key - An optional key for the notification.
   */
  success: (text: string, key?: string) => () => void;

  /**
   * @description Adds a new warning notification to the list of notifications.
   *
   * @param text - The text content of the notification.
   *
   * @param key - An optional key for the notification.
   */
  warning: (text: string, key?: string) => () => void;
}

const useGlobalValue = createGlobalState<Notification[]>([]);
const timeToLive = 3000;

/**
 * @description Hook that provides a way to manage notifications.
 *
 * @returns An object containing the current list of notifications, a function to add a
 * new notification, and shortcut functions for adding error and success notifications.
 *
 * @example
 * const { notifications, addNotification } = useNotification();
 * addNotification({ variant: 'error', text: 'Something went wrong' });
 * console.log(notifications); // [{ variant: 'error', text: 'Something went wrong' }]
 *
 * @example
 * const { error, notifications } = useNotification();
 * error('Something went wrong');
 * console.log(notifications); // [{ variant: 'error', text: 'Something went wrong' }]
 *
 * @example
 * const { success, notifications } = useNotification();
 * success('Something went right');
 * console.log(notifications); // [{ variant: 'positive', text: 'Something went right' }]
 */
export function useNotification(): UseNotification {
  const [notifications, setNotifications] = useGlobalValue();

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const addNotification = (params: AddNotificationParams): (() => void) => {
    const id = uniqueId('alerts');
    const dismiss = () => dismissNotification(id);

    const notification = {
      ...params,
      dismiss,
      id,
    };

    setNotifications((prev) => prev.concat(notification));

    if (notification.type !== 'persistent') {
      setTimeout(dismiss, timeToLive);
    }

    return dismiss;
  };

  return {
    addNotification,
    error: (text, key) => addNotification({ key, text, variant: 'error' }),
    notifications,
    success: (text, key) => addNotification({ key, text, variant: 'positive' }),
    warning: (text, key) => addNotification({ key, text, variant: 'warning' }),
  };
}
