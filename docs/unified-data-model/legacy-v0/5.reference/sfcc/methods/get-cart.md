# `GetCart`
Implements `GetCart` Unified Method.
        
## Source

```ts
import type { Basket } from "@vsf-enterprise/sfcc-types";
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizedCart } from "@/commons/cart";
import "./extended.d";

export const getCart = defineApi.getCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  let cart: Basket | undefined = await context.api.getBasket();

  if (!cart) {
    const customer = await assertAuthorized(context, { silent: true });
    cart = await context.api.createBasket({
      ...(customer?.email && { customerInfo: { email: customer.email } }),
    });
  }

  return await getNormalizedCart(context, cart);
});

```
