# Facet normalizer

Concept of facets exists in both Unified Data Layer world and BigCommerce. The `normalizeFacet` function maps BigCommerce `SearchProductFilter` options into Unified [`SfFacet`](/unified-data-layer/unified-data-model.html#sffacet).

## Parameters

| Name     | Type                          | Default value | Description                           |
| -------- | ----------------------------- | ------------- | ------------------------------------- |
| `filter` | `GraphQL.SearchProductFilter` |               | BigCommerce SearchProductFilter       |
| `ctx`    | `NormalizeFacetContext`       |               | Context which contains `getFacetType` |

## Extending

The `SfFacet` is returned from [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts) Method. If the `SfFacet` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function.

## Source

In BigCommerce, SearchProductFilter has a dynamic type. It can be one of the following:

- `BrandSearchFilter`
- `RatingSearchFilter`
- `CategorySearchFilter`
- `ProductAttributeSearchFilter`

```ts [facet.ts]
import { GraphQL } from "@vsf-enterprise/bigcommerce-api";
import { SfFacetTypes, type SfFacet, SfFacetType } from "@vue-storefront/unified-data-model";
import { graphqlTypeGuardFactory } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const isBrandSearchFilter =
  graphqlTypeGuardFactory<GraphQL.BrandSearchFilter>("BrandSearchFilter");
export const isRatingSearchFilter =
  graphqlTypeGuardFactory<GraphQL.RatingSearchFilter>("RatingSearchFilter");
export const isCategorySearchFilter =
  graphqlTypeGuardFactory<GraphQL.CategorySearchFilter>("CategorySearchFilter");
export const isProductAttributeSearchFilter =
  graphqlTypeGuardFactory<GraphQL.ProductAttributeSearchFilter>("ProductAttributeSearchFilter");

// Method is included in `docs/limitations/bigcommerce.md`. If you change it, please update the docs accordingly.
export const normalizeFacet = defineNormalizer.normalizeFacet((filter, ctx) => {
  const metadata = {
    label: filter.name,
    name: filter.name,
  };
  const values = normalizeFacetValues(filter);
  const { getFacetType = defaultGetFacetType } = ctx;

  if (values && values.length > 0) {
    return { ...metadata, values, type: getFacetType(filter) };
  }

  return null;
});

// Check here for all available types https://github.com/vuestorefront/bigcommerce/blob/main/packages/api-client/src/api/filters/get/FiltersQuery.ts
function normalizeFacetValues(filter: GraphQL.SearchProductFilter): SfFacet["values"] | undefined {
  let values: SfFacet["values"] | undefined;

  if (isBrandSearchFilter(filter)) {
    values = filter.brands.edges?.filter(Boolean).map((edge) => ({
      label: edge.node.name,
      value: edge.node.entityId.toString(),
      productCount: edge.node.productCount,
    }));
  } else if (isRatingSearchFilter(filter)) {
    values = filter.ratings.edges?.filter(Boolean).map((edge) => ({
      label: edge.node.value,
      value: edge.node.value,
      productCount: edge.node.productCount,
    }));
  } else if (isCategorySearchFilter(filter)) {
    values = filter.categories.edges
      ?.filter(Boolean)
      .filter((edge) => Boolean(edge.node.name))
      .map((edge) => ({
        label: edge.node.name,
        value: edge.node.entityId.toString(),
        productCount: edge.node.productCount,
      }));
  } else if (isProductAttributeSearchFilter(filter)) {
    values = filter.attributes.edges?.filter(Boolean).map((edge) => ({
      label: edge.node.value,
      value: edge.node.value,
      productCount: edge.node.productCount,
    }));
  }

  return values;
}

function defaultGetFacetType(facet: GraphQL.SearchProductFilter): SfFacetType {
  return SfFacetTypes.MULTI_SELECT;
}

```
