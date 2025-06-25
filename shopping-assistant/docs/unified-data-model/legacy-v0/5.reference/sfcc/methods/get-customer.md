# `GetCustomer`
Implements `GetCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getCustomer = defineApi.getCustomer(async (context) => {
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  try {
    const customerData = await context.api.getCustomer();
    return { customer: normalizeCustomer(customerData, normalizerContext) };
  } catch {
    return { customer: null };
  }
});

```
