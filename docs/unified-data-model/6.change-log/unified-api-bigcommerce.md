# @vsf-enterprise/unified-api-bigcommerce

## 4.0.1-next.0

### Patch Changes

- Updated dependencies:
  - @alokai/connect@1.1.0-next.0
  - @vsf-enterprise/bigcommerce-api@8.0.1-next.0

## 4.0.0

### Major Changes

- **[CHANGED]** Guarantee compatibility with `@alokai/connect` package.
- **[CHANGED]** Updated the package for compatibility with Node.js 22.

### Key Updates:

- Upgraded to the latest version of Node.js 22
- Updated CI pipelines to use Node.js 22 for consistency.
- Updated `.nvmrc` or `.node-version` files to specify Node.js version `22.14`.
- Upgraded `@types/node` to version `^22.13.17` for compatibility with the latest Node.js features.

### Recommendations:

- Use Node.js version `22.14.0` or higher for optimal performance, security, and compatibility.
- While Node.js 20 is technically supported, it is not recommended as it may cause compatibility issues with certain packages and has not been thoroughly tested.
  **[CHANGED]** Replaced core dependencies with a new `@alokai/connect` package. `@vue-storefront/middleware`, `@vue-storefront/sdk`, `vue-storefront/logger`, `vue-storefront/unified-data-model`, `@vue-storefront/multistore` were replaced with `@alokai/connect`. The replacement preserves the same functionality and interface as the original packages. To read more about the `@alokai/connect` package, please refer to the [documentation](/connect).

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/bigcommerce-api@8.0.0
  - @alokai/connect@1.0.0

## 4.0.0-rc.5

### Patch Changes

- Updated dependencies:
  - @alokai/connect@1.0.0-rc.4
  - @vsf-enterprise/bigcommerce-api@8.0.0-rc.5

## 4.0.0-rc.4

### Major Changes

- **[CHANGED]** Updated the package for compatibility with Node.js 22.

### Key Updates:

- Upgraded to the latest version of Node.js 22
- Updated CI pipelines to use Node.js 22 for consistency.
- Updated `.nvmrc` or `.node-version` files to specify Node.js version `22.14`.
- Upgraded `@types/node` to version `^22.13.17` for compatibility with the latest Node.js features.

### Recommendations:

- Use Node.js version `22.14.0` or higher for optimal performance, security, and compatibility.
- While Node.js 20 is technically supported, it is not recommended as it may cause compatibility issues with certain packages and has not been thoroughly tested.

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/bigcommerce-api@8.0.0-rc.4
  - @alokai/connect@1.0.0-rc.3

## 4.0.0-rc.3

### Patch Changes

- Updated dependencies:
  - @alokai/connect@1.0.0-rc.2
  - @vsf-enterprise/bigcommerce-api@8.0.0-rc.3

## 4.0.0-rc.2

### Patch Changes

- Updated dependencies:
  - @alokai/connect@1.0.0-rc.1
  - @vsf-enterprise/bigcommerce-api@8.0.0-rc.2

## 4.0.0-rc.1

### Major Changes

Update packages to work with connect rc version

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/bigcommerce-api@8.0.0-rc.1
  - @alokai/connect@1.0.0-rc.0

## 4.0.0-rc.0

### Major Changes

Replace legacy packages with a connect package

## 3.0.1

### Patch Changes

- **[CHANGED]** - update @vsf-enterprise/sdk package to 3.4.1

## 3.0.0

### Major Changes

Update the middleware to 5.1.0

## 2.1.2

### Patch Changes

- **[FIXED]**: Added the missing utils: slugify, maybe, graphqlTypeGuardFactory

## 2.1.1

### Patch Changes

- **[FIXED]** Re-export unified-data-model methods after accidental removal.

## 2.1.0

### Minor Changes

- **[ADDED]**: Refactored `NormalizerContext` to be an interface. Now you can use declaration merging to extend the `NormalizerContext` typings when you're using `assignToNormalizerContext` function.

