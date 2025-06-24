# `UpdateCartLineItem`
Implements `UpdateCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizedCart } from "@/commons/cart";
import "./extended.d";

export const updateCartLineItem = defineApi.updateCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const { lineItemId, quantity } = args;

  const cart = await context.api.updateProductInBasket({
    itemId: lineItemId,
    quantity,
  });

  return await getNormalizedCart(context, cart);
});

```
