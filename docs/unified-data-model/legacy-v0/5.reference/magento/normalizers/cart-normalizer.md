# Cart normalizer

The `normalizeCart` function is used to map a Magento Cart into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name   | Type                                                                          | Default value | Description                       |
| ------ | ----------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `cart` | [`Cart`](https://docs.alokai.com/integrations/magento/api/magento-types/Cart) |               | Magento Cart                      |
| `ctx`  | `NormalizerContext`                                                           |               | context needed for the normalizer |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCart` with a `gift_message` field.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeCart: (cart) => ({
    ...normalizersMagento.normalizeCart(cart),
    giftMessage: cart.gift_message,
  }),
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
```ts [cart.ts]
/* eslint-disable complexity */
import { maybe } from "@shared/utils";
import { Cart } from "@vue-storefront/magento-types";
import type { SfCart } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizerContext } from "../types";

export const normalizeCart = defineNormalizer.normalizeCart((cart, ctx) => {
  const { appliedCoupons } = normalizeDiscounts(cart, ctx);
  const { lineItems, subtotalRegularPrice, subtotalDiscountedPrice } = normalizeLineItems(
    cart,
    ctx,
  );
  const { billingAddress, shippingAddress } = normalizeAddresses(cart, ctx);
  const { shippingMethod, totalShippingPrice } = normalizeShipping(cart, ctx);
  const { totalItems, totalPrice, totalTax, totalCouponDiscounts } = normalizeTotals(cart, ctx);
  return {
    id: cart.id!,
    customerEmail: maybe(cart.email),
    appliedCoupons,
    lineItems,
    billingAddress,
    shippingAddress,
    totalItems,
    totalPrice,
    totalTax,
    subtotalDiscountedPrice,
    totalCouponDiscounts,
    shippingMethod,
    totalShippingPrice,
    subtotalRegularPrice,
  };
});

function normalizeDiscounts(cart: Cart, ctx: NormalizerContext): Pick<SfCart, "appliedCoupons"> {
  const appliedCoupons = (cart.applied_coupons ?? [])
    .filter(Boolean)
    .map((coupon) => ctx.normalizers.normalizeCartCoupon(coupon));
  return { appliedCoupons };
}

