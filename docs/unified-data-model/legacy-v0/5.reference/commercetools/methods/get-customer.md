# `GetCustomer`
Implements `GetCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getCurrentCustomer, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomer = defineApi.getCustomer(async (context) => {
  try {
    const customer = await getCurrentCustomer(context);
    const { normalizeCustomer } = getNormalizers(context);

    return {
      customer: normalizeCustomer(customer, getNormalizerContext(context)),
    };
  } catch {
    return {
      customer: null,
    };
  }
});

```
