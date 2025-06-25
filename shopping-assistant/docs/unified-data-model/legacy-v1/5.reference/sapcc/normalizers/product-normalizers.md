# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map SAP `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map SAP `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                               | Default value | Description                                                                                                                              |
|-----------| -------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `context` | `NormalizeProductContext`                                                                          |               | Context needed for the normalizer. `transformImageUrl` is added to transform product images urls, and `sku` to specify a product variant |
| `product` | [`Product`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.product.html) |               | SAP Product                                                                                                                              |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                               | Default value | Description                                                                                      |
|-----------| -------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `context` | `NormalizeProductCatalogItemContext`                                                               |               | Context needed for the normalizer. `transformImageUrl` is added to transform product images urls |
| `product` | [`Product`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.product.html) |               | SAP Product                                                                                      |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeProduct` with `classifications` field which is available on SAP Product and `normalizeProductCatalogItem` with `description` field.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-sapcc";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProduct: (context, product) => {
          const { quantityLimit } = normalizers.normalizeProduct(context, product);
          
          return {
            classifications: product.classifications,
            isSmallQuantityLimit: quantityLimit && quantityLimit <= 10,
          }
        },
        normalizeProductCatalogItem: (context, product) => ({
          description: product.description,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

Since both normalizers accept SAP `Product` as a second argument, you may also use the same approach to use same representation for both `SfProduct` and `SfProductCatalogItem` models.

However, in this case you should be aware that `SfProductCatalogItem` will contain all the fields from `SfProduct` model and, it will affect the performance of the catalog page.

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/product/product.ts [product.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/product/productCatalog.ts [productCatalog.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/product/images.ts [images.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/product/rating.ts [rating.ts]
:::