```ts
import {
  assignToNormalizerContext,
  getNormalizers,
} from "@vue-storefront/unified-api-<integration>";

declare module "@vue-storefront/unified-api-<integration>" {
  interface NormalizerContext {
    sku?: string;
  }
}

async function getProduct(context, args) {
  const product = await context.api.getProduct({ id: productId.id });
  const { normalizeProduct } = getNormalizers(context);

  assignToNormalizerContext(context, {
    sku: product.sku,
  });
  return normalizeProduct(product);
}
```

- **[ADDED]** Exported helpers used in `SearchProducts`, `LogoutCustomer`, `GetCategories` and `GetCategory` API Endpoints.

### Patch Changes

- **[ADDED]** re-export SfContract from unified-data-model

## 2.0.2

### Patch Changes

**[FIXED]**: Searching by brands. Added extra configuration value in Unified Extension that allow you to customize the brand filter facet name.

```ts
const extension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [{}],
  },
  config: {
    // ...
    facetNamesMap: {
      brand: "Brand",
    },
  },
});
```

## 2.0.1

### Patch Changes

- **[FIXED]** order normalizer will no longer throw error if there are no products in the order

## 2.0.0

### Major Changes

- **[BREAKING]** Updated peerDependencies:
- `@vue-storefront/middleware` version to `^4.0.0`.
- `@vsf-enterprise/bigcommerce-api` version to `^6.0.0`.

Make sure this versions are used in your project.

```diff
{
  ...
  "dependencies": {
-   "@vsf-enterprise/bigcommerce-api": "5.x.x",
+   "@vsf-enterprise/bigcommerce-api": "6.0.0"
-   "@vue-storefront/middleware": "3.x.x",
+   "@vue-storefront/middleware": "4.2.0"
  }
}
```

## 1.1.0

### Minor Changes

- **[ADDED]** `findCartItemById` method which allows to find for given Cart and itemId the corresponding cart item.

### Patch Changes

- **[FIXED]** `updateCartLineItem` and `removeCartLineItem` for digital products

## 1.0.1

### Patch Changes

- **[CHANGED]** Updated peerDependencies: `@vsf-enterprise/bigcommerce-api` to ^5.0.0.

## 1.0.0

### Major Changes

The version `v1.0.0` of `@vsf-enterprise/unified-api-[commerce]` packages brings the following changes:

- ✨ Simplified the extension initialization
- 🛠️ A new `addCustomFields` API which simplifies adding custom fields to the normalizers
- ⚠️ Deprecation of the `unifiedSdk`
- 🔄 Redefined a way to add custom methods
- 🔍 New utilities such as `defineNormalizer` which allow you to override the normalizer with the inferred typed of the raw data

### Migration

If you are interested in migrating to the new version, check the [Migration guide](https://docs.alokai.com/storefront/introduction/migration-guide-v1) page.

### Simplified the extension initialization

There is no need to pass the generics to the `createUnifiedExtension`, nor to pass the default normalizers and methods. Now all of them are built into the extension.

_In examples, we are using sapcc package. Remember to replace it with the name of the commerce you are using._

```diff
- import {
-   Config,
-   Context,
-   createUnifiedExtension,
-   methods,
-   normalizers,
- } from "@vsf-enterprise/unified-api-sapcc";
+ import { createUnifiedExtension } from "@vsf-enterprise/unified-api-sapcc";

- export const unifiedApiExtension = createUnifiedExtension<Context, Config>()({
-   normalizers,
-   apiMethods: {
-    ...apiMethods,
-   },
+ export const unifiedApiExtension = createUnifiedExtension({
+ normalizers: {
+   addCustomFields: [{}],
+ },
  config: {
    ...
  },
});
```

### `addCustomFields` API

The `addCustomFields` API allows you to add custom fields to the normalizers. The `defineNormalizers` utility have been removed and replaced with this API.

**Before:**

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizersSAP = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeProductCatalogItem: (rawProduct) => ({
    ...normalizersSAP.normalizeProductCatalogItem(product, context),
    description: rawProduct.description,
  }),
});

