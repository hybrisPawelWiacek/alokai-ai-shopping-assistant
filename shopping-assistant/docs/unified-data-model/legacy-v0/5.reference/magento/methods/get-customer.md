# `GetCustomer`
Implements `GetCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomer = defineApi.getCustomer(async (context) => {
  const { normalizeCustomer } = getNormalizers(context);

  try {
    const customerData = await query(context.api.customer());
    return {
      customer: normalizeCustomer(customerData.customer, getNormalizerContext(context)),
    };
  } catch {
    return { customer: null };
  }
});

```
