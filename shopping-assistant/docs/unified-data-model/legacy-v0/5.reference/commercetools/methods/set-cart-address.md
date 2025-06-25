# `SetCartAddress`
Implements `SetCartAddress` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import { cartActions } from "@vsf-enterprise/commercetools-api";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const setCartAddress = defineApi.setCartAddress(async (context, args) => {
  const version = await getCartVersion(context);
  const { normalizeCart, unnormalizeAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const updatedCart = await context.api.updateCart({
    ...version,
    actions: [
      cartActions.setShippingMethodAction(),
      cartActions.setShippingAddressAction(
        unnormalizeAddress(args.shippingAddress, normalizerContext),
      ),
    ],
  });

  return normalizeCart(updatedCart.data?.cart as Cart, normalizerContext);
});

```
