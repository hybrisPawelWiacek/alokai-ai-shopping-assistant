import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSdk } from '@/sdk/alokai-context';
import type { GetCustomerAddresses } from '@/types';

const addressQueryKey = ['customer', 'shippingDetails'];

type CustomerAddressResponse = Awaited<ReturnType<GetCustomerAddresses>>;

/**
 * @description Hook that provides functionality for managing customer addresses.
 *
 * @returns An object containing the following properties:
 * - `list`: A query object containing the list of customer addresses.
 * - `create`: A mutation object (from react-query) with function (`mutate`) to creating a new customer address.
 * - `update`: A mutation object (from react-query) with function (`mutate`) to updating an existing customer address.
 * - `remove`: A mutation object (from react-query) with function (`mutate`) to deleting a customer address.
 * - `isLoading`: A boolean indicating whether any of the mutation functions are currently loading.
 *
 * @example
 * const { list, isLoading } = useCustomerAddress();
 * const { data: addresses } = list;
 *
 * @example
 * const { create } = useCustomerAddress();
 * create.mutate({ address: { ... } });
 *
 * @example
 * const { update } = useCustomerAddress();
 * update.mutate({ id: '1', address: { ... } });
 *
 * @example
 * const { remove } = useCustomerAddress();
 * remove.mutate({ id: '1' });
 */
export function useCustomerAddresses() {
  const queryClient = useQueryClient();
  const sdk = useSdk();
  const list = useQuery({
    queryFn: () => sdk.unified.getCustomerAddresses(),
    queryKey: addressQueryKey,
    refetchOnWindowFocus: false,
    retry: false,
    select: ({ addresses }) => addresses,
    staleTime: Infinity,
  });

  const updateAddresses = (updater: (oldResponse: CustomerAddressResponse) => CustomerAddressResponse) =>
    queryClient.setQueryData(addressQueryKey, (oldData?: CustomerAddressResponse) => {
      return updater({ addresses: oldData?.addresses ?? [] });
    });

  const create = useMutation({
    meta: {
      notificationKey: 'address.createAddress',
    },
    mutationFn: sdk.unified.createCustomerAddress,
    onSuccess(data) {
      updateAddresses(({ addresses }) => ({ addresses: [...addresses, data.address] }));
    },
    retry: false,
  });

  const update = useMutation({
    meta: {
      notificationKey: 'address.updateAddress',
    },
    mutationFn: sdk.unified.updateCustomerAddress,
    onSuccess(data) {
      updateAddresses(({ addresses }) => {
        const newAddresses = [...addresses];
        const updatedElementIndex = addresses.findIndex((element) => element.id === data.address.id);
        newAddresses.splice(updatedElementIndex, 1, data.address);

        return { addresses: newAddresses };
      });
    },
    retry: false,
  });

  const remove = useMutation({
    meta: {
      notificationKey: 'address.deleteAddress',
    },
    mutationFn: sdk.unified.deleteCustomerAddress,
    onSuccess(_data, variables) {
      updateAddresses(({ addresses }) => ({ addresses: addresses.filter((address) => address.id !== variables.id) }));
    },
  });

  return {
    create,
    isLoading: list.isLoading || create.isPending || update.isPending || remove.isPending,
    list,
    remove,
    update,
  };
}
