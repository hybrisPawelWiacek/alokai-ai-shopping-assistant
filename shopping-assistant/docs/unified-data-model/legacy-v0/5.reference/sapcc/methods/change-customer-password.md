# `ChangeCustomerPassword`
Implements `ChangeCustomerPassword` Unified Method.
        
## Source

```ts
/* eslint-disable unicorn/no-keyword-prefix */
import { assertAuthorized, defineApi } from "@vsf-enterprise/unified-api-sapcc";
import { validatePassword } from "@vue-storefront/unified-data-model";
import "./extended.d";

const isUnauthorizedError = (error: unknown) =>
  error &&
  typeof error === "object" &&
  (error as any).response?.data?.errors?.[0]?.type === "PasswordMismatchError";

export const changeCustomerPassword = defineApi.changeCustomerPassword(async (context, args) => {
  await assertAuthorized(context);

  const { currentPassword, newPassword, confirmPassword } = args;

  if (!validatePassword(newPassword, confirmPassword)) {
    throw { message: "Password does not meet the requirements", code: 422 };
  }

  try {
    await context.api.changePassword({
      old: currentPassword,
      new: newPassword,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw { message: "Password change failed", code: 403 };
    }
    throw error;
  }
});

```
