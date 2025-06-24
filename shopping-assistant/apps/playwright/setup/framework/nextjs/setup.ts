import { test } from '@playwright/test';
import { execSync } from 'node:child_process';

import { getAppDir } from './shared';

type Fixtures = {
  dev: boolean;
};

const setup = test.extend<Fixtures>({
  dev: [false, { option: true, scope: 'test' }],
});

setup('Build a Next.js app', async ({ dev }) => {
  const nextAppDir = getAppDir();

  console.info(`Building Next.js app in ${nextAppDir}`);

  execSync(`rm -rf .next`, { cwd: nextAppDir });

  if (!dev) {
    execSync(`yarn build`, { cwd: nextAppDir, stdio: 'ignore' });
    console.info('Next.js app built successfully');
  }
});
