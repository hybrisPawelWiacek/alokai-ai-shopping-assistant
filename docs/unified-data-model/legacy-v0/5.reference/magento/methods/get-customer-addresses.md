# `GetCustomerAddresses`
Implements `GetCustomerAddresses` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomerAddresses = defineApi.getCustomerAddresses(async (context) => {
  await assertAuthorized(context);

  const addresses = await query(context.api.getCustomerAddresses());

  const { normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  return {
    addresses:
      addresses.customer?.addresses?.map((address) =>
        normalizeCustomerAddress(address, normalizerContext),
      ) || [],
  };
});

```
