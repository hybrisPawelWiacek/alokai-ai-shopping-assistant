# `DeleteCustomerAddress`
Implements `DeleteCustomerAddress` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const deleteCustomerAddress = defineApi.deleteCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { id } = args;

  const response = await context.api.deleteAddress({ addressName: id });

  if (response?.success === false) {
    throw { statusCode: 400, message: response.message ?? "Error deleting address" };
  }
});

```
