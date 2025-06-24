# Image normalizer

The `normalizeImage` function maps Commercetools `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                          | Default value | Description           |
| ------- | --------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `image` | [`Image`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Image_2) |               | Commercetools image   |
| `ctx`   | `NormalizerContext`                                                                           |               | Normalization context |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeImage: (image, context) => ({
    ...normalizersCT.normalizeImage(image, context),
    dimensions: image.dimensions,
  }),
});
```

## Source

```ts [image.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeImage = defineNormalizer.normalizeImage((image) => {
  return {
    alt: maybe(image.label),
    url: image.url,
  };
});
```
