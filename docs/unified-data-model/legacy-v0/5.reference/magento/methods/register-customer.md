# `RegisterCustomer`
Implements `RegisterCustomer` Unified Method.
        
## Source

```ts
import { defineApi, query } from "@vsf-enterprise/unified-api-magento";
import { loginCustomer } from "../loginCustomer";

export const registerCustomer = defineApi.registerCustomer(async (context, args) => {
  const { email, firstName, lastName, password } = args;

  await query(
    context.api.createCustomer({
      firstname: firstName,
      lastname: lastName,
      email,
      password: password,
    }),
  );

  return loginCustomer(context, { email, password });
});

```
