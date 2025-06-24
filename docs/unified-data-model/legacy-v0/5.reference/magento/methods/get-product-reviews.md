# `GetProductReviews`
Implements `GetProductReviews` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import type { ProductReview } from "@vue-storefront/magento-types";

export const getProductReviews = defineApi.getProductReviews(async (context, args) => {
  const { productId, currentPage, pageSize } = args;
  const { normalizeProductReview, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const { data } = await context.api.productReview({
    filter: {
      sku: {
        eq: productId,
      },
    },
    currentPage,
    pageSize,
  });

  const productReviewItems = data?.products?.items?.[0];

  const reviews = (productReviewItems?.reviews?.items ?? [])
    .filter((element): element is ProductReview => element !== undefined)
    .map((element: ProductReview) => normalizeProductReview(element, normalizerContext));

  const pagination = normalizePagination(
    {
      ...productReviewItems?.reviews?.page_info,
      total_results: productReviewItems?.review_count,
    },
    normalizerContext,
  );

  return {
    reviews,
    pagination,
  };
});

```
