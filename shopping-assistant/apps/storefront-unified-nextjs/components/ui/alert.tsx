import type { PropsWithStyle } from '@storefront-ui/react';
import classNames from 'classnames';
import type { PropsWithChildren, ReactNode } from 'react';

export enum AlertVariant {
  error = 'error',
  neutral = 'neutral',
  positive = 'positive',
  warning = 'warning',
}

export enum AlertSize {
  base = 'base',
  lg = 'lg',
}

export interface AlertProps extends PropsWithChildren, PropsWithStyle {
  /**
   * The header content of the alert.
   */
  header?: ReactNode;
  /**
   * The size of the alert. Defaults to 'base'.
   */
  size?: `${AlertSize}`;
  /**
   * The prefix slot of the alert.
   */
  slotPrefix?: ReactNode;
  /**
   * The suffix slot of the alert.
   */
  slotSuffix?: ReactNode;
  /**
   * The variant of the alert. Defaults to 'positive'.
   */
  variant?: `${AlertVariant}`;
}

const variantClasses = {
  [AlertVariant.error]: 'bg-negative-100 ring-negative-200',
  [AlertVariant.neutral]: 'bg-neutral-100 ring-neutral-200',
  [AlertVariant.positive]: 'bg-positive-100 ring-positive-200',
  [AlertVariant.warning]: 'bg-warning-100 ring-warning-200',
};

const sizeClasses = {
  [AlertSize.base]: 'px-4 py-3',
  [AlertSize.lg]: 'p-4 md:p-6',
};

export default function Alert({
  children,
  className,
  header,
  size = 'base',
  slotPrefix,
  slotSuffix,
  variant = 'positive',
  ...attributes
}: AlertProps) {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 break-words rounded-md text-neutral-900 ring-1 ring-inset',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      data-testid="alert"
      role="alert"
      {...attributes}
    >
      {slotPrefix && <div className="flex">{slotPrefix}</div>}
      <div className="min-w-0 flex-1" data-testid="alert-body">
        <div className="text-lg font-medium" data-testid="alert-header">
          {header}
        </div>
        {children}
      </div>
      {slotSuffix}
    </div>
  );
}
