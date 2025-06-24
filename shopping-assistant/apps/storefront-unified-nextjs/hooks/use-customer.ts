import { useQuery } from '@tanstack/react-query';

import { useSdk } from '@/sdk/alokai-context';

export const useCustomerKey = ['customer'];

/**
 * @description Hook that retrieves the current customer data from the SDK (on the first invoke) and
 * stores in the global state.
 *
 * @returns An query object (a `UseQueryResult` from `react-query`) containing the loading and error states.
 *
 * @example
 * const { isFetching, error } = useCustomer();
 */
export function useCustomer() {
  const sdk = useSdk();

  const customerQuery = useQuery({
    queryFn: () => sdk.unified.getCustomer(),
    queryKey: useCustomerKey,
    refetchOnWindowFocus: true,
    staleTime: 5 * 1000,
  });

  return customerQuery;
}
