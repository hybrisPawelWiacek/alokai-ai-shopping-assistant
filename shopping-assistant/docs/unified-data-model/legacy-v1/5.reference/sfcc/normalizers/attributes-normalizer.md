# Attributes normalizer

Attributes are Unified Data Layer representation of SFCC `VariationAttribute` values. The `normalizeAttribute` function map a single `VariationValue` along with list of `VariationAttributes` into an `SfAttribute`.

## Parameters

| Name    | Type                                                                                                                                                                                                                         | Default value | Description |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `context` | `NormalizerContext`                                        |               | Context needed for the normalizer. |
| `input` | Object containing an array of [`variationAttributes`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type:variation_attribute) and `key` and `value` of a single variation value |               |             |


## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `addCustomFields` API.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-sfcc";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeAttribute: (context, { attribute, variationAttributes }) => {
          const normalizedAttribute = normalizers.normalizeAttribute(context, { attribute, variationAttributes });
          
          if (normalizedAttribute) {
            return {
              someNewField: "someValue",
            };
          }
          
          return null;
        },
      },
    ],
  },
  config: {
    ...
  },
});
```

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-sfcc/src/normalizers/attributes/attributes.ts [attributes.ts]
