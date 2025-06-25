# @vsf-enterprise/unified-api-sfcc

## 0.16.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersSFCC,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-sfcc";

const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // your implementation goes here, no custom fields
  },
);

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersSFCC.normalizeCart(cart, context),
    // still use inline normalizer to add custom fields
    version: cart.version,
  }),
});
```

- **[ADDED]** `normalizers` to `NormalizerContext`. You can now access the other normalizers from the context. This is useful when you want to reuse the existing normalizers in your custom normalizer.

```ts
const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // ctx.normalizers.normalizeMoney is now available
  },
);
```

- **[REMOVED]** `normalizeAttributes` from `normalizersSFCC`. Now a `normalizeAttribute` should be used instead. The `normalizeAttribute` accepts as an input an object containing an array of [`variationAttributes`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type:variation_attribute) and `key` and `value` of a single variation value.

### Patch Changes

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

## 0.15.3

### Patch Changes

- **[FIXED]** - `getOrderDetails()` API method resolves order data for authorized user.

## 0.15.2

### Patch Changes

- 04a9ef6: [FIXED] Allow 0 to be a valid shipping price in `normalizeOrder`

## 0.15.1

### Patch Changes

- a4d76f8: [FIXED] Handle null price and image_groups in `normalizeAlgoliaProductCatalogItem` in Algolia extension.

## 0.15.0

### Minor Changes

- 724a3a2: Exported NormalizerContext type

## 0.14.0

### Minor Changes

- 64b7b17: Added error handling on registerCustomer endpoint. Now if e-commerce response will be negative, unified endpoint return HTTP 400 with message Could not register customer

## 0.13.0

### Minor Changes

- 2ac49bc: Added support for Algolia. A separate sub-package available as `@vsf-enterprise/unified-api-sfcc/algolia`. Using this API methods you can easily replace the searchProduct endpoint to the one based on the Algolia API. For further information check the Algolia Integration chapter in the docs.

## 0.12.0

### Minor Changes

- 82a761c: - [`Unified Data Model`](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model) model and methods integration.

  - UDM extension import:
    - `import { createUnifiedExtension } from "@vsf-enterprise/unified-api-sfcc"`
  - UDM model types import:
    - `import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-sfcc"`

## 0.11.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.10.2

### Patch Changes

- a856688: Updated unnormalizeAddres function to match new type reqiurements

## 0.10.1

### Patch Changes

- 459d20a: Update dependencies

## 0.10.0

### Minor Changes

- 8401301: Integrated normalization methods from the `@vsf-enterprise/normalizer-sfcc` library. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-sfcc"`

## 0.9.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

### Patch Changes

- Updated dependencies [a912cf6]
  - @vsf-enterprise/normalizer-sfcc@0.9.0

## 0.8.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.7.0

### Minor Changes

- d3b0594: The searchProducts endpoint is updated to match the updated behavior of the `unified-data-model`. Removed the "latest" from the translated sort options, which wasn't available by default in SFCC. Still, all non-standard sorting options are passing by directly to the API request.

## 0.6.2

### Patch Changes

- 1f52ffa: Update dependencies

## 0.6.1

### Patch Changes

- b7cccc5: Update dependencies

## 0.6.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

### Patch Changes

- Updated dependencies [6a3e0e8]
  - @vsf-enterprise/normalizer-sfcc@0.8.0

## 0.5.2

### Patch Changes

- 027ba5cc: Fixed product discount on PLP

## 0.5.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.5.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value
- f5a32640: Unified error response for `changeCustomerPassword`. Now when `currentPassword` is invalid, a 403 error response will be returned.

### Patch Changes

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.4.0

### Minor Changes

- Added endpoints for fetching list or user's orders and particular one. Also added necessary normalizers for SfOrder, SfOrderLineItem and SfOrderListItem.

- Added placeOrder endpoint

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.7.0

## 0.3.2

### Patch Changes

- Fixed `addCartLineItem` for product variants
- Fixed `searchProducts`'s `categoryHierarchy` including selected category

## 0.3.1

### Patch Changes

- Changed the way of calculating SfDiscountedPrice to be based on comparing pricelists for given product.

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.6.0

## 0.3.0

### Minor Changes

- Added endpoints for adding, removing & updating line items in cart

- Implemented `getProducts()` api handler

- Implemented `setCartAddress` method for checkout

- Implemented `setCustomerEmail` method for checkout

- Implemented `getAvailableShippingMethods` and `setShippingMethod` methods for checkout

### Patch Changes

- Created normalization function for SfCartLineItem. Updated getCart method to fetch product data for line items.

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.5.0

## 0.2.0

### Minor Changes

- getCategories api method

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.3.0
