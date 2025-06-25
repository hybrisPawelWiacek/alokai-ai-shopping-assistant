# @vsf-enterprise/unified-api-sapcc

## 0.22.1

### Patch Changes

- **[FIXED]** Product Gallery returns large images.

## 0.22.0

### Minor Changes

- **[ADDED]** `defineNormalizer` utility which helps in overriding the normalizers. It should be used only when you want to **override** the default normalizers. If you want to add custom fields, you should still declare the normalizer within the `defineNormalizers`.

```ts
import {
  defineNormalizer,
  normalizers as normalizersSAP,
  defineNormalizers,
} from "@vsf-enterprise/unified-api-sapcc";

const customNormalizeProduct = defineNormalizer.normalizeProduct(
  (rawProduct, ctx) => {
    // your implementation goes here, no custom fields
  },
);

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeProduct: customNormalizeProduct,
  normalizeCart: (cart, context) => ({
    ...normalizersSAP.normalizeCart(cart, context),
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

- **[REMOVED]** `normalizeAttributes` from `normalizersSAP`. Now a `normalizeAttribute` should be used instead. The `normalizeAttribute` accepts as an [input `VariantOptionQualifier`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.variantoptionqualifier.html).

### Patch Changes

- **[FIXED]** Normalizers such as `normalizeMoney` can be now overridden globally. This is useful when you want to change the way the money is represented accross the whole Unified extension.

## 0.21.3

### Patch Changes

- **[FIXED]** clear customer token on login error

## 0.21.2

### Patch Changes

- **[FIXED]** Allow empty string as a valid last name in `normalizeCustomer`
- **[CHANGED]** B2B method `getCustomer` is checking if user is authenticated before sending request to api and B2B `loginCustomer` is returning 403 if user is already logged in

## 0.21.1

### Patch Changes

- **[CHANGED]** `isAuthenticated` and `assertAuthorized`, added check of the `AUTH_USER_ID_COOKIE_NAME` cookie value

## 0.21.0

### Minor Changes

- **[ADDED]** `@vsf-enterprise/unified-api-sapcc/b2b` subpath export with Unified Methods implementation for SAP Commerce Cloud B2B

```ts
import { apiMethods as b2bApiMethods } from '@vsf-enterprise/unified-api-sapcc/b2b';

export const unifiedApiExtension = createUnifiedExtension<Context>()({
  normalizers,
  apiMethods: {
    ...methods<typeof normalizers>(),
    ...b2bApiMethods<typeof normalizers>();
  }
});
```

As some of the SAP Commerce Cloud API endpoints are the same for B2C and B2B, the `b2bApiMethods` will override only the implementation for:

- `getCustomer`
- `loginCustomer`
- `updateCustomer`
- `addCartLineItem`
- `updateCartLineItem`

As the B2B methods implement the same contract of the Unified Methods as B2C methods, there is no need to change the Storefront code.

## 0.20.0

### Minor Changes

- 724a3a2: Exported NormalizerContext type

### Patch Changes

- ce51cd4: Fixed issue with infinite loop of getting new cart. Now active cart is found by lack of `saveTime` and `savedBy` attribute.

## 0.19.1

### Patch Changes

- adc5bf9: Updated @vsf-enterprise/sapcc-api peerDependency to 4.2.1 as minimal version

## 0.19.0

### Minor Changes

- 2ac49bc: For `@vsf-enterprise/unified-api-sapcc/algolia`:
  - Fixed the Algolia record schema, by making `images` and `prices` optional
  - Added a request context as a second argument of `getFacetLabel` and `indexName`

## 0.18.0

### Minor Changes

- 82a761c: - [`Unified Data Model`](https://docs.alokai.com/storefront/unified-data-layer/unified-data-model) model and methods integration.

  - UDM extension import:
    - `import { createUnifiedExtension } from "@vsf-enterprise/unified-api-sapcc"`
  - UDM model types import:
    - `import { SfCategory, GetCategory } from "@vsf-enterprise/unified-api-sapcc"`

## 0.17.1

### Patch Changes

- 645259e: Changed the return value from `paymentMethod` in the `order` normalizer. Return `"ACCOUNT"` if `costCenter` is true, otherwise returns `"CARD"`.
- Updated dependencies [645259e]
  - @vue-storefront/unified-data-model@0.17.0

## 0.17.0

### Minor Changes

- 713734b: Added support for Algolia. A separate sub-package available as `@vsf-enterprise/unified-api-sapcc/algolia`. Using this API methods you can easily replace the searchProduct endpoint to the one based on the Algolia API. For further information check the Algolia Integration chapter in the docs.

## 0.16.0

### Minor Changes

- 98c8e77: Add new field `categoryParentId` to the `SfCategory` model.

## 0.15.2

### Patch Changes

- a856688: Updated unnormalizeAddres function to match new type reqiurements

## 0.15.1

### Patch Changes

- 459d20a: Update dependencies

## 0.15.0

### Minor Changes

- 8401301: Integrated normalization methods from the `@vsf-enterprise/normalizer-sapcc` library. Update imports for normalizer methods as follows:

  - `import { normalizers } from "@vsf-enterprise/unified-api-sapcc"`

## 0.14.0

### Minor Changes

- a912cf6: - Update `searchProducts()` API method:
  - remove `categoryHierarchy`, `currentCategory` & `subCategories` fields
  - Remove `productCount` field from `SfCategory`

### Patch Changes

- Updated dependencies [a912cf6]
  - @vsf-enterprise/normalizer-sapcc@0.9.0

## 0.13.0

### Minor Changes

- d514fe7: Implement a new `GetCategory` method which allows to get the category and its ancestors by category id.

## 0.12.0

### Minor Changes

- d3b0594: The searchProducts endpoint is updated to match the updated behavior of the `unified-data-model`. Removed the "latest" from the translated sort options, but it's still available using the value required by SAPCC API (`topRated`). All non-standard sorting options are passing by directly to the API request now.

## 0.11.2

### Patch Changes

- 1f52ffa: Update dependencies

## 0.11.1

### Patch Changes

- 0e4f4cc: - Fixed arguments encoding in `getProductDetails`.

## 0.11.0

### Minor Changes

- bc2cdc7: Support `cartId` argument in cart methods.

## 0.10.2

### Patch Changes

- 81dd649: Fixes:

  - `SfCart#id` normalization for authenthicated user. Previously a correct value was stored in the cookie, but the normalized object used incorrectly `guid` as a cart id. Now it uses `code` for authenthicated user and `guid` for guest user.
  - `Cannot read properties of undefined (reading 'flatMap')` error thrown from `getProductDetails` method, when the product has undefined `baseOptions`.

  Added a new `isAuthenticated` boolean flag to the `normalizerContext`.

