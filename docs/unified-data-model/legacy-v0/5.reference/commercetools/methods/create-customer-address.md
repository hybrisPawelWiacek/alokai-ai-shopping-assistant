# `CreateCustomerAddress`
Implements `CreateCustomerAddress` Unified Method.
        
## Source

```ts
import { getCurrentCustomer, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const createCustomerAddress = defineApi.createCustomerAddress(async (context, args) => {
  const { address } = args;
  const { version } = await getCurrentCustomer(context);
  const { unnormalizeAddress, normalizeCustomerAddress } = getNormalizers(context);

  await context.api.addShippingAddress({
    address: unnormalizeAddress(address),
    user: { version },
  });
  const meUpdated = await context.api.getMe({ customer: true });
  const createdAddress = meUpdated.data?.me.customer?.shippingAddresses.at(0);

  if (!createdAddress) {
    throw new Error("Address not created");
  }

  return {
    address: normalizeCustomerAddress(createdAddress, getNormalizerContext(context)),
  };
});

```
