# Image normalizer

The `normalizeImage` function maps SFCC `Image` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                                               | Default value | Description |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------- | ----------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `image` | [`Image`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Aimage) |               | SFCC image  |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeImage: (context, image) => ({
          someNewField: "someValue",
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/image/image.ts [image.ts]
