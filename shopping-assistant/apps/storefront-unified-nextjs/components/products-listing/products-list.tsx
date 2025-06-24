import { useTranslations } from 'next-intl';

import ImageWithPlaceholder from '@/components/image-with-placeholder';
import ProductCardVertical from '@/components/product-card-vertical';
import type { SfProductCatalogItem } from '@/types';

export interface ProductsListProps {
  /**
   * List of products to display.
   */
  products: SfProductCatalogItem[];
}

export default async function ProductListPage({ products }: ProductsListProps) {
  const t = useTranslations('ProductsList');

  return products.map(({ id, name: productTitle, price, primaryImage, quantityLimit, rating, sku, slug }, index) => (
    <ProductCardVertical
      disabled={quantityLimit === 0}
      id={id}
      key={id}
      link={{ params: { id, slug }, pathname: '/product/[slug]/[id]', query: { sku } }}
      oldPrice={price?.isDiscounted ? price.regularPrice : undefined}
      price={price}
      rating={rating?.average}
      ratingCount={rating?.count}
      showAddToCartButton
      sku={sku}
      slotImage={
        <ImageWithPlaceholder
          alt={primaryImage?.alt || productTitle || t('imageAltPlaceholder')}
          data-testid="image-slot"
          fetchPriority={index <= 1 ? 'high' : 'low'}
          height="320"
          nextImageClassName="object-contain aspect-square w-full h-full"
          placeholder="/images/placeholder-300.webp"
          priority={index <= 1}
          sizes="(max-width: 767px) 40vw, 320px"
          src={primaryImage?.url}
          unoptimized={!primaryImage}
          width="320"
        />
      }
      title={productTitle ?? ''}
    />
  ));
}
