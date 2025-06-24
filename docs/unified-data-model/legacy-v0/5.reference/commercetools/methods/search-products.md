# `SearchProducts`
Implements `SearchProducts` Unified Method.
        
## Source

```ts
import { InternalContext, ReturnNormalizerType, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import type { Category } from "@vsf-enterprise/commercetools-types";
import {
  getNormalizers,
  type SearchProductsArgs,
  type SfFacet,
} from "@vue-storefront/unified-data-model";
import { validate as validateUuid } from "uuid";

export const searchProducts = defineApi.searchProducts(async (context, args) => {
  const { search, sortBy, facets, category, currentPage, pageSize } = args;
  const { filterFacets = () => true, itemsPerPage } = context.config;
  const filters = await buildFilters(context, { category, facets });
  const sort = translateSort(sortBy);
  const { normalizeProductCatalogItem, normalizeFacet } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const {
    results,
    categories,
    facets: rawFacets,
    total,
  } = await context.api.getFacet({
    page: currentPage ?? 1,
    perPage: pageSize ?? itemsPerPage,
    ...filters,
    sort,
    phrase: search,
  });

  return {
    products: results.map((product) => normalizeProductCatalogItem(product, normalizerContext)),
    facets: rawFacets.reduce<SfFacet[]>((accumulator, rawFacet) => {
      if (!filterFacets(rawFacet)) {
        return accumulator;
      }

      const normalizedFacet = normalizeFacet(rawFacet, normalizerContext);
      const builtCategoryFacet = buildCategoryFacet(normalizedFacet, categories);

      return builtCategoryFacet === null ? accumulator : [...accumulator, builtCategoryFacet];
    }, []),
    ...(buildPagination(total, pageSize ?? itemsPerPage, currentPage) as ReturnNormalizerType<
      typeof context,
      "normalizePagination"
    >),
  };
});

/*
 * Build category facet from current categories
 */
function buildCategoryFacet(facet: SfFacet | null, categories: Category[] = []): SfFacet | null {
  if (!facet || facet.name !== "category") {
    return facet;
  }

  const valuesWithCategoryLabel = facet.values.reduce<SfFacet["values"]>((values, value) => {
    const category = categories.find((cat) => cat.id === value.value);
    if (!category || !category.name) {
      return values;
    }
    return [
      ...values,
      {
        ...value,
        label: category.name,
      },
    ];
  }, []);

  return {
    ...facet,
    values: valuesWithCategoryLabel,
  };
}

async function buildFilters(
  context: InternalContext,
  query: Pick<SearchProductsArgs, "category" | "facets">,
) {
  const { facets, category } = query;
  const filters = { ...facets };

  if (!category) {
    return { filters };
  }

  if (!validateUuid(category)) {
    return { filters, categorySlug: category };
  }

  const categoryEntity = await context.api.getCategory({ catId: category });
  const categorySlug = categoryEntity.data.categories.results[0].slug;

  return { filters, categorySlug };
}

function translateSort(sortBy: SearchProductsArgs["sortBy"]) {
  switch (sortBy) {
    case "relevant": {
      return "relevance";
    }
    case "price-low-to-high": {
      return "price-up";
    }
    case "price-high-to-low": {
      return "price-down";
    }
    default: {
      return sortBy;
    }
  }
}

function buildPagination(total: number, pageSize: number, currentPage?: number) {
  if (total === 0) {
    return {
      pagination: {
        currentPage: 0,
        pageSize: 0,
        totalResults: 0,
        totalPages: 0,
      },
    };
  }

  return {
    pagination: {
      currentPage: currentPage ?? 1,
      pageSize,
      totalResults: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

```
