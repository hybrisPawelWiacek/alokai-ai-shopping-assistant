# `GetProductReviews`
Implements `GetProductReviews` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getReview } from "@vsf-enterprise/commercetools-api";
import { Review } from "@vsf-enterprise/commercetools-types";
import { GetProductReviewsArgs, getNormalizers } from "@vue-storefront/unified-data-model";

type GetReviewParams = Parameters<typeof getReview>[1];

export const getProductReviews = defineApi.getProductReviews(async (context, args) => {
  const response = await context.api.getReview(toGetReviewParams(args));
  const { normalizeProductReview, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  return {
    reviews: response.results.map((review: Review) =>
      normalizeProductReview(review, normalizerContext),
    ),
    pagination: normalizePagination(response, normalizerContext),
  };
});

function toGetReviewParams(args: GetProductReviewsArgs): GetReviewParams {
  const offset =
    args.pageSize && args.currentPage ? (args.currentPage - 1) * args.pageSize : undefined;

  return {
    productId: args.productId,
    limit: args.pageSize,
    offset,
  };
}

```
