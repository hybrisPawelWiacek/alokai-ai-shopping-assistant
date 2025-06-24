# `PlaceOrder`
Implements `PlaceOrder` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const placeOrder = defineApi.placeOrder(async (context) => {
  const cart = await context.api.getBasket();

  if (!cart.basketId) {
    throw new Error("Cart is empty");
  }

  const order = await context.api.createOrder({ basketId: cart.basketId });
  const { normalizeOrder } = getNormalizers(context);

  return normalizeOrder(order, getNormalizerContext(context));
});

```
