import { getCartId, getNormalizers } from "@vsf-enterprise/unified-api-sapcc";
import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import type { PlaceOrgOrderArgs } from "./types";

export const placeOrgOrder = async (
  context: SapccIntegrationContext,
  args: PlaceOrgOrderArgs
) => {
  const cartId = getCartId(context);
  const { termsChecked } = args;
  const { normalizeOrder } = getNormalizers(context);

  if (!termsChecked) {
    throw new Error(
      "Bad Request: missing or invalid argument: `termsChecked`. It is required to place order."
    );
  }

  const { data: order } = await context.api.placeOrgOrder({
    cartId,
    termsChecked,
  });
  return normalizeOrder(order);
};
