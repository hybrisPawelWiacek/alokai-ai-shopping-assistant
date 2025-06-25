# `PlaceOrder`
Implements `PlaceOrder` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const placeOrder = defineApi.placeOrder(async (context) => {
  const cartId = getCartId(context);
  const order = await context.api.placeOrder({ cartId });
  const { normalizeOrder } = getNormalizers(context);

  return normalizeOrder(order, getNormalizerContext(context));
});

```
