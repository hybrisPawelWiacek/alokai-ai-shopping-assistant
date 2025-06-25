# Image normalizer

The `normalizeImage` function maps SFCC `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                                               | Default value | Description |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `image` | [`Image`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aimage) |               | SFCC image  |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeImage: (image, context) => ({
    ...normalizersSFCC.normalizeImage(image, context),
    someNewField: "someValue",
  }),
});
```


## Source

```ts [image.ts]
import type { Image } from "@internal";
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

function isImageObject(image: unknown): image is Image {
  return !!image && typeof image === "object" && "link" in image;
}

export const normalizeImage = defineNormalizer.normalizeImage((image) => {
  if (isImageObject(image)) {
    return {
      alt: maybe(image.alt),
      url: image.link,
    };
  }

  return {
    alt: null,
    url: image,
  };
});
```
