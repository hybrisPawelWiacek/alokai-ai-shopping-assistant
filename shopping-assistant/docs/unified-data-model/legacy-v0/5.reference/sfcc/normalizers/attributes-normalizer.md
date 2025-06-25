# Attributes normalizer

Attributes are Unified Data Layer representation of SFCC `VariationAttribute` values. The `normalizeAttribute` function map a single `VariationValue` along with list of `VariationAttributes` into an `SfAttribute`.

## Parameters

| Name    | Type                                                                                                                                                                                                                         | Default value | Description |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `input` | Object containing an array of [`variationAttributes`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type:variation_attribute) and `key` and `value` of a single variation value |               |             |


## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeAttribute: ({ attribute, variationAttributes }, ctx) => {
    const normalizedAttribute = normalizersSFCC.normalizeAttribute({ attribute, variationAttributes }, ctx);
    
    if (normalizedAttribute) {
      return {
        ...normalizedAttribute,
        someNewField: "someValue",
      };
    }
    
    return null;
  },
});
```

## Source

```ts [attributes.ts]
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAttribute = defineNormalizer.normalizeAttribute((input) => {
  const { attribute, variationAttributes } = input;
  const variationAttribute = variationAttributes.find((attr) => attr.id === attribute.key);
  const variationAttributeValue = variationAttribute?.values?.find(
    (values) => values.value === attribute.value,
  );

  if (!variationAttribute || !variationAttributeValue) {
    return null;
  }

  return {
    name: variationAttribute.id,
    label: variationAttribute.name ?? variationAttribute.id,
    value: variationAttributeValue.value,
    valueLabel: variationAttributeValue.name ?? variationAttributeValue.value,
  };
});
```
