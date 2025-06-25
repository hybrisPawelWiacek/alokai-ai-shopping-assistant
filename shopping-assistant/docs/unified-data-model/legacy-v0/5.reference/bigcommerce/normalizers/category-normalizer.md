# Category normalizer

The `normalizeCategory` function is used to map a Magento `CategoryTree` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                        | Default value | Description              |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `category` | [`CategoryTree`](https://docs.alokai.com/integrations/bigcommerce/api/bigcommerce-types/CategoryTree) |               | BigCommerce CategoryTree |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCategory` with a `depth` field.

```ts
import { normalizers as normalizersBC, defineNormalizers } from "@vsf-enterprise/unified-api-bigcommerce";

const normalizers = defineNormalizers<typeof normalizersBC>()({
  ...normalizersBC,
  normalizeCategory: (category) => ({
    ...normalizersBC.normalizeCategory(category),
    depth: category.depth,
  }),
});
```

## Source

```ts [category.ts]
import { maybe } from "@shared/utils";
import type { Maybe } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCategory = defineNormalizer.normalizeCategory((category, ctx) => {
  // top level category in BigCommerce returns parent_id equal to 0
  const parentCategoryId = category.parent_id || null;
  const slug = getCategorySlugFromUrl(category.url ?? "") ?? category.id.toString();

  return {
    id: category.id.toString(),
    name: category.name,
    slug,
    subcategories: maybe(
      category.children?.map((element) => ctx.normalizers.normalizeCategory(element)),
    ),
    parentCategoryId: maybe(parentCategoryId?.toString()),
  };
});

export function getCategorySlugFromUrl(categoryUrl: string): Maybe<string> {
  const slugs = categoryUrl.split("/").filter(Boolean);

  if (slugs.length === 0) {
    return null;
  }

  return slugs.at(-1)!;
}

```
