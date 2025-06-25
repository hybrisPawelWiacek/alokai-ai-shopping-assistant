# Attributes normalizer

Attributes are Unified Data Layer representation of Commercetools `RawProductAttribute`. The `normalizeAttribute` function maps the variant's `RawProductAttribute` into an `SfAttribute`.

## Parameters

| Name        | Type                                                                                                                    | Default value | Description                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `context`  | `NormalizerContext`                                                                       |               | context needed for the normalizer |
| `attribute` | [`RawProductAttribute`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/RawProductAttribute) |               | Commercetools RawProductAttribute |

## Extending

The `SfAttribute` is returned as a part of the `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `addCustomFields` API.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-commercetools";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeAttribute: (context, rawAttribute) => {
          const normalizedAttribute = normalizers.normalizeAttribute(context, rawAttribute);
          
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

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/attributes/attributes.ts [attributes.ts]
