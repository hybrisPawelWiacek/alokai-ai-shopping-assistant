# `SetCartAddress`
Implements `SetCartAddress` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const setCartAddress = defineApi.setCartAddress(async (context, args) => {
  const cartId = getCartId(context);
  const { unnormalizeAddress, normalizeCart } = getNormalizers(context);

  const data = await query(
    context.api.setShippingAddressesOnCart({
      cart_id: cartId,
      shipping_addresses: [{ address: unnormalizeAddress(args.shippingAddress) }],
    }),
  );

  return normalizeCart(data.setShippingAddressesOnCart?.cart, getNormalizerContext(context));
});

```
