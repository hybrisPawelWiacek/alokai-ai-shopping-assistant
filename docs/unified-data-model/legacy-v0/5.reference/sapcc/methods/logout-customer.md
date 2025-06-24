# `LogoutCustomer`
Implements `LogoutCustomer` Unified Method.
        
## Source

```ts
import { defineApi, setCartId } from "@vsf-enterprise/unified-api-sapcc";
import "./extended.d";

export const logoutCustomer = defineApi.logoutCustomer(async (context) => {
  try {
    await context.api.OAuthUserRevoke();
    setCartId(context, "");
    // eslint-disable-next-line no-empty
  } catch {}
});

```
