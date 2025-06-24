# `RegisterCustomer`
Implements `RegisterCustomer` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const registerCustomer = defineApi.registerCustomer(async (context, args) => {
  const { email, firstName, lastName, password } = args;
  const { normalizeCustomer } = getNormalizers(context);

  try {
    const user = await context.api.createCustomer({
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      accepts_product_review_abandoned_cart_emails: false,
      custom_fields: [],
    });

    return {
      customer: normalizeCustomer(user, getNormalizerContext(context)),
    };
  } catch {
    throw { statusCode: 400, message: "Could not register customer" };
  }
});

```
