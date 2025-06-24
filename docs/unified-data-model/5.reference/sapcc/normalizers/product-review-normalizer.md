# Product review normalizer

The `normalizeProductReview` function maps SAP `Review` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                                   | Default value | Description |
| -------- | ------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `review` | [`Review`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.review.html) |               | SAP Review  |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfProductReview` with a `alias` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProductReview: (context, review) => ({
          alias: review.alias,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/product/productReview.ts [productReview.ts]
