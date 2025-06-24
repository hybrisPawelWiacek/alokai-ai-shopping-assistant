# `RegisterCustomer`
Implements `RegisterCustomer` Unified Method.
        
## Source

```ts
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { AUTH_USER_TOKEN_COOKIE_NAME } from "@vsf-enterprise/sapcc-api";
import "./extended.d";

export const registerCustomer = defineApi.registerCustomer(async (context, args) => {
  const { email, firstName, lastName, password } = args;
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const user = await context.api.createUser({
    firstName: firstName,
    lastName: lastName,
    uid: email,
    password: password,
  });

  const loginData = await context.api.OAuthUserAuthorization({
    username: email,
    password: password,
  });
  context.req.cookies[AUTH_USER_TOKEN_COOKIE_NAME] = JSON.stringify(loginData.token);

  return {
    customer: normalizeCustomer(user, normalizerContext),
  };
});

```
