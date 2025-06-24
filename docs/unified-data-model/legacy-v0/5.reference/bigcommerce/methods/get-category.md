# `GetCategory`
Implements `GetCategory` Unified Method.
        
## Source

```ts
import { InternalContext, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { getCategorySlugFromUrl } from "@/commons/category";
import { CategoryTree } from "@vsf-enterprise/bigcommerce-api";
import { GetCategoryArgs, getNormalizers } from "@vue-storefront/unified-data-model";

interface RawResult {
  ancestors: CategoryTree[];
  category: CategoryTree;
}

export const getCategory = defineApi.getCategory(async (context, args) => {
  const { normalizeCategory } = getNormalizers(context);
  const rawResult = await getRawCategory(context, args);
  const normalizerContext = getNormalizerContext(context);

  return {
    ancestors: rawResult.ancestors.map((category) =>
      normalizeCategory(category, normalizerContext),
    ),
    category: normalizeCategory(rawResult.category, normalizerContext),
  };
});

export async function getRawCategory(
  context: InternalContext,
  args: GetCategoryArgs,
): Promise<RawResult> {
  const { data } = await context.api.getCategoryTree();
  let rawResult: RawResult | null = null;

  // eslint-disable-next-line complexity
  const searchCategory = (tree: CategoryTree[], ancestors: CategoryTree[]) => {
    for (const category of tree) {
      if (
        category.id.toString() === args.id ||
        (category.url && getCategorySlugFromUrl(category.url) === args.id)
      ) {
        rawResult = {
          category,
          ancestors: [...ancestors],
        };
        return;
      } else if (category.children && category.children.length > 0) {
        ancestors.push(category);
        searchCategory(category.children, ancestors);
        ancestors.pop(); // Remove the last ancestor for backtracking
      }
    }
  };

  searchCategory(data, []);

  if (!rawResult) {
    throw { statusCode: 404, message: "Category not found" };
  }

  return rawResult;
}

```
