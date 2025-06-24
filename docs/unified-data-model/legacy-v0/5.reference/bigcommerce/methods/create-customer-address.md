# `CreateCustomerAddress`
Implements `CreateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const createCustomerAddress = defineApi.createCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);

  const response = await context.api.createCustomerAddress(
    unnormalizeAddress(address, getNormalizerContext(context)),
  );

  const createdAddress = response.data.at(0);

  if (!createdAddress) {
    throw new Error("Address not created");
  }

  return {
    address: normalizeCustomerAddress(createdAddress, getNormalizerContext(context)),
  };
});

```
