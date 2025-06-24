# `ApplyCouponToCart`
Implements `ApplyCouponToCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartId } from "@vsf-enterprise/unified-api-bigcommerce";
import { getCart } from "../getCart";

export const applyCouponToCart = defineApi.applyCouponToCart(async (context, args) => {
  if (args.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);

  // response doesn't include LineItemsPhysicalItemsOptions, so we have to get cart again
  await context.api.addCoupon({
    checkoutId: cartId,
    couponCode: args.couponCode,
  });

  return getCart(context);
});

```
