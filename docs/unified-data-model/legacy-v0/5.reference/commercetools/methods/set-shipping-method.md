# `SetShippingMethod`
Implements `SetShippingMethod` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import { cartActions } from "@vsf-enterprise/commercetools-api";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const setShippingMethod = defineApi.setShippingMethod(async (context, args) => {
  const version = await getCartVersion(context);

  const updatedCart = await context.api.updateCart({
    ...version,
    actions: [cartActions.setShippingMethodAction(args.shippingMethodId)],
  });

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

```
