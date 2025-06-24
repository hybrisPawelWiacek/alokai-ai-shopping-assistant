# `ApplyCouponToCart`
Implements `ApplyCouponToCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const applyCouponToCart = defineApi.applyCouponToCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  if (!args.couponCode) {
    throw new Error("The provided coupon code is empty and cannot be applied.");
  }

  const data = await query(
    context.api.applyCouponToCart({ cart_id: cartId, coupon_code: args.couponCode }),
  );

  return normalizeCart(data?.applyCouponToCart?.cart, getNormalizerContext(context));
});

```
