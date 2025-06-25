# `GetProductDetails`
Implements `GetProductDetails` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { CategoryWithParentCode } from "@/normalizers/types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getProductDetails = defineApi.getProductDetails(async (context, args) => {
  const { id, sku } = args;
  const code = sku || id;
  const product = await context.api.getProduct({ id: decodeURI(code.replace(/\s/g, "+")) });
  const { normalizeProduct, normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);
  const categoryHierarchy: CategoryWithParentCode[] =
    product.categories?.map((category, index, categories) => ({
      ...category,
      parentCategoryCode: categories[index - 1]?.code,
    })) ?? [];

  return {
    product: normalizeProduct(product, normalizerContext),
    categoryHierarchy:
      categoryHierarchy.map((category) => normalizeCategory(category, normalizerContext)) ?? [],
  };
});

```
