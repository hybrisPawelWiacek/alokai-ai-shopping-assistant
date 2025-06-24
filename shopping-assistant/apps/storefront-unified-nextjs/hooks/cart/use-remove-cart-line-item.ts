import { useSdk, useSfCartState } from '@/sdk/alokai-context';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for removing a cart line item from the cart.
 *
 * @param lineItemId - ID of the line item to remove.
 *
 * @returns A mutation object (from react-query) with function (`mutate`) to remove the line item from the cart.
 *
 * @example
 * const removeCartLineItem = useRemoveCartLineItem(lineItemId);
 * removeCartLineItem.mutate();
 */
export function useRemoveCartLineItem(lineItemId: string) {
  const [cart] = useSfCartState();
  const sdk = useSdk();

  return useCartMutation(
    ['main', 'removeCartLineItem', lineItemId],
    async () => {
      const lineItem = cart?.lineItems.find((item) => item.id === lineItemId);

      if (!lineItem) {
        return null;
      }

      return sdk.unified.removeCartLineItem({
        lineItemId,
      });
    },
    {
      meta: cartNotificationKey('updateCart'),
    },
  );
}
