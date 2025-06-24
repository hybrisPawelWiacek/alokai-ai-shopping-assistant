# `RemoveCouponFromCart`
Implements `RemoveCouponFromCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartId } from "@vsf-enterprise/unified-api-bigcommerce";
import { getCart } from "../getCart";

export const removeCouponFromCart = defineApi.removeCouponFromCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);
  // response doesn't include LineItemsPhysicalItemsOptions, so we have to get cart again
  await context.api.deleteCoupon({
    checkoutId: cartId,
    couponCode: args.couponId,
  });

  return getCart(context);
});

```
