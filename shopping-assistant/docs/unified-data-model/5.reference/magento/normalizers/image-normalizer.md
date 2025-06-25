# Image normalizer

The `normalizeImage` function maps Magento `ProductImage` into Unified [`SfImage`](/unified-data-layer/unified-data-model#sfimage).

## Parameters

| Name    | Type                                                                                          | Default value | Description   |
| ------- | --------------------------------------------------------------------------------------------- | ------------- | ------------- |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `image` | [`ProductImage`](https://docs.alokai.com/integrations/magento/api/magento-types/ProductImage) |               | Magento image |

## Extending

The `SfImage` is returned as a part of multiple models, as for example `SfProduct`, `SfProductCatalogItem`, and `SfCart`. If you want to change the global attributes representation, you should override all root normalizers, so for example `normalizeCart`, `normalizeProduct` etc. If the `SfImage` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

```ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeImage: (context, image) => ({
          position: image.position,
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/image/image.ts [image.ts]
