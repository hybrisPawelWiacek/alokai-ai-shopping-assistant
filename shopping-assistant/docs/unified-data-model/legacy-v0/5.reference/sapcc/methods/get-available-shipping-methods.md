# `GetAvailableShippingMethods`
Implements `GetAvailableShippingMethods` Unified Method.
        
## Source

```ts
import { getCartId, defineApi, getNormalizerContext } from "@vsf-enterprise/unified-api-sapcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getAvailableShippingMethods = defineApi.getAvailableShippingMethods(
  async (context) => {
    const cartId = getCartId(context);
    const { normalizeShippingMethod } = getNormalizers(context);
    const normalizerContext = getNormalizerContext(context);

    try {
      const data = await context.api.getCartDeliveryModes({ cartId });
      return {
        methods:
          data.deliveryModes
            ?.map((deliveryMode) => normalizeShippingMethod(deliveryMode, normalizerContext))
            .filter(Boolean) ?? [],
      };
    } catch {
      throw new Error("Error getting available shipping methods");
    }
  },
);

```
