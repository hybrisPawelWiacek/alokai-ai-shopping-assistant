import { type WithoutContext } from '@vue-storefront/middleware';
import type { customExtension } from './extensions';
export type { Endpoints as UnifiedEndpoints } from '@vsf-enterprise/unified-api-sapcc';
export type { Endpoints as CommerceEndpoints, SapccIntegrationContext as IntegrationContext } from '@vsf-enterprise/sapcc-api';
export type CustomEndpoints = WithoutContext<(typeof customExtension)['extendApiMethods']>;