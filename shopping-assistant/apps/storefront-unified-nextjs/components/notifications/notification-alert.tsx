import { SfButton, SfIconCheckCircle, SfIconClose, SfIconError, SfIconInfo, SfIconWarning } from '@storefront-ui/react';
import classNames from 'classnames';

import { type AlertProps, AlertVariant } from '@/components/ui/alert';
import type { Notification } from '@/hooks';

import BaseAlert from './base-alert';

export interface NotificationAlertProps extends AlertProps {
  /**
   * The notification item.
   */
  item: Notification;
}

const prefixComponent = (variant?: Notification['variant']) => {
  switch (variant) {
    case AlertVariant.error:
      return <SfIconError className="text-negative-700" />;
    case AlertVariant.positive:
      return <SfIconCheckCircle className="text-positive-700" />;
    case AlertVariant.warning:
      return <SfIconWarning className="text-warning-700" />;
    default:
      return <SfIconInfo />;
  }
};

const buttonClasses = {
  error:
    '!text-negative-700 hover:!text-negative-800 hover:!bg-negative-200 active:!text-negative-900 active:!bg-negative-300',
  positive:
    '!text-positive-700 hover:!text-positive-800 hover:!bg-positive-200 active:!text-positive-900 active:!bg-positive-300',
  warning:
    '!text-warning-700 hover:!text-warning-800 hover:!bg-warning-200 active:!text-warning-900 active:!bg-warning-300',
};

export default function NotificationAlert({
  item: { dismiss, text, variant = 'positive' },
  ...rest
}: NotificationAlertProps) {
  return (
    <BaseAlert
      slotPrefix={prefixComponent(variant)}
      slotSuffix={
        <SfButton
          className={classNames('self-start', buttonClasses[variant])}
          data-testid="alert-close-button"
          onClick={dismiss}
          slotPrefix={<SfIconClose />}
          square
          variant="tertiary"
        />
      }
      variant={variant}
      {...rest}
    >
      {text}
    </BaseAlert>
  );
}
