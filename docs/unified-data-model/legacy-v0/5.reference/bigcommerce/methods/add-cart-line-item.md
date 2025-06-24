# `AddCartLineItem`
Implements `AddCartLineItem` Unified Method.
        
## Source

```ts
/* eslint-disable max-statements */
import { getCartFromContext, defineApi } from "@vsf-enterprise/unified-api-bigcommerce";
import { getNormalizedCart } from "@/commons/cart";
import { CartIncludeEnum, Product, ProductVariant } from "@vsf-enterprise/bigcommerce-api";

export const addCartLineItem = defineApi.addCartLineItem(async (context, args) => {
  if (args.cartId != null) {
    throw { statusCode: 400, message: "Multiple carts feature is not available." };
  }
  const cart = await getCartFromContext(context);
  const cartId = cart.id as string;

  const { productId, sku, quantity = 1 } = args;

  const { data: products } = await context.api.getProducts({
    id: Number(productId),
    include_fields: "variants,base_variant_id,sku", // reduce payload
    include: "variants", // this is never returned by default in the response
  });

  if (products.length === 0) {
    throw { statusCode: 404, message: "Product not found" };
  }

  const variant_id = await getVariantIdFromSku(products[0]!, sku);

  const { data } = await context.api.addCartItems({
    cartId,
    data: {
      line_items: [{ product_id: Number(productId), quantity, variant_id }],
    },
    include: CartIncludeEnum.LineItemsPhysicalItemsOptions,
  });

  return await getNormalizedCart(context, data);
});

async function getVariantIdFromSku(
  product: Product,
  sku: string | null,
): Promise<number | undefined> {
  const variants = product.variants ?? [];

  if (!sku || product.sku === sku) {
    return product.base_variant_id ?? variants[0]?.id;
  }

  if (variants.length > 0) {
    return findVariant(variants, sku).id;
  }
}

function findVariant(variants: ProductVariant[], sku: string): ProductVariant {
  const variantWithSpecifiedSku = variants.find((variant) => variant.sku === sku);

  if (!variantWithSpecifiedSku) {
    throw { statusCode: 404, message: "Variant with given sku not found" };
  }

  return variantWithSpecifiedSku;
}

```
