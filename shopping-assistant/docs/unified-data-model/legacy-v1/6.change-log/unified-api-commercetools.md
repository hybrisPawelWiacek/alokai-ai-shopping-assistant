# @vsf-enterprise/unified-api-commercetools

## 3.0.2

### Patch Changes

- **[FIXED]** Normalizing deeply nested categories in `@vsf-enterprise/unified-api-commercetools/algolia`.

## 3.0.1

### Patch Changes

- **[CHANGED]** - update @vsf-enterprise/sdk package to 3.4.1

## 3.0.0

### Major Changes

Update the middleware to 5.1.0

## 2.2.0

### Minor Changes

- **[ADDED]** Added support for Algolia. It's available at `@vsf-enterprise/unified-api-commercetools/algolia` subpath export. Using this API methods you can easily replace the searchProduct endpoint to the one based on the Algolia API. For further information check the [Integrating Algolia Search](https://docs.alokai.com/storefront/features/search/algolia-integration).

- **[FIXED]** `getCategories` method now returns `categoryParentId` field in the response.

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

- **[ADDED]**: Exported helpers used in `GetOrder`, `GetOrderDetails`, `PlaceOrder` and `GetProductDetails` API Methods.

### Patch Changes

- **[ADDED]** re-export SfContract from unified-data-model

## 2.0.1

### Patch Changes

- **[FIXED]** order normalizer will no longer throw error if there are no products in the order

## 2.0.0

### Major Changes

- **[BREAKING]** Updated peerDependencies:
- `@vue-storefront/middleware` version to `^4.0.0`.
- `@vsf-enterprise/commercetools-api` version to `^5.0.0`.

Make sure this versions are used in your project.

```diff
{
  ...
  "dependencies": {
-   "@vsf-enterprise/commercetools-api": "3.x.x",
+   "@vsf-enterprise/commercetools-api": "5.0.0"
-   "@vue-storefront/middleware": "3.x.x",
+   "@vue-storefront/middleware": "4.2.0"
  }
}
```

## 1.0.2

### Patch Changes

- **[CHANGED]** Updated peerDependencies: `@vsf-enterprise/commercetools-api` to ^3.0.0 and `@vsf-enterprise/commercetools-types` to ^2.0.0.

## 1.0.1

### Patch Changes

- **[CHANGED]** Upgrade `@vsf-enterprise/commercetools-api` to the `v.2.0.1`.

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

## 0.24.2

### Patch Changes

- **[CHANGED]** `loginCustomer` returns 403, when customer is already logged in.

## 0.24.1

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.24.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersCT,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-commercetools";

const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // your implementation goes here, no custom fields
});

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
const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // ctx.normalizers.normalizeMoney is now available
});
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
