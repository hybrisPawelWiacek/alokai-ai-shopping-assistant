# `GetCustomer`
Implements `GetCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getCustomer = defineApi.getCustomer(async (context) => {
  try {
    const user = await context.api.getUser({});
    const { normalizeCustomer } = getNormalizers(context);
    const normalizerContext = getNormalizerContext(context);

    return {
      customer: normalizeCustomer(user, normalizerContext),
    };
  } catch {
    return {
      customer: null,
    };
  }
});

```
