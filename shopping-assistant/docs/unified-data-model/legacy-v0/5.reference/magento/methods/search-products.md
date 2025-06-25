# `SearchProducts`
Implements `SearchProducts` Unified Method.
        
## Source

```ts
/* eslint-disable no-fallthrough */
/* eslint-disable complexity */
import { type InternalContext, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getRawCategory } from "@/methods/category/getCategory/getCategory";
import { maybe } from "@shared/utils";
import {
  type Aggregation,
  type CategoryFilterInput,
  type CategoryInterface,
  type ProductAttributeFilterInput,
  type ProductAttributeSortInput,
  SortEnum,
} from "@vue-storefront/magento-types";
import {
  type SfFacet,
  type SearchProductsArgs,
  type Maybe,
  type SfFacetItem,
  type NormalizersLike,
  getNormalizers,
  SearchProducts,
} from "@vue-storefront/unified-data-model";

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

async function searchProductsByQuery(
  context: InternalContext,
  {
    search,
    sortBy,
    facets,
    category: categoryIdOrSlug,
    currentPage = 1,
    pageSize,
  }: SearchProductsArgs,
): ReturnType<SearchProducts> {
  const category = categoryIdOrSlug ? await getCategoryId(context, categoryIdOrSlug) : undefined;
  const filter = buildFilter({ category, facets });
  const sort = translateSort(sortBy);

  /*
   * Magento2 Aggregations are recalculated on each request,
   * to keep facets unchanged for the same category, we fetching them independenty
   */
  const productsPromise = query(
    context.api.products({
      pageSize,
      search,
      currentPage: currentPage ?? 1,
      sort,
      filter,
    }),
  );
  const facetsPromise = query(
    context.api.products({
      pageSize: 0,
      filter: buildFilter({ category }),
    }),
  );

  const [productsData, facetsData] = await Promise.all([productsPromise, facetsPromise]);

  const { items, page_info, total_count } = productsData.products ?? {};
  const { aggregations } = facetsData.products ?? {};

  const { normalizeProductCatalogItem, normalizePagination } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);
  const facetsResult = await buildFacets(context, category, aggregations ?? []);

  return {
    products: (items ?? [])
      ?.filter(Boolean)
      .map((product) => normalizeProductCatalogItem(product, normalizerContext)),
    facets: facetsResult,
    pagination: normalizePagination(
      { ...page_info, total_results: total_count },
      normalizerContext,
    ),
  };
}

async function buildFacets(
  context: InternalContext,
  category: string | undefined,
  facets: Maybe<Aggregation>[],
): Promise<ReturnType<NormalizersLike["normalizeFacet"]>[]> {
  // using rootCategoryId instead of rootCategoryUid, because id value can be retrieved directly from Magento Admin

  const { rootCategoryId = 2 } = context.config;
  const filters: CategoryFilterInput = category
    ? { parent_category_uid: { eq: category } }
    : { parent_id: { eq: rootCategoryId.toString() } };

  const currentCategory = await context.api.categorySearch({ filters });
  const categories = (currentCategory.data.categoryList ?? []).filter(Boolean);

  const { filterFacets = () => true } = context.config;
  const { normalizeFacet } = getNormalizers(context);

  return facets
    .filter(Boolean)
    .filter((facet) => filterFacets(facet))
    .map((facet) => normalizeFacet(facet, getNormalizerContext(context)))
    .map((facet) => buildCategoryFacet(facet, categories))
    .filter(Boolean);
}

/*
 * Build category facet from current categories
 *
 * Note: Aggregations don't contain 'category_uid' option, so we need to manually build correct category child data
 * https://github.com/magento/magento2/issues/32557
 */
function buildCategoryFacet(
  facet: SfFacet | null,
  categories: CategoryInterface[] = [],
): SfFacet | null {
  if (!facet || facet.name !== "category_id") {
    return facet;
  }

  const values: SfFacetItem[] = categories.map((category) => ({
    label: category.name ?? category.uid,
    value: category.uid,
    productCount: maybe(category.product_count),
  }));

  return {
    ...facet,
    values,
  };
}

function buildFilterValue<Key extends keyof ProductAttributeFilterInput & string>(
  filterKey: Key,
  value: string | string[],
): ProductAttributeFilterInput[Key] {
  switch (filterKey) {
    case "name":
    case "description": {
      if (typeof value === "string") {
        return { match: value };
      }
    }
    case "price": {
      if (typeof value === "string") {
        const [from, to] = value.split("_");
        return { from, to };
      }
      if (Array.isArray(value) && typeof value.at(-1) === "string") {
        const [from, to] = value.at(-1)?.split("_") as [string, string];
        return { from, to };
      }
    }
    default: {
      return Array.isArray(value) ? { in: value } : { eq: value };
    }
  }
}

function buildFilter(
  query: Pick<SearchProductsArgs, "category" | "facets">,
): ProductAttributeFilterInput {
  const { facets, category } = query;

  const facetsFilter = Object.fromEntries(
    Object.entries(facets ?? {}).map(([key, value]: any[]) => [key, buildFilterValue(key, value)]),
  );

  return { ...(category && { category_uid: { eq: category } }), ...facetsFilter };
}

function translateSort(sortBy: SearchProductsArgs["sortBy"]): ProductAttributeSortInput {
  switch (sortBy) {
    case "relevant": {
      return {
        relevance: SortEnum.Desc,
      };
    }
    case "price-low-to-high": {
      return {
        price: SortEnum.Asc,
      };
    }
    case "price-high-to-low": {
      return {
        price: SortEnum.Desc,
      };
    }
    default: {
      return {};
    }
  }
}

async function getCategoryId(context: InternalContext, categoryIdOrSlug: string) {
  const category = await getRawCategory(context, { id: categoryIdOrSlug });
  return category.category.uid!;
}

```
