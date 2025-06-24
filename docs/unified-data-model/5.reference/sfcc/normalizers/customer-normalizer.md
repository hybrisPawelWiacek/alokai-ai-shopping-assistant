# Customer normalizer

The `normalizeCustomer` function is used to map a SFCC `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name   | Type                                                                                                                     | Default value | Description   |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `user` | [`Customer`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Acustomer) |               | SFCC Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCustomer` with a `job_title` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCustomer: (context, user) => ({
          job_title: user.jobTitle,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

## Source

SFCC `Customer` have some fields optional on the interface, but in the reality a valid `Customer` should contain a `customerId`, `email`, `firstName`, and `lastName`, so if any of these information is missing, normalizer returns an error.

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/auth/customer.ts [customer.ts]
