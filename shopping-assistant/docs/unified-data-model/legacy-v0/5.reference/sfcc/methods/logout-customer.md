# `LogoutCustomer`
Implements `LogoutCustomer` Unified Method.
        
## Source

```ts
import { defineApi, assertAuthorized } from "@vsf-enterprise/unified-api-sfcc";
import "./extended.d";

export const logoutCustomer = defineApi.logoutCustomer(async (context) => {
  if (await assertAuthorized(context, { silent: true })) {
    await context.api.signOut();
  }
});

```
