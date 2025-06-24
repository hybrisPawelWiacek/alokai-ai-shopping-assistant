# Customer normalizer

The `normalizeCustomer` function is used to map a Commercetools `Customer` into the unified [`SfCustomer`](/unified-data-layer/unified-data-model.html#sfcustomer) data model.

## Parameters

| Name       | Type                                                                                                    | Default value | Description            |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `customer` | [`Customer`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Customer) |               | Commercetools Customer |

## Extending

The `SfCustomer` model is returned from Unified Methods such as [`RegisterCustomer`](/unified-data-layer/unified-methods/authentication#registercustomer), [`LoginCustomer`](/unified-data-layer/unified-methods/authentication#logincustomer) and [`GetCustomer`](/unified-data-layer/unified-methods/authentication#getcustomer). If the `SfCustomer` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCustomer` with a `company` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCustomer: (context, customer) => ({
          company: customer.companyName,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/auth/customer.ts [customer.ts]
