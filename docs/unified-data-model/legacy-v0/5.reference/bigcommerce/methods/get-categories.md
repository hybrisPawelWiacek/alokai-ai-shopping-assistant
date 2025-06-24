# `GetCategories`
Implements `GetCategories` Unified Method.
        
## Source

```ts
import { slugify } from "@shared/utils";
import { CategoryTree } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { flattenCategoryTree } from "../helpers";
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";

export const getCategories = defineApi.getCategories(async (context, args) => {
  const { data } = await context.api.getCategoryTree();
  const { normalizeCategory } = getNormalizers(context);

  let filteredData = flattenCategoryTree(data);
  const { ids = [], slugs = [] } = args ?? {};

  if (ids.length > 0 || slugs.length > 0) {
    const idsSet = new Set(ids);
    const slugsSet = new Set(slugs.map((element) => slugify(element)));

    filteredData = filteredData.filter((category: CategoryTree) => {
      const idMatches = idsSet.has(category.id.toString());
      const slugMatches = slugsSet.has(slugify(category.name));

      return idMatches || slugMatches;
    });
  }

  return filteredData.map((element) => normalizeCategory(element, getNormalizerContext(context)));
});

```
