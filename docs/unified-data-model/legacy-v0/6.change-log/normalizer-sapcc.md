# @vsf-enterprise/normalizer-sapcc

## 0.10.0

### Minor Changes

- 8401301: [DEPRECATED] Library integrated into `@vsf-enterprise/unified-api-sapcc` package. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-sapcc"`

## 0.9.0

### Minor Changes

- a912cf6: - Remove `productCount` field from `SfCategory`

## 0.8.3

### Patch Changes

- 1f52ffa: Update dependencies

## 0.8.2

### Patch Changes

- 64f49d8: Added `quantityLimit` to the unified line item

## 0.8.1

### Patch Changes

- 81dd649: Fixes:

  - `SfCart#id` normalization for authenthicated user. Previously a correct value was stored in the cookie, but the normalized object used incorrectly `guid` as a cart id. Now it uses `code` for authenthicated user and `guid` for guest user.
  - `Cannot read properties of undefined (reading 'flatMap')` error thrown from `getProductDetails` method, when the product has undefined `baseOptions`.

  Added a new `isAuthenticated` boolean flag to the `normalizerContext`.

## 0.8.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

## 0.7.5

### Patch Changes

- 3718155: Fixed `normalizeDiscountablePrice` - it returns null when price has no value.
- 61123d7: Sanitize data like product name and product description in normalizers.

## 0.7.4

### Patch Changes

- a76b9f2c: Updated cart subtotals calculations

## 0.7.3

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.7.2

### Patch Changes

- For SfProduct use `description` as `SfProduct#description` instead of `summary`. Now `summary` will be used as a fallback when `description` will be empty.

## 0.7.1

### Patch Changes

- Sanitize data in normalizers.

## 0.7.0

### Minor Changes

- Return authenticated customer email from normalizeCart in `@vsf-enterprise/normalizer-commercetools` and `@vsf-enterprise/normalizer-sapcc` packages.

## 0.6.0

### Minor Changes

- Add more flexibility to customizing the image urls. Previous `mediaHost` config option has been replaced with a `transformImageUrl` option.

## 0.5.1

### Patch Changes

- Fix for handling lowercase coupon codes

## 0.5.0

### Minor Changes

- Added productId to unified line item

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.8.0

## 0.4.0

### Minor Changes

- Added GetOrders & GetOrderDetails endpoints and normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.7.0

## 0.3.1

### Patch Changes

- Publish `src` directory

- Temporary use empty methods for missing normalizers (in-development)

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.3.0

### Minor Changes

- Added implementation for customer address methods of `@vue-storefront/unified-data-model`:
  - `CreateCustomerAddress`
  - `UpdateCustomerAddress`
  - `GetCustomerAddresses`
  - `DeleteCustomerAddress`

### Patch Changes

- Changed `SetShippingAddress` to accept a new interface `SfCreateAddressBody`. Thanks to that we ensure that all required address fields are passed

  - Created definition for `Customer` methods:
    - `CreateCustomerAddress`: allows to set a new address for currently logged in customer
    - `UpdateCustomerAddress`: allows to update an existing address belonging to currently logged in customer
    - `GetCustomerAddresses`: returns all addresses assigned to currently logged in customer
    - `DeleteCustomerAddress`: allows to delete an existing address belonging to currently logged in customer

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.4.0

## 0.2.0

### Minor Changes

- Created normalizer for SfCustomer & 4 API methods for handling customer related actions

### Patch Changes

- Fixed sortBy filter & pagination index

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.1.0

## 0.1.0

### Minor Changes

- Extended SfProduct data model with quantityLimit

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.5.0

## 0.0.2

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.4.0