function normalizeLineItems(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "lineItems" | "subtotalRegularPrice" | "subtotalDiscountedPrice"> {
  const { normalizeMoney, normalizeCartLineItem } = ctx.normalizers;
  const lineItems = (cart.items ?? [])
    .filter(Boolean)
    .map((lineItem) => normalizeCartLineItem(lineItem));

  const lineItemsSubtotalRegular = lineItems.reduce((prev, curr) => {
    return prev + (curr.unitPrice?.regularPrice.amount ?? 0) * curr.quantity;
  }, 0);

  const lineItemsSubtotalDiscounted = lineItems.reduce((prev, curr) => {
    return prev + (curr.unitPrice?.value.amount ?? 0) * curr.quantity;
  }, 0);

  return {
    lineItems,
    subtotalRegularPrice: normalizeMoney({
      value: +lineItemsSubtotalRegular.toFixed(2),
      currency: cart.prices?.grand_total?.currency,
    }),
    subtotalDiscountedPrice: normalizeMoney({
      value: +lineItemsSubtotalDiscounted.toFixed(2),
      currency: cart.prices?.grand_total?.currency,
    }),
  };
}

function normalizeAddresses(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "billingAddress" | "shippingAddress"> {
  const { normalizeAddress } = ctx.normalizers;
  return {
    billingAddress: cart.billing_address ? normalizeAddress(cart.billing_address) : null,
    shippingAddress: cart.shipping_addresses?.[0]
      ? normalizeAddress(cart.shipping_addresses?.[0])
      : null,
  };
}

function normalizeTotals(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "totalPrice" | "totalItems" | "totalTax" | "totalCouponDiscounts"> {
  const { normalizeMoney } = ctx.normalizers;
  const totalPrice = normalizeMoney(cart.prices?.grand_total ?? {});
  const totalItems = cart.total_quantity ?? 0;

  const totalTax = normalizeMoney({
    currency: cart.prices?.subtotal_including_tax?.currency,
    value:
      (cart.prices?.subtotal_including_tax?.value ?? 0) -
      (cart.prices?.subtotal_excluding_tax?.value ?? 0),
  });

  const totalCouponDiscounts = normalizeMoney({
    value: cart.prices?.discounts?.reduce((prev, curr) => prev + (curr?.amount.value ?? 0), 0) ?? 0,
    currency: cart.prices?.grand_total?.currency,
  });

  return {
    totalPrice,
    totalItems,
    totalTax,
    totalCouponDiscounts,
  };
}

function normalizeShipping(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "shippingMethod" | "totalShippingPrice"> {
  const { normalizeMoney, normalizeShippingMethod } = ctx.normalizers;
  const selectedShippingMethod = cart.shipping_addresses?.[0]?.selected_shipping_method;

  const totalShippingPrice = selectedShippingMethod?.amount
    ? normalizeMoney(selectedShippingMethod?.amount)
    : null;
  const shippingMethod = selectedShippingMethod
    ? normalizeShippingMethod(selectedShippingMethod)
    : null;

  return {
    shippingMethod: maybe(shippingMethod),
    totalShippingPrice: maybe(totalShippingPrice),
  };
}
```
```ts [cartCoupon.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartCoupon = defineNormalizer.normalizeCartCoupon((discountCode) => {
  return {
    code: discountCode.code,
    id: discountCode.code,
    name: maybe(discountCode.code),
  };
});
```
```ts [shippingMethod.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeShippingMethod = defineNormalizer.normalizeShippingMethod(
  (shippingMethod, ctx) => {
    if (
      !shippingMethod.method_code ||
      !shippingMethod.carrier_code ||
      !shippingMethod.method_title ||
      !shippingMethod.amount
    ) {
      throw new Error("Invalid shipping method data");
    }
    return {
      id: [shippingMethod.carrier_code, shippingMethod.method_code].join(":"),
      name: shippingMethod.method_title,
      description: maybe(shippingMethod.carrier_title),
      price: ctx.normalizers.normalizeMoney(shippingMethod.amount),
      estimatedDelivery: null,
    };
  },
);
```
```ts [lineItem.ts]
import { CartItemWithTypeName, isConfigurableCartItem } from "@/normalizers/__internal__";
import { maybe, slugify } from "@shared/utils";
import type { ProductInterface } from "@vue-storefront/magento-types";
import type { SfCartLineItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizerContext } from "../types";

export const normalizeCartLineItem = defineNormalizer.normalizeCartLineItem((lineItem, ctx) => {
  const { variant, attributes } = getVariant(lineItem, ctx);
  const totalPrice = lineItem.prices?.row_total_including_tax
    ? ctx.normalizers.normalizeMoney(lineItem.prices?.row_total_including_tax)
    : null;

  return {
    ...variant,
    attributes,
    id: lineItem.uid,
    productId: lineItem.product.sku!,
    slug: lineItem.product.url_key ?? slugify(lineItem.product.name ?? ""),
    quantity: lineItem.quantity,
    totalPrice,
  };
});

function getVariant(lineItem: CartItemWithTypeName, ctx: NormalizerContext) {
  if (isConfigurableCartItem(lineItem)) {
    return {
      variant: getVariantFields(lineItem.configured_variant, ctx),
      attributes: (lineItem.configurable_options ?? [])
        .map((option) => option && ctx.normalizers.normalizeAttribute(option))
        .filter(Boolean),
    };
  }
  return {
    variant: getVariantFields(lineItem.product, ctx),
    attributes: [],
  };
}

function getVariantFields(
  product: ProductInterface,
  ctx: NormalizerContext,
): Pick<SfCartLineItem, "sku" | "image" | "name" | "quantityLimit" | "unitPrice"> {
  const { normalizeImage, normalizeDiscountablePrice } = ctx.normalizers;
  const image = product.thumbnail ? normalizeImage(product.thumbnail) : null;
  const unitPrice = product.price_range?.minimum_price
    ? normalizeDiscountablePrice(product.price_range.minimum_price)
    : null;

  return {
    image,
    name: maybe(product.name),
    sku: maybe(product.sku),
    unitPrice,
    quantityLimit: maybe(product.only_x_left_in_stock),
  };
}
```
::
