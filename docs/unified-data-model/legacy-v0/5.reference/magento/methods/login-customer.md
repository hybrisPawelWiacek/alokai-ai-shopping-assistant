# `LoginCustomer`
Implements `LoginCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { GenerateCustomerTokenMutation } from "@vue-storefront/magento-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

const MESSAGE_LOGIN_ERROR = "Could not login customer";

export const loginCustomer = defineApi.loginCustomer(async (context, args) => {
  const { email, password } = args;
  const { normalizeCustomer } = getNormalizers(context);
  let loginData: GenerateCustomerTokenMutation;

  try {
    loginData = await query(
      context.api.generateCustomerToken({
        email,
        password,
        recaptchaToken: "",
      }),
    );
    context.req.cookies[context.config.cookies.customerCookieName] =
      loginData.generateCustomerToken?.token;

    const user = await query(context.api.customer({}));

    context.res.cookie(
      context.config.cookies.customerCookieName,
      loginData.generateCustomerToken?.token,
    );
    // customer's 'id' field is deprecated in Magento
    return {
      customer: normalizeCustomer(user.customer, getNormalizerContext(context)),
    };
  } catch (error) {
    console.error(error);
    context.config.state.setCustomerToken(null);
    throw { statusCode: 401, message: MESSAGE_LOGIN_ERROR };
  }
});

```
