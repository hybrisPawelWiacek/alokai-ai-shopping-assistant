# @vsf-enterprise/normalizer-bigcommerce

## 0.8.0

### Minor Changes

- 8401301: [DEPRECATED] Library integrated into `@vsf-enterprise/unified-api-bigcommerce` package. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-bigcommerce"`

## 0.7.0

### Minor Changes

- a912cf6: - Remove `productCount` field from `SfCategory`

## 0.6.2

### Patch Changes

- 1f52ffa: Update dependencies

## 0.6.1

### Patch Changes

- 64f49d8: Added `quantityLimit` to the unified line item

## 0.6.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

## 0.5.5

### Patch Changes

- 61123d7: Sanitize data like product name and product description in normalizers.

## 0.5.4

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.5.3

### Patch Changes

- 1eaf5372: Fixed attribute `id` normalization in `normalizeAttributes`. Previously it took attribute `id` (`option_id` in BigCommerce), not the id of the value.

  Fixed fetching `variants` in `getProductDetails`. Previously an empty array was returned.

  Fixed `SfCart` normalization - empty email now will be set to null, and line items will include a discounted price.

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.5.2

### Patch Changes

- Sanitize data in normalizers.

## 0.5.1

### Patch Changes

- Fix `SfCartLineItem` subtotal discounted price calculation

## 0.5.0

### Minor Changes

- Implement `ApplyCouponToCart` and `RemoveCouponFromCart` methods

## 0.4.0

### Minor Changes

- Added productId to unified line item

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.8.0

## 0.3.0

### Minor Changes

- Added endpoints: GetOrders & GetOrderDetails. Added normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Publish `src` directory

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.2.0

### Minor Changes

- Created 4 API methods for getting currently logged in customer profile, login, logout & register on the store. Also, created normalizer for SfCustomer for BigCommerce.

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.2.0

## 0.1.2

### Patch Changes

- Fixed `getCategories` method and added temporary implementation for `getProducts` method which allows to fetch the products on Category Page

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

## 0.0.4

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/unified-data-model@0.4.0

## 0.0.3

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.4.0

## 0.0.2

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.3.0
  - @vsf-enterprise/unified-data-model@0.3.0
  - @shared/utils@0.0.2
