# `GetOrderDetails`
Implements `GetOrderDetails` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import "./extended.d";

export const getOrderDetails = defineApi.getOrderDetails(async (context, args) => {
  const { id } = args;
  const data = await context.api.getUserOrders({ code: id });
  const { normalizeOrder } = getNormalizers(context);

  return normalizeOrder(data, getNormalizerContext(context));
});

```
