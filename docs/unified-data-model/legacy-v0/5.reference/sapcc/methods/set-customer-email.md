# `SetCustomerEmail`
Implements `SetCustomerEmail` Unified Method.
        
## Source

```ts
import { getCartId, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const setCustomerEmail = defineApi.setCustomerEmail(async (context, args) => {
  const cartId = getCartId(context);
  const { email } = args;
  const { normalizeCart } = getNormalizers(context);

  if (!cartId) {
    throw new Error("No cartId found");
  }

  try {
    await context.api.addGuestEmailToCart({ cartId, email });
    const cart = await context.api.getCart({ cartId });

    return normalizeCart(cart, getNormalizerContext(context));
  } catch {
    throw new Error("Error setting customer email");
  }
});

```
