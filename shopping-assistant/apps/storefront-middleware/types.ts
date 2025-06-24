import type { InferAddCustomFields, SfContract as SfContractUdl } from '@vsf-enterprise/unified-api-sapcc';
export type { CommerceEndpoints, UnifiedEndpoints, CustomEndpoints } from './integrations/sapcc/types';
import type { unifiedApiExtension } from './integrations/sapcc/extensions';
export * from '@vsf-enterprise/unified-api-sapcc/udl';

declare module '@vsf-enterprise/unified-api-sapcc' {
  export interface AddCustomFields extends InferAddCustomFields<typeof unifiedApiExtension> {}
}

export type SfLocale = 'de' | 'en';

export interface SfContract extends SfContractUdl {
  SfLocale: SfLocale;
}

export { type SapccIntegrationContext as IntegrationContext } from '@vsf-enterprise/sapcc-api';
export type { B2BCheckoutEndpoints } from '@sf-modules-middleware/checkout-b2b';
export type { Endpoints as ContentfulEndpoints } from '@vsf-enterprise/contentful-api';
export type { UnifiedCmsEndpoints } from '@sf-modules-middleware/cms-contentful';