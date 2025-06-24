# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map SFCC `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map SFCC `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                                   | Default value | Description                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `product` | [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) |               | SFCC Product                                                                                        |
| `ctx`     | `NormalizerContext`                                                                                                    |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                                                                                                                                                 | Default value | Description                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `product` | [`ProductSearchHit`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct_search_hit) or [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) |               | SFCC ProductSearchHit or Product                                                                    |
| `ctx`     | `NormalizerContext`                                                                                                                                                                                                                                                  |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. In the following example we extend the `normalizeProduct` with `manufacturerSku` field which is available on SFCC Product and `normalizeProductCatalogItem` with `productType` field.

```ts
import { normalizers as normalizersSFC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";
import { defineNormalizers } from "@vue-storefront/unified-data-model";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeProduct: (product, context) => ({
    ...normalizersSFCC.normalizeProduct(product, context),
    manufacturerSku: product.manufacturerSku,
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersSFCC.normalizeProductCatalogItem(product, context),
    productType: product.productType,
  }),
});
```

Since both normalizers accepts SFCC `Product` as a first argument, you may also use the same approach to use same representation for both `SfProduct` and `SfProductCatalogItem` models.

```ts
import { normalizers as normalizersSFC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeProduct: (product, context) => ({
    ...normalizersSFCC.normalizeProduct(product, context),
  }),
  normalizeProductCatalogItem: (product, context) => ({
    ...normalizersSFCC.normalizeProduct(product, context),
  }),
});
```

