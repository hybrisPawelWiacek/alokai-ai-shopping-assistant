# `LoginCustomer`
Implements `LoginCustomer` Unified Method.
        
## Source

```ts
/* eslint-disable etc/throw-error */
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

const MESSAGE_LOGIN_ERROR = "Could not login customer";

export const loginCustomer = defineApi.loginCustomer(async (context, args) => {
  try {
    const loginData = await context.api.customerSignMeIn(args);
    const { normalizeCustomer } = getNormalizers(context);

    // @ts-expect-error -- CT types outdated
    const user = loginData.data?.user?.customer;

    if (!user) {
      throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
    }

    return { customer: normalizeCustomer(user, getNormalizerContext(context)) };
  } catch (error) {
    throw mapGraphQlError(error);
  }
});

// CT doesn't expose GQL errors type
function mapGraphQlError(err: any) {
  const isInvalidCredentials = err?.graphQLErrors?.find(
    (error: any) => error.extensions.code === "InvalidCredentials",
  );

  if (isInvalidCredentials) {
    return { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }

  return {
    statusCode: 500,
    message: "Internal Server Error",
  };
}

```
