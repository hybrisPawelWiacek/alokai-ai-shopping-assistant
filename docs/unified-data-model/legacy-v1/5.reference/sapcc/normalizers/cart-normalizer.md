# Cart normalizer

The `normalizeCart` function is used to map a SAP Cart into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name      | Type                                                                                         | Default value | Description                                                                                       |
|-----------| -------------------------------------------------------------------------------------------- | ------------- |---------------------------------------------------------------------------------------------------|
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `cart`    | [`Cart`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.cart.html) |               | SAP Cart                                                                                          |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCart` with an `expirationTime` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCart: (context, cart) => ({
          expirationTime: cart.expirationTime,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

You can override the `normalizeCart`, but it's also available to override the smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, `normalizeCartLineItem`.

## Source

The `normalizeCart` function consists of several smaller normalizers such as `normalizeCartCoupon`, `normalizeShippingMethod`, and more.

::code-group
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/cart/cart.ts [cart.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/cart/cartCoupon.ts [cartCoupon.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/cart/shippingMethod.ts [shippingMethod.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/cart/lineItem.ts [lineItem.ts]
::
