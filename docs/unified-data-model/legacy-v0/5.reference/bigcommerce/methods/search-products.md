# `SearchProducts`
Implements `SearchProducts` Unified Method.
        
## Source

```ts
import { InternalContext, getNormalizerContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { GraphQL, ProductsResponse } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { NormalizedRequestArgs, getBuilders, normalizeRequestParams } from "./helpers";

export const searchProducts = defineApi.searchProducts(async (context, args) => {
  const { normalizeProductCatalogItem } = getNormalizers(context);
  const normalizedParams = await normalizeRequestParams(context, args);
  const [productsResponse, filtersResponse] = await Promise.all([
    getProductsWithFilter(context, normalizedParams),
    getFilters(context, normalizedParams),
  ]);

  const products = productsResponse.data.map((product) =>
    normalizeProductCatalogItem(product, getNormalizerContext(context)),
  );

  const { buildFacets, buildPagination } = getBuilders(context);

  return {
    products,
    ...buildFacets(filtersResponse, context),
    ...buildPagination(productsResponse, normalizedParams),
  };
});

async function getProductsWithFilter(
  context: InternalContext,
  args: NormalizedRequestArgs,
): Promise<ProductsResponse> {
  const { currentPage, categoryEntityId, searchTerm, productAttributes, pageSize, sort } = args;
  let products: ProductsResponse;

  products = await context.api.getProductsWithFilter({
    filters: {
      categoryEntityId,
      searchTerm,
      productAttributes,
    },
    currencyCode: getNormalizerContext(context).currency as GraphQL.CurrencyCode,
    // API does not support offset pagination, so we have to fetch all products and then slice them
    first: pageSize * currentPage,
    sort,
  });

  products = {
    ...products,
    data: products.data.slice(-pageSize),
  };

  return products;
}

async function getFilters(
  context: InternalContext,
  args: NormalizedRequestArgs,
): Promise<GraphQL.SearchProductFilterConnection> {
  const { categoryEntityId, searchTerm, productAttributes } = args;
  try {
    return await context.api.getFilters({
      filters: {
        categoryEntityId,
        searchTerm,
        productAttributes,
      },
    });
  } catch {
    return {} as any;
  }
}

```
