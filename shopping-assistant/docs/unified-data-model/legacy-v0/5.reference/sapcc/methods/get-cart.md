# `GetCart`
Implements `GetCart` Unified Method.
        
## Source

```ts
import { defineApi, getCartFromContext, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getCart = defineApi.getCart(async (context, args) => {
  const data = await getCartFromContext(context, args);
  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(data, getNormalizerContext(context));
});

```
