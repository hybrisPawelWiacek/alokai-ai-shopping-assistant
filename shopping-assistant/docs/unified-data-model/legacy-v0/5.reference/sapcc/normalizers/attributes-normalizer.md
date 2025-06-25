# Attributes normalizer

Attributes are Unified Data Layer representation of SAP `VariantOptionQualifiers`. The `normalizeAttribute` function maps `VariantOptionQualifier` into a `SfAttribute`.

## Parameters

| Name              | Type                                                                                                                              | Default value | Description                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------- |
| `optionQualifier` | [`VariantOptionQualifiers`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.variantoptionqualifier.html) |               | SAP VariantOptionQualifiers |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeAttribute: (optionQualifier, ctx) => {
    const normalizedAttribute = normalizersSAP.normalizeAttribute(optionQualifier, ctx);

    if (normalizedAttribute) {
      return {
        ...normalizedAttribute,
        image: optionQualifier.image,
      };
    }

    return null;
  },
});
```

## Source

```ts [attributes.ts]
import { VariantOptionQualifier } from "@vsf-enterprise/sapcc-types";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeAttribute = defineNormalizer.normalizeAttribute((optionQualifier) => {
  if (!isValidOptionQualifier(optionQualifier)) {
    return null;
  }

  return {
    name: optionQualifier.qualifier,
    label: optionQualifier.name ?? optionQualifier.qualifier,
    value: optionQualifier.value,
    valueLabel: optionQualifier.value,
  };
});

type ValidOptionQualifier = VariantOptionQualifier &
  Required<Pick<VariantOptionQualifier, "qualifier" | "value">>;

function isValidOptionQualifier(
  optionQualifier: VariantOptionQualifier,
): optionQualifier is ValidOptionQualifier {
  return !!optionQualifier.qualifier && !!optionQualifier.value;
}
```
