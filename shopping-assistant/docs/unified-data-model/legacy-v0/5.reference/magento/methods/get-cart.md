# `GetCart`
Implements `GetCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartFromContext, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCart = defineApi.getCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }

  const cart = await getCartFromContext(context);
  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(cart, getNormalizerContext(context));
});

```
