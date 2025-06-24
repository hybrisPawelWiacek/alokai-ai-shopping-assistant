# Cart normalizer

The `normalizeCart` function is used to map a SFCC Basket into the unified [`SfCart`](/reference/unified-data-model.html#sfcart) data model.

## Parameters

| Name      | Type                                                                                                                 | Default value | Description                                                                                         |
|-----------| -------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                                                  |               | Context needed for the normalizer. Context contain a `currency` field that contains a currency code |
| `basket`  | [`Basket`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Abasket) |               | SFCC Cart                                                                                           |

## Extending

The `SfCart` structure is returned from all [Unified Cart Methods]($base/reference/unified-methods#getcart) such as [`GetCart`]($base/reference/unified-methods#cart), [`AddCartLineItem`]($base/reference/unified-methods#addcartlineitem), and [`UpdateCartLineItem`]($base/reference/unified-methods#updatecartlineitem). If the `SfCart` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API. The following example demonstrates how to extend `SfCart` with an `lastModification` field.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeCart: (context, basket) => ({
          lastModification: basket.lastModified,
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
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/cart/cart.ts [cart.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/cart/cartCoupon.ts [cartCoupon.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/cart/shippingMethod.ts [shippingMethod.ts]
<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/cart/lineItem.ts [lineItem.ts]
::
