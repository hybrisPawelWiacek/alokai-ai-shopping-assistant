# Attributes normalizer

Attributes are Unified Data Layer representation of Magento `option`. The `normalizeAttribute` function maps the variant's `attributes` into an array of `SfAttribute`.

## Parameters

| Name        | Type                                                                                                                                                                                                                                                                                                                                                          | Default value | Description    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------- |
| `attribute` | [`SelectedConfigurableOption`](https://docs.alokai.com/integrations/magento/api/magento-types/SelectedConfigurableOption), [`OrderItemOption`](https://docs.alokai.com/integrations/magento/api/magento-types/OrderItemOption) or [`ConfigurableAttributeOption`](https://docs.alokai.com/integrations/magento/api/magento-types/ConfigurableAttributeOption) |               | Magento option |

## Extending

The `SfAttribute` is returned as a part of `SfProduct`, `SfOrder` and `SfCart`. If you want to extend the `SfAttribute` with custom fields, you should use the `defineNormalizers` utility.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeAttribute: (rawAttribute, ctx) => {
    const normalizedAttribute = normalizersMagento.normalizeAttribute(rawAttribute, ctx);

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

Please note that the `normalizeAttribute` has a different type depending on the context in which it is used. We use a type guard to determine the type of the `attribute`.

```ts [attributes.ts]
/* eslint-disable complexity */
import type {
  ConfigurableProductOptions,
  ConfigurableVariant,
  OrderItemOption,
  SelectedConfigurableOption,
} from "@vue-storefront/magento-types";
import type { SfAttribute, SfProduct } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { NormalizeAttributeInput, NormalizerContext } from "../types";

const isSelectedConfigurableOption = (
  input: NormalizeAttributeInput,
): input is SelectedConfigurableOption =>
  !!(input as SelectedConfigurableOption).configurable_product_option_value_uid;

const isOrderItemOption = (input: NormalizeAttributeInput): input is OrderItemOption =>
  !isSelectedConfigurableOption(input) && !!(input as OrderItemOption).label;

export const normalizeAttribute = defineNormalizer.normalizeAttribute((attribute) => {
  if (isSelectedConfigurableOption(attribute)) {
    return normalizeConfigurableOption(attribute);
  } else if (isOrderItemOption(attribute)) {
    return normalizeOrderAttribute(attribute);
  }

  const { attributeOption, configurableOptions } = attribute;
  const configurableAttribute = configurableOptions.find(
    (option) => option.attribute_code === attributeOption?.code,
  );

  if (!configurableAttribute) {
    return null;
  }

  return {
    name: configurableAttribute.attribute_code!,
    label: configurableAttribute.label ?? configurableAttribute.uid!,
    value: attributeOption.uid,
    valueLabel: attributeOption.label ?? attributeOption.uid,
  };
});

export function normalizeAttributes<
  WithConfigurableAttributes extends Pick<ConfigurableVariant, "attributes">,
>(
  variant: WithConfigurableAttributes,
  configurableOptions: ConfigurableProductOptions[],
  ctx: NormalizerContext,
): SfProduct["attributes"] {
  const attributes = variant.attributes;
  if (!attributes || !configurableOptions?.length) {
    return [];
  }
  return attributes
    .filter(Boolean)
    .map((attributeOption) =>
      ctx.normalizers.normalizeAttribute({ attributeOption, configurableOptions }),
    )
    .filter(Boolean);
}

function normalizeConfigurableOption(option: SelectedConfigurableOption): SfAttribute {
  return {
    label: option.option_label,
    name: option.option_label,
    value: option.configurable_product_option_value_uid,
    valueLabel: option.value_label,
  };
}

function normalizeOrderAttribute(option: OrderItemOption): SfAttribute {
  return {
    name: option.label,
    value: option.value,
    label: option.label,
    valueLabel: option.value,
  };
}
```
