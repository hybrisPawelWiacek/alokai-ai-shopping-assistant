# `GetCart`
Implements `GetCart` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCart = defineApi.getCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const me = await context.api.getMe();
  let cart = me.data?.me.activeCart;

  if (!cart) {
    const response = await context.api.createCart();
    cart = response.data?.cart as Cart;
  }

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(cart, getNormalizerContext(context));
});

```
