import {
  getCartId,
  getNormalizers,
  type SetCartAddressArgs,
  type SfCreateAddressBody,
  type SfCustomerAddress,
} from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
function isSfCustomerAddress(
  address: SfCustomerAddress | SfCreateAddressBody
): address is SfCustomerAddress {
  return "id" in address;
}

export const setCartAddress = async (
  context: SapccIntegrationContext,
  args: SetCartAddressArgs
) => {
  const cartId = getCartId(context);
  const { shippingAddress } = args;
  const { normalizeCart } = getNormalizers(context);

  if (!isSfCustomerAddress(shippingAddress)) {
    throw new Error(
      "Bad Request: missing `id` key in argument `shippingAddress`. It is required to change the delivery address in the cart."
    );
  }
  try {
    await context.api.replaceOrgCartDeliveryAddress({
      cartId,
      addressId: shippingAddress.id,
    });
  } catch {
    throw new Error("Bad Request: Could not change the delivery address.");
  }

  const { data: cart } = await context.api.getCart({ cartId });

  return normalizeCart(cart);
};
