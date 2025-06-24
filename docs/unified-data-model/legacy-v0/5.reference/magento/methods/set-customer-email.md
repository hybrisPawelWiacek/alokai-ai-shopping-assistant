# `SetCustomerEmail`
Implements `SetCustomerEmail` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const setCustomerEmail = defineApi.setCustomerEmail(async (context, args) => {
  const { email } = args;
  const cartId = getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  const data = await query(
    context.api.setGuestEmailOnCart({
      cart_id: cartId,
      email,
    }),
  );

  return normalizeCart(data.setGuestEmailOnCart?.cart, getNormalizerContext(context));
});

```
