# `GetProductReviews`
Implements `GetProductReviews` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { Review } from "@vsf-enterprise/sapcc-types";
import { SfPagination, getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getProductReviews = defineApi.getProductReviews(async (context, args) => {
  const { productId, currentPage, pageSize } = args;
  let reviewsData: Review[] = [];
  const { normalizeProductReview, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  try {
    const response = await context.api.getProductReviews({
      productCode: productId,
    });
    reviewsData = response.reviews ?? [];
  } catch {
    console.error("Error while fetching product reviews");
  }

  const { data, pagination } = paginatedResponse(reviewsData, currentPage, pageSize);

  return {
    reviews: data.map((review) => normalizeProductReview(review, normalizerContext)),
    pagination: pagination as ReturnType<typeof normalizePagination>,
  };
});

type PaginatedResponse<TData> = {
  data: TData[];
  pagination: SfPagination;
};

function paginatedResponse<TData>(
  data: TData[],
  currentPage = 0,
  pageSize = 0,
): PaginatedResponse<TData> {
  const totalPages = pageSize ? Math.ceil(data.length / pageSize) : 0;

  const start = currentPage * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    pagination: {
      currentPage,
      pageSize,
      totalResults: data.length,
      totalPages,
    },
  };
}

```
