# `UpdateCustomerAddress`
Implements `UpdateCustomerAddress` Unified Method.
        
## Source

```ts
import { defineApi, getCurrentCustomer, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";

import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCustomerAddress = defineApi.updateCustomerAddress(async (context, args) => {
  const { address, id } = args;
  const { version, defaultShippingAddressId } = await getCurrentCustomer(context);
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  await context.api.updateShippingAddress({
    address: { id, ...unnormalizeAddress(address, normalizerContext) },
    // seems that there is an issue with types for defaultShippingAddressId, it shouldn't be required
    user: { version, defaultShippingAddressId: defaultShippingAddressId! },
  });
  const customerUpdated = await getCurrentCustomer(context);
  const updatedAddress = customerUpdated.shippingAddresses.find((address) => address.id === id);

  if (!updatedAddress) {
    throw new Error("Address not found");
  }

  return {
    address: normalizeCustomerAddress(updatedAddress, normalizerContext),
  };
});

```
