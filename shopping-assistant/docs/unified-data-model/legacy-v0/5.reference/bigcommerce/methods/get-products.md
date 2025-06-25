# `GetProducts`
Implements `GetProducts` Unified Method.
        
## Source

```ts
import { getNormalizerContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { GraphQL, Product } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getProducts = defineApi.getProducts(async (context, args) => {
  const { normalizeProductCatalogItem } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context);

  const productsData = await context.api.getProducts({
    "id:in": args.ids ? args.ids.map((id) => Number.parseInt(id)) : undefined,
    "sku:in": args.skus ?? undefined,
  });

  if (!productsData.data?.length) {
    return { products: [] };
  }
  const entityIds = productsData.data.map((product) => product.id);

  const productResponse = await context.api.getProductsById({
    entityIds,
    currencyCode: normalizerContext.currency as GraphQL.CurrencyCode,
  });

  const products = productResponse.data.map((product: Product) =>
    normalizeProductCatalogItem(product, normalizerContext),
  );

  return { products };
});

```
