# `GetCategory`
Implements `GetCategory` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { CategoryHierarchy } from "@vsf-enterprise/sapcc-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";
import { CategoryHierarchyWithParentId } from "@/normalizers/types";

interface RawResult {
  ancestors: CategoryHierarchy[];
  category: CategoryHierarchy | null;
}

export const getCategory = defineApi.getCategory(async (context, args) => {
  const categories = await context.api.getCatalogVersion();
  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const rawResult: RawResult = { ancestors: [], category: null };

  const searchCategory = (tree: CategoryHierarchy[], ancestors: CategoryHierarchy[]) => {
    for (const category of tree) {
      if (category.id === args.id) {
        rawResult.category = category;
        rawResult.ancestors = [...ancestors];
        return;
      } else if (category.subcategories && category.subcategories.length > 0) {
        ancestors.push(category);
        searchCategory(category.subcategories, ancestors);
        ancestors.pop(); // Remove the last ancestor for backtracking
      }
    }
  };

  searchCategory(categories.categories || [], []);

  if (!rawResult.category) {
    throw { statusCode: 404, message: "Category not found" };
  }

  const ancestors: CategoryHierarchyWithParentId[] = rawResult.ancestors.map(
    (category, index, categories) => ({
      ...category,
      parentCategoryId: categories[index - 1]?.id,
    }),
  );
  const category: CategoryHierarchyWithParentId = {
    ...rawResult.category,
    parentCategoryId: rawResult.ancestors.at(-1)?.id,
  };

  return {
    ancestors: ancestors.map((category) => normalizeCategory(category, normalizerContext)),
    category: normalizeCategory(category, normalizerContext),
  };
});

```
