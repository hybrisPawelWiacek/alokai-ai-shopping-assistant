# `GetProductDetails`
Implements `GetProductDetails` Unified Method.
        
## Source

```ts
import type { CurrencyCode, Product } from "@vsf-enterprise/bigcommerce-api";
import { SfCategory, getNormalizers } from "@vue-storefront/unified-data-model";
import { getNormalizerContext, defineApi, InternalContext, ReturnNormalizerType } from "@vsf-enterprise/unified-api-bigcommerce";
import { getCategories } from "@/methods/category";

export const getProductDetails = defineApi.getProductDetails(async (context, args) => {
  const normalizerContext = getNormalizerContext(context, { sku: args?.sku });
  const products = await context.api.getProductById({
    entityId: Number.parseInt(args.id),
    currencyCode: normalizerContext.currency as CurrencyCode,
  });
  const product = products.data;
  const { normalizeProduct } = getNormalizers(context);

  if (!product) {
    console.error("/getProductDetails - Product not found", { args });
    throw { statusCode: 404, message: "Product not found" };
  }

  const categoryHierarchy = await getCategoriesForProduct(context, product);

  return {
    product: normalizeProduct(product, normalizerContext),
    categoryHierarchy: categoryHierarchy as ReturnNormalizerType<
      InternalContext,
      "normalizeCategory"
    >[],
  };
});

async function getCategoriesForProduct(
  context: InternalContext,
  product: Product,
): Promise<SfCategory[]> {
  let categoryHierarchy: SfCategory[] = [];
  const tailCategoryId = product.categories.at(-1);

  if (tailCategoryId != null) {
    categoryHierarchy = await getCategories(context, {
      ids: [tailCategoryId.toString()],
    });
  }

  return categoryHierarchy;
}

```
