# Customer normalizer

The `normalizeCustomer` function is used to map a Magento `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name       | Type                                                                                        | Default value | Description      |
| ---------- | ------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| `customer` | [`Customer`](https://docs.alokai.com/integrations/magento/api/magento-types/Customer) |               | Magento Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCustomer` with a `isSubscribed` field.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeCustomer: (customer) => ({
    ...normalizersMagento.normalizeCustomer(customer),
    isSubscribed: customer.is_subscribed,
  }),
});
```

## Source

```ts [customer.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCustomer = defineNormalizer.normalizeCustomer((customer) => {
  if (!customer.firstname || !customer.lastname || !customer.email) {
    throw new Error("Customer must have an id, firstName, lastName and email");
  }

  return {
    id: customer.email,
    firstName: customer.firstname,
    lastName: customer.lastname,
    email: customer.email,
  };
});
```