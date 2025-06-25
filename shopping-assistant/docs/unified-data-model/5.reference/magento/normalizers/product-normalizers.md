# Product normalizers

Product includes two normalizers:

- **`normalizeProduct`**: This function is used to map Magento `Product` into [`SfProduct`](/unified-data-layer/unified-data-model#sfproduct), which includes a full product details
- **`normalizeProductCatalogItem`**: This function is used to map Magento `Product` into [`SfProductCatalogItem`](/unified-data-layer/unified-data-model#sfproductcatalogitem), which includes only basic product details, needed to display a product in a product catalog

## Parameters

### `normalizeProduct`

| Name      | Type                                                                                                                                        | Default value | Description                                                                    |
|-----------| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `context` | `NormalizeProductContext`                                                                                                                   |               | Context needed for the normalizer. `sku` is added to specify a product variant |
| `product` | [`ProductWithTypeName`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductInterface) ProductInterface with `__typename` |               | Magento Product                                                                |

### `normalizeProductCatalogItem`

| Name      | Type                                                                                                                                        | Default value | Description     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `product` | [`ProductWithTypeName`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductInterface) ProductInterface with `__typename` |               | Magento Product |

## Extending

The `SfProduct` model is returned from [`GetProductDetails`](/unified-data-layer/unified-methods/products#getproductdetails) method. The `SfProductCatalogItem` model is returned from [`GetProducts`]($base/reference/unified-methods.html#getproducts) method. If any of these models don't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. In the following example we extend the `normalizeProduct` and `normalizeProductCatalogItem` with `countryOfManufacture` field which is available on Magento Product.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-magento";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProduct: (context, product) => {
          const { quantityLimit } = normalizers.normalizeProduct(context, product);
          
          return {
            countryOfManufacture: product.country_of_manufacture,
            isSmallQuantityLimit: quantityLimit && quantityLimit <= 10,
          }
        },
        normalizeProductCatalogItem: (context, product) => ({
          countryOfManufacture: product.country_of_manufacture,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

## Source

The `normalizeProduct` and `normalizeProductCatalogItem` function consists of several smaller normalizers such as `normalizeImage`, `normalizeRating` `normalizeDiscountablePrice`, and more, which you can override as well.

:::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/product/product.ts [product.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/product/productCatalog.ts [productCatalog.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/product/rating.ts [rating.ts]
:::
