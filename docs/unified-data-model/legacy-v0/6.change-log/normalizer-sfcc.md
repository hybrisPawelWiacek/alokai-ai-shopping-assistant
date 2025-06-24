# @vsf-enterprise/normalizer-sfcc

## 0.10.0

### Minor Changes

- 8401301: [DEPRECATED] Library integrated into `@vsf-enterprise/unified-api-sfcc` package. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-sapcc"`

## 0.9.0

### Minor Changes

- a912cf6: - Remove `productCount` field from `SfCategory`

## 0.8.3

### Patch Changes

- 1f52ffa: Update dependencies

## 0.8.2

### Patch Changes

- b7cccc5: Update dependencies

## 0.8.1

### Patch Changes

- 64f49d8: Added `quantityLimit` to the unified line item

## 0.8.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

## 0.7.4

### Patch Changes

- 61123d7: Sanitize data like product name and product description in normalizers.

## 0.7.3

### Patch Changes

- a76b9f2c: Updated cart subtotals calculations

## 0.7.2

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.7.1

### Patch Changes

- f5a32640: Fixed normalization of `SfCart.subtotalRegularPrice`, when cart contains discounted products.
- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.7.0

### Minor Changes

Added endpoints for fetching list or user's orders and particular one. Also added necessary normalizers for SfOrder, SfOrderLineItem and SfOrderListItem.

## 0.6.0

### Minor Changes

- Changed the way of calculating SfDiscountedPrice to be based on comparing pricelists for given product.

- Added SfProductVariant normalizer

## 0.5.0

### Minor Changes

- Implemented `getProducts()` api handler

- Added base normalizer for `SfCart`, which takes SFCC `Basket` as input

- Added `normalizeShippingMethod` normalizer implementation

- Created normalization function for SfCartLineItem. Updated getCart method to fetch product data for line items.

- Implemented normalizeAttributes method

### Patch Changes

- Fixed issue with counting coupons in SfCart normalizer

## 0.4.0

### Minor Changes

- Implemented normalizeAddress.

- Created normalizer for SfCustomer entity

### Patch Changes

- Enhanced discountable-price normalizer

## 0.3.0

### Minor Changes

- Implemented image, money, pagination, product-catalog normalizers

## 0.2.0

### Minor Changes

- Implemented category normalizer.
