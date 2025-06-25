# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map BigCommerce `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map BigCommerce `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                              | Default value | Description                                                                    |
| --------- | ------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `product` | [`Product`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Product) |               | BigCommerce Product                                                            |
| `ctx`     | `NormalizeProductContext`                                                                         |               | Context needed for the normalizer. `sku` is added to specify a product variant |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                              | Default value | Description                        |
| --------- | ------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------- |
| `product` | [`Product`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Product) |               | BigCommerce Product                |
| `ctx`     | `NormalizeProductContext`                                                                         |               | Context needed for the normalizer. |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeProduct` and `normalizeProductCatalogItem` with `availabilityDescription` field which is available on BigCommerce Product.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeProduct: (product, context) => ({
    ...normalizersBC.normalizeProduct(product, context),
    availabilityDescription: product.availability_description,
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersBC.normalizeProductCatalogItem(product, context),
    availabilityDescription: product.availability_description,
  }),
});
```

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeMoney`, `normalizeRating` and more, which you can override as well.

:::code-group
```ts [product.ts]
import { getProductQuantityLimit } from "@/normalizers/__internal__";
import type { NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import type { Product, ProductVariant } from "@vsf-enterprise/bigcommerce-api";
import type { SfProduct } from "@vue-storefront/unified-data-model";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { createSfImages, type SfImages } from "./images";
import { normalizeProductPrice } from "./productPrice";

export const normalizeProduct = defineNormalizer.normalizeProduct((product, ctx) => {
  const currentVariant = getVariant(product, ctx.sku);

  const { primaryImage, gallery } = getImages(product, currentVariant);
  const price = normalizeProductPrice(product, currentVariant, ctx);
  const variants = normalizeVariants(product, ctx);
  const rating = ctx.normalizers.normalizeRating(product);
  const productAvailableQuantity = getProductQuantityLimit(product);

  return {
    id: product.id.toString(),
    sku: currentVariant?.sku ?? product.sku,
    name: product.name,
    slug: slugify(product.custom_url.url || product.name),
    description: product.description ? sanitizeHtml(product.description) : null,
    price,
    primaryImage,
    gallery,
    rating,
    variants,
    attributes: currentVariant
      ? currentVariant.option_values
          .map((option) => ctx.normalizers.normalizeAttribute(option))
          .filter(Boolean)
      : [],
    quantityLimit: maybe(productAvailableQuantity(currentVariant?.inventory_level)),
  };
});

function getVariant(product: Product, sku?: string): ProductVariant | undefined {
  let currentVariant = product.variants?.find((variant) => variant.id === product.base_variant_id);

  if (sku != null) {
    currentVariant = product.variants?.find((variant) => variant.sku === sku) ?? currentVariant;
  }

  return currentVariant;
}

function normalizeVariants(product: Product, ctx: NormalizerContext): SfProduct["variants"] {
  const variants = product.variants ?? [];
  const productQuantity = getProductQuantityLimit(product);

  return variants.map((variant) => ({
    id: variant.id.toString(),
    sku: variant.sku,
    name: null,
    slug: slugify(variant.sku),
    quantityLimit: maybe(productQuantity(variant.inventory_level)),
    attributes: variant.option_values
      .map((option) => ctx.normalizers.normalizeAttribute(option))
      .filter(Boolean),
  }));
}

function getImages(product: Product, currentVariant?: ProductVariant): SfImages {
  const { primaryImage, gallery } = createSfImages(product.images ?? []);
  const currentGallery = currentVariant?.image_url
    ? [{ alt: currentVariant.sku, url: currentVariant.image_url }]
    : gallery;

  return {
    primaryImage,
    gallery: currentGallery,
  };
}

```
```ts [productCatalog.ts]
import { slugify } from "@shared/utils";
import { InventoryTrackingType, Product } from "@vsf-enterprise/bigcommerce-api";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { createSfImages } from "./images";
import { normalizeProductPrice } from "./productPrice";

export const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem(
  (product, ctx) => {
    const { primaryImage } = createSfImages(product.images ?? []);
    const price = normalizeProductPrice(product, undefined, ctx);
    const rating = ctx.normalizers.normalizeRating(product);

    return {
      id: product.id.toString(),
      sku: product.sku,
      name: sanitizeHtml(product.name),
      slug: slugify(product.custom_url.url || product.name),
      price,
      primaryImage,
      rating,
      quantityLimit: getProductQuantityLimit(product),
    };
  },
);

function getProductQuantityLimit(product: Product): number | null {
  if (product.inventory_tracking === InventoryTrackingType.none) {
    return null;
  } else if (product.inventory_tracking === InventoryTrackingType.product) {
    return product.inventory_level;
  }
  return null;
}

```
```ts [rating.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeRating = defineNormalizer.normalizeRating((product) => {
  let rating = null;

  if (product.reviews_count > 0) {
    rating = {
      average: product.reviews_rating_sum / product.reviews_count,
      count: product.reviews_count,
    };
  }

  return rating;
});

```
:::
