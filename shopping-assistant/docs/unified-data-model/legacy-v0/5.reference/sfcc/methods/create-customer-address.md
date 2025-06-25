# `CreateCustomerAddress`
Implements `CreateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { randomUUID } from "node:crypto";
import "./extended.d";

export const createCustomerAddress = defineApi.createCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address, ...rest } = args;
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const createdAddress = await context.api.createAddress({
    ...unnormalizeAddress(address),
    addressId: randomUUID(),
    ...rest,
  });

  return {
    address: normalizeCustomerAddress(createdAddress, normalizerContext),
  };
});

```
