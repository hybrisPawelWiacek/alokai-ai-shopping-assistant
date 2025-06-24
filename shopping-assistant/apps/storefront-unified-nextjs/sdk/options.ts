import { resolveSdkOptions } from '@vue-storefront/next';
import { env } from 'next-runtime-env';

export function getSdkOptions() {
  const apiUrl = env('NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL') ?? '';
  const ssrApiUrl = env('NEXT_PUBLIC_ALOKAI_MIDDLEWARE_SSR_API_URL');
  const cdnCacheBustingId =
    env('NEXT_PUBLIC_ALOKAI_MIDDLEWARE_CDN_CACHE_BUSTING_ID') ?? env('GIT_SHA') ?? 'no-cache-busting-id-set';
  const isMultiStoreEnabled = env('NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED') === 'true';
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL is required to run the app');
  }

  const options = resolveSdkOptions({
    middleware: {
      apiUrl,
      cdnCacheBustingId,
      ssrApiUrl,
    },
    multistore: {
      enabled: isMultiStoreEnabled,
    },
  });

  return options;
}
