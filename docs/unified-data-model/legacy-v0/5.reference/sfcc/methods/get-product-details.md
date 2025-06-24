# `GetProductDetails`
Implements `GetProductDetails` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { SFCCIntegrationContext } from "@vsf-enterprise/sfcc-api";
import { Product } from "@vsf-enterprise/sfcc-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getProductDetails = defineApi.getProductDetails(async (context, args) => {
  const { id, sku } = args;
  const productId = sku || id;
  const product = await context.api.getProduct({ perPricebook: true, id: productId });

  const rootCategoryId = await getPrimaryCategoryId(context, product);
  const productCategory = rootCategoryId
    ? await context.api.getCategory({ id: rootCategoryId })
    : undefined;

  const { normalizeProduct, normalizeCategory } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  return {
    product: normalizeProduct(product, normalizerContext),
    categoryHierarchy:
      productCategory?.parentCategoryTree?.map((category) =>
        normalizeCategory(category, normalizerContext),
      ) ?? [],
  };
});

async function getPrimaryCategoryId(context: SFCCIntegrationContext, product: Product) {
  if (product?.primaryCategoryId) {
    return product.primaryCategoryId;
  }
  const masterId = product.master?.masterId;
  if (!masterId) {
    return;
  }
  const masterProduct = await context.api.getProduct({ id: masterId });
  return masterProduct?.primaryCategoryId;
}

```
