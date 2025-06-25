# Attributes normalizer

Attributes are Unified Data Layer representation of BigCommerce options. The `normalizeAttribute` function maps the variant's or cart item `option` into an `SfAttribute`.

## Parameters

| Name     | Type                                                                                                                                                            | Default value | Description                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------- |
| `context` | `NormalizerContext`                                                                   |               | Context which contains e.g. `currency` |
| `option` | [`ProductVariantOptionValue`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ProductVariantOptionValue) or `CartItemBase["options"][0]` |               | BigCommerce ProductVariant. |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `addCustomFields` API.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-bigcommerce";

export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeAttribute: (context, option) => {
          const normalizedAttribute = normalizers.normalizeAttribute(context, option);
          
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

Please note that the `normalizeAttribute` has a different type - `ProductVariantOptionValue` or `CartItemBase["options"][0]` depending on the context in which it is used. We use a type guard to determine the type of the `option`.

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/attributes/attributes.ts [attributes.ts]
