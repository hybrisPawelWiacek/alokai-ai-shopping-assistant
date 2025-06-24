import classNames from 'classnames';

import { useFormatter } from '@/hooks/use-formatter';
import type { SfProduct } from '@/types';

export interface ClassNameVariants {
  /**
   * Class name for the regular price.
   */
  regular?: string;
  /**
   * Class name for the special price.
   */
  special?: string;
}

export interface DecoratedPriceProps {
  /**
   * Class name for the wrapper of the component.
   */
  className?: string;
  /**
   * Class names for the price variants.
   */
  classNameVariants?: ClassNameVariants;
  /**
   * Product
   */
  price: SfProduct['price'];
}

export default function DecoratedPrice({ className, classNameVariants, price, ...rest }: DecoratedPriceProps) {
  /**
   * Lack of `useFormatter` utility accessible on the client side, necessitating its direct use within a server component.
   * The `NextIntlClientProvider` wrapper from next-intl fails to facilitate adequate client-side rendering.
   */
  const { formatPrice } = useFormatter();

  const regular = price?.value ? formatPrice(price.value) : '';
  const special = price?.isDiscounted ? formatPrice(price!.regularPrice) : undefined;

  return (
    price && (
      <div className={classNames('flex items-baseline gap-x-2', className)} {...rest}>
        <span
          className={classNames('font-semibold', classNameVariants?.regular, {
            'text-neutral-900': !special,
            'text-secondary-700': special,
          })}
          data-testid="special-price"
        >
          {regular}
        </span>
        {special && (
          <span
            className={classNames('font-normal text-neutral-500 line-through', classNameVariants?.special)}
            data-testid="regular-price"
          >
            {special}
          </span>
        )}
      </div>
    )
  );
}
