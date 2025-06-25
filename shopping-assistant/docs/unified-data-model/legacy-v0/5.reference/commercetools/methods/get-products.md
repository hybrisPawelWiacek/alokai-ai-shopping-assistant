# `GetProducts`
Implements `GetProducts` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getProducts = defineApi.getProducts(async (context, args) => {
  const { ids, skus } = args;
  const { normalizeProductCatalogItem } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const responseData = await context.api.getProduct({ ids, skus });
  const { results = [] } = responseData.data?.products || {};

  const products = results.map((product) =>
    normalizeProductCatalogItem(product, normalizerContext),
  );

  return {
    products,
  };
});

```
