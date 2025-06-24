import type { PropsWithStyle } from '@storefront-ui/react';
import { SfCounter, SfLink, SfRating } from '@storefront-ui/react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { LinkHref } from '@/config/navigation';
import { Link } from '@/config/navigation';
import type { Maybe, SfId, SfMoney, SfProduct } from '@/types';

import AddToCartButton from './add-to-cart-button';
import DecoratedPrice from './decorated-price';
import DecoratedPriceClient from './decorated-price-client';
import Skeleton from './ui/skeleton';

enum ProductCardSize {
  base = 'base',
  sm = 'sm',
}

export interface ProductCardVerticalProps extends PropsWithStyle {
  /**
   * Disabled state of the card
   */
  disabled?: boolean;
  /**
   * Product ID
   */
  id: SfId;
  /**
   * Link to the product details page
   */
  link: LinkHref;
  /**
   * Old price of the product
   */
  oldPrice?: SfMoney;
  /**
   * Price of the product
   */
  price?: SfProduct['price'];
  /**
   * Rating of the product
   */
  rating?: number;
  /**
   * Rating count of the product
   */
  ratingCount?: number;
  /**
   * Show add to cart button
   */
  showAddToCartButton?: boolean;
  /**
   * Size of the card
   */
  size?: `${ProductCardSize}`;
  /**
   * SKU of the product
   */
  sku?: Maybe<string>;
  /**
   * Slot to render the image
   */
  slotImage: ReactNode;
  /**
   * Title of the product
   */
  title: string;
}

export default function ProductCardVertical({
  className,
  disabled,
  id,
  link,
  price,
  rating,
  ratingCount,
  showAddToCartButton = false,
  size = 'base',
  sku,
  slotImage,
  title,
}: ProductCardVerticalProps) {
  const t = useTranslations();

  return (
    <div
      className={classNames(
        'flex flex-col overflow-hidden rounded-md border border-neutral-200 hover:shadow-lg',
        className,
      )}
      data-testid="product-card-vertical"
    >
      <div className="relative">
        <Link className="block h-full" href={link}>
          {slotImage}
        </Link>
      </div>
      <div className="flex h-full flex-col border-t border-neutral-200 p-2 text-neutral-900 md:p-4">
        <SfLink
          as={Link}
          className={classNames(
            'text-sm text-inherit no-underline visited:!text-inherit hover:!text-primary-800 hover:underline active:text-primary-900',
            size === 'base' && 'md:text-base',
          )}
          dangerouslySetInnerHTML={{ __html: title }}
          href={link}
          variant="secondary"
        />
        {!!rating && (
          <div className="flex items-center pt-1">
            <SfRating max={5} size="xs" value={rating} />
            <SfCounter className="pl-1" size="xs">
              {ratingCount}
            </SfCounter>
          </div>
        )}
        {price && (
          <>
            <noscript>
              <DecoratedPrice
                className="mt-1"
                classNameVariants={{
                  regular: 'typography-headline-2',
                  special: 'text-base',
                }}
                price={price}
              />
            </noscript>
            <DecoratedPriceClient
              className="mt-1"
              classNameVariants={{
                regular: 'typography-headline-2',
                special: 'text-base',
              }}
              data-testid="product-card-vertical-price"
              id={id}
              sku={sku!}
            />
          </>
        )}
        {showAddToCartButton && sku && (
          <div className="mt-auto pt-2">
            <AddToCartButton disabled={disabled} productId={id} size="sm" sku={sku}>
              {t('AddToCartButton.label')}
            </AddToCartButton>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardVerticalSkeletonProps {
  count?: number;
}

export function ProductCardVerticalSkeleton({ count = 1 }: ProductCardVerticalSkeletonProps) {
  function SingleProductCardVerticalSkeleton() {
    return (
      <div className="rounded-md border border-neutral-200">
        <Skeleton className="aspect-square rounded-none" />
        <div className="flex flex-col gap-4 p-2 lg:p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  return Array.from({ length: count }).map((_, index) => <SingleProductCardVerticalSkeleton key={index} />);
}
