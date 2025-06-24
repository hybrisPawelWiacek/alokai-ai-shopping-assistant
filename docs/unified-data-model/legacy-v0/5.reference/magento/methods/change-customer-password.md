# `ChangeCustomerPassword`
Implements `ChangeCustomerPassword` Unified Method.
        
## Source

```ts
/* eslint-disable unicorn/no-keyword-prefix */
import { assertAuthorized, defineApi, query } from "@vsf-enterprise/unified-api-magento";
import { validatePassword } from "@vue-storefront/unified-data-model";
import type { FetchResult } from "@apollo/client/core";

const isUnauthorizedError = (error: unknown) =>
  error &&
  typeof error === "object" &&
  "extensions" in error &&
  (error as FetchResult)?.extensions?.category === "graphql-authentication";

export const changeCustomerPassword = defineApi.changeCustomerPassword(async (context, args) => {
  await assertAuthorized(context);

  const { currentPassword, newPassword, confirmPassword } = args;

  if (!validatePassword(newPassword, confirmPassword)) {
    throw { message: "Password does not meet the requirements", code: 422 };
  }

  try {
    await query(
      context.api.changeCustomerPassword({
        currentPassword,
        newPassword,
      }),
    );
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw { message: "Password change failed", code: 403 };
    }
    throw error;
  }
});

```
