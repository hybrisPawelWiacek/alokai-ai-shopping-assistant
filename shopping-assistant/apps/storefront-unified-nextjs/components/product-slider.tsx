import type { SfScrollableButtonsPlacement, SfScrollableDirection } from '@storefront-ui/react';
import { SfScrollable } from '@storefront-ui/react';
import classNames from 'classnames';

import type { SfProductCatalogItem } from '@/types';

import ImageWithPlaceholder from './image-with-placeholder';
import ProductCardVertical from './product-card-vertical';
export enum SfScrollableScrollbar {
  always = 'always',
  auto = 'auto',
  hidden = 'hidden',
}

export interface ProductSliderProps {
  /**
   * Product slider direction (horizontal or vertical)
   */
  direction?: `${SfScrollableDirection}`;
  /**
   * Product slider navigation (none, floating, block)
   */
  navigation?: `${SfScrollableButtonsPlacement}`;
  /**
   * Product slider products
   */
  products: SfProductCatalogItem[];
  /**
   * Scrollbar visibility (always, auto, hidden)
   */
  scrollbar?: `${SfScrollableScrollbar}`;
  /**
   * Scroll snap
   */
  scrollSnap?: boolean;
}

export default function ProductSlider({ direction, navigation, products, scrollbar, scrollSnap }: ProductSliderProps) {
  return (
    <SfScrollable
      buttonsPlacement={navigation}
      className={classNames('items-center pb-4', {
        "[-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden": scrollbar === 'hidden',
        'overflow-x-visible': scrollbar === 'always',
        'snap-x snap-mandatory': scrollSnap,
      })}
      data-testid="slider"
      direction={direction}
    >
      {products.map(({ id, name, price, primaryImage, sku, slug }) => (
        <ProductCardVertical
          className={classNames('w-[148px] shrink-0 self-stretch md:w-[192px]', { 'snap-center': scrollSnap })}
          id={id}
          key={id + sku}
          link={{ params: { id, slug }, pathname: '/product/[slug]/[id]', query: { sku } }}
          oldPrice={price?.isDiscounted ? price?.regularPrice : undefined}
          price={price}
          size="sm"
          slotImage={
            <ImageWithPlaceholder
              alt={primaryImage?.alt || ''}
              data-testid="image-slot"
              height="192"
              nextImageClassName="object-contain aspect-square"
              placeholder="/images/placeholder-300.webp"
              src={primaryImage?.url}
              unoptimized={!primaryImage}
              width="192"
            />
          }
          title={name || ''}
        />
      ))}
    </SfScrollable>
  );
}
