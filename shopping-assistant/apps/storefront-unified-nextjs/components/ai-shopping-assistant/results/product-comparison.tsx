'use client';

import { SfButton, SfChip } from '@storefront-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useFormatter } from '@/hooks/use-formatter';
import type { ProductComparisonProps } from '../types';

export default function ProductComparison({
  products,
  highlightedAttributes = ['price', 'rating', 'availability'],
}: ProductComparisonProps) {
  const formatter = useFormatter();

  if (!products || products.length === 0) {
    return null;
  }

  // Get all unique attributes across products
  const allAttributes = new Set<string>();
  products.forEach(product => {
    Object.keys(product.attributes).forEach(attr => allAttributes.add(attr));
  });

  const attributesList = Array.from(allAttributes).filter(
    attr => !['id', 'name', 'image'].includes(attr)
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border-b border-neutral-200">Feature</th>
            {products.map((product) => (
              <th key={product.id} className="p-2 border-b border-neutral-200">
                <div className="text-center">
                  {product.image && (
                    <div className="relative w-24 h-24 mx-auto mb-2">
                      <Image
                        src={product.image.url}
                        alt={product.image.alt}
                        fill
                        className="object-contain"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <Link
                    href={`/product/${product.id}`}
                    className="font-medium text-sm hover:text-primary-700 line-clamp-2"
                  >
                    {product.name}
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price Row */}
          <tr className={highlightedAttributes.includes('price') ? 'bg-primary-50' : ''}>
            <td className="p-2 border-b border-neutral-200 font-medium">Price</td>
            {products.map((product) => (
              <td key={product.id} className="p-2 border-b border-neutral-200 text-center">
                <span className="font-bold text-primary-700">
                  {formatter.formatPrice(product.price.value, product.price.currency)}
                </span>
              </td>
            ))}
          </tr>

          {/* Other Attributes */}
          {attributesList.map((attr) => (
            <tr
              key={attr}
              className={highlightedAttributes.includes(attr) ? 'bg-primary-50' : ''}
            >
              <td className="p-2 border-b border-neutral-200 font-medium capitalize">
                {attr.replace(/_/g, ' ')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="p-2 border-b border-neutral-200 text-center">
                  {renderAttributeValue(product.attributes[attr], attr)}
                </td>
              ))}
            </tr>
          ))}

          {/* Action Row */}
          <tr>
            <td className="p-2 font-medium">Action</td>
            {products.map((product) => (
              <td key={product.id} className="p-2 text-center">
                <div className="space-y-2">
                  <SfButton
                    as={Link}
                    href={`/product/${product.id}`}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    View Details
                  </SfButton>
                  <SfButton
                    size="sm"
                    variant="primary"
                    className="w-full"
                    disabled={product.attributes.availability === 'out_of_stock'}
                  >
                    Add to Cart
                  </SfButton>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {products.length > 3 && (
        <p className="text-sm text-neutral-500 mt-2 text-center">
          Showing top {products.length} products for comparison
        </p>
      )}
    </div>
  );
}

function renderAttributeValue(value: any, attribute: string): React.ReactNode {
  if (value === undefined || value === null) {
    return <span className="text-neutral-400">-</span>;
  }

  if (typeof value === 'boolean') {
    return value ? (
      <SfChip size="sm" className="bg-positive-100 text-positive-700">Yes</SfChip>
    ) : (
      <SfChip size="sm" className="bg-neutral-100 text-neutral-700">No</SfChip>
    );
  }

  if (attribute === 'rating' && typeof value === 'number') {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-lg font-bold">{value.toFixed(1)}</span>
        <span className="text-sm text-neutral-500">/ 5</span>
      </div>
    );
  }

  if (attribute === 'availability') {
    return value === 'in_stock' ? (
      <SfChip size="sm" className="bg-positive-100 text-positive-700">In Stock</SfChip>
    ) : (
      <SfChip size="sm" className="bg-negative-100 text-negative-700">Out of Stock</SfChip>
    );
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}