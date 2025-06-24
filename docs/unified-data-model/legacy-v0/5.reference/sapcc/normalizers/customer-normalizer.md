# Customer normalizer

The `normalizeCustomer` function is used to map a SAP `User` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name   | Type                                                                                               | Default value | Description |
| ------ | -------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `user` | [`User`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.user.html) |               | SAP User    |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCustomer` with a `country` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeCustomer: (user) => ({
    ...normalizersSAP.normalizeCustomer(user),
    country: user.defaultAddress?.country,
  }),
});
```

## Source

SAP `User` have some fields optional on the interface, but in the reality a valid `User` should contain a `customerId`, `uid`, `firstName`, and `lastName`, so if any of these information is missing, normalizer returns an error.

```ts [customer.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCustomer = defineNormalizer.normalizeCustomer((user) => {
  if (!user.customerId || !user.uid || !user.firstName || user.lastName === undefined) {
    throw new Error("Missing required fields for customer");
  }

  return {
    id: user.customerId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.uid,
  };
});
```
