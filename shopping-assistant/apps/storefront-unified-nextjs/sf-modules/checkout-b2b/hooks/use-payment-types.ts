import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCartMutation } from "@/hooks/cart/utils";
import { useSdk } from "@/sdk/alokai-context";

import type { InferSdkArgs } from "./types";

export function usePaymentTypes() {
  const queryClient = useQueryClient();
  const sdk = useSdk();

  const paymentTypes = useQuery({
    initialData: null,
    queryFn: () => sdk.b2bCheckout.getPaymentTypes(),
    queryKey: ["paymentTypes"],
    refetchOnWindowFocus: false,
  });

  const setPaymentType = useCartMutation(
    ["main", "setPaymentType"],
    async (params: InferSdkArgs<"replaceOrgCartPaymentType">) =>
      sdk.b2bCheckout.replaceOrgCartPaymentType(params),
    {
      onSuccess: () => {
        queryClient.removeQueries({
          queryKey: ["costCentersAddresses"],
        });
      },
    },
  );

  return {
    loading: paymentTypes.isPending || setPaymentType.isPending,
    paymentTypes,
    setPaymentType,
  };
}
