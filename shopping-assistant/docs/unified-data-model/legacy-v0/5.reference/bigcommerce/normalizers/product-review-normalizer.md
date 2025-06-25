# Product review normalizer

The `normalizeProductReview` function maps BigCommerce `ProductReview` into Unified [`SfProductReview`](/unified-data-layer/unified-data-model#sfproductreview).

## Parameters

| Name     | Type                                                                                                          | Default value | Description               |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| `review` | [`ProductReview`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ProductReview) |               | BigCommerce ProductReview |

## Extending

The `SfProductReview` is returned from [`GetProductReviews`](/unified-data-layer/unified-methods/products#getproductreviews) Method. If the `SfProductReview` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfProductReview` with a `status` field.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeProductReview: (review) => ({
    ...normalizersBC.normalizeProductReview(review),
    status: review.status
  }),
});
```

## Source

```ts [productReview.ts]
import { maybe } from "@shared/utils";
import { ProductReview } from "@vsf-enterprise/bigcommerce-api";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeProductReview = defineNormalizer.normalizeProductReview(
  (review: ProductReview) => {
    return {
      id: review.id.toString(),
      title: review.title,
      text: maybe(review.text),
      rating: review.rating,
      reviewer: review.name,
      createdAt: new Date(review.date_created).toISOString(),
    };
  },
);
```
