# `LoginCustomer`
Implements `LoginCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { AUTH_USER_TOKEN_COOKIE_NAME } from "@vsf-enterprise/sapcc-api";
import { OAuthUserTokenResponse } from "@vsf-enterprise/sapcc-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

const MESSAGE_LOGIN_ERROR = "Could not login customer";

export const loginCustomer = defineApi.loginCustomer(async (context, args) => {
  const { email, password } = args;
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  let loginData: OAuthUserTokenResponse;

  try {
    loginData = await context.api.OAuthUserAuthorization({
      username: email,
      password: password,
    });
  } catch {
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }

  context.req.cookies[AUTH_USER_TOKEN_COOKIE_NAME] = JSON.stringify(loginData.token);
  const user = await context.api.getUser({});

  return {
    customer: normalizeCustomer(user, normalizerContext),
  };
});

```
