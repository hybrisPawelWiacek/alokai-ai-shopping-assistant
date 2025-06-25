# `GetCustomerAddresses`
Implements `GetCustomerAddresses` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getCustomerAddresses = defineApi.getCustomerAddresses(async (context) => {
  assertAuthorized(context);

  const { normalizeCustomerAddress } = getNormalizers(context);
  const { addresses = [] } = await context.api.getAddresses({});
  const normalizerContext = getNormalizerContext(context);

  return {
    addresses: addresses.map((address) => normalizeCustomerAddress(address, normalizerContext)),
  };
});

```
