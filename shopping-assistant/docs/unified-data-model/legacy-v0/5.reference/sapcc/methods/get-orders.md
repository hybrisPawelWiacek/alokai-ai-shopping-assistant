# `GetOrders`
Implements `GetOrders` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import "./extended.d";

export const getOrders = defineApi.getOrders(async (context, args) => {
  assertAuthorized(context);
  const { currentPage = 1, pageSize = 20 } = args ?? {};

  const { orders, pagination } = await context.api.getUserOrderHistory({
    currentPage: currentPage - 1,
    pageSize,
  });
  const { normalizeOrderListItem, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const normalizedOrders = orders
    ? orders?.map((order) => normalizeOrderListItem(order, normalizerContext)).filter(Boolean)
    : [];

  return {
    orders: normalizedOrders,
    pagination: normalizePagination(pagination, normalizerContext),
  };
});

```
