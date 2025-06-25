# Facet normalizer

Concept of facets exists in both Unified Data Layer world and Magento. The `normalizeFacet` function maps Magento `Aggregation` options into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name      | Type                                                                                        | Default value | Description                           |
|-----------| ------------------------------------------------------------------------------------------- | ------------- | ------------------------------------- |
| `context` | `NormalizerContext`                                                                         |               | Context which contains `getFacetType` |
| `facet`   | [`Aggregation`](https://docs.alokai.com/integrations/magento/api/magento-types/Aggregation) |               | Magento Facet                         |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

## Source

<<<../../../../node_modules/@vsf-enterprise/unified-api-magento/src/normalizers/facets/facet.ts [facet.ts]
