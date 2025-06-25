# `GetCategories`
Implements `GetCategories` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { GetCategoryResponse, getCategory } from "@vsf-enterprise/commercetools-api";
import { GetCategoriesArgs, getNormalizers } from "@vue-storefront/unified-data-model";

type CategoryWhereSearch = Parameters<typeof getCategory>[1];

export const getCategories = defineApi.getCategories(async (context, args = {}) => {
  const response = await context.api.getCategory(toCategoryWhereSearch(args));
  const { categories } = unwrapResponse(response);
  const normalizerContext = getNormalizerContext(context);

  const { normalizeCategory } = getNormalizers(context);

  return categories.map((category) => normalizeCategory(category, normalizerContext));
});

function toCategoryWhereSearch(args: GetCategoriesArgs): CategoryWhereSearch {
  return {
    catIds: args.ids,
    slugs: args.slugs,
  };
}

function unwrapResponse(response: GetCategoryResponse) {
  return { categories: response.data?.categories.results || [] };
}

```
