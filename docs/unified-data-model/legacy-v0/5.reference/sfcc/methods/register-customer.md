# `RegisterCustomer`
Implements `RegisterCustomer` Unified Method.
        
## Source

```ts
import { defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { validatePassword } from "@vue-storefront/unified-data-model";
import { loginCustomer } from "../loginCustomer";
import "./extended.d";

export const registerCustomer = defineApi.registerCustomer(async (context, args) => {
  const { email, firstName, lastName, password } = args;

  if (!validatePassword(password, password)) {
    // eslint-disable-next-line etc/throw-error
    throw { message: "Password does not meet the requirements", code: 422 };
  }
  try {
    await context.api.register({
      customer: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        login: email,
      },
      password: password,
    });
  } catch {
    throw { statusCode: 400, message: "Could not register customer" };
  }

  return loginCustomer(context, { email, password });
});

```
