# Product review normalizer

The `normalizeProductReview` function maps Magento `ProductReview` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                            | Default value | Description           |
| -------- | ----------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `review` | [`ProductReview`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductReview) |               | Magento ProductReview |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfProductReview` with a `ratingsBreakdown` field.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeProductReview: (review) => ({
    ...normalizersMagento.normalizeProductReview(review),
    ratingsBreakdown: review.ratings_breakdown
  }),
});
```

## Source

```ts [productReview.ts]
import { maybe } from "@shared/utils";
import { randomUUID } from "node:crypto";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeProductReview = defineNormalizer.normalizeProductReview((review) => {
  return {
    id: randomUUID(),
    title: maybe(review.summary),
    text: maybe(review.text),
    rating:
      review.ratings_breakdown?.[0]?.value == null
        ? null
        : Number.parseInt(review.ratings_breakdown?.[0]?.value),
    reviewer: maybe(review.nickname),
    createdAt: new Date(review.created_at).toISOString(),
  };
});
```
