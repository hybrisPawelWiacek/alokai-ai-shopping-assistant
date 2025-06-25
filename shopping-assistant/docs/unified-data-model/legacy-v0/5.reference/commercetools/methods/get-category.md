# `GetCategory`
Implements `GetCategory` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { CategoryWhereSearch, GetCategoryResponse } from "@vsf-enterprise/commercetools-api";
import { Category } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { validate as validateUuid } from "uuid";

export const getCategory = defineApi.getCategory(async (context, args) => {
  const search: CategoryWhereSearch = validateUuid(args.id)
    ? { catId: args.id }
    : { slug: args.id };
  const response = await context.api.getCategory(search);
  const category = unwrapResponse(response);

  if (!category) {
    throw { statusCode: 404, message: "Category not found" };
  }

  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);
  const ancestors = getCategoryAncestors(category);

  return {
    ancestors: ancestors.map((ancestor) => normalizeCategory(ancestor, normalizerContext)),
    category: normalizeCategory(category, normalizerContext),
  };
});

function unwrapResponse(response: GetCategoryResponse) {
  return response.data?.categories.results?.at(0);
}

function getCategoryAncestors(category: Category): Category[] {
  // Although category.ancestors is declared on the type, it is not always present
  return category?.parent ? [...getCategoryAncestors(category.parent), category.parent] : [];
}

```
