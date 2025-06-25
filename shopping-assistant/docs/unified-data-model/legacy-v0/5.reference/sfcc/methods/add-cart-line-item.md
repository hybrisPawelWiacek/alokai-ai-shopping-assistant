# `AddCartLineItem`
Implements `AddCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizedCart } from "@/commons/cart";
import "./extended.d";

export const addCartLineItem = defineApi.addCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const { quantity = 1, sku } = args;

  if (!sku) {
    throw new Error("sku parameter is required");
  }

  const cart = await context.api.addProductsToBasket({
    items: [
      {
        productId: sku,
        quantity,
      },
    ],
  });

  return await getNormalizedCart(context, cart);
});

```
