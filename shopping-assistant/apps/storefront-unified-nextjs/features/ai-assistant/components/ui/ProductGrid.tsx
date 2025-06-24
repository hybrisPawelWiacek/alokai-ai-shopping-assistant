import { useEffect } from 'react';
import type { SfProductCatalogItem } from '@/types';
export type Product = SfProductCatalogItem;
import ProductCardVertical from '@/components/product-card-vertical';
import ImageWithPlaceholder from '@/components/image-with-placeholder';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  useEffect(() => {
    console.log('ProductGrid mounted with:', products);
  }, [products]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {products.map((product, index) => (
        <div className="relative" key={`${product.id}-${index}`}>
          <ProductCardVertical
            className="w-full"
            id={product.id}
            title={product.name}
            link={{
              pathname: '/product/[slug]/[id]',
              params: {
                id: product.id,
                slug: product.slug
              },
              query: { sku: product.sku }
            }}
            price={product.price}
            slotImage={
              <ImageWithPlaceholder
                alt={product.primaryImage?.alt || product.name}
                data-testid="image-slot"
                height="192"
                nextImageClassName="object-contain aspect-square w-full h-full"
                placeholder="/images/placeholder-300.webp"
                priority={index <= 1}
                sizes="(max-width: 767px) 40vw, 192px"
                src={product.primaryImage?.url}
                unoptimized={!product.primaryImage}
                width="192"
              />
            }
          />
        </div>
      ))}
    </div>
  );
}
