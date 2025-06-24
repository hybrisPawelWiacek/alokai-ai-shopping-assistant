# Product review normalizer

The `normalizeProductReview` function maps SAP `Review` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                                   | Default value | Description |
| -------- | ------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `review` | [`Review`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.review.html) |               | SAP Review  |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfProductReview` with a `alias` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeProductReview: (review) => ({
    ...normalizersSAP.normalizeProductReview(review),
    alias: review.alias,
  }),
});
```

## Source

```ts [productReview.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeProductReview = defineNormalizer.normalizeProductReview((review) => {
  return {
    id: review.id! as string,
    title: maybe(review.id),
    text: maybe(review.comment),
    rating: maybe(review.rating),
    reviewer: maybe(review.principal?.name),
    createdAt: new Date(review.date!).toISOString(),
  };
});
```
