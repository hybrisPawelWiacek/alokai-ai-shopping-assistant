# `GetCart`
Implements `GetCart` Unified Method.
        
## Source

```ts
import { getCartFromContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizedCart } from "@/commons/cart";

export const getCart = defineApi.getCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cart = await getCartFromContext(context);

  return await getNormalizedCart(context, cart);
});

```
