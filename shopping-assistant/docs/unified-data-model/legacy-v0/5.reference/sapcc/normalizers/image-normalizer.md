# Image normalizer

The `normalizeImage` function maps SAP `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                             | Default value | Description                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `image` | [`Image`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.image_2.html) |               | SAP image                                                                                   |
| `ctx`   | `NormalizerContext`                                                                              |               | Normalization context including an optional `transformImageUrl` which may transform the url |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeImage: (image, context) => ({
    ...normalizersSAP.normalizeImage(image, context),
    format: image.format,
  }),
});
```

## Source

```ts [image.ts]
import { maybe } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeImage = defineNormalizer.normalizeImage((image, ctx) => {
  let url = image.url as string;
  if (ctx.transformImageUrl) {
    url = ctx.transformImageUrl(url);
  }

  return {
    alt: maybe(image.altText),
    url,
  };
});
```
