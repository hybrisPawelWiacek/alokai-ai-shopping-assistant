# `GetOrderDetails`
Implements `GetOrderDetails` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const getOrderDetails = defineApi.getOrderDetails(async (context, args) => {
  await assertAuthorized(context);
  const { id } = args;
  const { normalizeOrder } = getNormalizers(context);

  const order = await context.api.getCustomerOrder({
    id,
  });

  const productsDetails = await context.api.getProducts({
    ids: order.productItems!.map((item) => item.productId).filter(Boolean),
  });

  const normalizerContext = getNormalizerContext(context, { productsDetails });

  return normalizeOrder(order, normalizerContext);
});

```
