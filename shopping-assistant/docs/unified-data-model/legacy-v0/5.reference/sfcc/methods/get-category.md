# `GetCategory`
Implements `GetCategory` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { Category } from "@vsf-enterprise/sfcc-types";
import "./extended.d";

interface RawResult {
  ancestors: Category[];
  category: Category | null;
}

export const getCategory = defineApi.getCategory(async (context, args) => {
  const categories = await context.api.getCategory({ id: "root", levels: 10 });
  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const rawResult: RawResult = { ancestors: [], category: null };

  const searchCategory = (tree: Category[], ancestors: Category[]) => {
    for (const category of tree) {
      if (category.id === args.id) {
        rawResult.category = category;
        rawResult.ancestors = [...ancestors];
        return;
      } else if (category.categories && category.categories.length > 0) {
        ancestors.push(category);
        searchCategory(category.categories, ancestors);
        ancestors.pop(); // Remove the last ancestor for backtracking
      }
    }
  };

  searchCategory(categories.categories || [], []);

  if (!rawResult.category) {
    throw { statusCode: 404, message: "Category not found" };
  }

  return {
    ancestors: rawResult.ancestors.map((category) =>
      normalizeCategory(category, normalizerContext),
    ),
    category: normalizeCategory(rawResult.category, normalizerContext),
  };
});

```
