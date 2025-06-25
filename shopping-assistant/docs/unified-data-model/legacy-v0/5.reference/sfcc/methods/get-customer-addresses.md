# `GetCustomerAddresses`
Implements `GetCustomerAddresses` Unified Method.
        
## Source

```ts
import { defineApi, getCurrentCustomer, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getCustomerAddresses = defineApi.getCustomerAddresses(async (context) => {
  const { addresses = [] } = await getCurrentCustomer(context);

  const { normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  return {
    addresses: addresses?.map((address) => normalizeCustomerAddress(address, normalizerContext)),
  };
});

```
