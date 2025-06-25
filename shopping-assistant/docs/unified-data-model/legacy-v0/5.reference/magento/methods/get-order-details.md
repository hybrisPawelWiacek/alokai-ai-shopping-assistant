# `GetOrderDetails`
Implements `GetOrderDetails` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";

export const getOrderDetails = defineApi.getOrderDetails(async (context, args) => {
  await assertAuthorized(context);
  const { id } = args;
  const { normalizeOrder } = getNormalizers(context);

  const data = await query(
    context.api.customerOrders({
      filter: {
        number: { eq: id },
      },
      pageSize: 1,
      currentPage: 1,
    }),
  );

  const order = data.customer?.orders?.items?.[0] ?? {};

  return normalizeOrder(order, getNormalizerContext(context));
});

```
