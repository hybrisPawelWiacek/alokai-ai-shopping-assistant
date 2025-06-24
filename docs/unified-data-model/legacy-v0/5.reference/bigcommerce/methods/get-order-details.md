# `GetOrderDetails`
Implements `GetOrderDetails` Unified Method.
        
## Source

```ts
/* eslint-disable max-statements */
import { InternalContext, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-bigcommerce";
import { Order, OrderByCartResponse, OrderProductResponse } from "@vsf-enterprise/bigcommerce-api";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getOrderDetails = defineApi.getOrderDetails(async (context, args) => {
  const { id } = args;
  const orderId = Number.parseInt(id);
  const orderData = await context.api.getOrders({ min_id: orderId, max_id: orderId });
  const orderProducts = await context.api.getOrderProducts({ orderId });
  const orderShipping = await context.api.getOrderShippingAddresses({ orderId });

  const data: OrderByCartResponse = {
    ...(orderData![0] as Order),
    products: orderProducts,
    shipping_addresses: orderShipping,
  };

  const { normalizeOrder } = getNormalizers(context);
  const normalizerContext = getNormalizerContext(context, {
    imageGetter: await imageGetterFactory(orderProducts, context),
  });

  return normalizeOrder(data, normalizerContext);
});

async function imageGetterFactory(orderProducts: OrderProductResponse, context: InternalContext) {
  if (context.config.skipOrderImages) {
    return () => null;
  }

  const { data: orderImages } = await context.api.getProductsById({
    entityIds: orderProducts.map((product) => product.product_id).filter(Boolean),
  });

  if (!orderImages) {
    return () => null;
  }

  return (productId: number) => {
    const foundProduct = orderImages.find((product) => product.id === productId);

    if (!foundProduct?.images?.[0]) {
      return null;
    }

    return foundProduct.images[0];
  };
}

```
