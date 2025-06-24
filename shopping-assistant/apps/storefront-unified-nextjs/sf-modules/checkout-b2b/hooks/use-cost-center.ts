import { useQuery } from "@tanstack/react-query";

import { useCartMutation } from "@/hooks/cart/utils";
import { useSdk } from "@/sdk/alokai-context";

import type { InferSdkArgs } from "./types";

export function useCostCenter() {
  const sdk = useSdk();

  const costCenters = useQuery({
    queryFn: () => sdk.b2bCheckout.getActiveCostCenters(),
    queryKey: ["costCenters"],
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const setCostCenter = useCartMutation(
    ["main", "setCostCenter"],
    async (params: InferSdkArgs<"replaceOrgCartCostCenter">) =>
      sdk.b2bCheckout.replaceOrgCartCostCenter(params),
  );

  return {
    costCenters,
    setCostCenter,
  };
}
