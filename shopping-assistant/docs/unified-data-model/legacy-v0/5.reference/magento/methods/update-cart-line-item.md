# `UpdateCartLineItem`
Implements `UpdateCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCartLineItem = defineApi.updateCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cartId = getCartId(context);
  const { quantity, lineItemId } = args;
  const { normalizeCart } = getNormalizers(context);

  const data = await query(
    context.api.updateCartItems({
      cart_id: cartId,
      cart_items: [{ cart_item_uid: lineItemId, quantity }],
    }),
  );

  return normalizeCart(data?.updateCartItems?.cart, getNormalizerContext(context));
});

```
