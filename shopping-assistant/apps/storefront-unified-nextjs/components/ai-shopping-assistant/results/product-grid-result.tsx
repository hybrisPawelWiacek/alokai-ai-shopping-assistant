'use client';

import { SfButton, SfRating, SfIconShoppingCart } from '@storefront-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useFormatter } from '@/hooks/use-formatter';
import { useAddCartLineItem } from '@/hooks/cart/use-add-cart-line-item';
import { useNotification } from '@/hooks/use-notification';
import type { ProductGridResultProps } from '../types';

export default function ProductGridResult({
  products,
  onProductClick,
  onAddToCart,
}: ProductGridResultProps) {
  const formatter = useFormatter();
  const { mutate: addToCart } = useAddCartLineItem();
  const { addSuccess } = useNotification();

  const handleAddToCart = (productId: string) => {
    if (onAddToCart) {
      onAddToCart(productId);
    } else {
      addToCart({ productId, quantity: 1 });
      addSuccess('Product added to cart');
    }
  };

  const handleProductClick = (productId: string) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500">
        No products found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      {products.slice(0, 4).map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <Link
            href={`/product/${product.id}`}
            onClick={() => handleProductClick(product.id)}
            className="block"
          >
            {product.image && (
              <div className="relative aspect-square bg-neutral-100">
                <Image
                  src={product.image.url}
                  alt={product.image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>
            )}
          </Link>

          <div className="p-3">
            <Link
              href={`/product/${product.id}`}
              onClick={() => handleProductClick(product.id)}
              className="block"
            >
              <h3 className="font-medium text-sm line-clamp-2 hover:text-primary-700">
                {product.name}
              </h3>
            </Link>

            {product.rating !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <SfRating value={product.rating} size="xs" />
                <span className="text-xs text-neutral-500">({product.rating})</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-primary-700">
                {formatter.formatPrice(product.price.value, product.price.currency)}
              </span>

              <SfButton
                size="sm"
                variant="primary"
                disabled={!product.inStock}
                onClick={() => handleAddToCart(product.id)}
                aria-label={`Add ${product.name} to cart`}
                square
              >
                <SfIconShoppingCart size="sm" />
              </SfButton>
            </div>
          </div>
        </div>
      ))}

      {products.length > 4 && (
        <div className="col-span-full text-center mt-2">
          <Link href="/search" className="text-primary-700 hover:underline text-sm">
            View all {products.length} products →
          </Link>
        </div>
      )}
    </div>
  );
}