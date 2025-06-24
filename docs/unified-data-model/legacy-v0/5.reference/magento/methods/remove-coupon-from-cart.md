# `RemoveCouponFromCart`
Implements `RemoveCouponFromCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const removeCouponFromCart = defineApi.removeCouponFromCart(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);

  const data = await query(
    context.api.removeCouponFromCart({
      cart_id: cartId,
    }),
  );

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(data?.removeCouponFromCart?.cart, getNormalizerContext(context));
});

```
