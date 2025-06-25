# Facet normalizer

Concept of facets exists in both Unified Data Layer world and Commercetools. The `normalizeFacet` function maps Commercetools `FacetResultValue` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name               | Type                                                                                                                    | Default value | Description                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------- |
| `facetResultValue` | [`FacetResultValue`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/FacetResultValue) |               | Commercetools Facet                   |
| `ctx`              | `NormalizeFacetContext`                                                                                                 |               | Context which contains `getFacetType` |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

## Source

```ts [facet.ts]
import { FacetResultValue } from "@vsf-enterprise/commercetools-types";
import { GetFacetTypeFn, SfFacetTypes } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

const defaultGetFacetType: GetFacetTypeFn<FacetResultValue> = () => SfFacetTypes.MULTI_SELECT;

export const normalizeFacet = defineNormalizer.normalizeFacet((facetResultValue, ctx) => {
  const { facet, value } = facetResultValue;
  const { getFacetType = defaultGetFacetType } = ctx;

  const sfFacetItems =
    value.terms?.map((term) => ({
      label: term.term,
      value: term.term,
      productCount: term.productCount,
    })) || [];

  if (sfFacetItems.length === 0) {
    return null;
  }

  return {
    label: facet,
    name: facet,
    values: sfFacetItems,
    type: getFacetType(facetResultValue),
  };
});
```