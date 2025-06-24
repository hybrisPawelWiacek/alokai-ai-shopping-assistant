# `DeleteCustomerAddress`
Implements `DeleteCustomerAddress` Unified Method.
        
## Source

```ts
import { FetchResult } from "@apollo/client/core";
import { assertAuthorized, defineApi, query } from "@vsf-enterprise/unified-api-magento";
import { DeleteCustomerAddressMutation } from "@vue-storefront/magento-types";

export const deleteCustomerAddress = defineApi.deleteCustomerAddress(async (context, args) => {
  await assertAuthorized(context);
  const { id } = args;

  await query(
    context.api.deleteCustomerAddress(Number.parseInt(id)) as Promise<
      FetchResult<DeleteCustomerAddressMutation>
    >,
  );
});

```
