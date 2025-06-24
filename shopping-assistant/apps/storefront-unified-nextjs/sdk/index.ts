import { cookies, headers } from 'next/headers';

import { getSdk as getUniversalSdk } from './sdk.server';

/**
 * A dedicated function to get the SDK instance on the server side.
 * You can import it in React Server Components, Middleware, Route Handlers.
 */
export const getSdk = () =>
  getUniversalSdk({
    getRequestHeaders: () => ({
      cookies: cookies(),
      headers: headers(),
    }),
  });
