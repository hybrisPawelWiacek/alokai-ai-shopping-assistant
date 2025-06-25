# `UpdateCartLineItem`
Implements `UpdateCartLineItem` Unified Method.
        
## Source

```ts
import { getCartFromContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizedCart } from "@/commons/cart";
import { CartIncludeEnum } from "@vsf-enterprise/bigcommerce-api";

export const updateCartLineItem = defineApi.updateCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cart = await getCartFromContext(context);

  const { quantity, lineItemId } = args;
  const cartId = cart.id as string;
  const productId = cart.line_items?.physical_items?.find(
    (item) => item.id === lineItemId,
  )?.product_id;

  if (productId == null) {
    throw new Error(`Line item with id ${lineItemId} not found in the cart`);
  }

  const { data: updatedCart } = await context.api.updateCartItem({
    cartId: cartId,
    itemId: lineItemId,
    data: {
      line_item: {
        product_id: productId,
        quantity,
      },
    },
    include: CartIncludeEnum.LineItemsPhysicalItemsOptions,
  });

  return await getNormalizedCart(context, updatedCart);
});

```
