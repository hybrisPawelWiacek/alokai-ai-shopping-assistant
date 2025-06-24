# `GetCategories`
Implements `GetCategories` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getCategorySlug } from "@/normalizers";
import { CategoryHierarchy } from "@vsf-enterprise/sapcc-types";
import { GetCategoriesArgs, getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";
import { CategoryHierarchyWithParentId } from "@/normalizers/types";

export const getCategories = defineApi.getCategories(async (context, args) => {
  const allCategories = await context.api.getCatalogVersion();
  const { normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const filteredData = filterCategories(allCategories.categories || [], {
    ids: args?.ids ?? [],
    slugs: args?.slugs ?? [],
  });

  return filteredData.map((category) => normalizeCategory(category, normalizerContext));
});

function filterCategories(
  categories: CategoryHierarchy[],
  args: Required<Pick<GetCategoriesArgs, "ids" | "slugs">>,
): CategoryHierarchyWithParentId[] {
  const { ids = [], slugs = [] } = args;

  let filteredData = flatCategoryHierarchy(categories);

  if (ids.length > 0 || slugs.length > 0) {
    const idsSet = ids ? new Set(ids) : null;
    const slugsSet = slugs ? new Set(slugs) : null;

    filteredData = filteredData.filter((category) => {
      const idMatches = !idsSet || idsSet.has(category.id as string);
      const slugMatches = !slugsSet || slugsSet.has(getCategorySlug(category));

      return idMatches || slugMatches;
    });
  }

  return filteredData;
}

function flatCategoryHierarchy(
  categories: CategoryHierarchy[],
  parentCategoryId?: string | undefined,
): CategoryHierarchyWithParentId[] {
  return categories.flatMap((category) => [
    { ...category, parentCategoryId },
    ...(category.subcategories ? flatCategoryHierarchy(category.subcategories, category.id) : []),
  ]);
}

```
