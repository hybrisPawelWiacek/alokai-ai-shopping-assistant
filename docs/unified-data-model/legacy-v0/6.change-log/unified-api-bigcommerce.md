# @vsf-enterprise/unified-api-bigcommerce

## 0.19.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersBC,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-bigcommerce";

const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // your implementation goes here, no custom fields
  },
);

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersBC.normalizeCart(cart, context),
    // still use inline normalizer to add custom fields
    parentId: cart.parent_id,
  }),
});
```

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

- **[ADDED]** `normalizers` to `NormalizerContext`. You can now access the other normalizers from the context. This is useful when you want to reuse the existing normalizers in your custom normalizer.

```ts
const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // ctx.normalizers.normalizeMoney is now available
  },
);
```

## 0.18.0

### Minor Changes

- **[ADDED]** accept passing categories' slug as id in `getCategory` method and `searchProducts`. If passed field will be an uuid, it will be considered as id, otherwise as slug.

## 0.17.2

### Patch Changes

- 2af9fd4: [FIXED] Issue when image of selected product variant was not displayed.

## 0.17.1

### Patch Changes

- 4c21ada: [FIXED] Fix an issue where the Bigcommerce cart normalizer returned only physical items. Now physical and digital items are returned.

## 0.17.0

### Minor Changes

- 724a3a2: Exported NormalizerContext type

## 0.16.0

### Minor Changes

- 64b7b17: Added error handling on registerCustomer endpoint. Now if e-commerce response will be negative, unified endpoint return HTTP 400 with message Could not register customer

## 0.15.0

### Minor Changes

- 82a761c: - [`Unified Data Model`](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model) model and methods integration.

  - UDM extension import:
    - `import { createUnifiedExtension } from "@vsf-enterprise/unified-api-bigcommerce"`
  - UDM model types import:
    - `import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-bigcommerce"`

## 0.14.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.13.2

### Patch Changes

- a856688: Updated unnormalizeAddres function to match new type reqiurements

## 0.13.1

### Patch Changes

- 459d20a: Update dependencies

## 0.13.0

### Minor Changes

- 8401301: Integrated normalization methods from the `@vsf-enterprise/normalizer-bigcommerce` library. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-bigcommerce"`

## 0.12.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

### Patch Changes

- Updated dependencies [a912cf6]
  - @vsf-enterprise/normalizer-bigcommerce@0.7.0

## 0.11.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.10.0

### Minor Changes

- d3b0594: Update the sorting options in SearchProducts according to the changes in the unified data model. The latest option is no longer supported directly. Still, you can use it by passing the value from `GraphQL.SearchProductsSortInput` enum. The "relevant" is the new default option.

## 0.9.2

### Patch Changes

- 1f52ffa: Update dependencies
- 9431521: Fixed price currency in `getProducts()` method

## 0.9.1

### Patch Changes

- d7363a9: Add `getNormalizedCart` function for fetching product with quantityLimit.

## 0.9.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

### Patch Changes

- Updated dependencies [6a3e0e8]
  - @vsf-enterprise/normalizer-bigcommerce@0.6.0

## 0.8.1

### Patch Changes

- 41445ff1: Removed `MESSAGE_LOGIN_NOT_FOUND` and used `MESSAGE_LOGIN_ERROR` in the `loginCustomer` method.

## 0.8.0

### Minor Changes

- bfa5d496: Multi currency support

## 0.7.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.7.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value
- f5a32640: Unified error response for `changeCustomerPassword`. Now when `currentPassword` is invalid, a 403 error response will be returned.

### Patch Changes

- 1eaf5372: Fixed attribute `id` normalization in `normalizeAttributes`. Previously it took attribute `id` (`option_id` in BigCommerce), not the id of the value.

  Fixed fetching `variants` in `getProductDetails`. Previously an empty array was returned.

  Fixed `SfCart` normalization - empty email now will be set to null, and line items will include a discounted price.

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.6.1

### Patch Changes

- Fix problem with logout action

## 0.6.0

### Minor Changes

- Implement `ApplyCouponToCart` and `RemoveCouponFromCart` methods

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-bigcommerce@0.5.0

## 0.5.0

### Minor Changes

- Export all commons functions, utilities and types

## 0.4.0

### Minor Changes

- Added endpoints: GetOrders & GetOrderDetails. Added normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Publish `src` directory

- Updated dependencies:
  - @vsf-enterprise/normalizer-bigcommerce@0.3.0
  - @vue-storefront/unified-data-model@0.6.0

## 0.3.0

### Minor Changes

- Introduce the possibility of overwrite the normalizers in unified extension. Also provide functions for creating unified extension & define normalizers in Middleware configuration.

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.5.0

## 0.2.0

### Minor Changes

- Added implementation for customer address methods of `@vue-storefront/unified-data-model`:
  - `CreateCustomerAddress`
  - `UpdateCustomerAddress`
  - `GetCustomerAddresses`
  - `DeleteCustomerAddress`

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.4.0

## 0.1.0

### Minor Changes

- Created 4 API methods for getting currently logged in customer profile, login, logout & register on the store. Also, created normalizer for SfCustomer for BigCommerce.

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-bigcommerce@0.2.0
  - @vue-storefront/unified-data-model@0.2.0

## 0.0.7

### Patch Changes

- Fixed `getCategories` method and added temporary implementation for `getProducts` method which allows to fetch the products on Category Page

- Updated dependencies:
  - @vsf-enterprise/normalizer-bigcommerce@0.1.2

## 0.0.6

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.1.0
  - @vsf-enterprise/normalizer-bigcommerce@0.1.1

## 0.0.5

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.5.0
  - @vsf-enterprise/normalizer-bigcommerce@0.1.0

## 0.0.4

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/unified-data-model@0.4.0
  - @vsf-enterprise/normalizer-bigcommerce@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.4.0
  - @vsf-enterprise/normalizer-bigcommerce@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.3.0
  - @vsf-enterprise/unified-data-model@0.3.0
  - @vsf-enterprise/normalizer-bigcommerce@0.0.2
  - @shared/utils@0.0.2
