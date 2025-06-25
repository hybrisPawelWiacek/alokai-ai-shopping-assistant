# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map Magento `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map Magento `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                                                        | Default value | Description                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `product` | [`ProductWithTypeName`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductInterface) ProductInterface with `__typename` |               | Magento Product                                                                |
| `ctx`     | `NormalizeProductContext`                                                                                                                   |               | Context needed for the normalizer. `sku` is added to specify a product variant |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                        | Default value | Description     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| `product` | [`ProductWithTypeName`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductInterface) ProductInterface with `__typename` |               | Magento Product |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeProduct` and `normalizeProductCatalogItem` with `countryOfManufacture` field which is available on Magento Product.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeProduct: (product, context) => ({
    ...normalizersMagento.normalizeProduct(product, context),
    countryOfManufacture: product.country_of_manufacture,
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersMagento.normalizeProductCatalogItem(product, context),
    countryOfManufacture: product.country_of_manufacture,
  }),
});
```

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeRating` `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
```ts [product.ts]
import { ConfigurableVariant } from "@vue-storefront/magento-types";
import sanitizeHtml from "sanitize-html";
import { ProductWithTypeName } from "../__internal__";
import { isConfigurableProduct } from "../__internal__/helpers";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizeProductInput, NormalizerContext } from "../types";
import { normalizeProductInterface } from "./productCatalog";
import { normalizeProductVariant } from "./variant";

export const normalizeProduct = defineNormalizer.normalizeProduct((product, ctx) => {
  const currentVariant = getVariant(product, ctx.sku);
  const description = product.description?.html ? sanitizeHtml(product.description.html) : null;
  const gallery =
    currentVariant.product?.media_gallery
      ?.filter(Boolean)
      .map((img) => ctx.normalizers.normalizeImage(img)) ?? [];

  return {
    ...normalizeProductInterface(product, currentVariant?.product, ctx),
    attributes: getAttributes(product, currentVariant, ctx),
    description,
    gallery,
    variants: getVariants(product, ctx),
  };
});

function getAttributes(
  product: ProductWithTypeName,
  currentVariant: { attributes: ConfigurableVariant["attributes"] },
  ctx: NormalizerContext,
) {
  if (!isConfigurableProduct(product)) {
    return [];
  }
  const configurableOptions = (product.configurable_options ?? []).filter(Boolean);
  const attributes = currentVariant.attributes;
  if (!attributes || !configurableOptions?.length) {
    return [];
  }

  return attributes
    .filter(Boolean)
    .map((attributeOption) =>
      ctx.normalizers.normalizeAttribute({ attributeOption, configurableOptions }),
    )
    .filter(Boolean);
}

function getVariant(product: ProductWithTypeName, sku?: string) {
  if (!isConfigurableProduct(product)) {
    return { product, attributes: [] };
  }
  const variant = product.variants?.find((variant) => variant?.product?.sku === sku);
  if (!variant?.product) {
    return { product, attributes: [] };
  }
  return { product: variant.product, attributes: variant.attributes?.filter(Boolean) ?? [] };
}

function getVariants(product: NormalizeProductInput, ctx: NormalizerContext) {
  if (isConfigurableProduct(product)) {
    const configurable_options = (product.configurable_options ?? []).filter(Boolean);
    return (product.variants ?? [])
      .filter(Boolean)
      .map((variant) => normalizeProductVariant(variant, configurable_options, ctx));
  }
  return [];
}
```
```ts [productCatalog.ts]

import { isConfigurableProduct } from "@/normalizers/__internal__";
import { maybe, slugify } from "@shared/utils";
import { ProductInterface } from "@vue-storefront/magento-types";
import { SfProductCatalogItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizerContext } from "../types";

export const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem(
  (product, ctx) => {
    if (isConfigurableProduct(product)) {
      // use the first variant as the main purchasable product or fallback to product
      const variant = product.variants?.[0]?.product ?? product;
      return normalizeProductInterface(product, variant, ctx);
    }
    return normalizeProductInterface(product, product, ctx);
  },
);

export function normalizeProductInterface(
  product: ProductInterface,
  variant: ProductInterface,
  ctx: NormalizerContext,
): SfProductCatalogItem {
  const { normalizeRating, normalizeDiscountablePrice, normalizeImage } = ctx.normalizers;

  return {
    id: product.sku!,
    slug: product.url_key || slugify(product.name ?? ""),
    rating: normalizeRating(product),
    price: variant?.price_range?.minimum_price
      ? normalizeDiscountablePrice(variant.price_range.minimum_price)
      : null,
    name: maybe(variant.name),
    sku: maybe(variant.sku),
    primaryImage: variant.thumbnail ? normalizeImage(variant.thumbnail) : null,
    quantityLimit: maybe(variant.only_x_left_in_stock),
  };
}
```
```ts [rating.ts]
/* eslint-disable eqeqeq */
import { normalize } from "../__internal__/helpers";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeRating = defineNormalizer.normalizeRating((productData) => {
  if (productData.rating_summary == undefined || productData.review_count == undefined) {
    return null;
  }
  return {
    average: normalizeRatingSummary(productData.rating_summary),
    count: productData.review_count,
  };
});

/*
 * Normalize rating summary from 0-100 to 0-5
 */
function normalizeRatingSummary(value: number): number {
  return normalize(value, 0, 100, 0, 5);
}
```
:::
