# Attributes normalizer

Attributes are Unified Data Layer representation of Magento `option`. The `normalizeAttribute` function maps the variant's `attributes` into an array of `SfAttribute`.

## Parameters

| Name        | Type                                                                                                                                                                                                                                                                                                                                                          | Default value | Description    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------- |
| `context` | `NormalizerContext`                                                           |               | context needed for the normalizer |
| `attribute` | [`SelectedConfigurableOption`](https://docs.alokai.com/integrations/magento/api/magento-types/SelectedConfigurableOption), [`OrderItemOption`](https://docs.alokai.com/integrations/magento/api/magento-types/OrderItemOption) or [`ConfigurableAttributeOption`](https://docs.alokai.com/integrations/magento/api/magento-types/ConfigurableAttributeOption) |               | Magento option |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `addCustomFields` API.

```ts
import { normalizers } from "@vsf-enterprise/unified-api-magento";

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

Please note that the `normalizeAttribute` has a different type depending on the context in which it is used. We use a type guard to determine the type of the `attribute`.

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/attributes/attributes.ts [attributes.ts]
