import { getCartId, getNormalizers } from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import type { ReplaceOrgCartPaymentTypeArgs } from "./types";

export const replaceOrgCartPaymentType = async (
  context: SapccIntegrationContext,
  args: ReplaceOrgCartPaymentTypeArgs
) => {
  const cartId = args.cartId ?? getCartId(context);
  const { paymentType } = args;
  const { normalizeCart } = getNormalizers(context);

  if (!paymentType) {
    throw new Error(
      "Bad Request: missing required argument: `paymentType`. It is required to change payment type in the cart."
    );
  }

  try {
    await context.api.replaceOrgCartPaymentType({
      cartId,
      paymentType,
    });
  } catch {
    throw new Error("Bad Request: Could not change the payment type.");
  }

  const { data: cart } = await context.api.getCart({ cartId });

  return normalizeCart(cart);
};
