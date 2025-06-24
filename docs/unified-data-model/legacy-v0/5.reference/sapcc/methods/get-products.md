# `GetProducts`
Implements `GetProducts` Unified Method.
        
## Source

```ts
/* eslint-disable no-secrets/no-secrets */
import { defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getProducts = defineApi.getProducts(async (context, { ids = [], skus = [] }) => {
  try {
    // both, ids and skus, may be product codes
    const codes = [...ids, ...skus];
    const { normalizeProductCatalogItem } = getNormalizers(context);

    // SAP CC API does not support fetching multiple products by id (code)
    // https://help.sap.com/docs/SAP_COMMERCE_CLOUD_PUBLIC_CLOUD/3476714bba0b4cb9b3eb58c270e44439/8c3f3e3a86691014b312f98ba6e321ab.html?version=v2105&locale=en-US
    const promises = codes.map((id) => context.api.getProduct({ id }));

    const products = await Promise.all(promises);

    return {
      products: products.map((product) =>
        normalizeProductCatalogItem(product, getNormalizerContext(context)),
      ),
    };
  } catch {
    return {
      products: [],
    };
  }
});

```
