# `RemoveCouponFromCart`
Implements `RemoveCouponFromCart` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const removeCouponFromCart = defineApi.removeCouponFromCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const version = await getCartVersion(context);

  const updatedCart = await context.api.removeCartCoupon(version, {
    id: args.couponId,
    typeId: "discount-code",
  });

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

```
