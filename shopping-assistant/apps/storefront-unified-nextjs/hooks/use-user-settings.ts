'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setCookie } from 'cookies-next';
import { useParams, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { CURRENCY_COOKIE } from '@/config/constants';
import { usePathname, useRouter } from '@/config/navigation';
import { useSdk, useSfCurrencyState, useSfLocaleState } from '@/sdk/alokai-context';
import type { SfLocale } from '@/types';

/**
 * @description Hook for setting user preferences like currency and locale.
 *
 * @returns {setCurrentCurrency, setCurrentLocale}
 *
 * @example
 * const { setCurrentCurrency } = useLocation();
 * setCurrentCurrency('USD');
 *
 * @example
 * const { setCurrentLocale } = useLocation();
 * setCurrentLocale('de');
 *
 */
export function useUserSettings() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const query = useSearchParams();
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const [, setCurrency] = useSfCurrencyState();
  const [, setLocale] = useSfLocaleState();
  const currencies = useQuery({
    enabled: false,
    queryFn: () => sdk.unified.getCurrencies(),
    queryKey: ['settings', 'currencies'],
  });
  const setCurrentCurrency = (value: string) => {
    setCookie(CURRENCY_COOKIE, value, {
      sameSite: 'strict',
      secure: true,
    });
    currencies.refetch();
    queryClient.removeQueries({
      queryKey: ['lazyProduct'],
      type: 'active',
    });
    setCurrency(value);
  };

  const [_isChangingLocation, startTransition] = useTransition();
  const setCurrentLocale = async (value: SfLocale) => {
    startTransition(() => {
      const queryWithoutModal = new URLSearchParams(query);
      queryWithoutModal.delete('user-settings-modal');

      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { params: { slugs: [], ...params }, pathname, query: Object.fromEntries(queryWithoutModal) },
        { locale: value },
      );
      router.refresh();
      setLocale(value);
    });
  };

  return { setCurrentCurrency, setCurrentLocale };
}
