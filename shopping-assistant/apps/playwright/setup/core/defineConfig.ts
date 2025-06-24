import { devices } from '@playwright/test';
import type { FrontendFrameworks } from '@setup/types';

import type { ModuleConfig } from './types';

export function defineConfig(config: ModuleConfig) {
  return (frameworks: FrontendFrameworks[]) => {
    return frameworks.map((framework) => ({
      dependencies: [`build-${framework}`],
      name: `${config.name}-${framework}`,
      testDir: config.testDir,
      testMatch: ['*.test.ts', `*.test.${framework}.ts`],
      use: {
        ...devices['Desktop Chrome'],
        framework: framework,
      },
    }));
  };
}