export const unifiedApiExtension = createUnifiedExtension<Context, Config>()({
  normalizers,
  apiMethods: {
   ...apiMethods,
  },
  config: {
    ...
  }
});
```

**Now:**

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProductCatalogItem: (context, rawProduct) => ({
          description: rawProduct.description,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

`addCustomFields` is an array, so you can easily split the custom fields into separate files or import the custom fields from other packages.

```ts
import { customFields } from "@example/module";
import { productCustomFields, cartCustomFields } from "./customFields";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      productCustomFields,
      cartCustomFields,
      customFields,
    ],
  },
  config: {
    ...
  },
});
```

If you want to override the default normalizers, you can use the `override` key:

```ts
import { normalizers } from "@vsf-enterprise/unified-api-sapcc";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    override: {
      normalizeProductCatalogItem: (context, rawProduct) => ({
        // to call the default normalizer
        ...normalizers.normalizeProductCatalogItem(context, rawProduct),
        name: `${rawProduct.name} - ${rawProduct.sku}`,
      }),
    },
  },
  config: {
    ...
  },
});
```

### Deprecation of the `unifiedSdk`

The `@vsf-enterprise/unified-sdk` package has been deprecated. Now the same functionality can be achieved by using the `@vue-storefront/sdk`.

```diff
- import { unifiedModule } from '@vsf-enterprise/unified-sdk';
import { CreateSdkOptions, createSdk } from '@vue-storefront/next';
- import { UnifiedApiExtension } from 'storefront-middleware/middleware.config';
+ import { UnifiedEndpoints } from 'storefront-middleware/middleware.config';

