import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  clientsClaim: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        matcher({ request }) {
          return request.destination === 'document';
        },
        url: '/offline',
      },
      {
        matcher({ request }) {
          return request.destination === 'image';
        },
        url: '/images/fallback.webp',
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: defaultCache,
  skipWaiting: true,
});

serwist.addEventListeners();
