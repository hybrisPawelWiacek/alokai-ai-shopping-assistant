# `UpdateCustomerAddress`
Implements `UpdateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const updateCustomerAddress = defineApi.updateCustomerAddress(async (context, args) => {
  assertAuthorized(context);
  const { address, id } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  await context.api.updateAddress({
    addressId: id,
    address: unnormalizeAddress(address),
  });
  const updatedAddress = await context.api.getAddress({ addressId: id });

  return {
    address: normalizeCustomerAddress(updatedAddress, normalizerContext),
  };
});

```
