# `GetProductDetails`
Implements `GetProductDetails` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { CategoryInterface } from "@vue-storefront/magento-types";

export const getProductDetails = defineApi.getProductDetails(async (context, args) => {
  const response = await context.api.productDetails({ filter: { sku: { eq: args.id } } });
  const { normalizeProduct, normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context, { sku: args?.sku });

  const product = response.data.products?.items?.[0];
  if (!product) {
    throw new Error(`Product with sku ${args.id} not found`);
  }

  return {
    product: normalizeProduct(product, normalizerContext),
    categoryHierarchy: ((product.categories ?? []) as CategoryInterface[])
      .filter((value, index, categoriesArray) =>
        isValidBreadcrumbHierarchy(value, index, categoriesArray),
      )
      .map((category) => normalizeCategory(category, normalizerContext)),
  };
});

function isValidBreadcrumbHierarchy(
  category: CategoryInterface,
  index: number,
  categories: CategoryInterface[],
) {
  if (index === 0) return true;

  const previousCategory = categories[index - 1];

  return (
    category.url_path?.startsWith(previousCategory?.url_path ?? "") && category.breadcrumbs !== null
  );
}

```
