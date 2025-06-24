'use client';

import { SfLoaderCircular } from '@storefront-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useRouter } from '@/config/navigation';
import { useCart, useCustomer } from '@/hooks';
import { useSfCartState, useSfCustomerState } from '@/sdk/alokai-context';
import type { SfOrder } from '@/types';

import Checkout from './checkout';

export default function CheckoutClient() {
  const { replace } = useRouter();
  const [cart] = useSfCartState();
  const { isPending: isCartLoading } = useCart();
  const { isPending: isCustomerLoading } = useCustomer();
  const [customer] = useSfCustomerState();
  const queryClient = useQueryClient();

  const order = queryClient.getQueryData<SfOrder>(['order', 'confirmation']);
  const isEmpty = !cart?.lineItems.length;
  const isLoading = isCartLoading || isCustomerLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!customer) {
        replace('/login');
        // order data is only available during SPA navigation
      } else if (isEmpty && !order) {
        replace('/cart');
      }
    }
  }, [customer, isLoading, isEmpty, replace, order]);

  return (
    <>
      {!isEmpty && customer ? (
        <Checkout />
      ) : (
        <div className="my-40 flex h-24 w-full justify-center">
          <SfLoaderCircular size="3xl" />
        </div>
      )}
    </>
  );
}
