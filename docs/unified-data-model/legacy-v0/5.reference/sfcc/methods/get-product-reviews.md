# `GetProductReviews`
Implements `GetProductReviews` Unified Method.
        
## Source

```ts
import { ReturnNormalizerType, defineApi } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const getProductReviews = defineApi.getProductReviews(async (context) => {
  return {
    reviews: [],
    pagination: {
      currentPage: 0,
      pageSize: 0,
      totalResults: 0,
      totalPages: 0,
    } as ReturnNormalizerType<typeof context, "normalizePagination">,
  };
});

```
