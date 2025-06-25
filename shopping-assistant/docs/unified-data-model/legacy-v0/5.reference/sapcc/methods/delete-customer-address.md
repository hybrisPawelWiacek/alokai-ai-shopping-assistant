# `DeleteCustomerAddress`
Implements `DeleteCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-sapcc";
import "./extended.d";

export const deleteCustomerAddress = defineApi.deleteCustomerAddress(async (context, args) => {
  assertAuthorized(context);
  const { id } = args;

  await context.api.deleteAddress({ addressId: id });
});

```
