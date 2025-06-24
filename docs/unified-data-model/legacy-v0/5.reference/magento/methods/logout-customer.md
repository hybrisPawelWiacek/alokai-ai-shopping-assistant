# `LogoutCustomer`
Implements `LogoutCustomer` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-magento";

export const logoutCustomer = defineApi.logoutCustomer(async (context) => {
  try {
    await context.api.revokeCustomerToken();
    context.config.state.setCustomerToken(null);
    context.config.state.setCartId(null);
    // eslint-disable-next-line no-empty
  } catch {}
});

```
