# Attributes normalizer

Attributes are Unified Data Layer representation of Commercetools `RawProductAttribute`. The `normalizeAttribute` function maps the variant's `RawProductAttribute` into an `SfAttribute`.

## Parameters

| Name        | Type                                                                                                                    | Default value | Description                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `attribute` | [`RawProductAttribute`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/RawProductAttribute) |               | Commercetools RawProductAttribute |

## Extending

The `SfAttribute` is returned as a part of the `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeAttribute: (rawAttribute, ctx) => {
    const normalizedAttribute = normalizersCT.normalizeAttribute(rawAttribute, ctx);

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
/* eslint-disable complexity */
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAttribute = defineNormalizer.normalizeAttribute((attribute, ctx) => {
  const attributeType = attribute.attributeDefinition?.type.name ?? "text";

  if (!["boolean", "text", "ltext", "enum", "lenum"].includes(attributeType)) {
    return null;
  }

  const { locale } = ctx;
  let value: string;
  let valueLabel: string;

  switch (attributeType) {
    case "enum": {
      value = attribute.value.key;
      valueLabel = attribute.value.label;
      break;
    }
    case "ltext": {
      value = attribute.value[locale] ?? attribute.value.en;
      valueLabel = value;
      break;
    }
    case "lenum": {
      value = attribute.value.key;
      valueLabel = attribute.value.label[locale] ?? attribute.value.label.en;
      break;
    }
    default: {
      value = `${attribute.value}`;
      valueLabel = `${attribute.value}`;
      break;
    }
  }

  return {
    name: attribute.name,
    label: attribute.attributeDefinition?.label ?? attribute.name,
    value,
    valueLabel,
  };
});
```
