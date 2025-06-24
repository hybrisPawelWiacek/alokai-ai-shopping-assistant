# @vsf-enterprise/unified-api-magento

## 0.3.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersMagento,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-magento";

const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // your implementation goes here, no custom fields
  },
);

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
const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // ctx.normalizers.normalizeMoney is now available
  },
);
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
