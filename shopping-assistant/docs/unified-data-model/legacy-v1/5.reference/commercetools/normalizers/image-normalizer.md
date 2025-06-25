# Image normalizer

The `normalizeImage` function maps Commercetools `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name      | Type                                                                                          | Default value | Description           |
|-----------| --------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `context` | `NormalizerContext`                                                                           |               | Normalization context |
| `image`   | [`Image`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Image_2) |               | Commercetools image   |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeImage: (context, image) => ({
          dimensions: image.dimensions,
        }),
      },
    ],
  },
  config: {
    ...
  },
});
```

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/image/image.ts [image.ts]
