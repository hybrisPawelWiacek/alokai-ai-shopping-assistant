import { useQuery } from '@tanstack/react-query';

import { useSdk, useSfCartState } from '@/sdk/alokai-context';

export function useCostCenterAddresses() {
  const [cart] = useSfCartState();
  const sdk = useSdk();

  const costCenterAddresses = useQuery({
    enabled: false,
    initialData: null,
    queryFn: async () => {
      if (!cart?.$custom?.costCenter?.code) {
        return Promise.resolve([]);
      }
      return sdk.b2bCheckout.getCostCenterAddresses({
        costCenterCode: cart.$custom?.costCenter.code,
      });
    },
    queryKey: ['costCentersAddresses'],
    refetchOnWindowFocus: false,
  });

  return {
    costCenterAddresses,
  };
}
