# @vsf-enterprise/unified-api-magento

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

### Patch Changes

- **[ADDED]** re-export SfContract from unified-data-model

## 2.0.1

### Patch Changes

- **[FIXED]** order normalizer will no longer throw error if there are no products in the order
- **[FIXED]**: Types used in API methods are now available at dedicated export from this package - `@vsf-enterprise/unified-api-magento/ecommerceTypes`. Also types used by normalizers are grouped together and exported: `import { NormalizerTypes } from "@vsf-enterpise/unified-api-magento"`. All helpers used by API methods are also available to import directly from package.

## 2.0.0

### Major Changes

- **[BREAKING]** Updated peerDependencies:
- `@vue-storefront/middleware` version to `^4.0.0`.
- `@vsf-enterprise/magento-api` version to `^5.0.0`.
- `@vsf-enterprise/magento-types` version to `^2.0.0`.

Make sure this versions are used in your project.

```diff
{
  ...
  "dependencies": {
-   "@vsf-enterprise/magento-api": "3.x.x",
+   "@vsf-enterprise/magento-api": "5.0.0",
-   "@vsf-enterprise/magento-types": "1.x.x",
+   "@vsf-enterprise/magento-types": "2.0.0",
-   "@vue-storefront/middleware": "3.x.x",
+   "@vue-storefront/middleware": "4.2.0"
  }
}
```

## 1.0.1

### Patch Changes

- **[CHANGED]** Upgrade `@vue-storefront/magento-api` to the `v.3.1.1` and `@vue-storefront/magento-types` to the `v.1.2.0`.

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

## 0.3.4

### Patch Changes

- **[FIXED]** After `registerCustomer`, if the guest cart is not empty, it will be set as the customer cart. Previously a new, empty, cart was created for the customer every time they registered.
- **[CHANGED]** `loginCustomer` returns 403, when customer is already logged in.

## 0.3.3

### Patch Changes

- **[FIXED]** Category facets calculation. To use it, it is required to have at least v2.5 of Magento.

## 0.3.2

### Patch Changes

- **[FIXED]** - Create Customer Address handles `titleCode` field.

## 0.3.1

### Patch Changes

- **[ADDED]** `beforeCall` hook to Unified Extension, which set the `defaultCurrency` for `vsf-locale`, when `vsf-locale` is empty.

## 0.3.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersMagento,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-magento";

const customNormalizeProduct = defineNormalizer.normalizeProduct((rawProduct, ctx) => {
  // your implementation goes here, no custom fields
});

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersMagento.normalizeCart(cart, context),
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

### Patch Changes

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

## 0.2.0

### Minor Changes

- **[ADDED]** accept passing categories' slug as id in `getCategory` method and `searchProducts`. If passed field will be an uuid, it will be considered as id, otherwise as slug.

## 0.1.1

### Patch Changes

- 3d8183e: [FIXED] Cart line item display correct `ConfigurableCartItem` attributes.

  [FIXED] `searchProducts()` method default sorting.

  [FIXED] `getProductDetails()` method response `categories` displays related hierarchical data.

## 0.1.0

### Minor Changes

- 156465c: [ADDED] `@vsf-enterprise/unified-api-magento` integration for Adobe Commerce (Magento 2).

  Features:

  - Implemented core functionality for [Unified-Data-Model](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model)
    - Unified Methods
    - Normalizers

  UDM extension import:

  ```
  import { createUnifiedExtension } from "@vsf-enterprise/unified-api-magento"
  ```

  UDM model types import:

  ```
  import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-magento"
  ```

## 0.0.3

### Patch Changes

- c88a173: Internal release

## 0.0.2

### Patch Changes

- 1f52ffa: Update dependencies
