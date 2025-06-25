# Attributes normalizer

Attributes are Unified Data Layer representation of BigCommerce options. The `normalizeAttribute` function maps the variant's or cart item `option` into an `SfAttribute`.

## Parameters

| Name     | Type                                                                                                                                                            | Default value | Description                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------- |
| `option` | [`ProductVariantOptionValue`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/ProductVariantOptionValue) or `CartItemBase["options"][0]` |               | BigCommerce ProductVariant. |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeAttribute: (option, ctx) => {
    const normalizedAttribute = normalizersBC.normalizeAttribute(option, ctx);
    
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

Please note that the `normalizeAttribute` has a different type - `ProductVariantOptionValue` or `CartItemBase["options"][0]` depending on the context in which it is used. We use a type guard to determine the type of the `option`.

```ts [attributes.ts]
import { ProductVariantOptionValue } from "@vsf-enterprise/bigcommerce-api";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizeAttributeInput } from "../types";

const isProductVariantOptionValue = (
  option: NormalizeAttributeInput,
): option is ProductVariantOptionValue => {
  return (option as ProductVariantOptionValue).option_display_name !== undefined;
};

export const normalizeAttribute = defineNormalizer.normalizeAttribute((option) => {
  if (isProductVariantOptionValue(option)) {
    return {
      name: option.option_display_name,
      value: option.id.toString(),
      valueLabel: option.label,
      label: option.option_display_name,
    };
  }

  if (!option.nameId || !option.valueId) {
    return null;
  }

  return {
    name: option.nameId.toString(),
    value: option.valueId.toString(),
    valueLabel: option.value || option.valueId.toString(),
    label: option.name || option.nameId.toString(),
  };
});

```
