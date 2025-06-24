import type { AgnosticCmsProductListProps } from '@vsf-enterprise/cms-components-utils';
import classNames from 'classnames';

import ImageWithPlaceholder from '@/components/image-with-placeholder';
import ProductCardVertical from '@/components/product-card-vertical';
import { getSdk } from '@/sdk';
import type { SfProductCatalogItem } from '@/types';

export type ProductListProps = AgnosticCmsProductListProps;

export default async function ProductList({ items = [] }: ProductListProps) {
  const skus = items?.map(({ product }) => `${product}`);
  const { products } = await getSdk().unified.getProducts({ skus });

  if (products?.length === 0) {
    return null;
  }

  const productsList = skus.reduce<SfProductCatalogItem[]>((acc, entry) => {
    const productData = products.find((product) => product.sku === entry);
    if (productData) {
      acc.push(productData);
    }
    return acc;
  }, []);

  return productsList.map(({ id, name, price, primaryImage, sku, slug }) => (
    <ProductCardVertical
      className={classNames('w-[148px] shrink-0 self-stretch md:w-[192px]')}
      id={id}
      key={id + sku}
      link={{ params: { id, slug }, pathname: '/product/[slug]/[id]', query: { sku } }}
      oldPrice={price?.isDiscounted ? price?.regularPrice : undefined}
      price={price}
      size="sm"
      sku={sku}
      slotImage={
        <ImageWithPlaceholder
          alt={primaryImage?.alt ?? ''}
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
  ));
}
