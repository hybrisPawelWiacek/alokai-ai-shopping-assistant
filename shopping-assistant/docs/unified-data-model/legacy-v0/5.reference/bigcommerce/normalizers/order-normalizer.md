# Order normalizer

- **`normalizeOrder`**: This function is used to map BigCommerce `OrderByCartResponse` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps BigCommerce `Order` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                                                      | Default value | Description                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------- |
| `input` | [`OrderByCartResponse`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/OrderByCartResponse) |               | BigCommerce OrderByCartResponse |

### `normalizeOrderListItem`

| Name    | Type                                                                                          | Default value | Description       |
| ------- | --------------------------------------------------------------------------------------------- | ------------- | ----------------- |
| `order` | [`Order`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Order) |               | BigCommerce Order |

### `normalizeOrderLineItem`

| Name       | Type                                                                                                  | Default value | Description            |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| `lineItem` | [`OrderItem`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/OrderItem) |               | BigCommerce Order Item |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfOrder` with a `staffNotes` field.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeOrder: (order, context) => ({
    ...normalizersBC.normalizeOrder(order, context),
    staffNotes: order.staff_notes,
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
    date_created,
    status,
    products,
    subtotal_ex_tax,
    shipping_cost_inc_tax,
    total_tax,
    total_inc_tax,
    billing_address,
    shipping_addresses: { 0: shipping_address },
  } = input;
  const { shipping_method } = shipping_address ?? {};

  if (
    !date_created ||
    !subtotal_ex_tax ||
    !shipping_cost_inc_tax ||
    !total_tax ||
    !total_inc_tax ||
    !billing_address ||
    !products ||
    products.length === 0 ||
    !shipping_method ||
    !shipping_address
  ) {
    throw new Error("Missing required order fields");
  }

  const lineItems = products.map((entry) => ctx.normalizers.normalizeOrderLineItem(entry));

  return {
    id: id.toString(),
    orderDate: new Date(date_created).toISOString(),
    status: status ?? "UNKNOWN",
    lineItems,
    subtotalPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(subtotal_ex_tax)),
    totalShippingPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(shipping_cost_inc_tax)),
    totalTax: ctx.normalizers.normalizeMoney(Number.parseFloat(total_tax)),
    totalPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(total_inc_tax)),
    shippingAddress: ctx.normalizers.normalizeAddress(shipping_address),
    billingAddress: ctx.normalizers.normalizeAddress(billing_address),
    shippingMethod: ctx.normalizers.normalizeShippingMethod({
      name: shipping_method,
      price: shipping_cost_inc_tax,
    }),
    paymentMethod: "CARD",
  };
});

```
```ts [orderListItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderListItem = defineNormalizer.normalizeOrderListItem((input, ctx) => {
  if (!input.total_inc_tax || !input.date_created) {
    throw new Error("Order is missing required fields");
  }

  return {
    id: input.id.toString(),
    orderDate: new Date(input.date_created).toISOString(),
    totalPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(input.total_inc_tax)),
    status: input.status ?? "UNKNOWN",
  };
});

```
```ts [orderLineItem.ts]
/* eslint-disable complexity */
import type { NormalizerContext } from "@/normalizers/types";
import { maybe } from "@shared/utils";
import type { OrderItem } from "@vsf-enterprise/bigcommerce-api";
import type { SfAttribute, SfImage } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderLineItem = defineNormalizer.normalizeOrderLineItem((input, ctx) => {
  const { total_inc_tax, price_inc_tax, product_options, id, product_id, name } = input;

  if (!total_inc_tax || !price_inc_tax || !id || !product_id || !name) {
    throw new Error("OrderItem is missing required fields");
  }

  return {
    id: id.toString(),
    attributes: normalizeAttributes(product_options),
    unitPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(price_inc_tax)),
    totalPrice: ctx.normalizers.normalizeMoney(Number.parseFloat(total_inc_tax)),
    quantity: input.quantity ?? 1,
    productName: name,
    productId: product_id.toString(),
    sku: maybe(input.sku),
    image: normalizeImage(product_id, ctx),
  };
});

function normalizeAttributes(productOptions: OrderItem["product_options"]) {
  return productOptions
    ? productOptions
        .map((option) => {
          const { name, value, display_name, display_value } = option;

          if (!name || !value || !display_name || !display_value) {
            return null;
          }

          return {
            name: name,
            value: value,
            valueLabel: display_value,
            label: display_name,
          } satisfies SfAttribute;
        })
        .filter(Boolean)
    : [];
}

function normalizeImage(product_id: number, ctx: NormalizerContext) {
  if (!ctx.imageGetter) {
    return null;
  }
  const imageSource = ctx.imageGetter(product_id);
  if (!imageSource) {
    return null;
  }

  return {
    url: imageSource.image_url!,
    alt: maybe(imageSource.description),
  } satisfies SfImage;
}

```
:::
