# `RemoveCartLineItem`
Implements `RemoveCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizedCart } from "@/commons/cart";
import "./extended.d";

export const removeCartLineItem = defineApi.removeCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const { lineItemId } = args;

  const cart = await context.api.removeProductFromBasket({
    itemId: lineItemId,
  });

  return await getNormalizedCart(context, cart);
});

```
