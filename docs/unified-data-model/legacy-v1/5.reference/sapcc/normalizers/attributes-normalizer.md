# Attributes normalizer

Attributes are Unified Data Layer representation of SAP `VariantOptionQualifiers`. The `normalizeAttribute` function maps `VariantOptionQualifier` into a `SfAttribute`.

## Parameters

| Name              | Type                                                                                                                              | Default value | Description                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------- |
| `context` | `NormalizerContext`                                                                          |               | context needed for the normalizer.                                                                |
| `optionQualifier` | [`VariantOptionQualifiers`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.variantoptionqualifier.html) |               | SAP VariantOptionQualifiers |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `addCustomFields` API.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-sapcc";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeAttribute: (context, optionQualifier) => {
          const normalizedAttribute = normalizers.normalizeAttribute(context, optionQualifier);
          
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-sapcc/src/normalizers/attributes/attributes.ts [attributes.ts]
