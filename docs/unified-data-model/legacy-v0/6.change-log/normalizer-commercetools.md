# @vsf-enterprise/normalizer-commercetools

## 0.14.0

### Minor Changes

- 8401301: [DEPRECATED] Library integrated into `@vsf-enterprise/unified-api-commercetools` package. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-commercetools"`

## 0.13.0

### Minor Changes

- a912cf6: - Remove `productCount` field from `SfCategory`

## 0.12.2

### Patch Changes

- 1f52ffa: Update dependencies

## 0.12.1

### Patch Changes

- 64f49d8: Added `quantityLimit` to the unified line item

## 0.12.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

## 0.11.3

### Patch Changes

- 61123d7: Sanitize data like product name and product description in normalizers.

## 0.11.2

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.11.1

### Patch Changes

- Fixed cart's total coupon discounts value

## 0.11.0

### Minor Changes

- Return authenticated customer email from normalizeCart in `@vsf-enterprise/normalizer-commercetools` and `@vsf-enterprise/normalizer-sapcc` packages.

## 0.10.0

### Minor Changes

- Added productId to unified line item

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.8.0

## 0.9.0

### Minor Changes

- PlaceOrder implementation in unified-api-commercetools & unified-api-sapcc

## 0.8.0

### Minor Changes

- Added endpoints GetOrders & GetOrderDetails. Added normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.7.0

## 0.7.1

### Patch Changes

- Fixed attributes normalization for `boolean`, `lenum`, `ltext` attributeDefinitions

- Publish `src` directory

- Temporary use empty methods for missing normalizers (in-development)

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.7.0

### Minor Changes

- Added implementation for customer address methods of `@vue-storefront/unified-data-model`:

  - `CreateCustomerAddress`
  - `UpdateCustomerAddress`
  - `GetCustomerAddresses`
  - `DeleteCustomerAddress`

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

## 0.6.0

### Minor Changes

- Added normalizer for Customer & 4 API Methods for customer related actions

### Patch Changes

- Add an option to pass a commercetools `Product` to `normalizeProductCatalogItem` function

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.2.0

## 0.5.1

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.1.0

## 0.5.0

### Minor Changes

- Extended SfProduct data model with quantityLimit

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.5.0

## 0.4.0

### Minor Changes

- Remove `discount` field from `SfCartCoupon` interface

### Patch Changes

- Set `productCount` on `SfCategory` as nullable

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/unified-data-model@0.4.0

## 0.3.2

### Patch Changes

- Move `@shared/utils` to devDependencies

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.4.0

## 0.3.1

### Patch Changes

- Fix "Couldn't find package" error for @shared libraries

## 0.3.0

### Minor Changes

- Update packages for SI demo preparation

### Patch Changes

- Fix typo: rename GetProductDetail interface to GetProductDetails

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.3.0
  - @vsf-enterprise/unified-data-model@0.3.0
  - @shared/utils@0.0.2

## 0.2.0

### Minor Changes

- Update packages for SI demo preparation

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.2.0
  - @vsf-enterprise/unified-data-model@0.2.0

## 0.1.1

### Patch Changes

- Update release pipeline

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.1.1
  - @vsf-enterprise/unified-data-model@0.1.1

## 0.1.0

### Minor Changes

- Update packages in order to prepare unified storefront demo

- Update packages for demo purposes

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.1.0
  - @vsf-enterprise/unified-actions@0.1.0