-export const { getSdk } = createSdk(options, ({ buildModule, middlewareUrl, getRequestHeaders }) => ({
+export const { getSdk } = createSdk(options, ({ buildModule, middlewareUrl, getRequestHeaders, middlewareModule }) => ({
- unified: buildModule(unifiedModule<UnifiedApiExtension>, {
+ unified: buildModule(middlewareModule<UnifiedEndpoints>, {
    apiUrl: `${middlewareUrl}/commerce`,
-   requestOptions: {
-     headers: () => getRequestHeaders() as Record<string, string>,
+   defaultRequestConfig: {
+     headers: getRequestHeaders(),
    },
  }),
```

The `middlewareModule` can be used with any other extension, not only the Unified. It requires an endpoints type to be passed as a generic. An endpoint is just a record containing names of the methods and its contract:

```ts
export type MyEndpoints = {
  getProduct: (params: { id: string }) => Promise<Product>;
};
```

### Redefined a way to add custom methods

Thanks to the `middlewareModule` you can now add custom methods to the SDK, by just implementing a new extension to the middleware.

```ts
import type { ContextualizedEndpoints, SAPIntegrationContext } from "@vsf-enterprise/sapcc-api"

export const customMethodsExtension = {
  name: "customMethods",
  extendApiMethods: {
    getProduct: async (context, params: { id: string }) => {
      // your implementation
    },
  },
} satisfies ApiClientExtension<ContextualizedEndpoints, SAPIntegrationContext>;

// the Endpoints type can be written manually, or inferred from the extension
export type CustomMethodsEndpoints = WithoutContext<CustomMethodsExtension["extendApiMethods"]>;

export const config = {
  location: "@vsf-enterprise/sapcc-api/server",
  configuration: {
    ...
  },
  extensions: (extensions: ApiClientExtension[]) => [
    ...extensions,
    unifiedApiExtension,
    // register your extension in extensions array
    customMethodsExtension,
  ],
} satisfies Integration<MiddlewareConfig>;
```

Then you can use it on the Storefront side, in the `sdk.config.ts` file add the new module:

```diff
  unified: buildModule(middlewareModule<UnifiedEndpoints>, {
    apiUrl: `${middlewareUrl}/commerce`,
    defaultRequestConfig: {
      headers: getRequestHeaders(),
    },
  }),
+ customExtension: buildModule(middlewareModule<CustomMethodsEndpoints>, {
+   apiUrl: `${middlewareUrl}/commerce`,
+   defaultRequestConfig: {
+     headers: getRequestHeaders(),
+   },
+ }),
  cms: buildModule(contentfulModule, {
    apiUrl: `${middlewareUrl}/cntf`,
  }),
```

You can now call the new method in the application:

```ts
sdk.customMethods.getProduct({ id: "123" });
```

This change is important in terms of the `createUnifiedExtension` API. Our goal is to make a clear separation between the Unified Methods, which are shared across all supported eCommerce backends, and your custom methods. This approach should help you in the future if you will decide to migrate to another eCommerce.

Now you you should implement every non-Unified Method in a separate extension.

```diff
export const unifiedApiExtension = createUnifiedExtension<Context, Config>()({
  apiMethods: {
    ...apiMethods,
-   customMethod: async (context, params) => {...}
  },
})
```

```diff
export const customMethodsExtension = {
  name: "customMethods",
  extendApiMethods: {
    getProduct: async (context, params: { id: string }) => {
      // your implementation
    },
+   customMethod: async (context, params) => {...}
  },
} satisfies ApiClientExtension<ContextualizedEndpoints, SAPIntegrationContext>;
```

If you want to override the Unified Method, you can use the `override` key:

```ts
export const unifiedApiExtension = createUnifiedExtension({
  apiMethods: {
    override: {
      getProduct: async (context, params) => {
        // your implementation
      },
    },
  },
});
```

Please remember that in this case, the parameters and return type of the method should be the same as in the Unified Method.

### New utilities

#### `defineNormalizer`

You can split the override normalizer entries into separate variables. To get proper typings, you can use the `defineNormalizer` utility.

```ts
import { normalizers, defineNormalizer } from "@vsf-enterprise/unified-api-sapcc";

const normalizeProductCatalogItem = defineNormalizer.normalizeProductCatalogItem((context, rawProduct) => ({
  // to call the default normalizer
  ...normalizers.normalizeProductCatalogItem(context, rawProduct),
  name: `${rawProduct.name} - ${rawProduct.sku}`,
}));

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    override: {
      normalizeProductCatalogItem,
    },
  },
  config: {
    ...
  },
});
```

#### `defineAddCustomFields`

Similarly, you can use the `defineAddCustomFields` utility to split the custom fields into separate variables.

```ts
import { defineAddCustomFields } from "@vsf-enterprise/unified-api-sapcc";

const productCustomFields = defineAddCustomFields({
  normalizeProductCatalogItem: (context, rawProduct) => ({
    description: rawProduct.description,
  }),
});

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
   addCustomFields: [productCustomFields],
  },
  config: {
    ...
  },
});
```

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.
- **[ADDED]** export `getNormalizers` from package

## 1.0.0-rc.1

### Patch Changes

- **[ADDED]** export `getNormalizers` from package

## 1.0.0-rc.0

### Major Changes

First draft of v1.0.0

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.19.5

### Patch Changes

- **[CHANGED]** Updated `@vsf-enterprise/bigcommerce-api` peerDependency to `^3.0.0`

## 0.19.4

### Patch Changes

- **[CHANGED]** `loginCustomer` returns 403, when customer is already logged in.

## 0.19.3

### Patch Changes

- **[FIXED]** Getting a variantId in `addCartLineItem`

## 0.19.2

### Patch Changes

- **[FIXED]** `titleCode` is not required anymore to `createCustomerAddress`.

## 0.19.1

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.19.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersBC,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-bigcommerce";

const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // your implementation goes here, no custom fields
});

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
const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // ctx.normalizers.normalizeMoney is now available
});
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
