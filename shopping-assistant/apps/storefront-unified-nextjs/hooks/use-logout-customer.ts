import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { usePathname, useRouter } from '@/config/navigation';
import { useSdk } from '@/sdk/alokai-context';

interface UseLogoutCustomerArgs {
  onSuccess?: () => void;
  skipNotifications?: boolean;
}

/**
 * @description Hook for logging out a customer.
 *
 * @param options - The options to configure the hook.
 * @param options.onSuccess - A function to be called when the customer is successfully logged out.
 * @param options.skipNotifications - A flag to skip showing notifications.
 *
 * @returns A mutation object (from react-query) with function (`mutate`) to logs out the customer.
 *
 * @example
 * ```ts
 * const logoutCustomer = useLogoutCustomer();
 * logoutCustomer.mutate();
 * ```
 */
export function useLogoutCustomer({ onSuccess, skipNotifications }: UseLogoutCustomerArgs = {}) {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // https://github.com/TanStack/query/issues/2304
  const isPending = useMutationState({
    filters: {
      mutationKey: ['logout'],
    },
    select: (mutation) => mutation.state.status === 'pending',
  }).some(Boolean);

  const mutation = useMutation({
    meta: skipNotifications ? undefined : { notificationKey: 'logout' },
    mutationFn: () => sdk.unified.logoutCustomer(),
    mutationKey: ['logout'],
    onSuccess: () => {
      const isMyAccountPage = [/\/my-account.*$/].some((pattern) => pattern.test(pathname));
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      onSuccess?.();

      if (isMyAccountPage) {
        router.push('/login');
      }
    },
    retry: false,
  });

  return {
    ...mutation,
    isPending,
  };
}
