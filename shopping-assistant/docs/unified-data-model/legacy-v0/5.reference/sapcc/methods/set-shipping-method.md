# `SetShippingMethod`
Implements `SetShippingMethod` Unified Method.
        
## Source

```ts
import { getCartId, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const setShippingMethod = defineApi.setShippingMethod(async (context, args) => {
  const cartId = getCartId(context);
  const { shippingMethodId: deliveryModeId } = args;
  const { normalizeCart } = getNormalizers(context);

  await context.api.replaceCartDeliveryMode({ cartId, deliveryModeId });

  const cart = await context.api.getCart({ cartId });
  return normalizeCart(cart, getNormalizerContext(context));
});

```
