# Cart normalizer

The `normalizeCart` function is used to map a SAP Cart into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name   | Type                                                                                         | Default value | Description                                                                                        |
| ------ | -------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `cart` | [`Cart`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.cart.html) |               | SAP Cart                                                                                           |
| `ctx`  | `NormalizerContext`                                                                          |               | context needed for the normalizer. `transformImageUrl` is added to transform line items image urls |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCart` with an `expirationTime` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeCart: (cart, context) => ({
    ...normalizersSAP.normalizeCart(cart, context),
    expirationTime: cart.expirationTime,
  }),
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
```ts [cart.ts]
import type { Address, Cart, Price } from "@vsf-enterprise/sapcc-types";
import { Maybe, SfAddress, SfCart, SfMoney } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizerContext } from "../types";

export const normalizeCart = defineNormalizer.normalizeCart((cart, ctx) => {
  const { normalizeCartCoupon, normalizeCartLineItem, normalizeShippingMethod, normalizeMoney } =
    ctx.normalizers;
  const appliedCoupons = cart.appliedVouchers?.map((voucher) => normalizeCartCoupon(voucher)) ?? [];
  const billingAddress = getAddress(cart.paymentInfo?.billingAddress, ctx);
  const customerEmail = getCustomerEmail(cart);
  const lineItems = cart.entries?.map((entry) => normalizeCartLineItem(entry)) ?? [];
  const shippingAddress = getAddress(cart.deliveryAddress, ctx);
  const shippingMethod = cart.deliveryMode ? normalizeShippingMethod(cart.deliveryMode) : null;
  const subtotalDiscountedPrice = getSubtotalDiscountedPrice(cart, ctx);
  const totalShippingPrice = cart.deliveryCost ? normalizeMoney(cart.deliveryCost) : null;
  const id = (ctx.isAuthenthicated ? cart.code : cart.guid) as string;

  return {
    appliedCoupons,
    billingAddress,
    customerEmail,
    id,
    lineItems,
    shippingAddress,
    shippingMethod,
    subtotalDiscountedPrice,
    subtotalRegularPrice: getSubtotalRegularPrice(cart, ctx),
    totalCouponDiscounts: normalizeMoney(cart.orderDiscounts as Price),
    totalItems: cart.totalUnitCount as number,
    totalPrice: normalizeMoney(cart.totalPriceWithTax as Price),
    totalShippingPrice,
    totalTax: normalizeMoney(cart.totalTax as Price),
  };
});

function getAddress(address: Address | undefined, ctx: NormalizerContext): Maybe<SfAddress> {
  return address ? ctx.normalizers.normalizeAddress(address) : null;
}

function getCustomerEmail(cart: Cart): SfCart["customerEmail"] {
  // example uid: 42bc98b7-63ab-407b-9864-007acfa50888|email@example.com or just email
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uidParts = cart.user?.uid?.split("|") ?? [];
  return uidParts.find((element) => /^\S+@\S+\.\S+?$/.test(element)) ?? null;
}

/**
 * Calculates cart subtotal price after item discounts are applied, before order discounts, shipping and tax.
 */
function getSubtotalDiscountedPrice(cart: Cart, ctx: NormalizerContext): SfMoney {
  const productsPriceAfterDiscounts =
    cart.entries?.reduce((acc, entry) => {
      return acc + (entry.totalPrice?.value ?? 0);
    }, 0) ?? 0;
  return ctx.normalizers.normalizeMoney({
    currencyIso: cart.totalPrice?.currencyIso,
    value: productsPriceAfterDiscounts,
  });
}

/**
 * Calculates cart regular subtotal price before item discounts, order discounts, shipping and tax.
 *
 * Note: `subTotal` field in SAPCC represents the price **AFTER** item and order discounts are applied.
 */
function getSubtotalRegularPrice(cart: Cart, ctx: NormalizerContext): SfMoney {
  const productsPriceBeforeDiscounts =
    cart.entries?.reduce((acc, { quantity = 1, basePrice }) => {
      return acc + (basePrice?.value ?? 0) * quantity;
    }, 0) ?? 0;

  return ctx.normalizers.normalizeMoney({
    currencyIso: cart.totalPrice?.currencyIso,
    value: productsPriceBeforeDiscounts,
  });
}
```
```ts [cartCoupon.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartCoupon = defineNormalizer.normalizeCartCoupon((discountCode) => {
  return {
    code: (discountCode.voucherCode || discountCode.code) as string,
    id: (discountCode.voucherCode || discountCode.code) as string,
    name: maybe(discountCode.name || discountCode.code),
  };
});
```
```ts [shippingMethod.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeShippingMethod = defineNormalizer.normalizeShippingMethod((input, ctx) => {
  return {
    id: input.code!,
    name: input.name!,
    description: maybe(input.description),
    price: ctx.normalizers.normalizeMoney(input.deliveryCost!),
    estimatedDelivery: null,
  };
});
```
```ts [lineItem.ts]
import { createSfImages } from "../product/images";
import type { NormalizerContext } from "@/normalizers/types";
import { maybe, slugify } from "@shared/utils";
import type { Product } from "@vsf-enterprise/sapcc-types";
import type { SfAttribute, SfImage } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCartLineItem = defineNormalizer.normalizeCartLineItem((lineItem, ctx) => {
  const slug = slugify(lineItem?.product?.code ?? "", lineItem?.product?.name ?? "");
  const { normalizeMoney, normalizeDiscountablePrice } = ctx.normalizers;

  return {
    attributes: getAttributes(lineItem.product, ctx),
    id: lineItem.product?.code as string,
    productId: lineItem.product?.code as string,
    image: getImageFromProduct(lineItem.product, ctx),
    slug,
    name: maybe(lineItem.product?.name),
    quantity: lineItem.quantity as number,
    sku: maybe(lineItem.product?.code),
    totalPrice: lineItem.totalPrice ? ctx.normalizers.normalizeMoney(lineItem.totalPrice) : null,
    unitPrice: lineItem.basePrice
      ? ctx.normalizers.normalizeDiscountablePrice(lineItem.basePrice)
      : null,
    quantityLimit: maybe(lineItem.product?.stock?.stockLevel),
  };
});

function getImageFromProduct(product: Product | undefined, ctx: NormalizerContext): SfImage | null {
  if (!product) {
    return null;
  }
  const { primaryImage } = createSfImages(product.images, ctx);

  return primaryImage;
}

function getAttributes({ baseOptions }: Product = {}, ctx: NormalizerContext): SfAttribute[] {
  if (!baseOptions) return [];

  const optionQualifiers = baseOptions.flatMap(
    (option) => option.selected?.variantOptionQualifiers ?? [],
  );

  return optionQualifiers
    .map((optionQualifier) => ctx.normalizers.normalizeAttribute(optionQualifier))
    .filter(Boolean);
}
```
::
