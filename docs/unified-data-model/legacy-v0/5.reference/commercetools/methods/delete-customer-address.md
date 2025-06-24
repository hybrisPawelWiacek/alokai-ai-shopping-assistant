# `DeleteCustomerAddress`
Implements `DeleteCustomerAddress` Unified Method.
        
## Source

```ts
import { getCurrentCustomer, defineApi } from "@vsf-enterprise/unified-api-commercetools";

export const deleteCustomerAddress = defineApi.deleteCustomerAddress(async (context, args) => {
  const { id } = args;
  const { version } = await getCurrentCustomer(context);

  await context.api.deleteShippingAddress({
    address: {
      id,
    },
    user: { version },
  });
});

```
