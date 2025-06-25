# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map SFCC `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map SFCC `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                                   | Default value | Description                                                                                         |
|-----------| ---------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                                                    |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |
| `product` | [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) |               | SFCC Product                                                                                        |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                                                                                                                                                 | Default value | Description                                                                                         |
|-----------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                                                                                                                                                                                                  |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |
| `product` | [`ProductSearchHit`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct_search_hit) or [`Product`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aproduct) |               | SFCC ProductSearchHit or Product                                                                    |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeProduct` with `manufacturerSku` field which is available on SFCC Product and `normalizeProductCatalogItem` with `productType` field.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-sfcc";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProduct: (context, product) => {
          const { quantityLimit } = normalizers.normalizeProduct(context, product);
          
          return {
            manufacturerSku: product.manufacturerSku,
            isSmallQuantityLimit: quantityLimit && quantityLimit <= 10,
          }
        },
        normalizeProductCatalogItem: (context, product) => ({
          productType: product.productType,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Since both normalizers accept SFCC `Product` as a second argument, you may also use the same approach to use same representation for both `SfProduct` and `SfProductCatalogItem` models.

However, in this case you should be aware that `SfProductCatalogItem` will contain all the fields from `SfProduct` model and, it will affect the performance of the catalog page.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/product/product.ts [product.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/product/productCatalog.ts [productCatalog.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/image/image.ts [image.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/product/variant.ts [variant.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/money/discountablePrice.ts [discountablePrice.ts]
:::
