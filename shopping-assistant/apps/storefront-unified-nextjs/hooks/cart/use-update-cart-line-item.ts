import { useSdk } from '@/sdk/alokai-context';
import type { UpdateCartLineItemArgs } from '@/types';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for updating a cart line item in the cart.
 *
 * @param lineItemId - The ID of the line item to update.
 *
 * @returns A mutation object (from react-query) with function (`mutate`) to update the line item in the cart.
 *
 * @example
 * const updateCartLineItem = useUpdateCartLineItem({ lineItemId });
 * updateCartLineItem.mutate({ quantity: 2 });
 */
export function useUpdateCartLineItem(lineItemId: string) {
  const sdk = useSdk();

  return useCartMutation(
    ['main', 'updateCartLineItem', lineItemId],
    async (params: Omit<UpdateCartLineItemArgs, 'lineItemId'>) =>
      sdk.unified.updateCartLineItem({ lineItemId, ...params }),
    {
      meta: cartNotificationKey('updateCart'),
    },
  );
}
