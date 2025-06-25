# Image normalizer

The `normalizeImage` function maps Magento `ProductImage` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                          | Default value | Description   |
| ------- | --------------------------------------------------------------------------------------------- | ------------- | ------------- |
| `image` | [`ProductImage`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductImage) |               | Magento image |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to change the global attributes representation, you should override all root normalizers, so for example `normalizeCart`, `normalizeProduct` etc. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeImage: (image, context) => ({
    ...normalizersMagento.normalizeImage(image, context),
    position: image.position,
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
    url: image.url as string,
  };
});
```
