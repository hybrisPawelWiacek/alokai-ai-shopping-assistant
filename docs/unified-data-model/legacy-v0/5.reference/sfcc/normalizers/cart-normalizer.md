# Cart normalizer

The `normalizeCart` function is used to map a SFCC Basket into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name     | Type                                                                                                                 | Default value | Description                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `basket` | [`Basket`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Abasket) |               | SFCC Cart                                                                                           |
| `ctx`    | `NormalizerContext`                                                                                                  |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCart` with an `lastModification` field.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeCart: (basket, context) => ({
    ...normalizersSFCC.normalizeCart(basket, context),
    lastModification: basket.lastModified,
  }),
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
```ts [cart.ts]
/* eslint-disable complexity */
import type { NormalizerContext } from "@/normalizers/types";
import { ProductItem } from "@internal";
import { maybe } from "@shared/utils";
import { Basket, BasketAddress } from "@vsf-enterprise/sfcc-types";
import type { Maybe, SfAddress, SfCart, SfCartLineItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

/**
 * @link Reference: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=type:Basket
 */
export const normalizeCart = defineNormalizer.normalizeCart((basket, ctx) => {
  if (!basket.basketId || !basket.currency) {
    throw new Error("Basket must have an id, currency");
  }
  // In SAPCC basket currency is static and can't be changed.
  ctx.currency = basket.currency;
  const { normalizeCartCoupon, normalizeCartLineItem, normalizeMoney } = ctx.normalizers;
  const totalTax = getTotalTax(basket, ctx);
  const totalShippingPrice = basket.shippingTotal ? normalizeMoney(basket.shippingTotal) : null;
  const totalPrice = getTotalPrice(basket, ctx);
  const totalItems = getTotalItems(basket);
  const shippingAddress = getAddress(basket.shipments?.[0]?.shippingAddress, ctx);
  const billingAddress = getAddress(basket.billingAddress, ctx);
  const appliedCoupons = basket.couponItems?.map((coupon) => normalizeCartCoupon(coupon)) ?? [];
  const lineItems = basket.productItems?.map((item) => normalizeCartLineItem(item)) ?? [];
  const shippingMethod = getShippingMethod(basket, ctx);
  const totalCouponDiscounts = basket.productItems
    ? getTotalDiscounts(basket.productItems, ctx)
    : normalizeMoney(0);
  const subtotalRegularPrice = getSubtotalRegularPrice(lineItems, ctx);
  const subtotalDiscountedPrice = getSubtotalDiscountedPrice(basket.productItems, ctx);

  return {
    appliedCoupons,
    billingAddress,
    customerEmail: maybe(basket.customerInfo?.email || undefined),
    id: basket.basketId,
    lineItems,
    shippingAddress,
    shippingMethod,
    subtotalDiscountedPrice,
    subtotalRegularPrice,
    totalCouponDiscounts,
    totalItems,
    totalPrice,
    totalShippingPrice,
    totalTax,
  };
});

/**
 * taxTotal is undefined until the shipping method is selected, therefore we use adjustedMerchandizeTotalTax as a fallback.
 */
function getTotalTax(basket: Basket, ctx: NormalizerContext): SfCart["totalTax"] {
  const amount = basket.taxTotal ?? basket.adjustedMerchandizeTotalTax ?? 0;
  return ctx.normalizers.normalizeMoney(amount);
}

/**
 * orderTotal is undefined until the shipping method is selected, therefore we use productTotal as a fallback.
 */
function getTotalPrice(basket: Basket, ctx: NormalizerContext): SfCart["totalPrice"] {
  const shippingPrice = basket.shippingTotal ?? 0;
  const amount = basket.orderTotal || (basket.productTotal ?? 0) + shippingPrice;
  return ctx.normalizers.normalizeMoney(amount);
}

function getAddress(address: BasketAddress | undefined, ctx: NormalizerContext): Maybe<SfAddress> {
  return address ? ctx.normalizers.normalizeAddress(address) : null;
}

/**
 * SFCC always create one shipment which is available by default. Its id is "me". Although SFCC supports splitting product items into multiple shipments, we don't support it yet.
 * @link Reference: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=type:Shipment
 */
function getShippingMethod(basket: Basket, ctx: NormalizerContext): SfCart["shippingMethod"] {
  const unnormalizedShippingMethod = basket.shipments?.[0]?.shippingMethod;
  return unnormalizedShippingMethod
    ? ctx.normalizers.normalizeShippingMethod(unnormalizedShippingMethod)
    : null;
}

/**
 * ProductItem may include different types of discounts - coupons, promotions, manual discounts etc. All of them are sum up in priceAfterOrderDiscount.
 * To get discount components, you can iterate through priceAdjustments array.
 * @link Reference: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=type%3AProductItem
 */
function getTotalDiscounts(
  items: ProductItem[],
  ctx: NormalizerContext,
): SfCart["totalCouponDiscounts"] {
  const amount = items.reduce((acc, product) => {
    if (!product.price || !product.priceAfterOrderDiscount) return acc;

    const discount = product.price - product.priceAfterOrderDiscount;
    return acc + discount;
  }, 0);

  return ctx.normalizers.normalizeMoney(amount);
}

function getSubtotalRegularPrice(
  lineItems: SfCartLineItem[],
  ctx: NormalizerContext,
): SfCart["subtotalRegularPrice"] {
  const lineItemsAmount = lineItems.reduce(
    (acc, item) => acc + (item.unitPrice?.regularPrice.amount || 0) * item.quantity,
    0,
  );

  return ctx.normalizers.normalizeMoney(+lineItemsAmount.toFixed(2));
}

/**
 * Returns cumulated `productItem[].price` value, which is the price of the line item before applying any adjustments (e.g. coupons) or shipping charges.
 * Equals to purchasable price of the product - Sale pricebook value (if exists) or List pricebook value.
 * @link Reference: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket
 */
function getSubtotalDiscountedPrice(
  productItems: Basket["productItems"] = [],
  ctx: NormalizerContext,
): SfCart["subtotalDiscountedPrice"] {
  const amount = productItems.reduce((acc, item) => acc + (item.price || 0), 0);

  return ctx.normalizers.normalizeMoney(amount);
}

function getTotalItems(basket: Basket): SfCart["totalItems"] {
  return basket.productItems?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) ?? 0;
}
```
```ts [cartCoupon.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartCoupon = defineNormalizer.normalizeCartCoupon((discountCode) => {
  return {
    code: discountCode.code,
    id: discountCode.couponItemId as string,
    name: maybe(discountCode.code ?? discountCode.couponItemId),
  };
});
```
```ts [shippingMethod.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeShippingMethod = defineNormalizer.normalizeShippingMethod(
  (shippingMethod, ctx) => {
    if (!shippingMethod.name) {
      console.warn(`Shipping method with id ${shippingMethod.id} doesn't have name. Skipping it`);
      return null;
    }

    return {
      id: shippingMethod.id,
      name: shippingMethod.name,
      description: maybe(shippingMethod.description),
      price: ctx.normalizers.normalizeMoney(shippingMethod.price ?? 0),
      estimatedDelivery: maybe(shippingMethod.c_estimatedArrivalTime),
    };
  },
);
```
```ts [lineItem.ts]
/* eslint-disable complexity */
/* eslint-disable max-statements */
import { maybe, slugify } from "@shared/utils";
import type { SfAttribute, SfImage } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import type { NormalizerContext } from "../types";
import {
  getProductPrimaryImage,
  type Variant,
  type VariationAttribute,
} from "@/normalizers/__internal__";

export const normalizeCartLineItem = defineNormalizer.normalizeCartLineItem((lineItem, ctx) => {
  if (!lineItem.productId || !lineItem.itemId || !lineItem.quantity) {
    throw new Error("Product ID, item ID, and quantity are required.");
  }

  const { productsDetails } = ctx;

  if (!productsDetails) {
    throw new Error("Products details are required to normalize a cart line item.");
  }

  const productDetails = productsDetails.find((product) => product.id === lineItem.productId);

  if (!productDetails) {
    throw new Error(`Product details for product ${lineItem.productId} not found.`);
  }

  const { variants, variationAttributes, imageGroups, inventory } = productDetails;
  const { normalizeMoney, normalizeDiscountablePrice, normalizeImage } = ctx.normalizers;
  const variant = variants?.find((variant) => variant.productId === lineItem.productId);
  let attributes: SfAttribute[] = [];
  if (variant && variationAttributes) {
    attributes = getAttributes(variant, variationAttributes, ctx);
  }

  const totalPrice = lineItem.price ? normalizeMoney(lineItem.price) : null;
  const unitPrice = normalizeDiscountablePrice({
    ...productDetails,
    pricebookQuantity: lineItem.quantity,
  });

  let image: SfImage | null = null;
  if (imageGroups) {
    const productImage = getProductPrimaryImage(imageGroups);
    if (productImage) {
      image = normalizeImage(productImage);
    }
  }

  return {
    productId: lineItem.productId,
    id: lineItem.itemId,
    name: maybe(lineItem.productName),
    quantity: lineItem.quantity,
    quantityLimit: maybe(inventory?.ats),
    sku: maybe(lineItem.productId),
    slug: slugify(lineItem.productId),
    attributes,
    image,
    totalPrice,
    unitPrice: maybe(unitPrice),
  };
});

function getAttributes(
  variant: Variant,
  variationAttributes: VariationAttribute[],
  ctx: NormalizerContext,
): SfAttribute[] {
  const variationValues = variant.variationValues;
  if (!variationValues) {
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
::
