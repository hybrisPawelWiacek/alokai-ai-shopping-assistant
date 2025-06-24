# `GetProducts`
Implements `GetProducts` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getProducts = defineApi.getProducts(async (context, args) => {
  const { ids, skus = [] } = args;

  if (ids?.length) {
    console.warn("getProducts(): ids argument is not supported");
  }

  if (skus.length === 0) {
    return {
      products: [],
    };
  }

  const responseData = await context.api.products({ filter: { sku: { in: skus } } });

  if (responseData.errors?.[0])
    throw {
      message: responseData.errors[0].message,
    };

  const responseProducts = responseData.data.products?.items ?? [];

  const { normalizeProductCatalogItem } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const products = responseProducts.map((product) =>
    normalizeProductCatalogItem(product, normalizerContext),
  );

  return {
    products,
  };
});

```
