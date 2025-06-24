# `GetOrderDetails`
Implements `GetOrderDetails` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { defineApi, getCurrentCustomer, getNormalizerContext, getOrderQuery } from "@vsf-enterprise/unified-api-commercetools";

export const getOrderDetails = defineApi.getOrderDetails(async (context, args) => {
  await getCurrentCustomer(context);
  const { id } = args;
  const { normalizeOrder } = getNormalizers(context);

  const {
    orders: { 0: order },
  } = await getOrderQuery(context, { id });

  return normalizeOrder(order, getNormalizerContext(context));
});

```
