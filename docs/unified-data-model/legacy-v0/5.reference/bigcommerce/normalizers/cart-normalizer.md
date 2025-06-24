# Cart normalizer

The `normalizeCart` function is used to map a BigCommerce Cart into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name   | Type                                                                                  | Default value | Description                            |
| ------ | ------------------------------------------------------------------------------------- | ------------- | -------------------------------------- |
| `cart` | [`Cart`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/Cart) |               | BigCommerce Cart                       |
| `ctx`  | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCart` with a `parentId` field.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeCart: (cart, context) => ({
    ...normalizersBC.normalizeCart(cart, context),
    parentId: cart.parent_id,
  }),
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
```ts [cart.ts]
import type { NormalizerContext } from "@/normalizers/types";
import { SfCart, SfCartLineItem } from "@vue-storefront/unified-data-model";
import { maybe } from "@shared/utils";
import { Cart, LineItems } from "@vsf-enterprise/bigcommerce-api";
import { defineNormalizer } from "../defineNormalizer";

type CartTotals = Pick<
  SfCart,
  | "subtotalDiscountedPrice"
  | "subtotalRegularPrice"
  | "totalCouponDiscounts"
  | "totalPrice"
  | "totalShippingPrice"
  | "totalTax"
>;

export const normalizeCart = defineNormalizer.normalizeCart((cart, context) => {
  const ctx = { ...context, currency: cart.currency?.code as string };

  const lineItems = normalizeCartLineItems(cart.line_items, ctx);

  return {
    appliedCoupons:
      cart.coupons?.map((coupon) => ctx.normalizers.normalizeCartCoupon(coupon)) ?? [],
    billingAddress: null,
    customerEmail: maybe(cart.email || null),
    id: cart.id as string,
    lineItems,
    shippingAddress: null,
    shippingMethod: null,
    totalItems: lineItems.length,
    ...normalizeCartTotals(cart, lineItems, ctx),
  };
});

function normalizeCartTotals(
  cart: Cart,
  lineItems: SfCartLineItem[],
  ctx: NormalizerContext,
): CartTotals {
  const lineItemsAmount = lineItems.reduce(
    (acc, item) => acc + (item.unitPrice?.regularPrice.amount || 0) * item.quantity,
    0,
  );
  const subtotalRegularPrice = ctx.normalizers.normalizeMoney(+lineItemsAmount.toFixed(2));

  return {
    subtotalDiscountedPrice: getSubtotalDiscountedPrice(cart, ctx),
    subtotalRegularPrice: subtotalRegularPrice,
    totalCouponDiscounts: ctx.normalizers.normalizeMoney(
      cart.coupons?.reduce((acc, curr) => acc + (curr.discounted_amount ?? 0), 0) ?? 0,
    ),
    totalPrice: ctx.normalizers.normalizeMoney(cart.cart_amount ?? 0),
    totalShippingPrice: null, // @TODO shipping price is not available
    totalTax: ctx.normalizers.normalizeMoney(0), // @TODO tax is not available
  };
}

function getSubtotalDiscountedPrice(cart: Cart, ctx: NormalizerContext) {
  const { base_amount = 0, line_items } = cart;
  const discounts = (line_items?.physical_items ?? []).reduce(
    (acc, curr) => acc + (curr.extended_list_price ?? 0) - (curr.extended_sale_price ?? 0),
    0,
  );
  return ctx.normalizers.normalizeMoney(base_amount - discounts);
}

function normalizeCartLineItems(
  lineItems: LineItems | null | undefined,
  ctx: NormalizerContext,
): SfCartLineItem[] {
  if (!lineItems) {
    return [];
  }

  return [
    ...lineItems.physical_items.map((item) => ctx.normalizers.normalizeCartLineItem(item)),
    ...lineItems.digital_items.map((item) => ctx.normalizers.normalizeCartLineItem(item)),
  ];
}

``` 
```ts [cartCoupon.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartCoupon = defineNormalizer.normalizeCartCoupon((coupon) => {
  return {
    code: coupon.code,
    id: coupon.code,
    name: coupon.name,
  };
});

``` 
```ts [shippingMethod.ts]
import type { SfShippingMethod } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeShippingMethod = defineNormalizer.normalizeShippingMethod((input, ctx) => {
  const { name, price } = input;

  return {
    id: name,
    name: name,
    price: ctx.normalizers.normalizeMoney(Number.parseFloat(price)),
    description: null,
    estimatedDelivery: null,
  } satisfies SfShippingMethod;
});

``` 
```ts [lineItem.ts]
import { getProductQuantityLimit } from "@/normalizers/__internal__";
import type { NormalizeCartLineItemInput, NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import { SfCartLineItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

// eslint-disable-next-line complexity
export const normalizeCartLineItem = defineNormalizer.normalizeCartLineItem((lineItem, ctx) => {
  const { productsDetails } = ctx;

  if (!productsDetails) {
    throw new Error("Products details are required to normalize a cart line item.");
  }
  const productDetails = productsDetails.find((product) => product.id === lineItem.product_id);

  if (!productDetails) {
    throw new Error(`Product details for product ${lineItem.product_id} not found.`);
  }

  const { totalPrice, unitPrice } = normalizeLineItemPrice(lineItem, ctx);
  const productAvailableQuantity = getProductQuantityLimit(productDetails);

  return {
    attributes:
      lineItem.options
        ?.map((option) => ctx.normalizers.normalizeAttribute(option))
        .filter(Boolean) ?? [],
    productId: `${lineItem.product_id}`,
    id: lineItem.id!,
    image: lineItem.image_url ? { url: lineItem.image_url, alt: null } : null,
    slug: slugify(lineItem.url ?? lineItem.sku ?? lineItem.name ?? `${lineItem.variant_id}`),
    name: maybe(lineItem.name),
    quantity: lineItem.quantity,
    quantityLimit: maybe(productAvailableQuantity(productDetails.inventory_level)),
    sku: maybe(lineItem.sku),
    totalPrice,
    unitPrice,
  };
});

function normalizeLineItemPrice(
  lineItem: NormalizeCartLineItemInput,
  ctx: NormalizerContext,
): Pick<SfCartLineItem, "totalPrice" | "unitPrice"> {
  if (!lineItem.extended_list_price || !lineItem.list_price) {
    return {
      totalPrice: null,
      unitPrice: null,
    };
  }

  const totalPriceAmount = lineItem.extended_sale_price ?? lineItem.extended_list_price;
  const unitPriceAmount = lineItem.sale_price ?? lineItem.list_price;
  const unitRegularPriceAmount = lineItem.original_price ?? lineItem.list_price;

  return {
    totalPrice: ctx.normalizers.normalizeMoney(totalPriceAmount),
    unitPrice: {
      isDiscounted: unitPriceAmount < unitRegularPriceAmount,
      regularPrice: ctx.normalizers.normalizeMoney(unitRegularPriceAmount),
      value: ctx.normalizers.normalizeMoney(unitPriceAmount),
    },
  };
}

```
::
