# `LoginCustomer`
Implements `LoginCustomer` Unified Method.
        
## Source

```ts
/* eslint-disable max-statements */
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { Customer } from "@vsf-enterprise/sfcc-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

const MESSAGE_LOGIN_ERROR = "Could not login customer";

export const loginCustomer = defineApi.loginCustomer(async (context, args) => {
  const { email, password } = args;
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);
  let customerData: Customer;

  try {
    customerData = await context.api.signIn({
      username: email,
      password: password,
    });
  } catch (error) {
    // eslint-disable-next-line etc/throw-error
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR, extra: error };
  }

  return { customer: normalizeCustomer(customerData, normalizerContext) };
});

```
