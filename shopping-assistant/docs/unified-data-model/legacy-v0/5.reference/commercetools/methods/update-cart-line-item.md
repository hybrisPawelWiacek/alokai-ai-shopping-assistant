# `UpdateCartLineItem`
Implements `UpdateCartLineItem` Unified Method.
        
## Source

```ts
/* eslint-disable max-statements */
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCartLineItem = defineApi.updateCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const me = await context.api.getMe();
  const cart = me.data?.me.activeCart;

  if (!cart) {
    throw new Error("User has no active cart");
  }

  const lineItem = cart.lineItems.find(({ id }: { id: string }) => id === args.lineItemId);

  if (!lineItem) {
    throw new Error("The line item could not be found in the cart");
  }

  const updatedCart = await context.api.updateCartQuantity(
    {
      id: cart.id,
      version: cart.version,
    },
    {
      id: args.lineItemId,
      quantity: args.quantity,
    },
  );

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

```
