# `GetOrders`
Implements `GetOrders` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getOrders = defineApi.getOrders(async (context, args) => {
  await assertAuthorized(context);
  const { normalizeOrderListItem, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const { currentPage = 1, pageSize = 20 } = args ?? {};
  const data = await query(
    context.api.customerOrders({
      pageSize,
      currentPage,
    }),
  );
  const { items, total_count, page_info } = data.customer?.orders ?? {};

  return {
    orders: items?.map((order) => normalizeOrderListItem(order, normalizerContext)) ?? [],
    pagination: normalizePagination(
      { ...page_info, total_results: total_count },
      normalizerContext,
    ),
  };
});

```
