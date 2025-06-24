# `SearchProducts`
Implements `SearchProducts` Unified Method.
        
## Source

```ts
/* eslint-disable no-secrets/no-secrets */
/* eslint-disable max-statements */
import { InternalContext, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import {
  NormalizersLike,
  SearchProducts,
  SearchProductsArgs,
  getNormalizers,
} from "@vue-storefront/unified-data-model";
import { buildFilters, buildProductsResponse } from "./helpers";
import "./extended.d";

export const searchProducts = defineApi.searchProducts(async (context, args) => {
  try {
    return (await searchProductsByQuery(context, args)) as {
      products: ReturnType<NormalizersLike["normalizeProductCatalogItem"]>[];
      pagination: ReturnType<NormalizersLike["normalizePagination"]>;
      facets: ReturnType<NormalizersLike["normalizeFacet"]>[];
    };
  } catch (error) {
    console.error("/searchProducts", error);
    return {
      products: [],
      pagination: {
        currentPage: 0,
        pageSize: 0,
        totalResults: 0,
        totalPages: 0,
      },
      facets: [],
    };
  }
});

function translateSort(sortBy: SearchProductsArgs["sortBy"]) {
  switch (sortBy) {
    case "relevant": {
      return "relevance";
    }
    case "price-low-to-high": {
      return "price-asc";
    }
    case "price-high-to-low": {
      return "price-desc";
    }
    default: {
      return sortBy;
    }
  }
}

async function searchProductsByQuery(
  context: InternalContext,
  { search, sortBy, facets: facetsQuery, category, currentPage = 1, pageSize }: SearchProductsArgs,
): ReturnType<SearchProducts> {
  const filters = buildFilters({ category, facets: facetsQuery });
  const { filterFacets = () => true } = context.config;
  const { normalizePagination, normalizeFacet } = getNormalizers(context);

  const searchProductResponse = await context.api.searchProduct({
    currentPage: Math.max(currentPage - 1, 0),
    pageSize: pageSize,
    searchTerm: search,
    filters,
    sort: translateSort(sortBy),
  });

  const {
    facets: rawFacets = [],
    products: rawProducts = [],
    pagination: rawPagination = {},
    currentQuery,
  } = searchProductResponse;
  const normalizerContext = getNormalizerContext(context, { currentQuery });

  return {
    pagination: normalizePagination(rawPagination, normalizerContext),
    facets: rawFacets
      .filter((facet) => filterFacets(facet))
      .map((facet) => normalizeFacet(facet, normalizerContext))
      .filter(Boolean),
    ...buildProductsResponse(context, rawProducts),
  };
}

```
