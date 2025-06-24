import 'dotenv/config';
import { config as commerceConfig } from './integrations/sapcc';
import { config as cntfConfig } from '@sf-modules-middleware/cms-contentful';

export const config = {
  integrations: {
    commerce: commerceConfig,
    cntf: cntfConfig
  }
};