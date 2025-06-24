# Order normalizer

- **`normalizeOrder`**: This function is used to map SFCC `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps SFCC `ProductItem` into [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name      | Type                                                                                                               | Default value | Description                                                                                         |
|-----------| ------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                                                |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |
| `input`   | [`Order`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aorder) |               | SFCC Order                                                                                          |

### `normalizeOrderListItem`

| Name    | Type                                                                                                                     | Default value | Description             |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `input` | [`ProductItem`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aorder) |               | SFCC Order List Element |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfOrder` with a `shipments` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeOrder: (context, order) => ({
          shipments: order.shipments,
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
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/orders/order.ts [order.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/orders/orderListItem.ts [orderListItem.ts]
:::
