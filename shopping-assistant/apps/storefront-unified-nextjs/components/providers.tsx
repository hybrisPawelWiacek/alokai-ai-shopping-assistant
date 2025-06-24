'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { CreateSdkOptions } from '@vue-storefront/next';
import { createSdk } from '@vue-storefront/next';
import { useLocale, useTranslations } from 'next-intl';
import { createContext, type PropsWithChildren, useState } from 'react';

import StateObserver from '@/components/state-observer';
import { useNotification } from '@/hooks';
import { locales } from '@/i18n';
import { AlokaiProvider, useSdk } from '@/sdk/alokai-context';
import { getSdkConfig } from '@/sdk/config';
import type { GetCurrencies, SfCart, SfLocale, UnsafeUseTranslations } from '@/types';

export interface ProvidersProps extends PropsWithChildren {
  /**
   * Initial currency data to use for the Alokai provider.
   */
  initialCurrency: Awaited<ReturnType<GetCurrencies>>;
  /**
   * Options for creating the SDK instance on client-side.
   */
  sdkOptions: CreateSdkOptions;
}

export default function Providers({ children, initialCurrency, sdkOptions }: ProvidersProps) {
  const { getSdk } = createSdk(sdkOptions, getSdkConfig());
  const locale = useLocale();

  return (
    <AlokaiProvider
      initialData={{
        currencies: initialCurrency.currencies,
        currency: initialCurrency.currentCurrency,
        locale: locale as SfLocale,
        locales: locales as SfLocale[],
      }}
      sdk={getSdk()}
    >
      <TanstackQueryProvider>
        <CartProvider>
          <StateObserver>{children}</StateObserver>
        </CartProvider>
      </TanstackQueryProvider>
    </AlokaiProvider>
  );
}

function TanstackQueryProvider({ children }: PropsWithChildren) {
  const t = useTranslations(
    'Notifications.NotificationAlert',
  ) as UnsafeUseTranslations<'Notifications.NotificationAlert'>;

  const notification = useNotification();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: 3,
            retryDelay: (failureCount) => 500 * 2 ** failureCount,
          },
        },
        mutationCache: new MutationCache({
          onError(error, _variables, _context, mutation) {
            const skipNotification = mutation.meta?.skipErrorNotification?.(error);
            if (skipNotification) {
              return;
            }

            if (mutation.meta?.notificationKey) {
              notification.error(t(`error.${mutation.meta.notificationKey}`), mutation.meta.notificationKey);
            } else {
              notification.error(t('error.default'));
            }
          },
          onSuccess(data, _variables, _context, mutation) {
            /*
             * Handle GQL errors, which are returned as 200 responses with an error message
             */
            if (!!data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
              throw new Error(data.message);
            }
            if (mutation.meta?.notificationKey) {
              notification.success(t(`success.${mutation.meta.notificationKey}`), mutation.meta.notificationKey);
            }
          },
        }),
        queryCache: new QueryCache({
          onError() {
            notification.error(t('error.default'));
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      {children}
    </QueryClientProvider>
  );
}

export const CartContext = createContext<null | UseQueryResult<SfCart, unknown>>(null);

function CartProvider({ children }: PropsWithChildren) {
  const sdk = useSdk();
  const result = useQuery({
    initialDataUpdatedAt: 0,
    queryFn: () => sdk.unified.getCart(),
    queryKey: ['cart', 'main'],
    refetchOnWindowFocus: true,
    staleTime: Infinity,
  });

  return <CartContext.Provider value={result}>{children}</CartContext.Provider>;
}
