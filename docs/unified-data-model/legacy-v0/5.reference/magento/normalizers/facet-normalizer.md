# Facet normalizer

Concept of facets exists in both Unified Data Layer world and Magento. The `normalizeFacet` function maps Magento `Aggregation` options into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name    | Type                                                                                        | Default value | Description                           |
| ------- | ------------------------------------------------------------------------------------------- | ------------- | ------------------------------------- |
| `facet` | [`Aggregation`](https://docs.alokai.com/integrations/magento/api/magento-types/Aggregation) |               | Magento Facet                         |
| `ctx`   | `NormalizerContext`                                                                         |               | Context which contains `getFacetType` |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

## Source

```ts [facet.ts]
import type { Aggregation } from "@vue-storefront/magento-types";
import { GetFacetTypeFn, SfFacetTypes, type SfFacetItem } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

const defaultGetFacetType: GetFacetTypeFn<Aggregation> = () => SfFacetTypes.MULTI_SELECT;

export const normalizeFacet = defineNormalizer.normalizeFacet((facet, ctx) => {
  const { getFacetType = defaultGetFacetType } = ctx;

  const sfFacetItems: SfFacetItem[] =
    facet.options?.filter(Boolean).map((option) => ({
      label: option.label || option.value,
      value: option.value,
      productCount: Number(option.count ?? 0),
    })) || [];

  if (sfFacetItems.length === 0) {
    return null;
  }

  return {
    label: facet.label || facet.attribute_code,
    name: facet.attribute_code,
    values: sfFacetItems,
    type: getFacetType(facet),
  };
});
```
