# @vsf-enterprise/unified-api-sfcc

## 3.0.1

### Patch Changes

- Updated peer dependencies:
  - @vsf-enterprise/sfcc-api@^2.2.0
  - @vsf-enterprise/sfcc-types@^1.3.0

## 3.0.0

### Major Changes

Update the middleware to 5.1.0

## 2.2.3

### Patch Changes

- **[CHANGED]** Minor improvements in type declarations.

## 2.2.2

### Patch Changes

- **[FIXED]** Fetch detailed product data in `searchProducts` api method in a batch to reduce amount of calls to Salesforce Commerce Cloud.

## 2.2.2-rc.0

### Patch Changes

- **[FIXED]** Fetch detailed product data in `searchProducts` api method in a batch to reduce amount of calls to Salesforce Commerce Cloud.

## 2.2.1

### Patch Changes

- **[FIXED]**: Added the missing utils: slugify, maybe, graphqlTypeGuardFactory

## 2.2.0

### Minor Changes

- **[FIXED]** Algolia methods recursively references itself error.

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

- **[ADDED]**: Exported helpers used by `SearchProducts` and `GetCategories` API Methods. Additionaly `assignToNormalizerContext` exported from UDL and `KnownKeys` type from normalizers.

### Patch Changes

- **[ADDED]** re-export SfContract from unified-data-model

## 2.0.1

### Patch Changes

- **[FIXED]** order normalizer will no longer throw error if there are no products in the order

## 2.0.0

### Major Changes

- **[BREAKING]** Updated peerDependencies:
- `@vue-storefront/middleware` version to `^4.0.0`.
- `@vsf-enterprise/sfcc-api` version to `^1.0.0-rc.20`.
- `@vsf-enterprise/sfcc-types` version to `^1.0.0-rc.6`.

Make sure this versions are used in your project.

```diff
{
  ...
  "dependencies": {
-   "@vsf-enterprise/sfcc-api": "1.0.0-rc.x",
+   "@vsf-enterprise/sfcc-api": "1.0.0-rc.20"
-   "@vsf-enterprise/sfcc-types": "1.0.0-rc.x",
+   "@vsf-enterprise/sfcc-types": "1.0.0-rc.6"
-   "@vue-storefront/middleware": "3.x.x",
+   "@vue-storefront/middleware": "4.2.0"
  }
}
```

## 1.1.2

### Patch Changes

- **[FIXED]** `searchProducts` pagination response when last page requested

## 1.1.1

### Patch Changes

- **[FIXED]** `getCart` returns a new cart when invalid `basketId` is passed

## 1.1.0

### Minor Changes

- **[CHANGED]** Cart methods for SFCC now accept an optional `cartId` parameter.

Example: when it is provided, the `BasketFacade.getBasket` method will be called which might be preferred in case of SFCC environments using a custom taxation logic.

```diff
- sdk.commerce.getCart();
+ sdk.commerce.getCart({ cartId: '1234' });
```

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

## 0.16.3

### Patch Changes

- **[CHANGED]** `loginCustomer` returns 403, when customer is already logged in.
- **[FIXED]** After `loginCustomer` or `registerCustomer`, if the guest cart is not empty, it will be set as the customer cart. Previously a new, empty, cart was created for the customer every time they logged in or registered.

## 0.16.2

### Patch Changes

- **[CHANGED]** Required version of SFCC API Client to `@vsf-enterprise/sfcc-api@^1.0.0-rc.12`

## 0.16.1

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.16.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersSFCC,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-sfcc";

const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // your implementation goes here, no custom fields
});

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersSFCC.normalizeCart(cart, context),
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

- **[REMOVED]** `normalizeAttributes` from `normalizersSFCC`. Now a `normalizeAttribute` should be used instead. The `normalizeAttribute` accepts as an input an object containing an array of [`variationAttributes`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type:variation_attribute) and `key` and `value` of a single variation value.

### Patch Changes

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

## 0.15.3

### Patch Changes

- **[FIXED]** - `getOrderDetails()` API method resolves order data for authorized user.

## 0.15.2

### Patch Changes

- 04a9ef6: [FIXED] Allow 0 to be a valid shipping price in `normalizeOrder`

## 0.15.1

### Patch Changes

- a4d76f8: [FIXED] Handle null price and image_groups in `normalizeAlgoliaProductCatalogItem` in Algolia extension.

## 0.15.0

### Minor Changes

- 724a3a2: Exported NormalizerContext type

## 0.14.0

### Minor Changes

- 64b7b17: Added error handling on registerCustomer endpoint. Now if e-commerce response will be negative, unified endpoint return HTTP 400 with message Could not register customer

## 0.13.0

### Minor Changes

- 2ac49bc: Added support for Algolia. A separate sub-package available as `@vsf-enterprise/unified-api-sfcc/algolia`. Using this API methods you can easily replace the searchProduct endpoint to the one based on the Algolia API. For further information check the Algolia Integration chapter in the docs.

## 0.12.0

### Minor Changes

- 82a761c: - [`Unified Data Model`](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model) model and methods integration.

  - UDM extension import:
    - `import { createUnifiedExtension } from "@vsf-enterprise/unified-api-sfcc"`
  - UDM model types import:
    - `import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-sfcc"`

## 0.11.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.10.2

### Patch Changes

- a856688: Updated unnormalizeAddres function to match new type reqiurements

## 0.10.1

### Patch Changes

- 459d20a: Update dependencies

## 0.10.0

### Minor Changes

- 8401301: Integrated normalization methods from the `@vsf-enterprise/normalizer-sfcc` library. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-sfcc"`

## 0.9.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

### Patch Changes

- Updated dependencies [a912cf6]
  - @vsf-enterprise/normalizer-sfcc@0.9.0

## 0.8.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.7.0

### Minor Changes

- d3b0594: The searchProducts endpoint is updated to match the updated behavior of the `unified-data-model`. Removed the "latest" from the translated sort options, which wasn't available by default in SFCC. Still, all non-standard sorting options are passing by directly to the API request.

## 0.6.2

### Patch Changes

- 1f52ffa: Update dependencies

## 0.6.1

### Patch Changes

- b7cccc5: Update dependencies

## 0.6.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

### Patch Changes

- Updated dependencies [6a3e0e8]
  - @vsf-enterprise/normalizer-sfcc@0.8.0

## 0.5.2

### Patch Changes

- 027ba5cc: Fixed product discount on PLP

## 0.5.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.5.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value
- f5a32640: Unified error response for `changeCustomerPassword`. Now when `currentPassword` is invalid, a 403 error response will be returned.

### Patch Changes

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.4.0

### Minor Changes

- Added endpoints for fetching list or user's orders and particular one. Also added necessary normalizers for SfOrder, SfOrderLineItem and SfOrderListItem.

- Added placeOrder endpoint

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.7.0

## 0.3.2

### Patch Changes

- Fixed `addCartLineItem` for product variants
- Fixed `searchProducts`'s `categoryHierarchy` including selected category

## 0.3.1

### Patch Changes

- Changed the way of calculating SfDiscountedPrice to be based on comparing pricelists for given product.

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.6.0

## 0.3.0

### Minor Changes

- Added endpoints for adding, removing & updating line items in cart

- Implemented `getProducts()` api handler

- Implemented `setCartAddress` method for checkout

- Implemented `setCustomerEmail` method for checkout

- Implemented `getAvailableShippingMethods` and `setShippingMethod` methods for checkout

### Patch Changes

- Created normalization function for SfCartLineItem. Updated getCart method to fetch product data for line items.

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.5.0

## 0.2.0

### Minor Changes

- getCategories api method

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-sfcc@0.3.0
