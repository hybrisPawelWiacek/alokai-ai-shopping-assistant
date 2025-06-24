// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, Product, WithContext } from 'schema-dts';

import type { SeoItemListProps } from './types';

const getProductCatalogItemFields = (items: SeoItemListProps['productCatalogItemList']) => {
  return items.map((item) => ({
    currency: item?.price?.regularPrice?.currency ?? '',
    name: item?.name ?? '',
    quantityLimit: item?.quantityLimit ?? 0,
    regularPrice: item?.price?.regularPrice?.amount ?? 0,
    sku: item?.sku ?? '',
  }));
};
const getAvailability = (quantityLimit: number) => {
  return (quantityLimit ?? 0) <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
};
const generateJsonLdData = (config: SeoItemListProps): WithContext<ItemList> => {
  const payload = getProductCatalogItemFields(config.productCatalogItemList);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: payload.map((item, index) => ({
      '@type': 'ListItem',
      item: {
        '@type': 'Product',
        name: item?.name,
        offers: {
          '@type': 'Offer',
          availability: getAvailability(item?.quantityLimit ?? 0),
          price: item?.regularPrice,
          priceCurrency: item?.currency,
        },
        sku: item?.sku,
      } as Product,
      position: index + 1,
    })),
  };
};

export default function SeoItemList({
  config,
}: {
  /**
   * Component Config
   */
  config: SeoItemListProps;
}) {
  const jsonLdData = generateJsonLdData(config);
  return <JsonLd<WithContext<ItemList>> item={jsonLdData} />;
}
