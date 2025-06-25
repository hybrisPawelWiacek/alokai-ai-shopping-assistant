# `RemoveCouponFromCart`
Implements `RemoveCouponFromCart` Unified Method.
        
## Source

```ts
import { getCartId, defineApi } from "@vsf-enterprise/unified-api-sapcc";
import { getCart } from "../getCart";
import "./extended.d";

export const removeCouponFromCart = defineApi.removeCouponFromCart(async (context, args) => {
  const cartId = args.cartId ?? getCartId(context);

  await context.api.removeVoucherFromCart({
    cartId,
    voucherId: args.couponId,
  });
  return getCart(context);
});

```
