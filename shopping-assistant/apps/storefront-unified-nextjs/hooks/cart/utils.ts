import {
  type MutationFilters,
  type MutationFunction,
  type QueryKey,
  useIsMutating,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import { notificationKey } from '@/helpers';
import type { Maybe, SfCart } from '@/types';

export interface CartName {
  /**
   * Represents the main cart.
   */
  main: true;
}

export const cartNotificationKey = notificationKey('cart');

export class CartUpdateConcurrencyError extends Error {
  public constructor() {
    super('Cart has been already updated by another action.');
  }
}

type IsCartMutatingFilters = { mutationKey?: QueryKey } & MutationFilters;

function isCartResponse(data: unknown): data is SfCart {
  return typeof data === 'object' && data !== null && 'lineItems' in data && data.lineItems !== undefined;
}

/**
 * @description
 * Returns the number of active mutations for the cartUpdate mutation and
 * any additional mutation keys provided.
 *
 * @param filters An optional object containing filters to pass to the `useIsMutating` hook.
 *
 * @returns The number of active mutations.
 */
export function useIsCartMutating(filters: IsCartMutatingFilters = { mutationKey: [] }): number {
  const { mutationKey = [], ...restFilters } = filters;
  return useIsMutating({ mutationKey: ['cartUpdate', ...mutationKey], ...restFilters });
}

/**
 * @description A custom hook that provides a mutation function for updating the cart data.
 *
 * @template TData The expected shape of the mutation response data.
 * @template TError The expected shape of the mutation error.
 * @template TVariables The expected shape of the mutation variables.
 *
 * @param mutationKey The key for the mutation. Cart name should be specified as the first item.
 * @param mutationFn The mutation function to be executed.
 * @param options Additional options for the mutation.
 *
 * @returns The result of the mutation.
 *
 * @example
 * const { mutate } = useCartMutation(
 *   ['main', 'addCartLineItem', product],
 *   async (params: Omit<AddCartLineItemArgs, 'productId' | 'sku'>) => {
 *     return sdk.unified.addCartLineItem({ ...product, ...params });
 *   },
 *   {
 *     meta: cartNotificationKey('addToCart'),
 *   },
 * );
 */
export function useCartMutation<TData = unknown, TError = unknown, TVariables = void>(
  mutationKey: [`${keyof CartName}`, ...unknown[]] & QueryKey,
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, unknown>, 'mutationFn' | 'mutationKey'>,
): UseMutationResult<TData, TError, TVariables, unknown> {
  const cartName = mutationKey[0];
  const activeParallelCalls =
    useIsCartMutating({ mutationKey: [cartName] }) - useIsCartMutating({ exact: true, mutationKey });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (...args) => {
      if (activeParallelCalls >= 1) {
        return Promise.reject(new CartUpdateConcurrencyError());
      }
      return mutationFn(...args);
    },
    mutationKey: ['cartUpdate', ...mutationKey],
    ...options,
    onSuccess: (data, variables, context) => {
      if (isCartResponse(data)) {
        queryClient.setQueryData(['cart', cartName], data);
      }
      options?.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * @description Asserts that a cart is available. Throws an error if the cart is undefined.
 *
 * @param cart - The cart to check.
 *
 * @throws An error if the cart is undefined.
 */
export function assertIsCartAvailable(cart: Maybe<SfCart> | undefined): asserts cart is SfCart {
  if (!cart) {
    throw new Error('Cart is not available');
  }
}
