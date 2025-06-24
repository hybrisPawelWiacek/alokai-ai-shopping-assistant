import { useQueryClient } from '@tanstack/react-query';

import { useSdk } from '@/sdk/alokai-context';
import type { SetCartAddressArgs } from '@/types';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for updating an shipping address in the cart.
 *
 * @returns An object containing the `setShippingAddress` mutation object (from `react-query`).
 *
 * @example
 * const setShippingAddress = useSetCartAddress();
 * setShippingAddress.mutate({ shippingAddress: { ... } });
 */
export function useSetCartAddress() {
  const queryClient = useQueryClient();
  const sdk = useSdk();

  return useCartMutation(
    ['main', 'setCartAddress', 'shipping'],
    async (params: SetCartAddressArgs) => sdk.unified.setCartAddress(params),
    {
      meta: cartNotificationKey('updateCart'),
      onSuccess: () => {
        // @TODO invalidate shipping method from cart
        queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
      },
    },
  );
}
