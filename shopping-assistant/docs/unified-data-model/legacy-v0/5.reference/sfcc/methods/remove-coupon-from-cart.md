# `RemoveCouponFromCart`
Implements `RemoveCouponFromCart` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizedCart } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const removeCouponFromCart = defineApi.removeCouponFromCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const { couponId } = args;

  const cart = await context.api.removeCouponFromBasket({
    couponItemId: couponId,
  });

  return await getNormalizedCart(context, cart);
});

```
