# @vue-storefront/unified-data-model

## 3.0.0

### Major Changes

Update the middleware to 5.1.0

## 2.1.2

### Patch Changes

- **[FIXED]** Handle undefined unified config for CMS-es.

## 2.1.1

### Patch Changes

- **[ADDED]** add and export SfContract interface

## 2.1.0

### Minor Changes

- **[ADDED]** `createUnifiedCmsExtension` factory which streamlines the process of creating a new unified extension for CMS-es.

## 2.0.1

### Patch Changes

- **[CHANGED]** `dependencies` now dont specify a strict version of libraries

## 2.0.0

### Major Changes

- **[BREAKING]** Updated peerDependencies:
- `@vue-storefront/middleware` version to `^4.0.0`.

Make sure this version is used in your project.

```diff
{
  ...
  "dependencies": {
-   "@vue-storefront/middleware": "3.x.x",
+   "@vue-storefront/middleware": "4.2.0"
  }
}
```

## 1.0.0

### Major Changes

The release of the v1.0.0 of the `@vue-storefront/unified-data-model` package, doesn't introduce any breaking changes in the Unified Data Layer. The package is now considered stable. We've focused on improving the utilities which allows to simplify the development of the eCommerce integrations.

- **[ADDED]** `unifiedExtensionFactory` dedicated for the Unified API Extensions packages. Example usage in the `@vsf-enterprise/unified-api-<commerce>` package

```ts
export const createUnifiedExtension = unifiedExtensionFactory<
  typeof apiMethods,
  Normalizers,
  Config
>({
  extendApiMethods: apiMethods,
  normalizers,
});
```

- **[ADDED]** `UnifiedMethods` type which contains all the methods from the Unified Methods contract. You can still import a type of the single method.

```ts
// all methods in one interface
import { UnifiedMethods } from "@vue-storefront/unified-data-model";
// single method
import { GetCart } from "@vue-storefront/unified-data-model";
```

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 1.0.0-rc.0

### Major Changes

First draft of v1.0.0

- **[ADDED]** `unifiedExtensionFactory` dedicated for the Unified API Extensions packages. Example usage in the `@vsf-enterprise/unified-api-<commerce>` package

```ts
export const createUnifiedExtension = unifiedExtensionFactory<
  typeof apiMethods,
  Normalizers,
  Config
>({
  extendApiMethods: apiMethods,
  normalizers,
});
```

- **[ADDED]** `UnifiedMethods` type which contains all the methods from the Unified Methods contract. You can still import a type of the single method.

```ts
// all methods in one interface
import { UnifiedMethods } from "@vue-storefront/unified-data-model";
// single method
import { GetCart } from "@vue-storefront/unified-data-model";
```

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.18.1

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.18.0

### Minor Changes

- **[ADDED]** `toContextualizedNormalizers` function which allows to create a set of normalizers which have access to the context of the current request.

## 0.17.0

### Minor Changes

- 645259e: Changed `billingAddress` to optional in `SfOrder`

## 0.16.0

### Minor Changes

- 98c8e77: Add a new field `parentCategoryId` to the `SfCategory`.

## 0.15.1

### Patch Changes

- b41484d: Fix types for SetCartAddressArgs

## 0.15.0

### Minor Changes

- 8260999: - Update `SearchProducts` method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

## 0.14.0

### Minor Changes

- a8c62a1: Define a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.13.0

### Minor Changes

- d3b0594: Introduce the `SfSortBy` interface that defines possible sorting options in the SearchProduct request. Modify the `sortBy` options to make it possible to enter the custom options available in API clients.

## 0.12.0

### Minor Changes

- 95f6af6: Support `cartId` argument in cart methods.

## 0.11.1

### Patch Changes

- e13c168: Added `quantityLimit` to the `SfCartLineItem`

## 0.11.0

### Minor Changes

- 3187ae6: Enhance `SfFacet` data model with `type` property.

## 0.10.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value

## 0.9.0

### Minor Changes

- Changed method args declaration from interfaces to types. This increases the DX on the SDK side, because now in the IDE you can see the internals of the type, and not just the name of the type. Read more [here](https://github.com/microsoft/TypeScript/issues/38040).

## 0.8.0

### Minor Changes

- Added productId to unified line item

## 0.7.2

### Patch Changes

- Expose SfFacetItem interface from unified-data-model

## 0.7.1

### Patch Changes

- Implemented `PlaceOrder` method definition in `unified-data-model`

## 0.7.0

### Minor Changes

- Created ChangeCustomerPassword method

## 0.6.0

### Minor Changes

- Added new entity - SfOrder & SfOrderListItem for representing customer's orders. Also created GetOrders & GetOrderDetails methods for receving those data. Update definition methods for creating API endpoints.

### Patch Changes

- Publish `src` directory

## 0.5.0

### Minor Changes

- Introduce the possibility of overwrite the normalizers in unified extension. Also provide functions for creating unified extension & define normalizers in Middleware configuration.

## 0.4.0

### Minor Changes

- Changed `SetShippingAddress` to accept a new interface `SfCreateAddressBody`. Thanks to that we ensure that all required address fields are passed
  - Created definition for `Customer` methods:
    - `CreateCustomerAddress`: allows to set a new address for currently logged in customer
    - `UpdateCustomerAddress`: allows to update an existing address belonging to currently logged in customer
    - `GetCustomerAddresses`: returns all addresses assigned to currently logged in customer
    - `DeleteCustomerAddress`: allows to delete an existing address belonging to currently logged in customer

## 0.3.0

### Minor Changes

- Added a `UpdateCustomer` method data model and implemented for unified-data-mocks.

## 0.2.0

### Minor Changes

- Added a `SfCustomer` model and specification for authenthication methods:

  ```typescript
  type RegisterCustomer = (args: RegisterCustomerArgs): Promise<{
    customer: SfCustomer;
  }>;

  type LoginCustomer = (args: LoginCustomerArgs): Promise<{
    customer: SfCustomer;
  }>;

  type GetCustomer = () => Promise<Maybe<SfCustomer>>;

  type LogoutCustomer = () => Promise<void>;
  ```

- Split `GetProducts` method into two methods:
  - `GetProducts` which allows to get specific products by `ids` or `skus`
  - and `SearchProducts` which allows to search for products by `facets`, `category`, and `search` phrase with an option to paginate and sort results

## 0.1.0

### Minor Changes

- init package
