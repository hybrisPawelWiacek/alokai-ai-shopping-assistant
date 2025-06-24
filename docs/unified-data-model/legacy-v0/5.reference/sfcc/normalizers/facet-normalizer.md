# Facet normalizer

Concept of facets exists in both Unified Data Layer world and SFCC. The `normalizeFacet` function maps SFCC `Refinement` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name         | Type                                                                                                                         | Default value | Description     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| `refinement` | [`Refinement`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=Search%2BProducts) |               | SFCC Refinement |
| `ctx`        | `NormalizeFacetContext`                                                                                                      |               |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfFacet` with a `description` field.

```ts
import { normalizers as normalizersSFC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeFacet: (refinement) => ({
    ...normalizersSFCC.normalizeFacet(refinement),
    description: refinement.description,
  }),
});
```

## Source

```ts [facet.ts]
import { GetFacetTypeFn, SfFacetTypes } from "@vue-storefront/unified-data-model";
import { Refinement } from "@internal";
import { defineNormalizer } from "../defineNormalizer";

const defaultGetFacetType: GetFacetTypeFn<Refinement> = () => SfFacetTypes.MULTI_SELECT;

export const normalizeFacet = defineNormalizer.normalizeFacet((refinement, ctx) => {
  if (!refinement.values || refinement.values.length === 0) return null;
  const { getFacetType = defaultGetFacetType } = ctx;
  return {
    label: refinement.label ?? refinement.attributeId,
    name: refinement.attributeId,
    values:
      refinement.values?.map((refinementValue) => {
        return {
          label: refinementValue.label,
          value: refinementValue.value,
          productCount: refinementValue.hitCount,
        };
      }) ?? [],
    type: getFacetType(refinement),
  };
});
```
