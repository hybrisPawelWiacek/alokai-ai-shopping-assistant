# `GetCustomer`
Implements `GetCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomer = defineApi.getCustomer(async (context) => {
  const { normalizeCustomer } = getNormalizers(context);

  try {
    const {
      data: { 0: user },
    } = await context.api.getCustomers({});

    return {
      customer: normalizeCustomer(user!, getNormalizerContext(context)),
    };
  } catch {
    return {
      customer: null,
    };
  }
});

```
