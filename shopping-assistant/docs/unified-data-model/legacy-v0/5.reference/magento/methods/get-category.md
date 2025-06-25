# `GetCategory`
Implements `GetCategory` Unified Method.
        
## Source

```ts
import { InternalContext, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import type { NormalizeCategoryInput } from "@/normalizers/types";
import { GetCategoryArgs, getNormalizers } from "@vue-storefront/unified-data-model";

interface RawResult {
  ancestors: NormalizeCategoryInput[];
  category: NormalizeCategoryInput;
}

export const getCategory = defineApi.getCategory(async (context, args) => {
  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const { ancestors, category } = await getRawCategory(context, args);

  return {
    ancestors: ancestors.map((category) => normalizeCategory(category, normalizerContext)),
    category: normalizeCategory(category, normalizerContext),
  };
});

export async function getRawCategory(
  context: InternalContext,
  args: GetCategoryArgs,
): Promise<RawResult> {
  const categories = await context.api.categoryList();
  let rawResult: RawResult | null = null;

  // eslint-disable-next-line complexity
  const searchCategory = (tree: NormalizeCategoryInput[], ancestors: NormalizeCategoryInput[]) => {
    for (const category of tree) {
      if (category.uid === args.id || category.url_key === args.id) {
        rawResult = {
          category,
          ancestors: [...ancestors],
        };
        return;
      } else if (category.children && category.children.length > 0) {
        ancestors.push(category);
        searchCategory(category.children.filter(Boolean) ?? [], ancestors);
        ancestors.pop(); // Remove the last ancestor for backtracking
      }
    }
  };
  const categoriesData = (categories.data?.categories?.items?.[0]?.children ?? []).filter(Boolean);

  searchCategory(categoriesData, []);

  if (!rawResult) {
    throw { statusCode: 404, message: "Category not found" };
  }

  return {
    ancestors: (rawResult as RawResult).ancestors.map((category, index, categories) => ({
      ...category,
      parentCategoryId: categories[index - 1]?.uid,
    })),
    category: {
      ...(rawResult as RawResult).category,
      parentCategoryId: (rawResult as RawResult).ancestors.at(-1)?.uid,
    },
  };
}

```
