# Order normalizer

- **`normalizeOrder`**: This function is used to map Magento `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps Magento `OrderHistory` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                    | Default value | Description   |
| ------- | --------------------------------------------------------------------------------------- | ------------- | ------------- |
| `input` | [`Order`](https://docs.alokai.com/integrations/magento/api/magento-types/CustomerOrder) |               | Magento Order |

### `normalizeOrderListItem`

| Name    | Type                                                                                    | Default value | Description   |
| ------- | --------------------------------------------------------------------------------------- | ------------- | ------------- |
| `order` | [`Order`](https://docs.alokai.com/integrations/magento/api/magento-types/CustomerOrder) |               | Magento Order |

### `normalizeOrderLineItem`

| Name       | Type                                                                                                      | Default value | Description        |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| `lineItem` | [`OrderItemInterface`](https://docs.alokai.com/integrations/magento/api/magento-types/OrderItemInterface) |               | Magento Order Item |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfOrder` with an `invoices` field.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeOrder: (order, context) => ({
    ...normalizersMagento.normalizeOrder(order, context),
    invoices: order.invoices,
  }),
});
```

You can override the `normalizeOrder`, but it's also available to override the smaller normalizers such as `normalizeAddress`, `normalizeShippingMethod`.

## Source

:::code-group
```ts [order.ts]
/* eslint-disable complexity */
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrder = defineNormalizer.normalizeOrder((input, ctx) => {
  const {
    id,
    items,
    order_date,
    shipping_address,
    shipping_method,
    total,
    payment_methods,
    billing_address,
  } = input;
  if (
    !id ||
    !order_date ||
    !total ||
    !total?.shipping_handling?.total_amount ||
    !total.total_tax ||
    !total.subtotal ||
    !total.grand_total ||
    !items ||
    items.length === 0 ||
    !shipping_address ||
    !shipping_method ||
    !payment_methods ||
    !payment_methods[0] ||
    !shipping_address
  ) {
    throw new Error("Missing required order fields");
  }
  const { normalizeOrderLineItem, normalizeAddress, normalizeShippingMethod, normalizeMoney } =
    ctx.normalizers;

  return {
    id,
    lineItems: items.filter(Boolean).map((item) => normalizeOrderLineItem(item)) ?? [],
    orderDate: order_date,
    status: input.status ?? "UNKNOWN",
    billingAddress: billing_address ? normalizeAddress(billing_address) : null,
    shippingAddress: normalizeAddress(shipping_address),
    paymentMethod: payment_methods[0].name,
    shippingMethod: normalizeShippingMethod({
      carrier_code: shipping_method,
      amount: total.shipping_handling.total_amount,
      method_code: shipping_method,
      method_title: shipping_method,
    }),
    subtotalPrice: normalizeMoney(total.subtotal),
    totalPrice: normalizeMoney(total.grand_total),
    totalShippingPrice: normalizeMoney(total.shipping_handling?.total_amount),
    totalTax: normalizeMoney(total.total_tax),
  };
});
```
```ts [orderListItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderListItem = defineNormalizer.normalizeOrderListItem((input, ctx) => {
  if (!input.total?.grand_total || !input.order_date) {
    throw new Error("Order is missing required fields");
  }
  return {
    id: input.number,
    orderDate: input.order_date,
    status: input.status ?? "UNKNOWN",
    totalPrice: ctx.normalizers.normalizeMoney(input.total.grand_total),
  };
});
```
```ts [orderLineItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderLineItem = defineNormalizer.normalizeOrderLineItem((input, ctx) => {
  if (!input?.product_sale_price || !input?.product_name) {
    throw new Error("Order Item is missing required fields");
  }
  const { normalizeAttribute, normalizeMoney } = ctx.normalizers;

  return {
    id: input.id,
    attributes: (input.selected_options?.filter(Boolean) ?? [])
      .map((option) => ctx.normalizers.normalizeAttribute(option))
      .filter(Boolean),
    image: null,
    quantity: input.quantity_ordered!,
    sku: input.product_sku,
    totalPrice: normalizeMoney({
      value: input.product_sale_price.value! * input.quantity_ordered!,
      currency: input.product_sale_price.currency!,
    }),
    unitPrice: normalizeMoney(input.product_sale_price),
    productId: input.product_sku,
    productName: input.product_name,
  };
});
```
:::
