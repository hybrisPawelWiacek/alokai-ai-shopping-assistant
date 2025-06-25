# `LoginCustomer`
Implements `LoginCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { COOKIE_KEY_CUSTOMER_DATA } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";

const MESSAGE_LOGIN_ERROR = "Could not login customer";

export const loginCustomer = defineApi.loginCustomer(async (context, args) => {
  const loginData = await context.api.loginCustomer(args);
  const { normalizeCustomer } = getNormalizers(context);

  if (!loginData.is_valid) {
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }

  context.req.cookies[COOKIE_KEY_CUSTOMER_DATA] = loginData.token;
  const {
    data: { 0: user },
  } = await context.api.getCustomers({});

  if (!user) {
    throw { statusCode: 404, message: MESSAGE_LOGIN_ERROR };
  }

  return { customer: normalizeCustomer(user, getNormalizerContext(context)) };
});

```
