import type { SapccIntegrationContext } from "@vsf-enterprise/sapcc-api";
import {
  type AddCartLineItemArgs,
  getCartId,
  getNormalizers,
} from "@vsf-enterprise/unified-api-sapcc";
import { AxiosError, AxiosHeaders } from "axios";

export const addCartLineItem = async (
  context: SapccIntegrationContext,
  args: AddCartLineItemArgs
) => {
  const cartId = args.cartId ?? getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  if (!args.sku) {
    throw new Error(
      "Bad Request: missing required argument: `sku`. It is required to add a product to the cart in SAP."
    );
  }

  const code = args.sku;
  const quantity = args.quantity ?? 1;

  const { data: orgCartEntries } = await context.api.doAddOrgCartEntries({
    cartId,
    orderEntryList: {
      orderEntries: [
        {
          quantity,
          product: {
            code,
          },
        },
      ],
    },
  });
  const { data: cart } = await context.api.getCart({ cartId });
  if (
    orgCartEntries?.cartModifications?.find(
      ({ statusCode }) => statusCode === "noStock"
    )
  ) {
    const headers = new AxiosHeaders();
    throw new AxiosError(
      "InsufficientStockError",
      undefined,
      undefined,
      undefined,
      {
        status: 200,
        data: { errors: [{ type: "InsufficientStockError" }] },
        statusText: "ok",
        config: { headers },
        headers,
      }
    );
  }

  return normalizeCart(cart);
};
