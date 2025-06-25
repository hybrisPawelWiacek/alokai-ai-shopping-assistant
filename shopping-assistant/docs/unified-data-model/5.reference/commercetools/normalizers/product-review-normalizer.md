# Product review normalizer

The `normalizeProductReview` function maps Commercetools `Review` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                                | Default value | Description          |
| -------- | --------------------------------------------------------------------------------------------------- | ------------- | -------------------- |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `review` | [`Review`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Review) |               | Commercetools Review |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfProductReview` with a `includedInStatistics` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProductReview: (context, review) => ({
          includedInStatistics: review.includedInStatistics
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/product/productReview.ts [productReview.ts]
