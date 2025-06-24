# `UpdateCustomer`
Implements `UpdateCustomer` Unified Method.
        
## Source

```ts
/* eslint-disable etc/throw-error */
import { getCurrentCustomer, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCustomer = defineApi.updateCustomer(async (context, args) => {
  const { version } = await getCurrentCustomer(context);
  const { normalizeCustomer } = getNormalizers(context);

  if (version == null) {
    throw { statusCode: 401, message: "Unauthorized" };
  }
  const { firstName, lastName, email } = args;

  const actions = [
    firstName && { setFirstName: { firstName } },
    lastName && { setLastName: { lastName } },
    email && { changeEmail: { email } },
  ].filter(Boolean);

  const customerData = await context.api.updateMyCustomer({
    version,
    actions,
  });

  return { customer: normalizeCustomer(customerData.user, getNormalizerContext(context)) };
});

```
