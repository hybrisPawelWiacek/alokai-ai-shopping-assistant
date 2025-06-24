# Product review normalizer

The `normalizeProductReview` function maps BigCommerce `ProductReview` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                                          | Default value | Description               |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `review` | [`ProductReview`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ProductReview) |               | BigCommerce ProductReview |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfProductReview` with a `status` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProductReview: (context, review) => ({
          status: review.status
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/product/productReview.ts [productReview.ts]
