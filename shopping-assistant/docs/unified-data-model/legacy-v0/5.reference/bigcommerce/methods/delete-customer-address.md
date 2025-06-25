# `DeleteCustomerAddress`
Implements `DeleteCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";

export const deleteCustomerAddress = defineApi.deleteCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { id } = args;

  await context.api.deleteCustomerAddress({ "id:in": [Number(id)] });
});

```
