# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map Commercetools `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map Commercetools `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                  | Default value | Description                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `product` | [`Product`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Product) |               | Commercetools Product                                                          |
| `ctx`     | `NormalizeProductContext`                                                                             |               | Context needed for the normalizer. `sku` is added to specify a product variant |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                                                                                                               | Default value | Description                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------- |
| `product` | [`ProductProjection`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/ProductProjection) or [`Product`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Product) |               | Commercetools Product              |
| `ctx`     | `NormalizeProductCatalogItemContext`                                                                                                                                                                                               |               | Context needed for the normalizer. |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeProduct` with `type` field which is available on Commercetools Product and `normalizeProductCatalogItem` with `version` field.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeProduct: (product, context) => ({
    ...normalizersCT.normalizeProduct(product, context),
    type: product.productType,
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersCT.normalizeProductCatalogItem(product, context),
    version: product.version,
  }),
});
```

Please keep in mind that the `normalizeProductCatalogItem` takes `ProductProjection` or `Product` as a first argument, so you may use [Typescript's type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) to narrow the type.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeMoney`, `normalizeRating`, `normalizeImage` and more, which you can override as well.

:::code-group
```ts [product.ts]
import type { NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import type {
  Product,
  ProductVariant,
  RawProductAttribute,
} from "@vsf-enterprise/commercetools-types";
import type { SfProduct } from "@vue-storefront/unified-data-model";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { createSfImages } from "./images";

export const normalizeProduct = defineNormalizer.normalizeProduct((product, ctx) => {
  const {
    masterData: { current },
  } = product;
  const currentVariant = getVariant(product, ctx.sku);
  const { normalizeDiscountablePrice, normalizeRating } = ctx.normalizers;

  const { primaryImage, gallery } = createSfImages(currentVariant.images, ctx);
  const price = currentVariant.price ? normalizeDiscountablePrice(currentVariant.price) : null;
  const rating = product?.reviewRatingStatistics
    ? normalizeRating(product.reviewRatingStatistics)
    : null;
  const variants = normalizeVariants(current?.allVariants, ctx);
  const attributes = getAttributes(currentVariant.attributesRaw, ctx);

  return {
    id: product.id,
    sku: maybe(currentVariant?.sku),
    name: maybe(current?.name),
    slug: current?.slug || slugify(product.id, current?.name ?? ""),
    description: current?.description ? sanitizeHtml(current.description) : null,
    price,
    primaryImage,
    gallery,
    rating,
    variants,
    attributes,
    quantityLimit: maybe(currentVariant?.availability?.noChannel?.availableQuantity),
  };
});

function getVariant(product: Product, sku?: string): ProductVariant {
  const {
    masterData: { current },
  } = product;
  const allVariants = current?.allVariants ?? [];

  let currentVariant = current!.masterVariant;
  if (sku != null) {
    currentVariant = allVariants.find((variant) => variant?.sku === sku) ?? currentVariant;
  }

  return currentVariant;
}

function getAttributes(attributesRaw: RawProductAttribute[], ctx: NormalizerContext) {
  return attributesRaw.map((attr) => ctx.normalizers.normalizeAttribute(attr)).filter(Boolean);
}

function normalizeVariants(
  allVariants: Array<ProductVariant> | undefined,
  ctx: NormalizerContext,
): SfProduct["variants"] {
  if (!allVariants) {
    return [];
  }

  return allVariants.map((variant) => ({
    id: variant.id.toString(),
    sku: maybe(variant?.sku),
    name: null,
    slug: slugify(variant?.sku ?? variant.id.toString()),
    quantityLimit: maybe(variant?.availability?.noChannel?.availableQuantity),
    attributes: getAttributes(variant.attributesRaw, ctx),
  }));
}
```
```ts [productCatalog.ts]
import type { Product, ProductProjection } from "@vsf-enterprise/commercetools-types";
import type { SfProductCatalogItem } from "@vue-storefront/unified-data-model";
import type { NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import { createSfImages } from "./images";
import { normalizeProduct } from "./product";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem(
  (product, ctx) => {
    if (isProductProjection(product)) {
      return normalizeProductCatalogItemFromProductProjection(product, ctx);
    }

    return normalizeProductCatalogItemFromProduct(product, ctx);
  },
);

function isProductProjection(product: Product | ProductProjection): product is ProductProjection {
  return product.__typename === "ProductProjection";
}

function normalizeProductCatalogItemFromProductProjection(
  product: ProductProjection,
  ctx: NormalizerContext,
): SfProductCatalogItem {
  const currentVariant = product.masterVariant;

  const { primaryImage } = createSfImages(currentVariant.images, ctx);
  const price = currentVariant.price
    ? ctx.normalizers.normalizeDiscountablePrice(currentVariant.price)
    : null;
  const rating = product?.reviewRatingStatistics
    ? ctx.normalizers.normalizeRating(product.reviewRatingStatistics)
    : null;

  return {
    id: product.id,
    sku: maybe(currentVariant?.sku),
    name: product.name ? sanitizeHtml(product.name) : null,
    slug: product?.slug || slugify(product.id, product?.name ?? ""),
    price,
    primaryImage,
    rating,
    quantityLimit: maybe(currentVariant?.availability?.noChannel?.availableQuantity),
  };
}

function normalizeProductCatalogItemFromProduct(
  product: Product,
  ctx: NormalizerContext,
): SfProductCatalogItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { attributes, variants, gallery, description, ...normalizedProductCatalogItem } =
    normalizeProduct(product, ctx);

  return normalizedProductCatalogItem;
}

```
```ts [rating.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeRating = defineNormalizer.normalizeRating((reviewRatingStatistics) => {
  return {
    average: reviewRatingStatistics.averageRating,
    count: reviewRatingStatistics.count,
  };
});

```
:::
