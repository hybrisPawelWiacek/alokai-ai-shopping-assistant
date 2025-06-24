# Order normalizer

- **`normalizeOrder`**: This function is used to map SAP `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps SAP `OrderHistory` into Unified [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                           | Default value | Description                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `input` | [`Order`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.order.html) |               | SAP Order                                                                                          |
| `ctx`   | `NormalizerContext`                                                                            |               | Context needed for the normalizer. `transformImageUrl` is added to transform line items image urls |

### `normalizeOrderListItem`

| Name    | Type                                                                                                         | Default value | Description            |
| ------- | ------------------------------------------------------------------------------------------------------------ | ------------- | ---------------------- |
| `input` | [`OrderHistory`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.orderhistory.html) |               | SAP Order List Element |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfOrder` with an `orderDiscounts` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeOrder: (order, context) => ({
    ...normalizersSAP.normalizeOrder(order, context),
    orderDiscounts: order.orderDiscounts,
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
    code,
    created,
    status,
    entries,
    subTotal,
    deliveryCost,
    totalTax,
    totalPriceWithTax,
    deliveryAddress,
    deliveryMode,
    paymentInfo,
    costCenter,
  } = input;

  if (
    !code ||
    !created ||
    !subTotal ||
    !deliveryCost ||
    !totalTax ||
    !entries ||
    entries?.length === 0 ||
    !totalPriceWithTax ||
    !deliveryAddress ||
    !deliveryMode
  ) {
    throw new Error("Missing required order fields");
  }

  const { normalizeAddress, normalizeOrderLineItem, normalizeShippingMethod, normalizeMoney } =
    ctx.normalizers;
  const subTotalWithoutTax = {
    ...subTotal,
    value: subTotal.value! - totalTax.value!,
  };
  const billingAddress = paymentInfo?.billingAddress
    ? ctx.normalizers.normalizeAddress(paymentInfo.billingAddress)
    : null;
  const paymentMethod = costCenter ? "ACCOUNT" : "CARD";

  return {
    id: code,
    orderDate: new Date(created).toISOString(),
    status: status ?? "UNKNOWN",
    lineItems: entries.map((entry) => normalizeOrderLineItem(entry)),
    subtotalPrice: normalizeMoney(subTotalWithoutTax),
    totalShippingPrice: normalizeMoney(deliveryCost),
    totalTax: normalizeMoney(totalTax),
    totalPrice: normalizeMoney(totalPriceWithTax),
    shippingAddress: normalizeAddress(deliveryAddress),
    billingAddress,
    shippingMethod: normalizeShippingMethod(deliveryMode),
    paymentMethod,
  };
});
```
```ts [orderListItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderListItem = defineNormalizer.normalizeOrderListItem((input, ctx) => {
  if (!input.total || !input.placed) {
    throw new Error("OrderHistory is missing required fields");
  }

  return {
    id: input.code!,
    orderDate: new Date(input.placed).toISOString(),
    totalPrice: ctx.normalizers.normalizeMoney(input.total),
    status: input.status ?? "unknown",
  };
});
```
```ts [orderLineItem.ts]
import { getOptions } from "@/normalizers/__internal__";
import { createSfImages } from "../product/images";
import type { NormalizerContext } from "@/normalizers/types";
import { maybe } from "@shared/utils";
import type { VariantOptionQualifier } from "@vsf-enterprise/sapcc-types";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderLineItem = defineNormalizer.normalizeOrderLineItem((input, ctx) => {
  if (!input.product || !input.basePrice || !input.totalPrice) {
    throw new Error("OrderEntry is missing required fields");
  }

  const { currentOption } = getOptions(input.product, input.product.code as string);
  const attributes = getAttributes(currentOption?.variantOptionQualifiers ?? [], ctx);
  const { primaryImage } = createSfImages(input.product.images, ctx);

  return {
    id: input.entryNumber!.toString(),
    attributes,
    unitPrice: ctx.normalizers.normalizeMoney(input.basePrice),
    totalPrice: ctx.normalizers.normalizeMoney(input.totalPrice),
    quantity: input.quantity ?? 1,
    image: maybe(primaryImage),
    productId: input.product.code!,
    productName: input.product.name!,
    sku: maybe(input.product.code),
  };
});

function getAttributes(optionQualifiers: VariantOptionQualifier[], ctx: NormalizerContext) {
  return optionQualifiers
    .map((optionQualifier) => ctx.normalizers.normalizeAttribute(optionQualifier))
    .filter(Boolean);
}
```
:::
