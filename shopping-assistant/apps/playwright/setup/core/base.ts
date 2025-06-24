import { test as base } from '@playwright/test';
import { dataFactoryFixture } from '@setup/fixtures/data';
import { dbFixture } from '@setup/fixtures/db';
import { frontendFixture } from '@setup/fixtures/frontend';
import { middlewareFixtureFactory } from '@setup/fixtures/middleware';
import { utilsFixture } from '@setup/fixtures/utils';

import type { CoreFixtures, CoreWorkerFixtures, RouterFactory } from './types';

const FRONTEND_BUILD_TIMEOUT = 120 * 1000; // 2 minutes

export function baseFixtureFactory(...args: RouterFactory[]) {
  return base.extend<CoreFixtures, CoreWorkerFixtures>({
    dataFactory: async ({}, use) => {
      await dataFactoryFixture(use);
    },
    db: [
      async ({}, use) => {
        await dbFixture(use);
      },
      { auto: true },
    ],
    debug: [true, { option: true, scope: 'worker' }],
    dev: [false, { option: true, scope: 'worker' }],
    framework: [null, { option: true, scope: 'worker' }],
    frontendUrl: [
      async ({ debug, dev, framework, middleware }, use, workerInfo) => {
        await frontendFixture(use, { debug, dev, framework, middlewarePort: middleware.port, workerInfo });
      },
      {
        auto: true,
        scope: 'worker',
        timeout: FRONTEND_BUILD_TIMEOUT,
      },
    ],
    isB2B: [false, { option: true, scope: 'worker' }],
    middleware: [
      async ({ debug }, use, workerInfo) => {
        const middlewareFixture = middlewareFixtureFactory(args);
        await middlewareFixture(use, { debug, workerInfo });
      },
      { auto: true, scope: 'worker' },
    ],
    utils: async ({ framework, page }, use) => {
      await utilsFixture(use, page, framework);
    },
  });
}
