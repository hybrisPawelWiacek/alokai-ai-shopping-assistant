# `SetShippingMethod`
Implements `SetShippingMethod` Unified Method.
        
## Source

```ts
import { defineApi, getCartId, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getNormalizers } from "@vue-storefront/unified-data-model";

export const setShippingMethod = defineApi.setShippingMethod(async (context, args) => {
  const cartId = getCartId(context);
  const { carrier_code, method_code } = unwrapShippingMethodId(args.shippingMethodId);

  const updatedCart = await query(
    context.api.setShippingMethodsOnCart({
      cart_id: cartId,
      shipping_methods: [
        {
          carrier_code,
          method_code,
        },
      ],
    }),
  );

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.setShippingMethodsOnCart?.cart, getNormalizerContext(context));
});

function unwrapShippingMethodId(input: string) {
  const [carrier_code, method_code] = input.split(":");
  if (!carrier_code || !method_code) {
    throw new Error(
      `Invalid shipping method id "${input}", expected a colon separated carrier code and method code`,
    );
  }
  return { carrier_code, method_code };
}

```
