import { useSdk } from '@/sdk/alokai-context';
import type { AddCartLineItemArgs } from '@/types';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for adding a cart line item to the cart.
 *
 * @param product - The product to add to the cart.
 * @param product.productId - The unique identifier of the product.
 * @param product.sku - The SKU of the product (can be null).
 *
 * @returns A mutation object (from react-query) with function (`mutate`) to adding a line item to the cart.
 *
 * @example
 * const addCartLineItem = useAddCartLineItem({ productId, sku });
 * addCartLineItem.mutate({ quantity: 2 });
 * addCartLineItem.mutate(); // takes quantity: 1 as default
 */
export function useAddCartLineItem(product: Pick<AddCartLineItemArgs, 'productId' | 'sku'>) {
  const sdk = useSdk();

  return useCartMutation(
    ['main', 'addCartLineItem', product],
    async (params: Omit<AddCartLineItemArgs, 'productId' | 'sku'>) => {
      return sdk.unified.addCartLineItem({ ...product, ...params });
    },
    {
      meta: cartNotificationKey('addToCart'),
    },
  );
}
