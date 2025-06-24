# `GetProductDetails`
Implements `GetProductDetails` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import { getProduct } from "../helpers";

export const getProductDetails = defineApi.getProductDetails(async (context, args) => {
  const product = await getProduct(context, args);
  const categories = product.masterData.current?.categories || [];
  const normalizerContext = getNormalizerContext(context, { sku: args.sku });

  const { normalizeProduct, normalizeCategory } = getNormalizers(context);

  return {
    product: normalizeProduct(product, normalizerContext),
    categoryHierarchy: categories.map((category) => normalizeCategory(category, normalizerContext)),
  };
});

```
