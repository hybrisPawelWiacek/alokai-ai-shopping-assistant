# `GetCustomerAddresses`
Implements `GetCustomerAddresses` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomerAddresses = defineApi.getCustomerAddresses(async (context) => {
  await assertAuthorized(context);
  const addresses = await context.api.getCustomerAddress({});
  const { normalizeCustomerAddress } = getNormalizers(context);

  return {
    addresses: addresses.data.map((address) =>
      normalizeCustomerAddress(address, getNormalizerContext(context)),
    ),
  };
});

```
