# `ChangeCustomerPassword`
Implements `ChangeCustomerPassword` Unified Method.
        
## Source

```ts
/* eslint-disable unicorn/no-keyword-prefix */
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-sfcc";
import { validatePassword } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const changeCustomerPassword = defineApi.changeCustomerPassword(async (context, args) => {
  await assertAuthorized(context);

  const { currentPassword, newPassword, confirmPassword } = args;

  if (!validatePassword(newPassword, confirmPassword)) {
    throw { message: "Password does not meet the requirements", code: 422 };
  }

  const { success } = await context.api.updateCustomerPassword({
    currentPassword: currentPassword,
    password: newPassword,
  });

  if (!success) {
    throw { message: "Password change failed", code: 403 };
  }
});

```
