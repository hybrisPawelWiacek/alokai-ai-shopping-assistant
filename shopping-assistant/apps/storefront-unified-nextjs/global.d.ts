import '@tanstack/react-query';

import type lang from './lang/en';

interface CustomMeta extends Record<string, unknown> {
  notificationKey?: string;
  skipErrorNotification?: (error: unknown) => boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: CustomMeta;
    queryMeta: CustomMeta;
  }
}

type Messages = ReturnType<typeof lang>;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
