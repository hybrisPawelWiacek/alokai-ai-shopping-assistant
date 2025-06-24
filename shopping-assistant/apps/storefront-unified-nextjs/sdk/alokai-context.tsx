'use client';

import { createAlokaiContext } from '@vue-storefront/next/client';
import type { SfContract } from 'storefront-middleware/types';

import type { Sdk } from './sdk.server';

export const {
  AlokaiProvider,
  useSdk,
  useSfCartState,
  useSfCurrenciesState,
  useSfCurrencyState,
  useSfCustomerState,
  useSfLocalesState,
  useSfLocaleState,
} = createAlokaiContext<Sdk, SfContract>();
