# `GetAvailableShippingMethods`
Implements `GetAvailableShippingMethods` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getShipmentId } from "@vsf-enterprise/unified-api-sfcc";
import { getNormalizers } from "@vue-storefront/unified-data-model";
import "./extended.d";

export const getAvailableShippingMethods = defineApi.getAvailableShippingMethods(
  async (context) => {
    const shipmentId = getShipmentId(context);
    const { normalizeShippingMethod } = getNormalizers(context);

    const { applicableShippingMethods } = await context.api.getApplicableShippingMethods({
      shipmentId,
    });

    let methods = [];

    if (applicableShippingMethods) {
      methods = applicableShippingMethods
        .map((shippingMethod) =>
          normalizeShippingMethod(shippingMethod, getNormalizerContext(context)),
        )
        .filter(Boolean);
    }

    return { methods };
  },
);

```
