# Category normalizer

The `normalizeCategory` function is used to map a SFCC `Category` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                                      | Default value | Description   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------- |
| `category` | [`Category`](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ocapi-shop-api?meta=type%3Acategory). |               | SFCC Category |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCategory` with an `thumbnail` field.

```ts
import { normalizers as normalizersSFCC, defineNormalizers } from "@vsf-enterprise/unified-api-sfcc";

const normalizers = defineNormalizers<typeof normalizersSFCC>()({
  ...normalizersSFCC,
  normalizeCategory: (category) => ({
    ...normalizersSFCC.normalizeCategory(category),
    thumbnail: category.thumbnail,
  }),
});
```

## Source

```ts [category.ts]
import { maybe, slugify } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCategory = defineNormalizer.normalizeCategory((category, ctx) => {
  const parentCategoryId = category.parentCategoryId === "root" ? null : category.parentCategoryId;

  return {
    id: category.id,
    name: category.name ?? category.id,
    slug: slugify(category.id),
    subcategories: maybe(
      category.categories?.map((subCategory) => normalizeCategory(subCategory, ctx)),
    ),
    parentCategoryId: maybe(parentCategoryId),
  };
});
```
