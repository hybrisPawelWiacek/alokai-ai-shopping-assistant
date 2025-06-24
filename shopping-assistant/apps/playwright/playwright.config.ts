import { defineConfig, type PlaywrightTestOptions } from '@playwright/test';
import { getProjects } from '@setup/framework/config';
import type { Config } from '@setup/types';
import dotenv from 'dotenv';

dotenv.config();

const testTimeoutInMilliseconds = 60 * 1000; // 60 seconds
const navigationTimeoutInMilliseconds = 10 * 1000; // 10 seconds
const colorScheme = process.env.PW_COLOR_SCHEME || 'light';
const locale = process.env.PW_LOCALE || 'en-US';

export default defineConfig<Config>({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  outputDir: './test-results',
  projects: await getProjects(),
  reporter: [
    ['list', { printSteps: true }],
    ['html', { open: 'never' }],
  ],
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate: '{testFilePath}/__snapshots__/{testFilePath}/{arg}{ext}',
  testDir: './tests',
  testMatch: ['**/*.test.ts'],
  timeout: testTimeoutInMilliseconds,
  use: {
    colorScheme: colorScheme as PlaywrightTestOptions['colorScheme'],
    debug: !process.env.CI,
    dev: process.env.PW_DEV === 'true',
    isB2B: process.env.PW_IS_B2B === 'true',
    locale,
    navigationTimeout: navigationTimeoutInMilliseconds,
    trace: 'on-first-retry',
    video: process.env.CI ? 'on-first-retry' : 'on',
  },
  workers: process.env.CI ? 1 : undefined,
});
