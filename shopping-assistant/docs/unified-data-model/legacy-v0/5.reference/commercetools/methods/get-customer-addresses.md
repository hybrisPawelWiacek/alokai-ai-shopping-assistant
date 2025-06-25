# `GetCustomerAddresses`
Implements `GetCustomerAddresses` Unified Method.
        
## Source

```ts
import { getCurrentCustomer, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getCustomerAddresses = defineApi.getCustomerAddresses(async (context) => {
  const customer = await getCurrentCustomer(context);
  const { normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  return {
    addresses: customer.shippingAddresses.map((address) =>
      normalizeCustomerAddress(address, normalizerContext),
    ),
  };
});

```
