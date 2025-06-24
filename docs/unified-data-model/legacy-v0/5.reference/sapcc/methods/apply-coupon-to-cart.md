# `ApplyCouponToCart`
Implements `ApplyCouponToCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const applyCouponToCart = defineApi.applyCouponToCart(async (context, args) => {
  const cartId = args.cartId ?? getCartId(context);
  const { couponCode } = args;
  const { normalizeCart } = getNormalizers(context);

  if (!couponCode) {
    throw new Error("The provided coupon code is empty and cannot be applied.");
  }

  const updatedCart = await context.api.addVoucherAndGetNewCartVersion({
    voucherId: couponCode,
    cartId: cartId,
  });
  return normalizeCart(updatedCart, getNormalizerContext(context));
});

```
