'use client';
import type { SfButtonProps } from '@storefront-ui/react';
import { SfButton, SfIconShoppingCart } from '@storefront-ui/react';

import { useAddCartLineItem } from '@/hooks';
import type { Maybe } from '@/types';

export interface AddToCartButtonProps extends SfButtonProps {
  /**
   * Product ID
   */
  productId: string;
  /**
   * Quantity of the product
   */
  quantity?: number;
  /**
   * SKU of the product
   */
  sku?: Maybe<string>;
}

export default function AddToCartButton({
  children,
  disabled,
  productId,
  quantity,
  sku = null,
  ...rest
}: AddToCartButtonProps) {
  const addToCart = useAddCartLineItem({ productId, sku });

  return (
    <SfButton
      data-testid="add-to-cart-button"
      disabled={addToCart.isPending || disabled}
      onClick={() => addToCart.mutate({ quantity })}
      slotPrefix={<SfIconShoppingCart size="sm" />}
      {...rest}
    >
      {children}
    </SfButton>
  );
}
