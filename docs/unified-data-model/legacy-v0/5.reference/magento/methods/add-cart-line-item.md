# `AddCartLineItem`
Implements `AddCartLineItem` Unified Method.
        
## Source

```ts
/* eslint-disable complexity */
import { type InternalContext, defineApi, getNormalizerContext, query } from "@vsf-enterprise/unified-api-magento";
import { getCartId } from "@/commons/cartId";
import { type ProductWithTypeName, isConfigurableProduct } from "@/normalizers/__internal__";
import { AddCartLineItemArgs, getNormalizers } from "@vue-storefront/unified-data-model";

async function getCartItem(context: InternalContext, args: AddCartLineItemArgs) {
  const productData = await query(
    context.api.productDetails({ pageSize: 1, filter: { sku: { eq: args.productId } } }),
  );

  const selectedProduct = productData.products?.items?.[0] as ProductWithTypeName;
  if (!selectedProduct) {
    throw { statusCode: 404, message: "Invalid product" };
  }
  if (isConfigurableProduct(selectedProduct)) {
    const variant = selectedProduct.variants
      ?.filter(Boolean)
      .find((productVariant) => productVariant.product?.sku === args.sku);
    if (!variant) {
      throw { statusCode: 404, message: "Product not found" };
    }
    const selected_options = (variant.attributes ?? [])
      ?.map((attribute) => attribute?.uid)
      .filter(Boolean);
    return { sku: args.productId, selected_options };
  }
  return { sku: args.sku as string };
}

export const addCartLineItem = defineApi.addCartLineItem(async (context, args) => {
  if (args?.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }

  const { productId, sku, quantity = 1 } = args;
  if (!productId || !sku) {
    throw {
      statusCode: 400,
      message: "Bad Request: missing required arguments: `productId` & `sku`",
    };
  }
  const cartItem = await getCartItem(context, args);
  const cartId = getCartId(context);
  const { normalizeCart } = getNormalizers(context);

  const data = await query(
    context.api.addProductsToCart({
      cartId,
      cartItems: [{ quantity, ...cartItem }],
    }),
  );

  const { cart, user_errors } = data.addProductsToCart;

  if (user_errors?.[0]) {
    throw user_errors[0];
  }

  return normalizeCart(cart, getNormalizerContext(context));
});

```
