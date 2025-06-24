# `GetAvailableShippingMethods`
Implements `GetAvailableShippingMethods` Unified Method.
        
## Source

```ts
import { InternalContext, defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getAvailableShippingMethods = defineApi.getAvailableShippingMethods(
  async (context) => {
    const customerToken = context.config.state.getCustomerToken();

    const getShippingMethodsPromise = customerToken
      ? getCustomerShippingMethods
      : getGuestShippingMethods;

    const shippingMethods = await getShippingMethodsPromise(context);

    if (shippingMethods.length === 0) {
      throw new Error("No shipping methods available");
    }

    const { normalizeShippingMethod } = getNormalizers(context);
    const normalizerContext = getNormalizerContext(context);

    return {
      methods:
        shippingMethods
          .map((method) => normalizeShippingMethod(method, normalizerContext))
          .filter(Boolean) || [],
    };
  },
);

async function getCustomerShippingMethods(context: InternalContext) {
  const data = await query(context.api.getAvailableCustomerShippingMethods());
  return data?.customerCart?.shipping_addresses?.[0]?.available_shipping_methods ?? [];
}

async function getGuestShippingMethods(context: InternalContext) {
  const cartId = getCartId(context);
  const data = await query(context.api.getAvailableShippingMethods({ cart_id: cartId }));

  return data?.cart?.shipping_addresses?.[0]?.available_shipping_methods || [];
}

```
