# Order normalizer

- **`normalizeOrder`**: This function is used to map SAP `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps SAP `OrderHistory` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name      | Type                                                                                           | Default value | Description                                                                                        |
|-----------| ---------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `input`   | [`Order`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.order.html) |               | SAP Order                                                                                          |

### `normalizeOrderListItem`

| Name    | Type                                                                                                         | Default value | Description            |
| ------- | ------------------------------------------------------------------------------------------------------------ | ------------- | ---------------------- |
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `input` | [`OrderHistory`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.orderhistory.html) |               | SAP Order List Element |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfOrder` with an `orderDiscounts` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeOrder: (context, order) => ({
          orderDiscounts: order.orderDiscounts,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

You can override the `normalizeOrder`, but it's also available to override the smaller normalizers such as `normalizeAddress`, `normalizeShippingMethod`.

## Source

:::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/orders/order.ts [order.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/orders/orderListItem.ts [orderListItem.ts]
:::
