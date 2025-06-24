# `GetProductReviews`
Implements `GetProductReviews` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { ProductReview } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getProductReviews = defineApi.getProductReviews(async (context, args) => {
  const { normalizeProductReview, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizers(context);

  const data = await context.api.getProductReviewCollection(
    {
      productId: Number.parseInt(args.productId),
    },
    {
      page: args.currentPage,
      limit: args.pageSize,
    },
  );

  return {
    reviews: data.data.map((element: ProductReview) =>
      normalizeProductReview(element, normalizerContext),
    ),
    pagination: normalizePagination(data?.meta?.pagination ?? {}, normalizerContext),
  };
});

```
