# `RegisterCustomer`
Implements `RegisterCustomer` Unified Method.
        
## Source

```ts
/* eslint-disable etc/throw-error */
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const registerCustomer = defineApi.registerCustomer(async (context, args) => {
  const { firstName, lastName, email, password } = args;

  if (!checkPasswordComplexity(password)) {
    throw { statusCode: 422, message: "Password does not meet complexity requirements" };
  }

  try {
    const { data } = await context.api.customerSignMeUp({
      email,
      password,
      firstName,
      lastName,
    });
    const { normalizeCustomer } = getNormalizers(context);

    return {
      // @ts-expect-error - CT types are not up to date
      customer: normalizeCustomer(data!.user!.customer, getNormalizerContext(context)),
    };
  } catch {
    throw { statusCode: 400, message: "Could not register customer" };
  }
});

function checkPasswordComplexity(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  if (!/\d/.test(password)) {
    return false;
  }
  return !!/[A-Z]/.test(password);
}

```
