# `GetAvailableShippingMethods`
Implements `GetAvailableShippingMethods` Unified Method.
        
## Source

```ts
import { defineApi, getCartVersion, getNormalizerContext } from "@vsf-enterprise/unified-api-commercetools";
import { ShippingMethod } from "@vsf-enterprise/commercetools-types";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const getAvailableShippingMethods = defineApi.getAvailableShippingMethods(
  async (context) => {
    const { id: cartId } = await getCartVersion(context);
    const [shippingMethods, me] = await Promise.all([
      context.api.getShippingMethods(cartId),
      context.api.getMe(),
    ]);
    const activeCart = me.data!.me.activeCart!;
    const normalizerContext = getNormalizerContext(context);
    const { normalizeShippingMethod } = getNormalizers(context);

    return {
      methods:
        shippingMethods.data?.shippingMethods
          .map((method: ShippingMethod) =>
            normalizeShippingMethod(
              { ...method, totalPrice: activeCart.totalPrice },
              normalizerContext,
            ),
          )
          .filter(Boolean) || [],
    };
  },
);

```
