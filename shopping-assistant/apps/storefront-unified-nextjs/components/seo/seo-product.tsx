// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { JsonLd } from 'react-schemaorg';
import type { Product, WithContext } from 'schema-dts';

import type { SeoProductProps } from './types';

const getProductFields = (product: SeoProductProps['product']) => {
  return {
    currency: product?.price?.regularPrice?.currency ?? '',
    description: product?.description ?? '',
    imageUrl: product?.gallery?.[0]?.url ?? '',
    name: product?.name ?? '',
    quantityLimit: product?.quantityLimit,
    regularPrice: product?.price?.regularPrice?.amount ?? 0,
    sku: product?.sku ?? '',
  };
};
const getAvailability = (quantityLimit: number) => {
  return (quantityLimit ?? 0) <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
};
const generateJsonLdData = (config: SeoProductProps): WithContext<Product> => {
  const payload = getProductFields(config.product);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: payload?.description,
    image: payload?.imageUrl,
    name: payload?.name,
    offers: {
      '@type': 'Offer',
      availability: getAvailability(payload.quantityLimit ?? 0),
      price: payload?.regularPrice,
      priceCurrency: payload?.currency,
    },
    sku: payload?.sku,
  };
};

export default function SeoItemList({
  config,
}: {
  /**
   * Component Config
   */
  config: SeoProductProps;
}) {
  const jsonLdData = generateJsonLdData(config);
  return <JsonLd<WithContext<Product>> item={jsonLdData} />;
}
