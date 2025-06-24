# @vsf-enterprise/unified-api-mocks

## 0.15.0

### Minor Changes

- d50630f: Add missing `changeCustomerPassword` method

## 0.14.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.13.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

## 0.12.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.11.1

### Patch Changes

- 64f49d8: Added `quantityLimit` to the unified line item

## 0.11.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

## 0.10.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.10.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value

### Patch Changes

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.9.0

### Minor Changes

- Added productId to unified line item

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.8.0

## 0.8.0

### Minor Changes

- Added mocked endpoints for Orders, Customer Address & Currencies

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.7.0

## 0.7.1

### Patch Changes

- Publish `src` directory

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.7.0

### Minor Changes

- Added a `UpdateCustomer` method data model and implemented for unified-data-mocks.

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.3.0

## 0.6.0

### Minor Changes

- Split `GetProducts` method into two methods:

  - `GetProducts` which allows to get specific products by `ids` or `skus`
  - and `SearchProducts` which allows to search for products by `facets`, `category`, and `search` phrase with an option to paginate and sort results

- Implemented customer auth methods for unified-api-mocks

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.2.0

## 0.5.2

### Patch Changes

- Fallback to first product in list in `addCartLineItem` method to allow to add a product to cart, when the real ecommerce product id is used (e.g. because `getProductDetails` method is using the ecommerce data, not mocks)

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

- Improve DX of initializing normalized extension: add `createUnifiedExtension` function which set up the extension and facilitates the `extendApiMethods` customization, by infering the parameters type of the base api methods.

- Removed ability to SetBillingAddress within SetCartAddress method. Now only SetShippingAddress is allowed

- Remove `discount` field from `SfCartCoupon` interface

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/unified-data-model@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.4.0

## 0.3.0

### Minor Changes

- Update packages for SI demo preparation

### Patch Changes

- Fix typo: rename GetProductDetail interface to GetProductDetails

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.3.0
  - @vsf-enterprise/unified-data-model@0.3.0

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
