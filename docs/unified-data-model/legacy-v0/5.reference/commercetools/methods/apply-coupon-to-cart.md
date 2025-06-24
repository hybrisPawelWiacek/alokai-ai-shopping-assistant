# `ApplyCouponToCart`
Implements `ApplyCouponToCart` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const applyCouponToCart = defineApi.applyCouponToCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const version = await getCartVersion(context);
  if (!args.couponCode) {
    throw new Error("The provided coupon code is empty and cannot be applied.");
  }

  const updatedCart = await context.api.applyCartCoupon(version, args.couponCode);

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

```
