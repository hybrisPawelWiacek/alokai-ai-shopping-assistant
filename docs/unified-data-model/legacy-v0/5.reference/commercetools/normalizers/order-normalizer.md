# Order normalizer

- **`normalizeOrder`**: This function is used to map Commercetools `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps Commercetools `OrderHistory` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                              | Default value | Description                       |
| ------- | ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `input` | [`Order`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Order) |               | Commercetools Order               |
| `ctx`   | `NormalizerContext`                                                                               |               | Context needed for the normalizer |

### `normalizeOrderListItem`

| Name    | Type                                                                                              | Default value | Description                       |
| ------- | ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `order` | [`Order`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Order) |               | Commercetools Order               |
| `ctx`   | `NormalizerContext`                                                                               |               | Context needed for the normalizer |

### `normalizeOrderLineItem`

| Name       | Type                                                                                                    | Default value | Description                       |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `lineItem` | [`LineItem`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/LineItem) |               | Commercetools Line Item           |
| `ctx`      | `NormalizerContext`                                                                                     |               | Context needed for the normalizer |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfOrder` with a `cartRef` field.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeOrder: (order, context) => ({
    ...normalizersCT.normalizeOrder(order, context),
    cartRef: order.cartRef,
  }),
});
```

You can override the `normalizeOrder`, but it's also available to override the smaller normalizers such as `normalizeAddress`, `normalizeShippingMethod`.

## Source

:::code-group
```ts [order.ts]
/* eslint-disable complexity */
import type { BaseMoney, TaxedPrice } from "@vsf-enterprise/commercetools-types";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrder = defineNormalizer.normalizeOrder((input, ctx) => {
  const {
    id,
    createdAt,
    orderState,
    lineItems,
    totalPrice,
    taxedPrice,
    shippingAddress,
    shippingInfo,
    billingAddress,
  } = input;

  if (
    !id ||
    !createdAt ||
    !totalPrice ||
    !taxedPrice ||
    !lineItems ||
    lineItems.length === 0 ||
    !shippingAddress ||
    !shippingInfo ||
    !shippingInfo.shippingMethod ||
    !shippingInfo.price
  ) {
    throw new Error("Missing required order fields");
  }

  const { normalizeMoney, normalizeAddress, normalizeOrderLineItem, normalizeShippingMethod } =
    ctx.normalizers;

  const shippingMethod = normalizeShippingMethod({
    ...shippingInfo.shippingMethod,
    totalPrice: totalPrice,
  });

  const totalTax = calculateTotalTax(taxedPrice);
  const subTotal = {
    ...totalPrice,
    centAmount: totalPrice.centAmount - shippingInfo.price.centAmount - totalTax.centAmount,
  };

  return {
    id,
    orderDate: new Date(createdAt).toISOString(),
    status: orderState ?? "UNKNOWN",
    lineItems: lineItems.map((entry) => normalizeOrderLineItem(entry)),
    subtotalPrice: normalizeMoney(subTotal),
    totalShippingPrice: normalizeMoney(shippingInfo.price),
    totalTax: normalizeMoney(totalTax),
    totalPrice: normalizeMoney(totalPrice),
    shippingAddress: normalizeAddress(shippingAddress),
    billingAddress: billingAddress ? normalizeAddress(billingAddress) : null,
    shippingMethod: shippingMethod!,
    paymentMethod: "CARD",
  };
});

function calculateTotalTax(taxedPrice: TaxedPrice) {
  const { totalNet, totalGross } = taxedPrice;
  const totalTax = totalGross.centAmount - totalNet.centAmount;

  return {
    type: totalGross.type,
    centAmount: totalTax,
    currencyCode: totalGross.currencyCode,
    fractionDigits: totalGross.fractionDigits,
  } satisfies BaseMoney;
}
```
```ts [orderListItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderListItem = defineNormalizer.normalizeOrderListItem((input, ctx) => {
  if (!input.totalPrice || !input.createdAt) {
    throw new Error("Order is missing required fields");
  }

  return {
    id: input.id,
    orderDate: new Date(input.createdAt).toISOString(),
    totalPrice: ctx.normalizers.normalizeMoney(input.totalPrice),
    status: input.orderState ?? "UNKNOWN",
  };
});
```
```ts [orderLineItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderLineItem = defineNormalizer.normalizeOrderLineItem((input, ctx) => {
  if (!input.variant || !input.price || !input.name) {
    throw new Error("LineItem is missing required fields");
  }

  const { id, attributes, image, quantity, sku, totalPrice, unitPrice } =
    ctx.normalizers.normalizeCartLineItem(input);

  return {
    id,
    attributes,
    image,
    quantity,
    sku,
    totalPrice: totalPrice!,
    unitPrice: unitPrice!.value,
    productId: input.productId,
    productName: input.name,
  };
});
```
:::
