# `UpdateCustomer`
Implements `UpdateCustomer` Unified Method.
        
## Source

```ts
import { assertAuthorized, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const updateCustomer = defineApi.updateCustomer(async (context, args) => {
  await assertAuthorized(context);

  const { email, firstName, lastName } = args;
  const { normalizeCustomer } = getNormalizers(context);

  if (email) {
    // Magento2 API require password to update email
    throw { statusCode: 400, message: "Updating email is not supported" };
  }

  const user = await query(
    context.api.updateCustomer({
      firstname: firstName,
      lastname: lastName,
    }),
  );

  return {
    customer: normalizeCustomer(user.updateCustomerV2?.customer, getNormalizerContext(context)),
  };
});

```
