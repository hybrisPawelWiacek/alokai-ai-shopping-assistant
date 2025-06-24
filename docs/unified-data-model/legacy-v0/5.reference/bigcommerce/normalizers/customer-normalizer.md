# Customer normalizer

The `normalizeCustomer` function is used to map a BigCommerce `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name       | Type                                                                                                | Default value | Description          |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------- | -------------------- |
| `customer` | [`Customer`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Customer) |               | BigCommerce Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCustomer` with a `company` field.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeCustomer: (customer) => ({
    ...normalizersBC.normalizeCustomer(customer),
    company: customer.company,
  }),
});
```

## Source

```ts [customer.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCustomer = defineNormalizer.normalizeCustomer((user) => {
  if (!user.id) {
    throw new Error("User id is required");
  }

  return {
    id: user.id.toString(),
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  };
});
```
