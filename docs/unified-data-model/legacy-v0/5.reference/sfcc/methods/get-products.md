# `GetProducts`
Implements `GetProducts` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getProducts = defineApi.getProducts(async (context, { ids = [], skus = [] }) => {
  try {
    // both, ids and skus, may be product ids
    const productIds = [...new Set([...ids, ...skus])];

    const { normalizeProductCatalogItem } = getNormalizers(context);
    const normalizerContext = getNormalizerContext(context);

    const products = await context.api.getProducts({ ids: productIds, perPricebook: true });
    return {
      products: products.map((product) => normalizeProductCatalogItem(product, normalizerContext)),
    };
  } catch (error) {
    console.error({ error });
    return {
      products: [],
    };
  }
});

```
