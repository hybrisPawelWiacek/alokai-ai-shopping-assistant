# Customer normalizer

The `normalizeCustomer` function is used to map a SFCC `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name   | Type                                                                                                                     | Default value | Description   |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------- |
| `user` | [`Customer`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Acustomer) |               | SFCC Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCustomer` with a `job_title` field.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeCustomer: (user) => ({
    ...normalizersSFCC.normalizeCustomer(user),
    job_title: user.jobTitle,
  }),
});
```

## Source

SFCC `Customer` have some fields optional on the interface, but in the reality a valid `Customer` should contain a `customerId`, `email`, `firstName`, and `lastName`, so if any of these information is missing, normalizer returns an error.

```ts [customer.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCustomer = defineNormalizer.normalizeCustomer((customer) => {
  if (!customer.customerId || !customer.firstName || !customer.lastName || !customer.email) {
    throw new Error("Customer must have an id, firstName, lastName and email");
  }

  return {
    id: customer.customerId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
  };
});
```
