import { createServer, type CreateServerOptions } from '@vue-storefront/middleware';

import { config } from '../middleware.config';
import { config as multistoreConfig } from '../multistore.config';

const developmentCorsConfig: CreateServerOptions['cors'] = {
  credentials: true,
  origin: true,
};
const port = Number(process.env.API_PORT) || 4000;

runApp();

async function runApp() {
  const app = await createServer(config, {
    cors: process.env.NODE_ENV === 'production' ? undefined : developmentCorsConfig,
  });

  app.listen(port, '', () => {
    console.log(`API server listening on port ${port}`);

    if (process.env.IS_MULTISTORE_ENABLED === 'false') {
      console.log('Multistore is not enabled');
      return;
    }
    console.log(
      `Multistore is enabled. The available stores: ${multistoreConfig
        .getDomains()
        .map((url) => `https://${url}`)
        .join(', ')}`,
    );
  });
}
