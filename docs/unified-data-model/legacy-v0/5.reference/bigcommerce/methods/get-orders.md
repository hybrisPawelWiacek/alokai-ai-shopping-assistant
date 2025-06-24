# `GetOrders`
Implements `GetOrders` Unified Method.
        
## Source

```ts
/* eslint-disable max-lines-per-function */
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { Order } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import paginate from "jw-paginate";

export const getOrders = defineApi.getOrders(async (context, args) => {
  await assertAuthorized(context);

  const allOrders = await context.api.getOrders();
  const { normalizeOrderListItem, normalizePagination } = getNormalizers(context);

  const { pageSize = 20, currentPage = 1 } = args ?? {};
  const paginator = paginate(allOrders?.length ?? 0, currentPage, pageSize);

  const orders = (allOrders || [])
    .slice(paginator.startIndex, paginator.endIndex + 1)
    .map((order: Order) => normalizeOrderListItem(order, getNormalizerContext(context)));

  const pagination = normalizePagination({
    current_page: paginator.currentPage,
    per_page: paginator.pageSize,
    total: paginator.totalItems,
    total_pages: paginator.totalPages,
  });

  return {
    orders,
    pagination,
  };
});

```
