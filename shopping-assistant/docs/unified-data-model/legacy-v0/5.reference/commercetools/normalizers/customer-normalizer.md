# Customer normalizer

The `normalizeCustomer` function is used to map a Commercetools `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name       | Type                                                                                                    | Default value | Description            |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| `customer` | [`Customer`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Customer) |               | Commercetools Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCustomer` with a `company` field.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeCustomer: (customer) => ({
    ...normalizersCT.normalizeCustomer(customer),
    company: customer.companyName,
  }),
});
```

## Source

```ts [customer.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCustomer = defineNormalizer.normalizeCustomer((customer) => {
  return {
    id: customer.id,
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    email: customer.email,
  };
});
```
