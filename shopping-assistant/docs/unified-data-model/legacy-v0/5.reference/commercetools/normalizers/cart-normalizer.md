# Cart normalizer

The `normalizeCart` function is used to map a Commercetools Cart into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name   | Type                                                                                      | Default value | Description                       |
| ------ | ----------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `cart` | [`Cart`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Cart) |               | Commercetools Cart                |
| `ctx`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCart` with a `version` field.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeCart: (cart, context) => ({
    ...normalizersCT.normalizeCart(cart, context),
    version: cart.version,
  }),
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
```ts [cart.ts]
import type { NormalizerContext } from "@/normalizers/types";
import { maybe } from "@shared/utils";
import type { Cart } from "@vsf-enterprise/commercetools-types";
import type { SfCart } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCart = defineNormalizer.normalizeCart((cart, ctx) => {
  const { lineItems } = normalizeLineItems(cart, ctx);
  const { appliedCoupons } = normalizeDiscounts(cart, ctx);
  const { shippingMethod, totalShippingPrice } = normalizeShipping(cart, ctx);
  const { billingAddress, shippingAddress } = normalizeAddresses(cart, ctx);
  const {
    totalItems,
    totalPrice,
    totalTax,
    subtotalRegularPrice,
    subtotalDiscountedPrice,
    totalCouponDiscounts,
  } = normalizeTotals(cart, ctx);

  return {
    id: cart.id,
    customerEmail: getCartCustomerEmail(cart),
    lineItems,
    totalPrice,
    subtotalRegularPrice,
    subtotalDiscountedPrice,
    totalItems,
    appliedCoupons,
    billingAddress,
    shippingAddress,
    shippingMethod,
    totalShippingPrice,
    totalCouponDiscounts,
    totalTax,
  };
});

function normalizeDiscounts(cart: Cart, ctx: NormalizerContext): Pick<SfCart, "appliedCoupons"> {
  const appliedCoupons = cart.discountCodes
    .map((discountCode) =>
      discountCode.discountCode
        ? ctx.normalizers.normalizeCartCoupon(discountCode.discountCode)
        : null,
    )
    .filter((item) => item !== null) as SfCart["appliedCoupons"];

  return {
    appliedCoupons,
  };
}

