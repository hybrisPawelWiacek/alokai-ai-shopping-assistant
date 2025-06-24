# `LogoutCustomer`
Implements `LogoutCustomer` Unified Method.
        
## Source

```ts
import { VSF_UNIFIED_CART_ID_COOKIE } from "@shared/middleware-config";
import { defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { COOKIE_KEY_CUSTOMER_DATA } from "@vsf-enterprise/bigcommerce-api";

export const logoutCustomer = defineApi.logoutCustomer(async (context) => {
  try {
    await context.api.logoutCustomer();
  } catch {
    /* ignore BC error */
  }
  /* manually clear session cookie */
  context.res.cookie(COOKIE_KEY_CUSTOMER_DATA, "", {
    maxAge: 0,
  });
  context.res.cookie(VSF_UNIFIED_CART_ID_COOKIE, "", {
    maxAge: 0,
  });
});

```
