# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map Commercetools `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map Commercetools `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                  | Default value | Description                                                                    |
|-----------| ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `context` | `NormalizeProductContext`                                                                             |               | Context needed for the normalizer. `sku` is added to specify a product variant |
| `product` | [`Product`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Product) |               | Commercetools Product                                                          |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                                                                                                               | Default value | Description                        |
|-----------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------- |
| `context` | `NormalizeProductCatalogItemContext`                                                                                                                                                                                               |               | Context needed for the normalizer. |
| `product` | [`ProductProjection`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/ProductProjection) or [`Product`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Product) |               | Commercetools Product              |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeProduct` with `type` field which is available on Commercetools Product and `normalizeProductCatalogItem` with `version` field.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-commercetools";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProduct: (context, product) => {
          const { quantityLimit } = normalizers.normalizeProduct(context, product);
          
          return {
            type: product.productType,
            isSmallQuantityLimit: quantityLimit && quantityLimit <= 10,
          }
        },
        normalizeProductCatalogItem: (context, product) => ({
          version: product.version,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Please keep in mind that the `normalizeProductCatalogItem` takes `ProductProjection` or `Product` as a first argument, so you may use [Typescript's type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) to narrow the type.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeMoney`, `normalizeRating`, `normalizeImage` and more, which you can override as well.

:::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/product/product.ts [product.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/product/productCatalog.ts [productCatalog.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/product/rating.ts [rating.ts]
:::
