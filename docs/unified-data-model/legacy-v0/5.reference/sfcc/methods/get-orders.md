# `GetOrders`
Implements `GetOrders` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { Order } from "@vsf-enterprise/sfcc-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getOrders = defineApi.getOrders(async (context, args) => {
  await assertAuthorized(context);

  const { normalizeOrderListItem, normalizePagination } = getNormalizers(context);
  const normalizersContext = getNormalizerContext(context);

  const { currentPage = 1, pageSize = 20 } = args ?? {};
  const {
    data: orders = [],
    limit,
    offset,
    total,
  } = await context.api.getCustomerOrders({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
  });

  return {
    orders: orders
      .map((order: Order) => normalizeOrderListItem(order, normalizersContext))
      .filter(Boolean),
    pagination: normalizePagination({
      limit,
      total,
      offset,
    }),
  };
});

```
