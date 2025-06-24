# Order normalizer

- **`normalizeOrder`**: This function is used to map BigCommerce `OrderByCartResponse` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps BigCommerce `Order` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                                                      | Default value | Description                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------- |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `input` | [`OrderByCartResponse`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/OrderByCartResponse) |               | BigCommerce OrderByCartResponse |

### `normalizeOrderListItem`

| Name    | Type                                                                                          | Default value | Description       |
| ------- | --------------------------------------------------------------------------------------------- | ------------- | ----------------- |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `order` | [`Order`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Order) |               | BigCommerce Order |

### `normalizeOrderLineItem`

| Name       | Type                                                                                                  | Default value | Description            |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `lineItem` | [`OrderItem`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/OrderItem) |               | BigCommerce Order Item |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfOrder` with a `staffNotes` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeOrder: (context, order) => ({
          staffNotes: order.staff_notes,
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
<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/orders/order.ts [order.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/orders/orderListItem.ts [orderListItem.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/orders/orderLineItem.ts [orderLineItem.ts]
:::
