# `SetShippingMethod`
Implements `SetShippingMethod` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizedCart, getShipmentId } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const setShippingMethod = defineApi.setShippingMethod(async (context, args) => {
  const { shippingMethodId } = args;
  const shipmentId = getShipmentId(context);

  const cart = await context.api.updateShipment({
    shipmentId,
    shippingMethod: {
      id: shippingMethodId,
    },
  });

  return await getNormalizedCart(context, cart);
});

```
