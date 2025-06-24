import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';

import { useCustomerKey } from '@/hooks';
import { useSdk, useSfCartState, useSfCustomerState } from '@/sdk/alokai-context';
import type { GetCart, GetCustomer } from '@/types';

export default function StateObserver({ children }: PropsWithChildren) {
  const sdk = useSdk();
  const [, setCustomer] = useSfCustomerState();
  const [, setCart] = useSfCartState();
  const queryClient = useQueryClient();
  const cartObserver = new QueryObserver<Awaited<ReturnType<GetCart>>>(queryClient, {
    queryFn: () => sdk.unified.getCart(),
    queryKey: ['cart', 'main'],
  });
  const customerObserver = new QueryObserver<Awaited<ReturnType<GetCustomer>>>(queryClient, {
    queryFn: () => sdk.unified.getCustomer(),
    queryKey: useCustomerKey,
  });

  useEffect(() => {
    const unsubscribeCart = cartObserver.subscribe(({ data }) => {
      setCart(data);
    });
    const unsubscribeCustomer = customerObserver.subscribe(({ data }) => {
      setCustomer(data?.customer);
    });

    return () => {
      unsubscribeCart();
      unsubscribeCustomer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
