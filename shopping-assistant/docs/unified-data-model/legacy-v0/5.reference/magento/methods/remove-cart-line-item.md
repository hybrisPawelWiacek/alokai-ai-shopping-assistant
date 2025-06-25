# `RemoveCartLineItem`
Implements `RemoveCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const removeCartLineItem = defineApi.removeCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  const data = await query(
    context.api.removeItemFromCart({
      cart_id: cartId,
      cart_item_uid: args.lineItemId,
    }),
  );

  return normalizeCart(data?.removeItemFromCart?.cart, getNormalizerContext(context));
});

```
