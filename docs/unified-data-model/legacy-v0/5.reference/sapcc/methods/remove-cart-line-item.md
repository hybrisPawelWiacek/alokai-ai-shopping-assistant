# `RemoveCartLineItem`
Implements `RemoveCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const removeCartLineItem = defineApi.removeCartLineItem(async (context, args) => {
  const cartId = args.cartId ?? getCartId(context);
  const cart = await context.api.getCart({ cartId });

  const { lineItemId } = args;
  const { normalizeCart } = getNormalizers(context);

  const entryNumber = cart.entries?.find((item) => item.product?.code === lineItemId)?.entryNumber;

  if (entryNumber == null) {
    throw new Error(`Line item with id ${lineItemId} not found in the cart`);
  }

  const updatedCart = await context.api.deleteCartEntry({
    cartId,
    entryNumber,
  });

  return normalizeCart(updatedCart, getNormalizerContext(context));
});

```
