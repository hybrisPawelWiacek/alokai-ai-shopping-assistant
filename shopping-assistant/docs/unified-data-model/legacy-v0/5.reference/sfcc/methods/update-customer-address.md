# `UpdateCustomerAddress`
Implements `UpdateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const updateCustomerAddress = defineApi.updateCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address, id } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const updatedAddress = await context.api.updateAddress({
    addressId: id,
    ...unnormalizeAddress(address),
  });

  return {
    address: normalizeCustomerAddress(updatedAddress, normalizerContext),
  };
});

```
