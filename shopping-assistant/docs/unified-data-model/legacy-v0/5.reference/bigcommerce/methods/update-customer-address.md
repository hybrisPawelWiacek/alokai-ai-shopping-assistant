# `UpdateCustomerAddress`
Implements `UpdateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCustomerAddress = defineApi.updateCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address, id } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const body = {
    id: Number(id),
    ...unnormalizeAddress(address, normalizerContext),
  };

  const { data } = await context.api.updateCustomerAddress(body);
  const updatedAddress = data.at(0);

  if (!updatedAddress) {
    throw new Error("Address not updated");
  }

  return {
    address: normalizeCustomerAddress(updatedAddress, normalizerContext),
  };
});

```
