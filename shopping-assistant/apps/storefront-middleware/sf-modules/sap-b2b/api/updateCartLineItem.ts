import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import {
  getCartId,
  getNormalizers,
  type UpdateCartLineItemArgs,
} from "@vsf-enterprise/unified-api-sapcc";

export const updateCartLineItem = async (
  context: SapccIntegrationContext,
  args: UpdateCartLineItemArgs
) => {
  const cartId = args.cartId ?? getCartId(context);
  const { data: cart } = await context.api.getCart({ cartId });

  const { quantity, lineItemId } = args;
  const { normalizeCart } = getNormalizers(context);

  const isProductInCart = !!cart.entries?.find(
    (item) => item.product?.code === lineItemId
  );

  if (!isProductInCart) {
    throw new Error(`Line item with id ${lineItemId} not found in the cart`);
  }

  await context.api.replaceOrgCartEntries({
    cartId,
    orderEntryList: {
      orderEntries: [
        {
          quantity,
          product: {
            code: lineItemId,
          },
        },
      ],
    },
  });

  const { data: updatedCart } = await context.api.getCart({ cartId });

  return normalizeCart(updatedCart);
};
