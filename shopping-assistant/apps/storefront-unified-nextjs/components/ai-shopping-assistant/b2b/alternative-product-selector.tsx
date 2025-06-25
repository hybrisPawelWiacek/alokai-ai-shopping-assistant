'use client';

import { useState } from 'react';
import {
  SfButton,
  SfIconCheck,
  SfIconClose,
  SfChip,
  SfRating,
} from '@storefront-ui/react';
import Image from 'next/image';
import type { NormalizedProduct } from '@vsf-enterprise/unified-api-sapcc';

interface AlternativeProductSelectorProps {
  originalSku: string;
  requestedQuantity: number;
  alternatives: NormalizedProduct[];
  onSelect: (product: NormalizedProduct, quantity: number) => void;
  onSkip: () => void;
  onCancel?: () => void;
}

export default function AlternativeProductSelector({
  originalSku,
  requestedQuantity,
  alternatives,
  onSelect,
  onSkip,
  onCancel,
}: AlternativeProductSelectorProps) {
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [quantity, setQuantity] = useState(requestedQuantity);

  const handleSelect = () => {
    if (selectedProduct) {
      onSelect(selectedProduct, quantity);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getAvailabilityColor = (available?: boolean, stock?: number) => {
    if (!available) return 'text-red-600';
    if (stock && stock < 10) return 'text-amber-600';
    return 'text-green-600';
  };

  const getAvailabilityText = (available?: boolean, stock?: number) => {
    if (!available) return 'Out of stock';
    if (stock) {
      if (stock < 10) return `Low stock (${stock} left)`;
      return `In stock (${stock}+)`;
    }
    return 'In stock';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Alternative Products for {originalSku}
        </h3>
        <p className="text-sm text-neutral-600">
          The requested product is unavailable. Please select an alternative or skip this item.
        </p>
      </div>

      <div className="grid gap-4 mb-6">
        {alternatives.map((product) => (
          <div
            key={product.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedProduct?.id === product.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setSelectedProduct(product)}
          >
            <div className="flex gap-4">
              {/* Product image */}
              <div className="w-24 h-24 flex-shrink-0 bg-neutral-100 rounded">
                {product.primaryImage ? (
                  <Image
                    src={product.primaryImage.url}
                    alt={product.primaryImage.alt || product.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      SKU: {product.sku}
                    </p>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <SfIconCheck className="text-primary-600" size="sm" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="font-semibold">
                    {formatPrice(product.price?.value?.amount)}
                  </span>
                  <span className={getAvailabilityColor(
                    product.availableForSale,
                    product.quantityAvailable
                  )}>
                    {getAvailabilityText(
                      product.availableForSale,
                      product.quantityAvailable
                    )}
                  </span>
                  {product.rating?.average && (
                    <div className="flex items-center gap-1">
                      <SfRating value={product.rating.average} size="xs" />
                      <span className="text-xs text-neutral-500">
                        ({product.rating.count})
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional attributes */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.attributes?.brand && (
                    <SfChip size="sm" className="bg-neutral-100">
                      {product.attributes.brand}
                    </SfChip>
                  )}
                  {product.attributes?.category && (
                    <SfChip size="sm" className="bg-neutral-100">
                      {product.attributes.category}
                    </SfChip>
                  )}
                  {product.price?.isDiscounted && (
                    <SfChip size="sm" className="bg-red-100 text-red-800">
                      Sale
                    </SfChip>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quantity selector */}
      {selectedProduct && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
          <label className="block text-sm font-medium mb-2">
            Quantity for {selectedProduct.name}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center hover:bg-neutral-100"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1 text-center border border-neutral-300 rounded"
              min="1"
              max={selectedProduct.quantityAvailable || 999}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded border border-neutral-300 flex items-center justify-center hover:bg-neutral-100"
              disabled={
                selectedProduct.quantityAvailable
                  ? quantity >= selectedProduct.quantityAvailable
                  : false
              }
            >
              +
            </button>
            <span className="text-sm text-neutral-600 ml-2">
              (Requested: {requestedQuantity})
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <SfButton
            variant="tertiary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </SfButton>
        )}
        <SfButton
          variant="secondary"
          onClick={onSkip}
          className="flex-1"
        >
          Skip This Item
        </SfButton>
        <SfButton
          variant="primary"
          onClick={handleSelect}
          disabled={!selectedProduct}
          className="flex-1"
        >
          Use Selected Alternative
        </SfButton>
      </div>

      {/* No alternatives message */}
      {alternatives.length === 0 && (
        <div className="text-center py-8">
          <SfIconClose className="mx-auto mb-4 text-neutral-400" size="2xl" />
          <p className="text-neutral-600">
            No alternatives found for this product.
          </p>
          <SfButton
            variant="secondary"
            onClick={onSkip}
            className="mt-4"
          >
            Skip This Item
          </SfButton>
        </div>
      )}
    </div>
  );
}