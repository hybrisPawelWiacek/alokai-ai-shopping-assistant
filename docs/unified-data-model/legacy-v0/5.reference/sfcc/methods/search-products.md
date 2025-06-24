# `SearchProducts`
Implements `SearchProducts` Unified Method.
        
## Source

```ts
// Splitting this functions into smaller ones actually may make it less readable
// in this scenario
/* eslint-disable complexity */
/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
import { InternalContext, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { ProductSearchResult } from "@vsf-enterprise/sfcc-types";
import {
  NormalizersLike,
  SearchProducts,
  SearchProductsArgs,
  getNormalizers,
} from "@vue-storefront/unified-data-model";
import type { Search } from "commerce-sdk";
import "./extended.d";
import { findRefinementCategory, mapFacetsToRefinements, mapSort } from "./helpers";

const CATEGORY_REFINEMENT_ID = "cgid";

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
  { search, sortBy, facets: facetsQuery, category, currentPage = 1, pageSize }: SearchProductsArgs,
): ReturnType<SearchProducts> {
  const { filterFacets = () => true } = context.config;
  const shouldReturnWholeCatalog = !category;
  const rootCategoryId = context.config.rootCategoryId ?? "root";
  // if no params are passed then searchProduct returns no results
  // UDM predicts that in case of no params we should return all results
  // root is the main category in sfcc so we effectively query all products here
  // in case when no params are passed
  const categoryToSearchBy = shouldReturnWholeCatalog ? rootCategoryId : category;

  // UST-706: we temporarily don't support sets, bundles and variation groups
  // Note: Salesforce TsDocs claim that the correct refinement to filter by the
  // product type is `htypes` but it doesn't work when actually attempting to use it.
  // `htype` works fine though.
  const SUPPORTED_PRODUCT_TYPES = ["master", "product"];

  // TS thinks that categorRefinement may be { cgid: undefined | string}
  // So we cast it to a Record<string, string>
  const categoryRefinement: Record<string, string> = categoryToSearchBy
    ? { cgid: categoryToSearchBy }
    : {};

  const facets = {
    htype: SUPPORTED_PRODUCT_TYPES,
    ...categoryRefinement,
    ...facetsQuery,
  };

  const paginationOffset = Math.max(currentPage - 1, 0) * (pageSize ?? 0);

  const refine = mapFacetsToRefinements(facets);

  const searchProductsResults = await context.api.searchProducts({
    q: search,
    limit: pageSize,
    offset: paginationOffset,
    refine,
    sort: mapSort(sortBy),
  });

  const productsHits = searchProductsResults.hits ?? [];

  const { normalizePagination, normalizeFacet, normalizeProductCatalogItem } =
    getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const sfProductCatalogItems = await Promise.all(
    productsHits.map(async (product) => {
      const representedProductId = product?.representedProduct?.id;
      if (!representedProductId) {
        return normalizeProductCatalogItem(product, normalizerContext);
      }

      // We need to fetch tieredPrices separately because they are not included in the
      // searchProducts response
      const { tieredPrices } = await context.api.getProduct({
        id: representedProductId,
        perPricebook: true,
      });

      return normalizeProductCatalogItem({ ...product, tieredPrices }, normalizerContext);
    }),
  );

  const paginationNormaliserParams = {
    limit: searchProductsResults.limit,
    offset: searchProductsResults.offset,
    total: searchProductsResults.total,
  } satisfies Pick<Search.ShopperSearch.SimpleSearchResult, "limit" | "offset" | "total">;

  const sfPagination = normalizePagination(paginationNormaliserParams, normalizerContext);

  const sfFacets = searchProductsResults.refinements
    .filter((refinement) => {
      // We filter out 'htype' to let through only supported products. Other products are not supported
      // and we do not let user request them here.
      const isSystemFilter = ["htype"].includes(refinement.attributeId);

      return !isSystemFilter;
    })
    .filter((refinement) => filterFacets(refinement))
    .map((refinement) =>
      transformCategoryRefinement(
        refinement,
        searchProductsResults.selectedRefinements,
        rootCategoryId,
      ),
    )
    .map((refinement) => normalizeFacet(refinement, normalizerContext))
    .filter(Boolean);

  return {
    products: sfProductCatalogItems,
    pagination: sfPagination,
    facets: sfFacets,
  };
}

function transformCategoryRefinement(
  refinement: ProductSearchResult["refinements"][number],
  selectedRefinements: ProductSearchResult["selectedRefinements"],
  rootCategoryId: string,
) {
  if (refinement.attributeId !== CATEGORY_REFINEMENT_ID) {
    return refinement;
  }
  const refinedCategory = selectedRefinements?.[CATEGORY_REFINEMENT_ID];
  if (refinedCategory === rootCategoryId) {
    return refinement;
  }
  const currentCategory = findRefinementCategory(refinement.values ?? [], refinedCategory);
  if (currentCategory) {
    return {
      ...refinement,
      values: currentCategory?.values ?? [],
    };
  }
  return refinement;
}

```
