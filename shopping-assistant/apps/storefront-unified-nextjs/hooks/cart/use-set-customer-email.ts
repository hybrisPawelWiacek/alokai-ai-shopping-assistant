import { useSdk } from '@/sdk/alokai-context';
import type { SetCustomerEmailArgs } from '@/types';

import { cartNotificationKey, useCartMutation } from './utils';

/**
 * @description Hook for updating an customer's email address in the cart.
 *
 * @returns A mutation object (from react-query) with function (`mutate`) to set the customer email for the cart.
 *
 * @example
 * const setCustomerEmail = useSetCustomerEmail();
 * setCustomerEmail.mutate({ shippingAddress: { ... } });
 */
export function useSetCustomerEmail() {
  const sdk = useSdk();

  return useCartMutation(
    ['main', 'setCustomerEmail'],
    async (params: SetCustomerEmailArgs) => sdk.unified.setCustomerEmail(params),
    {
      meta: cartNotificationKey('updateCart'),
    },
  );
}
