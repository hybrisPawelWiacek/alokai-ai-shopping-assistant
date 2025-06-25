# `UpdateCustomer`
Implements `UpdateCustomer` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const updateCustomer = defineApi.updateCustomer(async (context, args) => {
  assertAuthorized(context);

  const { email, firstName, lastName } = args;
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const user = await context.api.updateAndGetUser({
    user: {
      firstName,
      lastName,
      uid: email,
    },
  });

  return {
    customer: normalizeCustomer(user, normalizerContext),
  };
});

```
