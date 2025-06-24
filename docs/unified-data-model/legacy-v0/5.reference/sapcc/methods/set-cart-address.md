# `SetCartAddress`
Implements `SetCartAddress` Unified Method.
        
## Source

```ts
import { getCartId, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import {
  SfCreateAddressBody,
  SfCustomerAddress,
  getNormalizers,
} from "@vue-storefront/unified-data-model";
import "./extended.d";

function isSfCustomerAddress(
  address: SfCustomerAddress | SfCreateAddressBody,
): address is SfCustomerAddress {
  return "id" in address;
}

export const setCartAddress = defineApi.setCartAddress(async (context, args) => {
  const cartId = getCartId(context);
  const { shippingAddress } = args;

  const { normalizeCart, unnormalizeAddress } = getNormalizers(context);

  if (isSfCustomerAddress(shippingAddress)) {
    await context.api.replaceCartAddress({
      addressId: shippingAddress.id,
      cartId,
    });
  } else {
    const address = unnormalizeAddress(shippingAddress);
    await context.api.createCartAddress({
      address,
      cartId,
    });
  }

  const cart = await context.api.getCart({ cartId });

  return normalizeCart(cart, getNormalizerContext(context));
});

```