function normalizeShipping(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "shippingMethod" | "totalShippingPrice"> {
  const { normalizeMoney, normalizeShippingMethod } = ctx.normalizers;
  const shippingMethod =
    cart.shippingInfo?.shippingMethod &&
    normalizeShippingMethod({
      ...cart.shippingInfo.shippingMethod,
      totalPrice: cart.totalPrice,
    });

  const totalShippingPrice = cart.shippingInfo && normalizeMoney(cart.shippingInfo.price);

  return {
    shippingMethod: maybe(shippingMethod),
    totalShippingPrice: maybe(totalShippingPrice),
  };
}

function normalizeAddresses(
  cart: Cart,
  ctx: NormalizerContext,
): Pick<SfCart, "billingAddress" | "shippingAddress"> {
  const { normalizeAddress } = ctx.normalizers;
  return {
    billingAddress: cart.billingAddress ? normalizeAddress(cart.billingAddress) : null,
    shippingAddress: cart.shippingAddress ? normalizeAddress(cart.shippingAddress) : null,
  };
}

type Totals = Pick<
  SfCart,
  | "totalPrice"
  | "subtotalRegularPrice"
  | "subtotalDiscountedPrice"
  | "totalItems"
  | "totalTax"
  | "totalCouponDiscounts"
>;

function normalizeTotals(cart: Cart, ctx: NormalizerContext): Totals {
  const { normalizeMoney } = ctx.normalizers;
  const totalPrice = normalizeMoney(cart.totalPrice);
  const totalItems = cart.lineItems.reduce((total, item) => total + item.quantity, 0);

  const { regular: subtotalRegularCentAmount, discounted: subtotalDiscountedCentAmount } =
    cart.lineItems.reduce(
      (total, item) => {
        const regular = item.price.value.centAmount * item.quantity;
        total.regular += regular;
        total.discounted += item.price.discounted?.value?.centAmount * item.quantity || regular;
        return total;
      },
      { regular: 0, discounted: 0 },
    );

  const subtotalRegularPrice = normalizeMoney({
    ...cart.totalPrice,
    centAmount: subtotalRegularCentAmount,
  });

  const subtotalDiscountedPrice = normalizeMoney({
    ...cart.totalPrice,
    centAmount: subtotalDiscountedCentAmount,
  });

  const totalTax =
    cart.taxedPrice?.totalGross && cart.taxedPrice?.totalNet
      ? normalizeMoney({
          ...cart.taxedPrice.totalGross,
          centAmount: cart.taxedPrice.totalGross.centAmount - cart.taxedPrice.totalNet.centAmount,
        })
      : normalizeMoney({
          ...cart.totalPrice,
          centAmount: 0,
        });

  const totalCouponDiscounts = normalizeTotalDiscounts(cart, ctx);

  return {
    totalPrice,
    totalItems,
    totalTax,
    subtotalRegularPrice,
    subtotalDiscountedPrice,
    totalCouponDiscounts,
  };
}

function normalizeLineItems(cart: Cart, ctx: NormalizerContext): Pick<SfCart, "lineItems"> {
  return {
    lineItems: cart.lineItems
      .map((lineItem) => ctx.normalizers.normalizeCartLineItem(lineItem))
      .filter(Boolean),
  };
}

function normalizeTotalDiscounts(cart: Cart, ctx: NormalizerContext) {
  const totalCouponsAmount = calculateDiscountsValue(cart);

  return ctx.normalizers.normalizeMoney({
    centAmount: totalCouponsAmount ?? 0,
    fractionDigits: cart.totalPrice.fractionDigits,
    currencyCode: cart.totalPrice.currencyCode,
    type: cart.totalPrice.type,
  });
}

function calculateDiscountsValue(cart: Cart) {
  const { lineItems } = cart;
  if (!lineItems || lineItems.length <= 0) {
    return null;
  }

  return lineItems.reduce((totalAmount, lineItem) => {
    const lineItemDiscountAmount = lineItem.discountedPricePerQuantity.reduce(
      (amount, discountedPricePerQuantity) => {
        const original =
          (lineItem.price.discounted?.value.centAmount || lineItem.price.value.centAmount) *
          discountedPricePerQuantity.quantity;

        const discounted =
          discountedPricePerQuantity.discountedPrice.value.centAmount *
          discountedPricePerQuantity.quantity;

        return amount + (original - discounted);
      },
      0,
    );
    return totalAmount + lineItemDiscountAmount;
  }, 0);
}

function getCartCustomerEmail(cart: Cart): string | null {
  return cart.customerEmail || cart.customer?.email || null;
}
```
```ts [cartCoupon.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartCoupon = defineNormalizer.normalizeCartCoupon((discountCode) => {
  return {
    code: discountCode.code,
    id: discountCode.id,
    name: maybe(discountCode.name),
  };
});
```
```ts [shippingMethod.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizeShippingMethodInput, ShippingRateMatcher } from "../types";
import { ShippingRate } from "@vsf-enterprise/commercetools-types";

const defaultShippingRateMatcher: ShippingRateMatcher = (shippingRates, totalPrice) => {
  let matchingShippingRate: ShippingRate | undefined = shippingRates.find(
    (rate) => rate.isMatching,
  );
  if (!matchingShippingRate) {
    matchingShippingRate = shippingRates.find(
      (rate) => rate.freeAbove && rate.freeAbove.centAmount < totalPrice.centAmount,
    );
  }
  if (!matchingShippingRate) {
    matchingShippingRate = shippingRates[0];
  }

  return matchingShippingRate;
};

export const normalizeShippingMethod = defineNormalizer.normalizeShippingMethod(
  (shippingMethod, ctx) => {
    const shippingRateMatcher = ctx.shippingRateMatcher || defaultShippingRateMatcher;
    const shippingRate = getShippingRate(shippingMethod, shippingRateMatcher);
    const { normalizeMoney } = ctx.normalizers;

    if (!shippingRate) {
      return null;
    }

    const isFreeShipping =
      shippingRate.freeAbove &&
      shippingMethod.totalPrice.centAmount > shippingRate.freeAbove.centAmount;

    return {
      id: shippingMethod.id,
      name: shippingMethod.localizedName || shippingMethod.name,
      description: maybe(shippingMethod.localizedDescription),
      price: isFreeShipping
        ? normalizeMoney({ ...shippingRate.price, centAmount: 0 })
        : normalizeMoney(shippingRate.price),
      estimatedDelivery: null,
    };
  },
);

function getShippingRate(
  shippingMethod: NormalizeShippingMethodInput,
  shippingRateMatcher: typeof defaultShippingRateMatcher,
) {
  const { zoneRates } = shippingMethod;
  if (!Array.isArray(zoneRates) || zoneRates.length === 0) {
    return null;
  }
  const shippingRates = zoneRates[0]!.shippingRates;
  const shippingRate = shippingRateMatcher(shippingRates, shippingMethod.totalPrice);

  return shippingRate || null;
}
```
```ts [lineItem.ts]
import { maybe, slugify } from "@shared/utils";
import type { LineItem } from "@vsf-enterprise/commercetools-types";
import type { SfImage, SfMoney } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizerContext } from "../types";

export const normalizeCartLineItem = defineNormalizer.normalizeCartLineItem((lineItem, ctx) => {
  const attributes = lineItem.variant
    ? lineItem.variant.attributesRaw
        .map((attr) => ctx.normalizers.normalizeAttribute(attr))
        .filter(Boolean)
    : [];

  return {
    attributes,
    id: lineItem.id,
    productId: lineItem.productId,
    image: getImageFromVariant(lineItem, ctx),
    slug: getSlug(lineItem),
    name: maybe(lineItem.name),
    quantity: lineItem.quantity,
    sku: maybe(lineItem.variant?.sku),
    totalPrice: calculateTotalPrice(lineItem, ctx),
    unitPrice: ctx.normalizers.normalizeDiscountablePrice(lineItem.price),
    quantityLimit: maybe(lineItem.variant?.availability?.noChannel?.availableQuantity),
  };
});

function getImageFromVariant(lineItem: LineItem, ctx: NormalizerContext): SfImage | null {
  if (!lineItem.variant) {
    return null;
  }

  if (lineItem.variant.images.length === 0) {
    return null;
  }

  return ctx.normalizers.normalizeImage(lineItem.variant.images[0]!);
}

function getSlug(lineItem: LineItem): string {
  if (lineItem.productSlug) {
    return lineItem.productSlug;
  }

  return slugify(lineItem?.name ?? "", lineItem.variant?.sku ?? "");
}

function calculateTotalPrice(lineItem: LineItem, ctx: NormalizerContext): SfMoney {
  if (!lineItem.price) {
    return ctx.normalizers.normalizeMoney({
      centAmount: 0,
      currencyCode: "",
      fractionDigits: 0,
      type: "",
    });
  }

  let centAmount =
    (lineItem.price.discounted ?? lineItem.price).value.centAmount * lineItem.quantity;

  if (lineItem.discountedPricePerQuantity.length > 0) {
    centAmount = lineItem.discountedPricePerQuantity.reduce((acc, discountedPrice) => {
      return acc + discountedPrice.discountedPrice.value.centAmount * discountedPrice.quantity;
    }, 0);
  }

  return ctx.normalizers.normalizeMoney({
    centAmount,
    currencyCode: lineItem.price.value.currencyCode,
    fractionDigits: lineItem.price.value.fractionDigits,
    type: lineItem.price.value.type,
  });
}
```
::
