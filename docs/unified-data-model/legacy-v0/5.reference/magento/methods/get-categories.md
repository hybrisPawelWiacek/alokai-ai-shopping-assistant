# `GetCategories`
Implements `GetCategories` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import type { NormalizeCategoryInput } from "@/normalizers/types";
import { type GetCategoriesArgs, getNormalizers } from "@vue-storefront/unified-data-model";

export const getCategories = defineApi.getCategories(async (context, args) => {
  const allCategories = await context.api.categoryList();
  const { normalizeCategory } = getNormalizers(context);
  const rootCategories = (allCategories.data?.categories?.items?.[0]?.children ?? []).filter(
    Boolean,
  );

  const filteredData = filterCategories(rootCategories, {
    ids: args?.ids ?? [],
    slugs: args?.slugs ?? [],
  });

  return filteredData.map((category) => normalizeCategory(category, getNormalizerContext(context)));
});

function filterCategories(
  categories: NormalizeCategoryInput[],
  args: Required<Pick<GetCategoriesArgs, "ids" | "slugs">>,
): NormalizeCategoryInput[] {
  const { ids = [], slugs = [] } = args;

  let filteredData = flatCategoryHierarchy(categories);

  if (ids.length > 0 || slugs.length > 0) {
    const idsSet = ids ? new Set(ids) : null;
    const slugsSet = slugs ? new Set(slugs) : null;

    filteredData = filteredData.filter((category) => {
      const idMatches = !idsSet || idsSet.has(category.uid as string);
      const slugMatches = !slugsSet || slugsSet.has(category.url_path as string);

      return idMatches || slugMatches;
    });
  }

  return filteredData;
}

function flatCategoryHierarchy(
  categories: NormalizeCategoryInput[],
  parentCategoryId?: string | undefined,
): NormalizeCategoryInput[] {
  return categories.flatMap((category) => [
    { ...category, parentCategoryId },
    ...(category.children
      ? flatCategoryHierarchy((category.children ?? []) as NormalizeCategoryInput[], category.uid)
      : []),
  ]);
}

```
