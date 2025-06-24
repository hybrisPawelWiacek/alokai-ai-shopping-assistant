# `ApplyCouponToCart`
Implements `ApplyCouponToCart` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizedCart } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const applyCouponToCart = defineApi.applyCouponToCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const { couponCode } = args;

  if (!couponCode) {
    throw new Error("The provided coupon code is empty and cannot be applied.");
  }

  const cart = await context.api.addCouponToBasket({ code: couponCode });

  return getNormalizedCart(context, cart);
});

```