However in this case you should be aware that `SfProductCatalogItem` will contain all the fields from `SfProduct` model and it will affect the performance of the catalog page.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
```ts [product.ts]
import { getImageGroupByViewType } from "@/normalizers/__internal__";
import type { ImageGroup, Product } from "@internal";
import type { NormalizerContext } from "../types";
import type { SfAttribute, SfImage } from "@vue-storefront/unified-data-model";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";
import { normalizeProductCatalogItemFromProduct } from "./productCatalog";
import { normalizeProductVariant } from "./variant";

// eslint-disable-next-line complexity
export const normalizeProduct = defineNormalizer.normalizeProduct((product, ctx) => {
  const baseFields = normalizeProductCatalogItemFromProduct(product, ctx);
  const description = product.longDescription
    ? sanitizeHtml(product.longDescription)
    : product.shortDescription
      ? sanitizeHtml(product.shortDescription)
      : null;

  let attributes: SfAttribute[] = [];
  // variationValues exists only for type.variant or type.item
  if (product.variationValues && product.variationAttributes) {
    attributes = getAttributes(product, ctx);
  }

  return {
    ...baseFields,
    attributes,
    description,
    gallery: getGallery(product.imageGroups ?? [], ctx),
    variants:
      product.variants?.map((variant) =>
        normalizeProductVariant(
          { variant, variationAttributes: product.variationAttributes ?? [] },
          ctx,
        ),
      ) ?? [],
  };
});

function getGallery(images: ImageGroup[], ctx: NormalizerContext): SfImage[] {
  if (!images?.length) {
    return [];
  }
  const imageGroup = getImageGroupByViewType(images, "large") ?? images[0];
  return imageGroup?.images.map((image) => ctx.normalizers.normalizeImage(image)) ?? [];
}

function getAttributes(product: Product, ctx: NormalizerContext): SfAttribute[] {
  const { variationValues, variationAttributes } = product;
  if (!variationValues || !variationAttributes) {
    return [];
  }
  return Object.entries(variationValues)
    .map(([key, value]) => {
      const attribute = { key, value };
      return ctx.normalizers.normalizeAttribute({ attribute, variationAttributes });
    })
    .filter(Boolean);
}
```
```ts [productCatalog.ts]
import { getProductPrimaryImage } from "@/normalizers/__internal__";
import type { NormalizerContext } from "@/normalizers/types";
import type { Inventory, Product, ProductSearchHit, Variant } from "@internal";
import { maybe, slugify } from "@shared/utils";
import type { Maybe, SfProductCatalogItem } from "@vue-storefront/unified-data-model";
import sanitizeHtml from "sanitize-html";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem(
  (product, ctx) => {
    if (isProductSearchHit(product)) {
      return normalizeProductCatalogItemFromProductSearchHit(product, ctx);
    }
    return normalizeProductCatalogItemFromProduct(product, ctx);
  },
);

function isProductSearchHit(product: ProductSearchHit | Product): product is ProductSearchHit {
  return Reflect.has(product, "hitType") || Reflect.has(product, "productId");
}

function normalizeProductCatalogItemFromProductSearchHit(
  product: ProductSearchHit,
  ctx: NormalizerContext,
): SfProductCatalogItem {
  const { normalizeDiscountablePrice, normalizeImage } = ctx.normalizers;

  return {
    id: product.productId,
    name: product.productName ? sanitizeHtml(product.productName) : null,
    slug: slugify(product.productId),
    price: normalizeDiscountablePrice(product),
    primaryImage: product.image ? normalizeImage(product.image) : null,
    sku: maybe(product.representedProduct?.id),
    rating: null,
    quantityLimit: getProductQuantityLimit(product),
  };
}

/*
 * User can search by product id, both master or its variants. Response may slightly differ depending on response product type.
 *
 * The idea behind this method is:
 * - if returned product is type.master, then get first variant and use its values for pricing or cart features (afaik master is not purchasable and returns aggregated prices values from its variants - e.g. min/max),
 * - if returned product is type.variant of type.item, then product itself is purchasable and should contain fields that are related to selected variants, e.g. tieredPrices or variationValues.
 * Reference: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts
 */
export function normalizeProductCatalogItemFromProduct(
  product: Product,
  ctx: NormalizerContext,
): SfProductCatalogItem {
  const productImage = getProductPrimaryImage(product.imageGroups);
  const currentVariant = getCurrentVariant(product);
  const { normalizeDiscountablePrice, normalizeImage } = ctx.normalizers;

  return {
    id: product.master?.masterId ?? product.id,
    name: maybe(product.name),
    slug: slugify(product.id),
    price: normalizeDiscountablePrice(product),
    primaryImage: productImage ? normalizeImage(productImage) : null,
    sku: currentVariant.productId ?? currentVariant.id,
    rating: null,
    quantityLimit: getProductQuantityLimit(product.inventory),
  };
}

function getProductQuantityLimit<TOrderable extends Pick<Inventory, "ats" | "orderable">>(
  orderableItem?: TOrderable,
): Maybe<number> {
  if (!orderableItem) return null;

  const { ats, orderable } = orderableItem;
  if (ats != null) {
    return ats;
  }
  if (orderable === false) {
    return 0;
  }
  return null;
}

function isMasterProduct(product: Product): boolean {
  return product.type?.master === true;
}

function getCurrentVariant(product: Product): Product | Variant {
  if (isMasterProduct(product) && !!product.variants?.[0]) {
    return product.variants[0];
  }
  return product;
}
```
```ts [variant.ts]
import { slugify } from "@shared/utils";
import { SfAttribute, SfProductVariant } from "@vue-storefront/unified-data-model";
import { NormalizeProductVariantInput, NormalizerContext } from "../types";

export function normalizeProductVariant(
  input: NormalizeProductVariantInput,
  ctx: NormalizerContext,
): SfProductVariant {
  const { variant } = input;

  return {
    id: variant.productId,
    slug: slugify(variant.productId),
    sku: variant.productId,
    name: null,
    quantityLimit: null,
    attributes: variant.variationValues ? getAttributes(input, ctx) : [],
  };
}

function getAttributes(input: NormalizeProductVariantInput, ctx: NormalizerContext): SfAttribute[] {
  const { variant, variationAttributes } = input;
  const variationValues = variant.variationValues;

  if (!variationValues) {
    return [];
  }

  return Object.entries(variationValues ?? [])
    .map(([key, value]) => {
      const attribute = { key, value };
      return ctx.normalizers.normalizeAttribute({ attribute, variationAttributes });
    })
    .filter(Boolean);
}
```
```ts [discountablePrice.ts]
import type { NormalizerContext } from "@/normalizers/types";
import type { ProductPriceTable } from "@internal";
import type { Maybe, SfDiscountablePrice } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeDiscountablePrice = defineNormalizer.normalizeDiscountablePrice(
  (input, ctx) => {
    const { tieredPrices, price, pricebookQuantity } = input;

    if (!price) {
      return null;
    }

    if (isTieredPrices(tieredPrices) && typeof price === "number") {
      return normalizeTieredPrices(ctx, {
        tieredPrices,
        price,
        pricebookQuantity: pricebookQuantity ?? 1,
      });
    }

    return normalizePrice(ctx, price);
  },
);

function isTieredPrices(value: unknown): value is ProductPriceTable[] {
  return (
    Array.isArray(value) && value.every((price) => isProductPriceTable(price)) && value.length > 1
  );
}

function isProductPriceTable(value: unknown): value is ProductPriceTable {
  return typeof value === "object" && value !== null && "price" in value && "pricebook" in value;
}

function normalizePrice(ctx: NormalizerContext, input: number) {
  const regularPrice = ctx.normalizers.normalizeMoney(input);
  const value = regularPrice;

  return {
    isDiscounted: false,
    regularPrice,
    value,
  };
}

function normalizeTieredPrices(
  ctx: NormalizerContext,
  data: {
    tieredPrices: ProductPriceTable[];
    price: number;
    pricebookQuantity: number;
  },
): Maybe<SfDiscountablePrice> {
  const { tieredPrices, price, pricebookQuantity } = data;
  const { normalizeMoney } = ctx.normalizers;

  const currentPriceList = tieredPrices.find(
    (priceTable) => priceTable.price === price && (priceTable?.quantity ?? 1) <= pricebookQuantity,
  );

  if (!currentPriceList || !currentPriceList.price) {
    return null;
  }

  const regularPrice = tieredPrices.reduce((acc, priceTable) => {
    if (
      (priceTable.price ?? 0) > currentPriceList.price! &&
      (priceTable?.quantity ?? 1) <= pricebookQuantity
    ) {
      return priceTable;
    }

    return acc;
  }, currentPriceList);

  const promotionalPrice = tieredPrices.reduce((acc, priceTable) => {
    if (
      (priceTable.price ?? 0) < currentPriceList.price! &&
      (priceTable?.quantity ?? 1) <= pricebookQuantity
    ) {
      return priceTable;
    }

    return acc;
  }, currentPriceList);

  const normalizedRegularPrice = normalizeMoney(regularPrice.price!);
  const isDiscounted = regularPrice.pricebook !== promotionalPrice.pricebook;

  return {
    isDiscounted,
    regularPrice: normalizedRegularPrice,
    value: isDiscounted ? normalizeMoney(promotionalPrice.price!) : normalizedRegularPrice,
  };
}
```
:::
