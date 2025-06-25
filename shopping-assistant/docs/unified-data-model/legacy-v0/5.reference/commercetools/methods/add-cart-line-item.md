# `AddCartLineItem`
Implements `AddCartLineItem` Unified Method.
        
## Source

```ts
import { defineApi, getNormalizerContext, getCartVersion } from "@vsf-enterprise/unified-api-commercetools";
import { getProduct } from "@/methods/product/helpers";
import { CommercetoolsContext } from "@vsf-enterprise/commercetools-api";
import { Cart } from "@vsf-enterprise/commercetools-types";
import { AddCartLineItemArgs, getNormalizers } from "@vue-storefront/unified-data-model";

export const addCartLineItem = defineApi.addCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const [variant, cartVersion] = await Promise.all([
    getProductVariant(context, args),
    getCartVersion(context),
  ]);

  if (!variant) {
    throw new Error("Variant not found");
  }

  const updatedCart = await context.api.addToCart(cartVersion, {
    product: variant,
    quantity: args.quantity || 1,
  });

  const { normalizeCart } = getNormalizers(context);

  return normalizeCart(updatedCart.data?.cart as Cart, getNormalizerContext(context));
});

async function getProductVariant(context: CommercetoolsContext, args: AddCartLineItemArgs) {
  const product = await getProduct(context, { id: args.productId, sku: args.sku || undefined });
  const { allVariants, masterVariant } = product.masterData.current || {};

  if (!args.sku) {
    return masterVariant;
  }

  return allVariants?.find((variant) => variant.sku === args.sku);
}

```
