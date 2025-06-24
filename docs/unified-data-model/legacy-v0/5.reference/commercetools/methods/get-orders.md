# `GetOrders`
Implements `GetOrders` Unified Method.
        
## Source

```ts
import { defineApi, getCurrentCustomer, getNormalizerContext, getOrderQuery } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { Order } from "@vsf-enterprise/commercetools-types";

export const getOrders = defineApi.getOrders(async (context, args) => {
  await getCurrentCustomer(context);
  const { normalizeOrderListItem, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const { currentPage = 1, pageSize = 20 } = args ?? {};
  const { orders, paginationData } = await getOrderQuery(context, { currentPage, pageSize });

  return {
    orders: orders.map((order: Order) => normalizeOrderListItem(order, normalizerContext)),
    pagination: normalizePagination(paginationData, normalizerContext),
  };
});

```
