import { useQuery } from '@tanstack/react-query';

import { useSdk, useSfCartState } from '@/sdk/alokai-context';
import type { SetShippingMethodArgs } from '@/types';

import { useCartMutation } from './utils';

/**
 * @description Hook for fetching shipping methods & updating shipping method in the cart.
 *
 * @returns An object with `shippingMethods` and `setShippingMethod` properties.
 *
 * @example
 * const { shippingMethods, setShippingMethod } = useCartShippingMethods();
 * setShippingMethod({ shippingMethodId: '1' });
 */
export function useCartShippingMethods() {
  const [cart] = useSfCartState();
  const sdk = useSdk();

  const shippingMethods = useQuery({
    enabled: !!cart?.shippingAddress,
    initialData: null,
    queryFn: async () => sdk.unified.getAvailableShippingMethods(),
    queryKey: ['shippingMethods'],
    refetchOnWindowFocus: false,
  });

  const setShippingMethod = useCartMutation(['main', 'setShippingMethod'], async (params: SetShippingMethodArgs) =>
    sdk.unified.setShippingMethod(params),
  );

  return {
    setShippingMethod,
    shippingMethods,
  };
}
