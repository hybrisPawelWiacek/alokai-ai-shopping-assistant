# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map SAP `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map SAP `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                               | Default value | Description                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `product` | [`Product`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.product.html) |               | SAP Product                                                                                                                              |
| `ctx`     | `NormalizeProductContext`                                                                          |               | Context needed for the normalizer. `transformImageUrl` is added to transform product images urls, and `sku` to specify a product variant |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                               | Default value | Description                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `product` | [`Product`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.product.html) |               | SAP Product                                                                                      |
| `ctx`     | `NormalizeProductCatalogItemContext`                                                               |               | Context needed for the normalizer. `transformImageUrl` is added to transform product images urls |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeProduct` with `classifications` field which is available on SAP Product and `normalizeProductCatalogItem` with `description` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeProduct: (product, context) => ({
    ...normalizersSAP.normalizeProduct(product, context),
    classifications: product.classifications,
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersSAP.normalizeProductCatalogItem(product, context),
    description: product.description,
  }),
});
```

Since both normalizers accepts SAP `Product` as a first argument, you may also use the same approach to use same representation for both `SfProduct` and `SfProductCatalogItem` models.

```ts
import { normalizers as normalizersSAP } from "@vsf-enterprise/unified-api-sapcc";
import { defineNormalizers } from "@vue-storefront/unified-data-model";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeProduct: (product, context) => ({
    ...normalizersSAP.normalizeProduct(product, context),
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersSAP.normalizeProduct(product, context),
  }),
});
```

However in this case you should be aware that `SfProductCatalogItem` will contain all the fields from `SfProduct` model and it will affect the performance of the catalog page.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
```ts [product.ts]
import type { NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import type { VariantOption, VariantOptionQualifier } from "@vsf-enterprise/sapcc-types";
import type { SfProduct, SfProductVariant } from "@vue-storefront/unified-data-model";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { createSfImages } from "./images";
import { getOptions } from "@/normalizers/__internal__";

export const normalizeProduct = defineNormalizer.normalizeProduct((product, ctx) => {
  const { allOptions, currentOption } = getOptions(product, ctx.sku);

  const attributes = getAttributes(currentOption?.variantOptionQualifiers ?? [], ctx);
  const variants = normalizeVariants(allOptions, ctx);
  const { id, sku, name, slug, price, primaryImage, rating, quantityLimit } =
    ctx.normalizers.normalizeProductCatalogItem(product);
  const { gallery } = createSfImages(product.images, ctx);
  const description = product.description
    ? sanitizeHtml(product.description)
    : product.summary
      ? sanitizeHtml(product.summary)
      : null;

  return {
    id,
    sku,
    name,
    slug,
    price,
    primaryImage,
    rating,
    quantityLimit,
    attributes,
    variants,
    description,
    gallery,
  };
});

function normalizeVariants(
  variants: VariantOption[],
  ctx: NormalizerContext,
): SfProduct["variants"] {
  return variants.map((variant) => normalizeVariant(variant, ctx));
}

function normalizeVariant(variant: VariantOption, ctx: NormalizerContext): SfProductVariant {
  const id = variant.code as string;

  return {
    id,
    sku: id,
    slug: slugify(id),
    name: null,
    quantityLimit: maybe(variant.stock?.stockLevel),
    attributes: getAttributes(variant.variantOptionQualifiers ?? [], ctx),
  };
}

function getAttributes(optionQualifiers: VariantOptionQualifier[], ctx: NormalizerContext) {
  return optionQualifiers
    .map((optionQualifier) => ctx.normalizers.normalizeAttribute(optionQualifier))
    .filter(Boolean);
}
```
```ts [productCatalog.ts]
import { maybe, slugify } from "@shared/utils";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { createSfImages } from "./images";

export const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem(
  (product, ctx) => {
    const id = product.code as string;
    const { primaryImage } = createSfImages(product.images, ctx);
    const price = product.price ? ctx.normalizers.normalizeDiscountablePrice(product.price) : null;
    const rating = ctx.normalizers.normalizeRating(product);

    return {
      id,
      sku: maybe(product?.code),
      name: product.name ? sanitizeHtml(product.name) : null,
      slug: slugify(id, product?.name ?? ""),
      price,
      primaryImage,
      rating,
      quantityLimit: maybe(product.stock?.stockLevel),
    };
  },
);
```
```ts [images.ts]
import type { SfProduct } from "@vue-storefront/unified-data-model";
import type { NormalizerContext } from "@/normalizers/types";
import { ImageImageTypeEnum, type Image } from "@vsf-enterprise/sapcc-types";

export type SfImages = Pick<SfProduct, "primaryImage" | "gallery">;

export function createSfImages(images: Array<Image> = [], ctx: NormalizerContext): SfImages {
  const primaryImage = getPrimaryImage(images);
  return {
    primaryImage: primaryImage ? ctx.normalizers.normalizeImage(primaryImage) : null,
    gallery: getGalleryImages(images).map((image) => ctx.normalizers.normalizeImage(image)),
  };
}

function getGalleryImages(images: Array<Image>): Image[] {
  const galleryImages = images.filter(
    (image) => image.imageType === ImageImageTypeEnum.Gallery && isProductImage(image, "zoom"),
  );

  if (galleryImages.length === 0) {
    return images.filter((image) => isProductImage(image, "zoom"));
  }

  return galleryImages;
}

function getPrimaryImage(images: Array<Image>): Image | null {
  if (images.length === 0) {
    return null;
  }
  const primary = images.find(
    (image) => image.imageType === ImageImageTypeEnum.Primary && isProductImage(image),
  );

  return primary || images[0] || null;
}

function isProductImage(image: Image, format = "product"): image is Image {
  return image.format === format;
}
```
```ts [rating.ts]
import type { Product } from "@vsf-enterprise/sapcc-types";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeRating = defineNormalizer.normalizeRating((product) => {
  if (!isValidProductRating(product)) {
    return null;
  }
  return {
    average: product.averageRating,
    count: product.numberOfReviews,
  };
});

type ValidProductRating = Product & Required<Pick<Product, "averageRating" | "numberOfReviews">>;

function notNullable<TData>(value: TData): value is NonNullable<TData> {
  return value !== null && value !== undefined;
}

function isValidProductRating(product: Product): product is ValidProductRating {
  return notNullable(product.averageRating) && notNullable(product.numberOfReviews);
}
```
:::
