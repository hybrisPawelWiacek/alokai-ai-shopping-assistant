import { getCartId, getNormalizers } from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import type { ReplaceOrgCartCostCenterArgs } from "./types";

export const replaceOrgCartCostCenter = async (
  context: SapccIntegrationContext,
  args: ReplaceOrgCartCostCenterArgs
) => {
  const cartId = args.cartId ?? getCartId(context);
  const { costCenterId } = args;
  const { normalizeCart } = getNormalizers(context);

  if (!costCenterId) {
    throw new Error(
      "Bad Request: missing required argument: `costCenterId`. It is required to change the cost center in the cart."
    );
  }

  try {
    await context.api.replaceOrgCartCostCenter({
      cartId,
      costCenterId,
    });
  } catch {
    throw new Error("Bad Request: Could not change the cost center.");
  }

  const { data: cart } = await context.api.getCart({ cartId });

  return normalizeCart(cart);
};
