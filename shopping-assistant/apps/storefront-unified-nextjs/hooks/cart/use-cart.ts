import { useContext } from 'react';

import { CartContext } from '@/components/providers';

/**
 * @description Hook for getting the cart query object. Cart will be fetched when it is called first time.
 *
 * @returns An query object (a `UseQueryResult` from `react-query`) containing the loading and error states.
 *
 * @throws If used outside of the CartProvider.
 *
 * @example
 * const { isFetching, error } = useCart();
 */
export function useCart() {
  const result = useContext(CartContext);

  if (!result) {
    throw new Error('useCart must be used within CartProvider');
  }

  return result;
}
