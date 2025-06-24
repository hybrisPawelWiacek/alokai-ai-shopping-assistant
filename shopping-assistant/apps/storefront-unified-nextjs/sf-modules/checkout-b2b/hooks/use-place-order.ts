import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "@/config/navigation";
import { useSdk } from "@/sdk/alokai-context";

/**
 * @description Hook for finalizing checkout and placing order.
 * It supports two payment methods: credit card and account.
 * In order to handle cart payment type, payment details are required.
 * For account payment type omit payment details.
 * It also supports terms and conditions check, those needs to be accepted by the user.
 * @example
 * const placeOrder = usePlaceOrder();
   // cart payment type
   placeOrder.mutate({
     paymentDetails: { billingAddress: {...}, payload: { ... }}
     termsChecked: true
   })
   // account payment type
   placeOrder.mutate({ termsChecked: true })
 */

export function usePlaceOrder() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const { push } = useRouter();

  return useMutation({
    mutationFn: sdk.b2bCheckout.createOrder,
    onError: () => {
      push("/order/failed");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["order", "confirmation"], data);
      push("/order/success");
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
}
