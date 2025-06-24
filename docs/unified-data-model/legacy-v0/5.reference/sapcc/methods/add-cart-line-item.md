# `AddCartLineItem`
Implements `AddCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const addCartLineItem = defineApi.addCartLineItem(async (context, args) => {
  const cartId = args.cartId ?? getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  if (args.sku == null) {
    throw new Error(
      "Bad Request: missing required argument: `sku`. It is required to add a product to the cart in SAP.",
    );
  }

  const code = args.sku;
  const quantity = args.quantity ?? 1;

  const cart = await context.api.addCartEntry({
    cartId,
    entry: {
      quantity,
      product: {
        code,
      },
    },
  });

  return normalizeCart(cart, getNormalizerContext(context));
});

```
