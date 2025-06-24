# `LogoutCustomer`
Implements `LogoutCustomer` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-commercetools";

export const logoutCustomer = defineApi.logoutCustomer(async (context) => {
  await context.api.customerSignOut();
});

```
