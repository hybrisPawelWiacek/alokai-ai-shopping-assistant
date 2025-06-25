# `UpdateCustomerAddress`
Implements `UpdateCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { resolveRegionId } from "../helpers/resolveRegionId";

export const updateCustomerAddress = defineApi.updateCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { address, id } = args;

  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const selectedRegion = await resolveRegionId(context, address);

  const updatedAddress = await query(
    context.api.updateCustomerAddress({
      id: Number.parseInt(id),
      input: {
        ...unnormalizeAddress(address, normalizerContext),
        region: { region_id: selectedRegion.id },
      },
    }),
  );

  if (!updatedAddress?.updateCustomerAddress) {
    throw new Error("Address not found");
  }

  return {
    address: normalizeCustomerAddress(updatedAddress.updateCustomerAddress, normalizerContext),
  };
});

```
