# Image normalizer

The `normalizeImage` function maps SAP `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name      | Type                                                                                             | Default value | Description                                                                                 |
|-----------| ------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `context` | `NormalizerContext`                                                                              |               | Normalization context including an optional `transformImageUrl` which may transform the url |
| `image`   | [`Image`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.image_2.html) |               | SAP image                                                                                   |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeImage: (context, image) => ({
          format: image.format,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/image/image.ts [image.ts]
