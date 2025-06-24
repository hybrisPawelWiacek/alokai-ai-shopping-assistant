import {
  type LoginCustomerArgs,
  getNormalizers,
} from "@vsf-enterprise/unified-api-sapcc";
import type { OAuthUserTokenResponse } from "@vsf-enterprise/sapcc-types";
import {
  type SapccIntegrationContext,
  AUTH_USER_COOKIE_NAME,
  AUTH_USER_TOKEN_COOKIE_NAME,
} from "@vsf-enterprise/sapcc-api";

const MESSAGE_LOGIN_ERROR = "Could not login customer";
const ACCESS_DENIED_ERROR_MESSAGE = "User is already logged in";

export const loginCustomer = async (
  context: SapccIntegrationContext,
  args: LoginCustomerArgs
) => {
  const { email, password } = args;
  const { normalizeCustomer } = getNormalizers(context);

  let loginData: OAuthUserTokenResponse;

  if (context.req.cookies[AUTH_USER_TOKEN_COOKIE_NAME]) {
    throw { statusCode: 403, message: ACCESS_DENIED_ERROR_MESSAGE };
  }
  try {
    loginData = await context.extendedApi.auth.OAuthUserAuthorization({
      username: email,
      password: password,
    });
  } catch {
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }

  context.req.cookies[AUTH_USER_TOKEN_COOKIE_NAME] = JSON.stringify(
    loginData.token
  );

  try {
    const { data: user } = await context.api.getOrgUser({});

    return {
      customer: normalizeCustomer(user),
    };
  } catch {
    context.res.clearCookie(AUTH_USER_TOKEN_COOKIE_NAME);
    context.res.clearCookie(AUTH_USER_COOKIE_NAME);
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }
};
