# @vsf-enterprise/unified-api-commercetools

## 0.24.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersCT,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-commercetools";

const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // your implementation goes here, no custom fields
  },
);

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersCT.normalizeCart(cart, context),
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

- **[ADDED]** `shippingRateMatcher` option in `createUnifiedExtension` config. This option allows you to match the shipping rate based on the shipping method.

```ts
const extension = createUnifiedExtension({
  config: {
    shippingRateMatcher: (shippingRates, totalPrice) => {
      // your implementation goes here
    },
  },
});
```

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

## 0.23.0

### Minor Changes

- **[ADDED]** accept passing categories' slug as id in `getCategory` method and `searchProducts`. If passed field will be an uuid, it will be considered as id, otherwise as slug.

## 0.22.0

### Minor Changes

- 724a3a2: Exported NormalizerContext type

## 0.21.0

### Minor Changes

- 64b7b17: Added error handling on registerCustomer endpoint. Now if e-commerce response will be negative, unified endpoint return HTTP 400 with message Could not register customer

## 0.20.0

### Minor Changes

- 82a761c: - [`Unified Data Model`](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model) model and methods integration.

  - UDM extension import:
    - `import { createUnifiedExtension } from "@vsf-enterprise/unified-api-commercetools"`
  - UDM model types import:
    - `import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-commercetools"`

## 0.19.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.18.2

### Patch Changes

- a856688: Updated unnormalizeAddres function to match new type reqiurements

## 0.18.1

### Patch Changes

- 459d20a: Update dependencies

## 0.18.0

### Minor Changes

- 8401301: Integrated normalization methods from the `@vsf-enterprise/normalizer-commercetools` library. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-commercetools"`

## 0.17.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

### Patch Changes

- Updated dependencies [a912cf6]
  - @vsf-enterprise/normalizer-commercetools@0.13.0

## 0.16.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.15.0

### Minor Changes

- d3b0594: The `searchProducts` endpoint is updated to match the updated behavior of the `unified-data-model`. Removed the `latest` option from the translated sort options, but it's still available without any changes. All non-standard sorting options are passing by directly to the API request now.

## 0.14.1

### Patch Changes

- 1f52ffa: Update dependencies

## 0.14.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

### Patch Changes

- Updated dependencies [6a3e0e8]
  - @vsf-enterprise/normalizer-commercetools@0.12.0

## 0.13.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.13.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value
- f5a32640: Unified error response for `changeCustomerPassword`. Now when `currentPassword` is invalid, a 403 error response will be returned.

### Patch Changes

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.12.0

### Minor Changes

- Changed status code for invalid email in `setCustomerEmail` from 500 to 400

## 0.11.2

### Patch Changes

- Failing auth no longer returns a generic error message

## 0.11.1

### Patch Changes

- Update setCartAddress in unified-api-sapcc & unified-api-commercetools

## 0.11.0

### Minor Changes

- Export all commons functions, utilities and types

- PlaceOrder implementation in unified-api-commercetools & unified-api-sapcc

### Patch Changes

- Fix problem with sing up

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.9.0

## 0.10.0

### Minor Changes

- Added endpoints GetOrders & GetOrderDetails. Added normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.8.0
  - @vue-storefront/unified-data-model@0.7.0

## 0.9.1

### Patch Changes

- Publish `src` directory

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.9.0

### Minor Changes

- Introduce the possibility of overwrite the normalizers in unified extension. Also provide functions for creating unified extension & define normalizers in Middleware configuration.

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.5.0

## 0.8.0

### Minor Changes

- Added implementation for customer address methods of `@vue-storefront/unified-data-model`:
  - `CreateCustomerAddress`
  - `UpdateCustomerAddress`
  - `GetCustomerAddresses`
  - `DeleteCustomerAddress`

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.7.0
  - @vue-storefront/unified-data-model@0.4.0

## 0.7.0

### Minor Changes

- Implemented `updateCustomer` for unified-api-commercetools

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.3.0

## 0.6.0

### Minor Changes

- Split `GetProducts` method into two methods:

  - `GetProducts` which allows to get specific products by `ids` or `skus`
  - and `SearchProducts` which allows to search for products by `facets`, `category`, and `search` phrase with an option to paginate and sort results

- Added normalizer for Customer & 4 API Methods for customer related actions

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.6.0
  - @vue-storefront/unified-data-model@0.2.0

## 0.5.2

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.1.0
  - @vsf-enterprise/normalizer-commercetools@0.5.1

## 0.5.1

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.5.0
  - @vsf-enterprise/normalizer-commercetools@0.5.0

## 0.5.0

### Minor Changes

- Improve DX of initializing normalized extension: add `createUnifiedExtension` function which set up the extension and facilitates the `extendApiMethods` customization, by infering the parameters type of the base api methods.

- Removed ability to SetBillingAddress within SetCartAddress method. Now only SetShippingAddress is allowed

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/normalizer-commercetools@0.4.0
  - @vsf-enterprise/unified-data-model@0.4.0

## 0.4.0

### Minor Changes

- Unification of arguments interfaces names to follow the pattern: ActionName + Args

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.4.0
  - @vsf-enterprise/normalizer-commercetools@0.3.2

## 0.3.1

### Patch Changes

- Fix "Couldn't find package" error for @shared libraries

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.3.1

## 0.3.0

### Minor Changes

- Update packages for SI demo preparation

### Patch Changes

- Fix typo: rename GetProductDetail interface to GetProductDetails

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.3.0
  - @vsf-enterprise/unified-actions@0.3.0
  - @vsf-enterprise/unified-data-model@0.3.0

## 0.2.0

### Minor Changes

- Update packages for SI demo preparation

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.2.0
  - @vsf-enterprise/unified-actions@0.2.0
  - @vsf-enterprise/unified-data-model@0.2.0

## 0.1.1

### Patch Changes

- Update release pipeline

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.1.1
  - @vsf-enterprise/unified-actions@0.1.1
  - @vsf-enterprise/unified-data-model@0.1.1

## 0.1.0

### Minor Changes

- Update packages in order to prepare unified storefront demo

- Update packages for demo purposes

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-commercetools@0.1.0
  - @vsf-enterprise/unified-data-model@0.1.0
  - @vsf-enterprise/unified-actions@0.1.0
