# Category normalizer

The `normalizeCategory` function is used to map a SAP `CategoryHierarchy` or `Category` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                                                                                                                                                       | Default value | Description  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------ |
| `category` | [`CategoryHierarchy`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.categoryhierarchy.html) or [`Category`](https://docs.alokai.com/sapcc/reference/api/sap-commerce-webservices-sdk.category.html) |               | SAP Category |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCategory` with an `url` field.

```ts
import { normalizers as normalizersSAP, defineNormalizers } from "@vsf-enterprise/unified-api-sapcc";

const normalizers = defineNormalizers<typeof normalizersSAP>()({
  ...normalizersSAP,
  normalizeCategory: (category) => ({
    ...normalizersSAP.normalizeCategory(category),
    url: category.url,
  }),
});
```

## Source

`CategoryHiearchy` is returned from API Client's the `getCatalogVersion` and `Category` from the `getProduct`.

```ts [category.ts]
import { maybe, slugify } from "@shared/utils";
import { SfCategory } from "@vue-storefront/unified-data-model";
import { defineNormalizer } from "../defineNormalizer";
import { CategoryHierarchyWithParentId, CategoryWithParentCode, NormalizerContext } from "../types";

export const normalizeCategory = defineNormalizer.normalizeCategory((category, ctx) => {
  if ("code" in category) {
    return handleCategory(category);
  }
  return handleCategoryHierarchy(category, ctx);
});

export function getCategorySlug(category: CategoryHierarchyWithParentId): string {
  let slug = slugify(category.id as string);

  if (category.url) {
    slug = category.url.split("/").at(-1) ?? slug;
  }

  return slug;
}

function handleCategoryHierarchy(
  category: CategoryHierarchyWithParentId,
  ctx: NormalizerContext,
): SfCategory {
  return {
    id: category.id as string,
    name: category.name ?? (category.id as string),
    slug: getCategorySlug(category),
    subcategories: maybe(
      category?.subcategories?.map((element) =>
        normalizeCategory({ ...element, parentCategoryId: category.id }, ctx),
      ),
    ),
    parentCategoryId: maybe(category.parentCategoryId),
  };
}

function handleCategory(category: CategoryWithParentCode): SfCategory {
  return {
    id: category.code as string,
    name: category.name as string,
    slug: category.code as string,
    subcategories: null,
    parentCategoryId: maybe(category.parentCategoryCode),
  };
}
```
