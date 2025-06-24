'use client';

import CartProductCard from '@/components/cart-product-card';
import { useFormatter, useIsCartMutating, useRemoveCartLineItem, useUpdateCartLineItem } from '@/hooks';
import type { SfCartLineItem } from '@/types';

interface ProductCardProps {
  product: SfCartLineItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const id = product.id;
  const updateCartQuantity = useUpdateCartLineItem(id);
  const removeCartLineItem = useRemoveCartLineItem(id);
  const { formatPrice } = useFormatter();
  const isMutatingCart = !!useIsCartMutating();

  return (
    <CartProductCard
      attributes={product.attributes}
      disabled={isMutatingCart}
      id={id}
      imageAlt={product.image?.alt}
      imageUrl={product.image?.url}
      key={id}
      maxValue={product.quantityLimit || Infinity}
      minValue={1}
      name={product.name ?? ''}
      onRemove={() => removeCartLineItem.mutate()}
      onUpdate={(quantity) => updateCartQuantity.mutate({ quantity })}
      price={product.unitPrice}
      productId={product.productId}
      sku={product.sku ?? product.productId}
      slug={product.slug}
      specialPrice={product.unitPrice?.isDiscounted ? formatPrice(product.unitPrice?.regularPrice) : undefined}
      totalPrice={product.totalPrice ? formatPrice(product.totalPrice) : undefined}
      value={product.quantity}
    />
  );
}
