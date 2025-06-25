# Facet normalizer

Concept of facets exists in both Unified Data Layer world and Commercetools. The `normalizeFacet` function maps Commercetools `FacetResultValue` into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name               | Type                                                                                                                    | Default value | Description                           |
|--------------------| ----------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------- |
| `context`          | `NormalizeFacetContext`                                                                                                 |               | Context which contains `getFacetType` |
| `facetResultValue` | [`FacetResultValue`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/FacetResultValue) |               | Commercetools Facet                   |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

## Source

:::code-group

<<<../../../../node_modules/@vsf-enterprise/unified-api-commercetools/src/normalizers/facets/facet.ts [facet.ts]

:::
