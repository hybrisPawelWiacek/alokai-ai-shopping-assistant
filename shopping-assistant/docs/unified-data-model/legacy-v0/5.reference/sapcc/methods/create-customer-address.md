# `CreateCustomerAddress`
Implements `CreateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const createCustomerAddress = defineApi.createCustomerAddress(async (context, args) => {
  assertAuthorized(context);
  const { address } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const createdAddress = await context.api.createAddress({
    address: unnormalizeAddress(address),
  });

  return {
    address: normalizeCustomerAddress(createdAddress, normalizerContext),
  };
});

```
