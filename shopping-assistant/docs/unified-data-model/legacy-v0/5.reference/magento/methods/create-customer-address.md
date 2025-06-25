# `CreateCustomerAddress`
Implements `CreateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { resolveRegionId } from "../helpers/resolveRegionId";

export const createCustomerAddress = defineApi.createCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address } = args;

  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const selectedRegion = await resolveRegionId(context, address);

  const createdAddress = await query(
    context.api.createCustomerAddress({
      ...unnormalizeAddress(address, normalizerContext),
      region: {
        region_id: selectedRegion.id,
      },
    }),
  );

  if (!createdAddress?.createCustomerAddress) {
    throw new Error("Address not created");
  }

  return {
    address: normalizeCustomerAddress(createdAddress.createCustomerAddress, normalizerContext),
  };
});

```
