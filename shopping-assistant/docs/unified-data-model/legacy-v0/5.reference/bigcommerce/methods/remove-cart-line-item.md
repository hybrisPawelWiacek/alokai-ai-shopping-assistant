# `RemoveCartLineItem`
Implements `RemoveCartLineItem` Unified Method.
        
## Source

```ts
/* eslint-disable max-statements */
import { getCartFromContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizedCart } from "@/commons/cart";
import { CartIncludeEnum } from "@vsf-enterprise/bigcommerce-api";

export const removeCartLineItem = defineApi.removeCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cart = await getCartFromContext(context);

  const { lineItemId } = args;
  const cartId = cart.id as string;
  const isLineItemFound =
    cart.line_items?.physical_items?.some((item) => item.id === lineItemId) ||
    cart.line_items?.digital_items?.some((item) => item.id === lineItemId);

  if (!isLineItemFound) {
    throw new Error(`Line item with id ${lineItemId} not found in the cart`);
  }

  const { data: updatedCart } = await context.api.removeCartItem({
    cartId,
    itemId: lineItemId,
    include: CartIncludeEnum.LineItemsPhysicalItemsOptions,
  });

  if (updatedCart) {
    return await getNormalizedCart(context, updatedCart);
  }

  const createdCart = await context.api.createCart({
    data: {
      line_items: [],
    },
  });

  return await getNormalizedCart(context, createdCart.data);
});

```
