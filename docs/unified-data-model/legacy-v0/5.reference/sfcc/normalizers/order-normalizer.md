# Order normalizer

- **`normalizeOrder`**: This function is used to map SFCC `Order` into [`SfOrder`](/unified-data-layer/unified-data-model#sforder), which includes order details data.
- **`normalizeOrderListItem`**: This function maps SFCC `ProductItem` into [`SfOrderListItem`](/unified-data-layer/unified-data-model#sforderlistitem) which includes only basic order details, used to display an data in an order list.

## Parameters

### `normalizeOrder`

| Name    | Type                                                                                                               | Default value | Description                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `input` | [`Order`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aorder) |               | SFCC Order                                                                                          |
| `ctx`   | `NormalizerContext`                                                                                                |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |

### `normalizeOrderListItem`

| Name    | Type                                                                                                                     | Default value | Description             |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------- |
| `input` | [`ProductItem`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aorder) |               | SFCC Order List Element |

## Extending

The `SfOrder` is returned from the [`GetOrders`](/unified-data-layer/unified-methods/customer#getorders) Method. If the `SfOrder` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfOrder` with a `shipments` field.

```ts
import { normalizers as normalizersSFC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeOrder: (order, context) => ({
    ...normalizersSFCC.normalizeOrder(order, context),
    shipments: order.shipments,
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
    orderNo,
    creationDate,
    status,
    productItems,
    productTotal,
    taxTotal,
    shippingTotal,
    billingAddress,
    shipments,
  } = input;

  if (
    !orderNo ||
    !creationDate ||
    !productItems ||
    productItems?.length === 0 ||
    !productTotal ||
    !taxTotal ||
    shippingTotal === undefined ||
    shippingTotal < 0 ||
    !billingAddress ||
    !shipments ||
    shipments?.length === 0 ||
    !("shippingMethod" in shipments[0]!) ||
    !("shippingAddress" in shipments[0]!)
  ) {
    throw new Error("Missing required order fields");
  }

  const subTotalWithoutTax = productTotal - taxTotal;
  const { shippingAddress, shippingMethod } = shipments[0];
  const { normalizeMoney, normalizeShippingMethod, normalizeAddress, normalizeOrderLineItem } =
    ctx.normalizers;

  return {
    id: orderNo,
    orderDate: new Date(creationDate).toISOString(),
    status: status ?? "UNKNOWN",
    lineItems: productItems.map((entry) => normalizeOrderLineItem(entry)),
    subtotalPrice: normalizeMoney(subTotalWithoutTax),
    totalShippingPrice: normalizeMoney(shippingTotal),
    totalTax: normalizeMoney(taxTotal),
    totalPrice: normalizeMoney(productTotal),
    shippingAddress: normalizeAddress(shippingAddress!),
    billingAddress: normalizeAddress(billingAddress),
    shippingMethod: normalizeShippingMethod(shippingMethod!)!,
    paymentMethod: "CARD",
  };
});
```
```ts [orderListItem.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeOrderListItem = defineNormalizer.normalizeOrderListItem((input, ctx) => {
  if (!input.orderNo || !input.creationDate || !input.orderTotal) {
    throw new Error("Missing required properties");
  }

  return {
    id: input.orderNo,
    orderDate: new Date(input.creationDate).toISOString(),
    totalPrice: ctx.normalizers.normalizeMoney(input.orderTotal),
    status: input.status ?? "unknown",
  };
});
```
```ts [orderLineItem.ts]
import { getProductPrimaryImage } from "@/normalizers/__internal__";
import { maybe } from "@shared/utils";
import type { Product } from "@vsf-enterprise/sfcc-types";
import type { SfAttribute, SfOrderLineItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import type { NormalizerContext } from "../types";

// eslint-disable-next-line complexity
export const normalizeOrderLineItem = defineNormalizer.normalizeOrderLineItem((input, ctx) => {
  if (!input.productId || !input.itemId || !input.productName || !input.basePrice || !input.price) {
    throw new Error("OrderProductItem is missing required fields");
  }

  const { normalizeMoney, normalizeImage } = ctx.normalizers;
  let attributes: SfOrderLineItem["attributes"] = [];
  let image: SfOrderLineItem["image"] | null = null;
  if (ctx.productsDetails) {
    const product = ctx.productsDetails.find((p) => p.id === input.productId);
    if (product) {
      const productImage = getProductPrimaryImage(product.imageGroups);
      if (productImage) {
        image = normalizeImage(productImage);
      }
      if (product.variationAttributes) {
        attributes = getAttributes(product, ctx);
      }
    }
  }

  return {
    id: input.itemId,
    attributes,
    image,
    unitPrice: normalizeMoney(input.basePrice),
    totalPrice: normalizeMoney(input.price),
    quantity: input.quantity ?? 1,
    productId: input.productId,
    productName: input.productName,
    sku: maybe(input.productId),
  };
});

function getAttributes(product: Product, ctx: NormalizerContext): SfAttribute[] {
  const { variationValues, variationAttributes } = product;
  if (!variationValues || !variationAttributes) {
    return [];
  }
  return Object.entries(variationValues)
    .map(([key, value]) => {
      const attribute = { key, value };
      return ctx.normalizers.normalizeAttribute({ attribute, variationAttributes });
    })
    .filter(Boolean);
}
```
:::
