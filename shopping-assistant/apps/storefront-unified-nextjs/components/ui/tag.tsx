import classNames from 'classnames';
import type { PropsWithChildren } from 'react';

export enum TagVariant {
  negative = 'negative',
  primary = 'primary',
  secondary = 'secondary',
  warning = 'warning',
}

export enum TagSize {
  base = 'base',
  sm = 'sm',
}

export interface TagProps extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the tag
   */
  size?: `${TagSize}`;
  /**
   * If true, the tag will have a strong appearance
   */
  strong?: boolean;
  /**
   * Variant of the tag
   */
  variant?: `${TagVariant}`;
}

function getVariantClasses(variant: TagProps['variant'], strong: boolean): classNames.ArgumentArray {
  switch (variant) {
    case 'negative': {
      return ['text-negative-800', strong ? 'bg-negative-600' : 'bg-negative-100'];
    }
    case 'primary': {
      return ['text-primary-800', strong ? 'bg-primary-600' : 'bg-primary-100'];
    }
    case 'secondary': {
      return ['text-secondary-800', strong ? 'bg-secondary-800' : 'bg-secondary-100'];
    }
    case 'warning': {
      return ['text-warning-800', strong ? 'bg-warning-700' : 'bg-warning-100'];
    }
    default: {
      return [];
    }
  }
}

const sizeClasses: Record<TagSize, string> = {
  base: 'text-sm p-1.5 gap-1.5',
  sm: 'text-xs p-1 gap-1',
};

export default function Tag({
  children,
  className,
  size = 'base',
  strong = false,
  variant = 'primary',
  ...rest
}: TagProps) {
  return (
    <div
      className={classNames(
        'inline-flex items-center justify-center',
        strong ? 'rounded-none font-medium text-white' : 'rounded-md font-normal',
        getVariantClasses(variant, strong),
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
