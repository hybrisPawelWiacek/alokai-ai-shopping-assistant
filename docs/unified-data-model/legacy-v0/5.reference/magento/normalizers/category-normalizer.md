# Category normalizer

The `normalizeCategory` function is used to map a Magento `CategoryTree` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                             | Default value | Description                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `category` | [`CategoryTreeWithParentUid`](https://docs.alokai.com/integrations/magento/api/magento-types/CategoryTree) |               | Magento CategoryTree with information about categories' parent uid |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCategory` with a `description` field.

```ts
import { normalizers as normalizersMagento, defineNormalizers } from "@vsf-enterprise/unified-api-magento";

const normalizers = defineNormalizers<typeof normalizersMagento>()({
  ...normalizersMagento,
  normalizeCategory: (category) => ({
    ...normalizersMagento.normalizeCategory(category),
    description: category.description,
  }),
});
```

## Source

```ts [category.ts]
import { maybe, slugify } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCategory = defineNormalizer.normalizeCategory((category, ctx) => {
  return {
    id: category.uid as string,
    name: category.name ?? category.uid!,
    parentCategoryId: maybe(category.parentCategoryId),
    slug: category.url_key ?? slugify(category.name ?? ""),
    subcategories: maybe(
      category.children
        ?.filter(Boolean)
        .map((element) =>
          ctx.normalizers.normalizeCategory({ ...element, parentCategoryId: category.uid }),
        ),
    ),
  };
});
```
