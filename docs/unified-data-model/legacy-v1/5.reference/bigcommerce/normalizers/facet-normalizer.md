# Facet normalizer

Concept of facets exists in both Unified Data Layer world and BigCommerce. The `normalizeFacet` function maps BigCommerce `SearchProductFilter` options into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name      | Type                          | Default value | Description                           |
|-----------| ----------------------------- | ------------- | ------------------------------------- |
| `context` | `NormalizeFacetContext`       |               | Context which contains `getFacetType` |
| `filter`  | `GraphQL.SearchProductFilter` |               | BigCommerce SearchProductFilter       |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `addCustomFields` API.

## Source

In BigCommerce, SearchProductFilter has a dynamic type. It can be one of the following:

- `BrandSearchFilter`
- `RatingSearchFilter`
- `CategorySearchFilter`
- `ProductAttributeSearchFilter`

<<<../../../../node_modules/@vsf-enterprise/unified-api-bigcommerce/src/normalizers/facets/facet.ts [facet.ts]