## 0.10.1

### Patch Changes

- a2c442b: Fixed calculation of cartId in `addCartLineItem`, and `updateCartLineItem` methods for logged in customer

## 0.10.0

### Minor Changes

- 6a3e0e8: Customize `SfFacet` type with `getFacetType` config method.
  Filter out `facets` data from `searchProducts` API method with `filterFacets` config method.

### Patch Changes

- Updated dependencies [6a3e0e8]
  - @vsf-enterprise/normalizer-sapcc@0.8.0

## 0.9.1

### Patch Changes

- f5d72f14: Update `unified-data-model` version

## 0.9.0

### Minor Changes

- 1df82d2c: Enhanced `getCurrencies` method to return current currency value
- f5a32640: Unified error response for `changeCustomerPassword`. Now when `currentPassword` is invalid, a 403 error response will be returned.

### Patch Changes

- Updated dependencies [1df82d2c]
  - @vue-storefront/unified-data-model@0.10.0

## 0.8.0

### Minor Changes

- Add more flexibility to customizing the image urls. Previous `mediaHost` config option has been replaced with a `transformImageUrl` option.

## 0.7.3

### Patch Changes

- Fix for handling lowercase coupon codes

## 0.7.2

### Patch Changes

- Fixed searchproduct method in `unified-api-sapcc`

- Fix the issue with being not authenticated after account registration

## 0.7.1

### Patch Changes

- Update setCartAddress in unified-api-sapcc & unified-api-commercetools

## 0.7.0

### Minor Changes

- Export all commons functions, utilities and types

- PlaceOrder implementation in unified-api-commercetools & unified-api-sapcc

## 0.6.0

### Minor Changes

- Added GetOrders & GetOrderDetails endpoints and normalizers for Order, OrderLineItem & OrderListItem

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.7.0
  - @vsf-enterprise/normalizer-sapcc@0.4.0

## 0.5.1

### Patch Changes

- Publish `src` directory

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.6.0

## 0.5.0

### Minor Changes

- Introduce the possibility of overwrite the normalizers in unified extension. Also provide functions for creating unified extension & define normalizers in Middleware configuration.

### Patch Changes

- Fix unified-api-sap user session cart cookie

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.5.0

## 0.4.0

### Minor Changes

- Added implementation for customer address methods of `@vue-storefront/unified-data-model`:
  - `CreateCustomerAddress`
  - `UpdateCustomerAddress`
  - `GetCustomerAddresses`
  - `DeleteCustomerAddress`

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/normalizer-sapcc@0.3.0
  - @vue-storefront/unified-data-model@0.4.0

## 0.3.0

### Minor Changes

- Implemented `updateCustomer` method for unified-api-sapcc

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.3.0

## 0.2.0

### Minor Changes

- Created normalizer for SfCustomer & 4 API methods for handling customer related actions

- Split `GetProducts` method into two methods:
  - `GetProducts` which allows to get specific products by `ids` or `skus`
  - and `SearchProducts` which allows to search for products by `facets`, `category`, and `search` phrase with an option to paginate and sort results

### Patch Changes

- Fixed sortBy filter & pagination index

- Updated dependencies:
  - @vsf-enterprise/normalizer-sapcc@0.2.0
  - @vue-storefront/unified-data-model@0.2.0

## 0.1.0

### Minor Changes

- Stable version implementing `@vue-storefront/unified-data-model@0.1.0`

## 0.0.4

### Patch Changes

- Updated dependencies:
  - @vue-storefront/unified-data-model@0.1.0
  - @vsf-enterprise/normalizer-sapcc@0.1.1

## 0.0.3

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-data-model@0.5.0
  - @vsf-enterprise/normalizer-sapcc@0.1.0

## 0.0.2

### Patch Changes

- Updated dependencies:
  - @vsf-enterprise/unified-actions@0.5.0
  - @vsf-enterprise/unified-data-model@0.4.0
  - @vsf-enterprise/normalizer-sapcc@0.0.2
