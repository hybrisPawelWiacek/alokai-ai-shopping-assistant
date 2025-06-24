'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import AddToCartButton from './add-to-cart-button';
import QuantitySelector from './ui/quantity-selector';

export interface PurchaseCardFormProps {
  /**
   * Product is out of stock
   */
  isOutOfStock: boolean;
  /**
   * Maximum purchasable product quantity
   */
  maxProductQuantity?: number;
  /**
   * Minimum purchasable product quantity
   */
  minProductQuantity: number;
  /**
   * Product ID
   */
  productId: string;
  /**
   * Product SKU
   */
  sku: null | string;
}

export default function PurchaseCardForm({
  isOutOfStock,
  maxProductQuantity,
  minProductQuantity,
  productId,
  sku,
}: PurchaseCardFormProps) {
  const t = useTranslations();

  const [productQuantity, setProductQuantity] = useState<number>(minProductQuantity);

  useEffect(() => {
    setProductQuantity(minProductQuantity);
  }, [sku, minProductQuantity]);

  return (
    <div className="flex flex-col flex-wrap gap-4 md:flex-row">
      <QuantitySelector
        className="min-w-[145px] flex-shrink-0 flex-grow basis-0"
        disabled={isOutOfStock}
        maxValue={maxProductQuantity}
        minValue={minProductQuantity}
        onChange={setProductQuantity}
        showPlaceholder={isOutOfStock}
        size="lg"
        value={productQuantity}
      >
        {!isOutOfStock && maxProductQuantity != null && (
          <div className="mt-1 text-center text-xs font-normal" data-testid="quantity-selector-stock">
            {t.rich('PurchaseCardForm.numberInStock', {
              number: (chunks) => <span className="font-medium">{chunks}</span>,
              value: maxProductQuantity,
            })}
          </div>
        )}
      </QuantitySelector>
      <AddToCartButton
        className="h-full flex-shrink flex-grow-[2] basis-auto whitespace-nowrap capitalize"
        disabled={isOutOfStock}
        productId={productId}
        quantity={productQuantity}
        size="lg"
        sku={sku}
      >
        {t('AddToCartButton.label')}
      </AddToCartButton>
    </div>
  );
}
