import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { env } from 'next-runtime-env';
import { match } from 'path-to-regexp';

import { LOCALE_COOKIE } from './config/constants';
import { pathnames } from './config/navigation';
import { defaultLocale, localePrefix, locales } from './i18n';
import { getSdk } from './sdk';

// https://next-intl-docs.vercel.app/docs/routing/middleware
const i18nMiddleware = createMiddleware({
  defaultLocale,
  localeDetection: false,
  localePrefix,
  locales,
  pathnames,
});

/**
 * Set Cache-Control headers based on the middleware pathname
 *
 * @param matchers - A record of pathnames and their Cache-Control headers
 *
 * @returns A middleware function that sets the Cache-Control header based on the pathname
 *
 * Read more details on building matchers in {@link https://github.com/pillarjs/path-to-regexp path-to-regexp} documentation.
 */
const cacheControlMiddleware = cacheControl({
  matchers: {
    '/cart': 'private, no-store, no-cache',
    '/checkout': 'private, no-store, no-cache',
    '/login': 'private, no-store, no-cache',
    '/my-account/:path*': 'private, no-store, no-cache',
    '/register': 'private, no-store, no-cache',
  },
});

export default async function middleware(request: NextRequest) {
  let response = i18nMiddleware(request);

  const locale = response.headers.get('x-middleware-request-x-next-intl-locale') || defaultLocale;

  // set cookie for the upcoming request
  request.cookies.set(LOCALE_COOKIE, locale);
  // set cookie for the response, to be used in the browser
  response.cookies.set(LOCALE_COOKIE, locale);

  const authRedirectPath = await getAuthRedirectPath(request);
  if (authRedirectPath) {
    response = NextResponse.redirect(new URL(`/${locale}${authRedirectPath}`, request.nextUrl));
  }

  // Set Cache-Control headers based on the pathname
  const defaultCacheControl = env('NEXT_DEFAULT_HTML_CACHE_CONTROL');
  response = cacheControlMiddleware(request, response, defaultCacheControl);

  return response;
}

export const config = {
  // Match pathnames without static assets and API routes
  matcher: ['/((?!api|_next|images|icons|.*\\..*).*)'],
  unstable_allowDynamic: [
    // supress https://nextjs.org/docs/messages/edge-dynamic-code-evaluation error for modules
    '**/node_modules/reflect-metadata/**',
  ],
};

function cacheControl({ matchers = {} }: { matchers: Record<string, string> }) {
  return (request: NextRequest, response: NextResponse, defaultCacheControl?: string) => {
    Object.entries(matchers).forEach(([rule, headerValue]: [string, string]): void => {
      // Match the URL pathname with the rule
      const urlMatch = match(rule, {
        decode: decodeURIComponent,
      });
      // Skip if the rule doesn't match
      if (!urlMatch(request.nextUrl.pathname)) {
        return;
      }

      // Set the Cache-Control header based on the rule
      response.headers.set('Cache-Control', headerValue);
    });

    if (!response.headers.get('Cache-Control') && defaultCacheControl) {
      // Set the default Cache-Control header if no rule matched
      response.headers.set('Cache-Control', defaultCacheControl);
    }
    return response;
  };
}

async function getAuthRedirectPath(request: NextRequest) {
  const sdk = getSdk();
  const checkIsLoggedIn = () => sdk.unified.getCustomer().then(({ customer }) => !!customer);
  const { pathname } = request.nextUrl;
  let redirectPath: string | undefined;

  // Redirect to my-account if the user is logged in and tries to access login or register page
  if (isPathForNotLoggedInCustomer(pathname) && (await checkIsLoggedIn())) {
    redirectPath = '/my-account';
  }

  // Redirect to login if the user is not logged in and tries to access protected pages
  if (isProtectedPath(pathname) && !(await checkIsLoggedIn())) {
    redirectPath = '/login';
  }

  return redirectPath;
}

function isPathForNotLoggedInCustomer(path: string) {
  return ['/login', '/register'].some((p) => p.endsWith(path));
}

function isProtectedPath(path: string) {
  const protectedPaths = [/\/my-account.*$/];

  return protectedPaths.some((pattern) => pattern.test(path));
}
