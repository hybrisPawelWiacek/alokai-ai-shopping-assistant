# Product review normalizer

The `normalizeProductReview` function maps Magento `ProductReview` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                            | Default value | Description           |
| -------- | ----------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `review` | [`ProductReview`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductReview) |               | Magento ProductReview |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfProductReview` with a `ratingsBreakdown` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProductReview: (context, review) => ({
          ratingsBreakdown: review.ratings_breakdown
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/product/productReview.ts [productReview.ts]
