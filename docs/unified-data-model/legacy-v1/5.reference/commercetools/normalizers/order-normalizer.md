# Order normalizer

- **`normalizeOrder`**: This function is used to map Commercetools `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps Commercetools `OrderHistory` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name      | Type                                                                                              | Default value | Description                       |
|-----------| ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `context` | `NormalizerContext`                                                                               |               | Context needed for the normalizer |
| `input`   | [`Order`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Order) |               | Commercetools Order               |

### `normalizeOrderListItem`

| Name      | Type                                                                                              | Default value | Description                       |
|-----------| ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `context` | `NormalizerContext`                                                                               |               | Context needed for the normalizer |
| `order`   | [`Order`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Order) |               | Commercetools Order               |

### `normalizeOrderLineItem`

| Name       | Type                                                                                                    | Default value | Description                       |
|------------| ------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `context`  | `NormalizerContext`                                                                                     |               | Context needed for the normalizer |
| `lineItem` | [`LineItem`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/LineItem) |               | Commercetools Line Item           |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfOrder` with a `cartRef` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeOrder: (context, order) => ({
          cartRef: order.cartRef,
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
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/orders/order.ts [order.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/orders/orderListItem.ts [orderListItem.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/orders/orderLineItem.ts [orderLineItem.ts]
:::
