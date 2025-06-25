# Category normalizer

The `normalizeCategory` function is used to map a Commercetools `Category` into the unified [`SfCategory`](/reference/unified-data-model.html#sfcategory) data model.

## Parameters

| Name       | Type                                                                                                    | Default value | Description            |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------- | ---------------------- |
| `category` | [`Category`](https://docs.alokai.com/integrations/commercetools/api/commercetools-types/Category) |               | Commercetools Category |

## Extending

The `SfCategory` model is returned from the Unified Methods such as [`SearchProducts`](/unified-data-layer/unified-methods/products#searchproducts), and [`GetCategories`](/unified-data-layer/unified-methods/category#getcategories). If the `SfCategory` structure doesn't contain the information you need for your Storefront, you can extend its logic using the `defineNormalizers` function. The following example demonstrates how to extend `SfCategory` with an `externalId` field.

```ts
import { normalizers as normalizersCT, defineNormalizers } from "@vsf-enterprise/unified-api-commercetools";

const normalizers = defineNormalizers<typeof normalizersCT>()({
  ...normalizersCT,
  normalizeCategory: (category) => ({
    ...normalizersCT.normalizeCategory(category),
    externalId: category.externalId,
  }),
});
```

## Source

```ts [category.ts]
import { maybe, slugify } from "@shared/utils";
import { defineNormalizer } from "../defineNormalizer";

export const normalizeCategory = defineNormalizer.normalizeCategory((category, ctx) => {
  const subcategories =
    category.children && category.children.length > 0
      ? category.children.map((child) => ctx.normalizers.normalizeCategory(child))
      : null;

  const name = category.name ?? String(category.id);

  return {
    id: category.id,
    name,
    slug: category.slug ?? slugify(name),
    subcategories,
    parentCategoryId: maybe(category.parent?.id),
  };
});
```
