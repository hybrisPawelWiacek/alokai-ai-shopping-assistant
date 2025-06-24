import { createMultistoreExtension } from '@vue-storefront/multistore';
import defu from 'defu';
import NodeCache from 'node-cache';

import { config } from '../../multistore.config';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function multistoreExtensionFactory() {
  return createMultistoreExtension({
    cacheManagerFactory() {
      const client = new NodeCache({
        stdTTL: 10,
      });

      return {
        get(key) {
          return client.get(key);
        },
        set(key, value) {
          return client.set(key, value);
        },
      };
    },
    fetchConfiguration: () => config.getConfig(),
    mergeConfigurations({ baseConfig, storeConfig }) {
      return defu(storeConfig, baseConfig);
    },
  });
}
