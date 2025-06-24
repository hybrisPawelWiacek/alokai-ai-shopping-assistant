# `UpdateCustomer`
Implements `UpdateCustomer` Unified Method.
        
## Source

```ts
import { defineApi, assertAuthorized, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const updateCustomer = defineApi.updateCustomer(async (context, args) => {
  await assertAuthorized(context);

  const { email, firstName, lastName } = args;
  const { normalizeCustomer } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const updatedCustomer = await context.api.updateCustomer({
    email,
    firstName,
    lastName,
  });

  return { customer: normalizeCustomer(updatedCustomer, normalizerContext) };
});

```
