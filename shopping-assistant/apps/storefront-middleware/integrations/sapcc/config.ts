import { AUTH_USER_TOKEN_COOKIE_NAME, type MiddlewareConfig } from '@vsf-enterprise/sapcc-api';
import type { ApiClientExtension, Integration } from '@vue-storefront/middleware';
import { multistoreExtensionFactory } from '../../multistore/utils';
import { cdnExtension, unifiedApiExtension, customExtension } from './extensions';
import { b2bCheckoutExtensionFactory } from '@sf-modules-middleware/checkout-b2b';

const {
  IS_MULTISTORE_ENABLED,
  NODE_ENV,
  SAPCC_API_URI,
  SAPCC_OAUTH_CLIENT_ID,
  SAPCC_OAUTH_CLIENT_SECRET,
  SAPCC_OAUTH_TOKEN_ENDPOINT,
  SAPCC_OAUTH_TOKEN_REVOKE_ENDPOINT,
  SAPCC_OAUTH_URI
} = process.env;

if (!SAPCC_OAUTH_URI)
  throw new Error('Missing env var: SAPCC_OAUTH_URI');

if (!SAPCC_OAUTH_CLIENT_ID)
  throw new Error('Missing env var: SAPCC_OAUTH_CLIENT_ID');

if (!SAPCC_OAUTH_CLIENT_SECRET)
  throw new Error('Missing env var: SAPCC_OAUTH_CLIENT_SECRET');

if (!SAPCC_OAUTH_TOKEN_ENDPOINT)
  throw new Error('Missing env var: SAPCC_OAUTH_TOKEN_ENDPOINT');

if (!SAPCC_OAUTH_TOKEN_REVOKE_ENDPOINT)
  throw new Error('Missing env var: SAPCC_OAUTH_TOKEN_REVOKE_ENDPOINT');

if (!SAPCC_API_URI)
  throw new Error('Missing env var: SAPCC_API_URI');

export const config = {
  configuration: {
    api: {
      baseSiteId: 'powertools-spa',
      catalogId: 'powertoolsProductCatalog',
      catalogVersion: 'Online',
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      uri: SAPCC_API_URI
    },

    OAuth: {
      clientId: SAPCC_OAUTH_CLIENT_ID,
      clientSecret: SAPCC_OAUTH_CLIENT_SECRET,

      cookieOptions: NODE_ENV === 'development' ? {
        [AUTH_USER_TOKEN_COOKIE_NAME]: {
          sameSite: 'none'
        }
      } : {},

      tokenEndpoint: SAPCC_OAUTH_TOKEN_ENDPOINT,
      tokenRevokeEndpoint: SAPCC_OAUTH_TOKEN_REVOKE_ENDPOINT,
      uri: SAPCC_OAUTH_URI
    }
  },

  extensions: (extensions: ApiClientExtension[]) => [
    ...extensions,
    unifiedApiExtension,
    cdnExtension,
    ...(IS_MULTISTORE_ENABLED === 'true' ? [multistoreExtensionFactory()] : []),
    customExtension,
    b2bCheckoutExtensionFactory()
  ],

  location: '@vsf-enterprise/sapcc-api/server'
} satisfies Integration<Config>;

export type Config = MiddlewareConfig;