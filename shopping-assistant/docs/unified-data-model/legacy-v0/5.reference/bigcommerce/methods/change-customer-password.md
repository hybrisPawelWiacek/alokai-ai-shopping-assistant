# `ChangeCustomerPassword`
Implements `ChangeCustomerPassword` Unified Method.
        
## Source

```ts
/* eslint-disable unicorn/no-keyword-prefix */
import { defineApi, getCurrentCustomer } from "@vsf-enterprise/unified-api-bigcommerce";
import { validatePassword } from "@vue-storefront/unified-data-model";

const isUnauthorizedError = (error: unknown) =>
  error && typeof error === "object" && (error as any).statusCode === 403;

export const changeCustomerPassword = defineApi.changeCustomerPassword(async (context, args) => {
  const { email } = await getCurrentCustomer(context);
  const { currentPassword, newPassword, confirmPassword } = args;

  if (!validatePassword(newPassword, confirmPassword)) {
    throw { message: "Password does not meet the requirements", code: 422 };
  }

  try {
    await context.api.updateCustomer({
      validation: {
        email: email!,
        password: currentPassword,
      },
      authentication: {
        new_password: newPassword,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw { message: "Password change failed", code: 403 };
    }
    throw error;
  }
});

```
