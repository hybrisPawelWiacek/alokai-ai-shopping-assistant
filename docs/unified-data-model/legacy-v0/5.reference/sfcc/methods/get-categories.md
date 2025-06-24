# `GetCategories`
Implements `GetCategories` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { Category } from "@vsf-enterprise/sfcc-types";
import { GetCategoriesArgs, getNormalizers } from "@vue-storefront/unified-data-model";
import { slugify } from "@shared/utils";
import "./extended.d";

export const getCategories = defineApi.getCategories(async (context, args) => {
  const rootCategory = await context.api.getCategory({ id: "root", levels: 10 });
  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const filteredData = filterCategories(rootCategory.categories || [], {
    ids: args?.ids ?? [],
    slugs: args?.slugs ?? [],
  });

  return filteredData.map((category) => normalizeCategory(category, normalizerContext));
});

function filterCategories(
  categories: Category[],
  args: Required<Pick<GetCategoriesArgs, "ids" | "slugs">>,
): Category[] {
  const { ids, slugs } = args;

  let filteredData = categories;

  if (ids.length > 0 || slugs.length > 0) {
    filteredData = flattenCategories(categories);
    const idsSet = ids ? new Set(ids) : null;
    const slugsSet = slugs ? new Set(slugs) : null;

    filteredData = filteredData.filter((category) => {
      const idMatches = !idsSet || idsSet.has(category.id as string);
      const slugMatches = !slugsSet || slugsSet.has(slugify(category.id));

      return idMatches || slugMatches;
    });
  }

  return filteredData;
}

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [
    category,
    ...(category.categories ? flattenCategories(category.categories) : []),
  ]);
}

```
