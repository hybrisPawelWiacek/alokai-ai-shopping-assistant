import { ReadonlyURLSearchParams } from 'next/navigation';
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString, type SearchParams } from 'nuqs/server';

import { FACET_QUERY_PREFIX } from '@/config/constants';
import type { SearchProductsArgs } from '@/types';

export const searchProductsStaticQueryParsers = {
  currentPage: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(24),
  search: parseAsString,
  sortBy: parseAsString.withDefault('relevant'),
};

/**
 * @description Parses the search products query on the server side
 *
 * @param searchParams - Current search params
 *
 * @returns The parsed search products query which can be passed to the SearchProducts method
 */
export function parseSearchProductsQuery(searchParams: SearchParams): SearchProductsArgs {
  const staticQuery = createSearchParamsCache(searchProductsStaticQueryParsers).parse(searchParams);
  return {
    ...staticQuery,
    facets: parseFacetsServerSide(searchParams) as Record<string, string[]>,
    search: staticQuery.search ?? undefined,
  };
}

/**
 * @description Provides the dynamic facet query parsers. Facets query params are prefixed with FACET_QUERY_PREFIX.
 *
 * @param searchParams - Current search params
 *
 * @returns The dynamic facet query parsers. Please note that if the facet query param is not present in the search params,
 * it will not be included in the result.
 */
export function getFacetsQueryParsers(searchParams: ReadonlyURLSearchParams | SearchParams) {
  const normalizedSearchParams =
    searchParams instanceof ReadonlyURLSearchParams ? Object.fromEntries(searchParams.entries()) : searchParams;
  return Object.fromEntries(
    Object.entries(normalizedSearchParams)
      .filter(([key]) => key.startsWith(FACET_QUERY_PREFIX))
      .map(([key]) => [key, parseAsArrayOf(parseAsString)]),
  );
}

function parseFacetsServerSide(searchParams: SearchParams) {
  const normalizeFacetKey = (key: string) => key.replace(FACET_QUERY_PREFIX, '');
  const parsers = getFacetsQueryParsers(searchParams);

  return Object.fromEntries(
    Object.entries(parsers).map(([key, parser]) => [normalizeFacetKey(key), parser.parseServerSide(searchParams[key])]),
  );
}
