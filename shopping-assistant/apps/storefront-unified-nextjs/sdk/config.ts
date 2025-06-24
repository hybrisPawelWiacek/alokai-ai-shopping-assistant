import { contentfulModule } from '@vsf-enterprise/contentful-sdk';
import { defineSdkConfig } from '@vue-storefront/next';
import type {
  B2BCheckoutEndpoints,
  CommerceEndpoints,
  ContentfulEndpoints,
  CustomEndpoints,
  UnifiedCmsEndpoints,
  UnifiedEndpoints,
} from 'storefront-middleware/types';

export function getSdkConfig() {
  return defineSdkConfig(({ buildModule, config, getRequestHeaders, middlewareModule }) => ({
    b2bCheckout: buildModule(middlewareModule<B2BCheckoutEndpoints>, {
      apiUrl: `${config.middlewareUrl}/commerce/b2b-checkout`,
      cdnCacheBustingId: config.cdnCacheBustingId,

      defaultRequestConfig: {
        headers: getRequestHeaders(),
      },
    }),

    /**
     * `sdk.commerce` allows you to call the raw eCommerce API endpoints.
     * It doesn't return unified data, but the raw data from your eCommerce backend.
     * By default, the Alokai Starter doesn't use this module, but you can use it to call the raw API endpoints.
     */
    commerce: buildModule(middlewareModule<CommerceEndpoints>, {
      apiUrl: `${config.middlewareUrl}/commerce`,
      cdnCacheBustingId: config.cdnCacheBustingId,

      defaultRequestConfig: {
        headers: getRequestHeaders(),
      },
    }),

    contentful: buildModule(contentfulModule<ContentfulEndpoints>, {
      apiUrl: `${config.middlewareUrl}/cntf`,
    }),

    customExtension: buildModule(middlewareModule<CustomEndpoints>, {
      apiUrl: `${config.middlewareUrl}/commerce/custom`,
    }),

    /**
     * `sdk.unified` allows you to call the Unified Methods.
     * All methods return a collection of standardized data structures (Unified Data Model),
     * which are common for all supported eCommerce backends.
     * If you want to add custom fields to the Unified Data Model,
     * check the normalizer docs https://docs.alokai.com/storefront/unified-data-layer/normalizers
     *
     * By default, the Alokai Starter uses this module to communicate with the eCommerce backend.
     * Check the docs for more https://docs.alokai.com/storefront/unified-data-layer
     */
    unified: buildModule(middlewareModule<UnifiedEndpoints>, {
      apiUrl: `${config.middlewareUrl}/commerce/unified`,
      cdnCacheBustingId: config.cdnCacheBustingId,

      defaultRequestConfig: {
        headers: getRequestHeaders(),
      },

      methodsRequestConfig: config.defaultMethodsRequestConfig.unifiedCommerce.middlewareModule,
    }),

    unifiedCms: buildModule(middlewareModule<UnifiedCmsEndpoints>, {
      apiUrl: `${config.middlewareUrl}/cntf/unified`,
      cdnCacheBustingId: config.cdnCacheBustingId,

      defaultRequestConfig: {
        headers: getRequestHeaders(),
      },
    }),
  }));
}
